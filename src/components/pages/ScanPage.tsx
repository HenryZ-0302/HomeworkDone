import { toast } from "sonner";
import { Info, StarIcon } from "lucide-react";
import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useAiStore } from "@/store/ai-store";
import ActionsCard from "../cards/ActionsCard";
import PreviewCard from "../cards/PreviewCard";
import { SOLVE_SYSTEM_PROMPT } from "@/ai/prompts";
import { uint8ToBase64 } from "@/utils/encoding";
import { parseSolveResponse } from "@/ai/response";

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
import { useMediaQuery } from "@/hooks/use-media-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useShortcut } from "@/hooks/use-shortcut";

export default function ScanPage() {
  const { t } = useTranslation("commons", { keyPrefix: "scan-page" });
  const navigate = useNavigate();
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

    return [active, ...available.filter((source) => source.id !== active.id)];
  }, [sources, activeSourceId]);

  // State to track if the AI is currently processing images.
  const setWorking = useProblemsStore((s) => s.setWorking);

  const showDonateBtn = useSettingsStore((s) => s.showDonateBtn);
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [activeTab, setActiveTab] = useState<"capture" | "preview">(
    items.length ? "preview" : "capture",
  );

  useShortcut(
    "openChat",
    (event) => {
      event.preventDefault();
      navigate("/chat");
    },
    [navigate],
  );

  useEffect(() => {
    if (!items.length) {
      setActiveTab("capture");
    }
  }, [items.length]);

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
    const availableSources = enabledSources;

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

        for (const source of availableSources) {
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
            console.error(`Source ${source.name} failed for ${item.id}`, error);
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
    <div className={cn("min-h-screen", isMobile && "pb-24")}>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header
          className={cn(
            "mb-6 flex items-center justify-between gap-4",
            isMobile && "flex-col items-start",
          )}
        >
          <div className="flex w-full flex-col gap-2">
            <h1
              className={cn(
                "text-3xl font-semibold tracking-tight",
                isMobile && "text-2xl leading-tight",
              )}
            >
              {t("title")}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
              <Info className="h-4 w-4 shrink-0" />
              <span>{t("tip")}</span>
            </div>
          </div>
          {showDonateBtn && (
            <Button
              className={cn(
                "gap-2 whitespace-nowrap",
                isMobile ? "w-full justify-center rounded-full py-3" : "px-4",
              )}
              size={isMobile ? "lg" : "default"}
              variant="secondary"
              asChild
            >
              <a
                href="https://91porna.com/"
                target="_blank"
                rel="noreferrer"
              >
                <StarIcon className="h-4 w-4" />
                {t("donate-btn")}
              </a>
            </Button>
          )}
        </header>

        {isMobile && (
          <div className="mb-6 w-full rounded-2xl border border-white/15 bg-background/70 p-4 shadow-sm backdrop-blur">
            <p className="text-base font-medium">
              {items.length
                ? t("mobile.status", { count: items.length })
                : t("mobile.empty")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {allowPdfUploads ? t("mobile.hint-ready") : t("mobile.hint-pdf")}
            </p>
          </div>
        )}

        {isMobile ? (
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "capture" | "preview")
            }
            className="md:hidden"
          >
            <TabsList className="grid w-full grid-cols-2 bg-muted/40">
              <TabsTrigger
                value="capture"
                className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                {t("mobile.tabs.capture")}
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                {t("mobile.tabs.preview")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="capture" className="mt-4">
              <ActionsCard
                appendFiles={appendFiles}
                clearAll={clearAll}
                startScan={startScan}
                totalBytes={totalBytes}
                items={items}
                allowPdfUploads={allowPdfUploads}
                layout="mobile"
              />
            </TabsContent>
            <TabsContent value="preview" className="mt-4">
              <PreviewCard
                appendFiles={appendFiles}
                removeItem={removeItem}
                items={items}
                layout="mobile"
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
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
        )}

        {/* Solutions Section */}
        <section className={cn("mt-8", !isMobile && "mt-10")}>
          <SolutionsArea />
        </section>

        <footer
          className={cn(
            "mt-10 flex items-center justify-between text-sm text-muted-foreground",
            isMobile && "mt-12 flex-col items-start gap-3 text-base",
          )}
        >
          <p>
            {t("footer.license")} {t("footer.slogan")}{" "}
            <a
              className="underline"
              href="https://github.com/996-ai/skid-homework"
              target="_blank"
              rel="noreferrer"
            >
              {t("footer.source")}
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
