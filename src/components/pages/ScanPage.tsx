import { toast } from "sonner";
import { Info, StarIcon } from "lucide-react";
import { useEffect, useMemo, useCallback, useRef } from "react";
import { useAiStore } from "@/store/ai-store";
import ActionsCard from "../cards/ActionsCard";
import PreviewCard from "../cards/PreviewCard";
import { SOLVE_SYSTEM_PROMPT } from "@/ai/prompts";
import { uint8ToBase64 } from "@/utils/encoding";
import { parseSolveResponse } from "@/ai/response";
import { shuffleArray } from "@/utils/shuffle";

import {
  useProblemsStore,
  type FileItem as FileItem,
  type ProblemSolution,
} from "@/store/problems-store";
import SolutionsArea from "../areas/SolutionsArea";
import { useSettingsStore } from "@/store/settings-store";
import { binarizeImageFile } from "@/utils/image-post-processing";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";

export default function ScanPage() {
  const { t } = useTranslation("commons", { keyPrefix: "scan-page" });
  // Destructure all necessary state and new semantic actions from the store.
  const {
    imageItems: items,
    addFileItems,
    updateItemStatus,
    removeImageItem,
    updateFileItem,
    clearAllItems,
    addSolution,
    updateSolution,
    removeSolutionsByUrls,
    clearAllSolutions,
    appendStreamedOutput,
    clearStreamedOutput,
} = useProblemsStore((s) => s);

  const { imageBinarizing } = useSettingsStore((s) => s);
  const imageBinarizingRef = useRef(imageBinarizing);

  // Zustand store for AI provider configuration.
  const sources = useAiStore((state) => state.sources);
  const activeSourceId = useAiStore((state) => state.activeSourceId);
  const getClientForSource = useAiStore((state) => state.getClientForSource);
  const allowPdfUploads = useAiStore((state) => state.allowPdfUpload());

  const enabledSources = useMemo(() => {
    const available = sources.filter(
      (source) => source.enabled && Boolean(source.apiKey),
    );

    const active = available.find((source) => source.id === activeSourceId);
    if (!active) {
      return available;
    }

    return [
      active,
      ...available.filter((source) => source.id !== active.id),
    ];
  }, [sources, activeSourceId]);

  // State to track if the AI is currently processing images.
  const setWorking = useProblemsStore((s) => s.setWorking);

  const showDonateBtn = useSettingsStore((s) => s.showDonateBtn);

  // Effect hook to clean up object URLs when the component unmounts or items change.
  useEffect(() => {
    return () => {
      items.forEach((it) => URL.revokeObjectURL(it.url));
    };
  }, [items]);

  // Memoized calculation of the total size of all uploaded files.
  const totalBytes = useMemo(
    () => items.reduce((sum, it) => sum + it.file.size, 0),
    [items],
  );

  // Callback to add new files to the items list using the store action.
  const appendFiles = useCallback(
    (files: File[] | FileList, source: FileItem["source"]) => {
      let rejectedPdf = false;
      const arr = Array.from(files).filter((f) => {
        if (f.type.startsWith("image/")) {
          return true;
        }

        if (f.type === "application/pdf") {
          if (allowPdfUploads) {
            return true;
          }
          rejectedPdf = true;
          return false;
        }

        return false;
      });

      if (rejectedPdf) {
        toast(t("toasts.pdf-blocked.title"), {
          description: t("toasts.pdf-blocked.description"),
        });
      }

      if (arr.length === 0) return;

      const initialItems: FileItem[] = arr.map((file) => ({
        id: crypto.randomUUID(),
        file,
        mimeType: file.type,
        url: URL.createObjectURL(file),
        source,
        status:
          file.type.startsWith("image/") && imageBinarizingRef.current
            ? "rasterizing"
            : "pending",
      }));

      addFileItems(initialItems);

      // Image post-processing
      if (imageBinarizingRef.current) {
        initialItems.forEach((item) => {
          if (item.status === "rasterizing") {
            binarizeImageFile(item.file)
              .then((rasterizedResult) => {
                updateFileItem(item.id, {
                  status: "pending",
                  url: rasterizedResult.url,
                  file: rasterizedResult.file,
                });
              })
              .catch((error) => {
                console.error(`Failed to rasterize ${item.file.name}:`, error);
                updateFileItem(item.id, {
                  status: "failed",
                });
              });
          }
        });
      }
    },
    [addFileItems, updateFileItem, allowPdfUploads, t],
  );

  // Function to remove a specific item from the list by its ID.
  const removeItem = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (target) URL.revokeObjectURL(target.url); // Clean up the object URL.
    // Use the semantic action to remove the item.
    removeImageItem(id);
  };

  // Function to clear all uploaded items and solutions.
  const clearAll = () => {
    items.forEach((i) => URL.revokeObjectURL(i.url)); // Clean up all object URLs.
    clearAllItems();
    clearAllSolutions(); // Use the semantic action to clear solutions.
  };

  // Utility function to retry an async operation with exponential backoff.
  const retryAsyncOperation = async (
    asyncFn: () => Promise<string>,
    maxRetries: number = 5,
    initialDelayMs: number = 5000,
  ): Promise<string> => {
    let lastError: Error | undefined;
    let delay = initialDelayMs;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await asyncFn(); // Attempt the operation.
      } catch (error) {
        lastError = error as Error;
        console.log(
          `Attempt ${attempt} failed. Retrying in ${delay / 1000}s...`,
        );

        if (attempt < maxRetries) {
          // Wait for the delay period before the next attempt.
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Double the delay for the next retry (exponential backoff).
        }
      }
    }
    // If all retries fail, throw the last captured error.
    throw lastError ?? new Error("Unknown AI failure");
  };

  /**
   * Main function to start the scanning process.
   * It polls through the configured AI sources until one succeeds per item.
   */
  const startScan = async () => {
    const availableSources = shuffleArray(enabledSources);

    if (!availableSources.length) {
      toast(t("toasts.no-source.title"), {
        description: t("toasts.no-source.description"),
      });
      return;
    }

    const invalidSource = availableSources.find(
      (source) => !source.model || source.model.length === 0,
    );
    if (invalidSource) {
      toast(t("toasts.no-model.title"), {
        description: t("toasts.no-model.description", {
          provider: invalidSource.name,
        }),
      });
      return;
    }

    const itemsToProcess = items.filter(
      (item) => item.status === "pending" || item.status === "failed",
    );

    if (itemsToProcess.length === 0) {
      toast(t("toasts.all-processed.title"), {
        description: t("toasts.all-processed.description"),
      });
      return;
    }

    const hasPdfItems = itemsToProcess.some(
      (item) => item.mimeType === "application/pdf",
    );

    const hasGeminiSource = availableSources.some(
      (source) => source.provider === "gemini",
    );

    if (hasPdfItems && !hasGeminiSource) {
      toast(t("toasts.pdf-blocked.title"), {
        description: t("toasts.pdf-blocked.description"),
      });
      return;
    }

    toast(t("toasts.working.title"), {
      description: t("toasts.working.description", {
        count: itemsToProcess.length,
      }),
    });
    setWorking(true);

    try {
      const concurrency = 4;
      const n = itemsToProcess.length;

      const urlsToProcess = new Set(itemsToProcess.map((item) => item.url));
      removeSolutionsByUrls(urlsToProcess);

      const processOne = async (item: FileItem) => {
        console.log(`Processing ${item.id}`);

        addSolution({
          imageUrl: item.url,
          status: "processing",
          problems: [],
        });

        const buf = await item.file.arrayBuffer();
        const base64 = uint8ToBase64(new Uint8Array(buf));

        let lastError: unknown = null;

        for (const source of shuffleArray(availableSources)) {
          try {
            const ai = getClientForSource(source.id);
            if (!ai) {
              throw new Error(
                t("errors.missing-key", { provider: source.name }),
              );
            }

            const traitsPrompt = source.traits
              ? `\nUser defined traits:
<traits>
${source.traits}
</traits>
`
              : "";

            ai.setSystemPrompt(SOLVE_SYSTEM_PROMPT + traitsPrompt);

            clearStreamedOutput(item.url);

            const resText = await retryAsyncOperation(() =>
              ai.sendMedia(
                base64,
                item.mimeType,
                undefined,
                source.model,
                (text) => appendStreamedOutput(item.url, text),
              ),
            );

            const res = parseSolveResponse(resText);
            if (!res) {
              throw new Error(t("errors.parsing-failed"));
            }

            updateSolution(item.url, {
              status: "success",
              problems: res.problems ?? [],
              aiSourceId: source.id,
            });

            updateItemStatus(item.id, "success");
            return;
          } catch (error) {
            lastError = error;
            console.error(
              `Source ${source.name} failed for ${item.id}`,
              error,
            );
            clearStreamedOutput(item.url);
          }
        }

        throw lastError ?? new Error("All AI sources exhausted");
      };

      let nextIndex = 0;
      const worker = async () => {
        while (true) {
          const i = nextIndex++;
          if (i >= n) break;
          try {
            await processOne(itemsToProcess[i]);
          } catch (err) {
            const failureProblem: ProblemSolution = {
              problem: t("errors.processing-failed.problem"),
              answer: t("errors.processing-failed.answer"),
              explanation: t("errors.processing-failed.explanation", {
                error: String(err),
              }),
            };

            updateSolution(itemsToProcess[i].url, {
              status: "failed",
              problems: [failureProblem],
              aiSourceId: undefined,
            });
            clearStreamedOutput(itemsToProcess[i].url);

            updateItemStatus(itemsToProcess[i].id, "failed");
          }
        }
      };

      const workers = Array(Math.min(concurrency, n))
        .fill(0)
        .map(() => worker());

      await Promise.all(workers);
    } catch (e) {
      console.error(e);
      toast(t("toasts.error.title"), {
        description: t("toasts.error.description"),
      });
    } finally {
      toast(t("toasts.done.title"), {
        description: t("toasts.done.description"),
      });
      setWorking(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6 flex space-x-4 items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          {showDonateBtn && (
            <Button className="flex-1" variant="secondary" asChild>
              <a href="https://996every.day/donate" target="_blank">
                <StarIcon />
                {t("donate-btn")}
              </a>
            </Button>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="h-4 w-4" /> {t("tip")}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Left panel: Upload controls and actions. */}
          <ActionsCard
            appendFiles={appendFiles}
            clearAll={clearAll}
            startScan={startScan}
            totalBytes={totalBytes}
            items={items}
            allowPdfUploads={allowPdfUploads}
          />

          <PreviewCard
            appendFiles={appendFiles}
            removeItem={removeItem}
            items={items}
          />
        </div>

        {/* Solutions Section */}
        <div className="mt-6">
          <SolutionsArea />
        </div>

        <footer className="mt-4 flex flex-row justify-between">
          <p className="text-sm text-gray-500">
            {t("footer.license")} {t("footer.slogan")}{" "}
            <a
              className="underline"
              href="https://github.com/996-ai/skid-homework"
              target="_blank"
            >
              {t("footer.source")}
            </a>
          </p>
          {/* TODO: Add help page */}
          {/* <Button variant="link" asChild> */}
          {/*   <Link to="/help">Help</Link> */}
          {/* </Button> */}
        </footer>
      </div>
    </div>
  );
}
