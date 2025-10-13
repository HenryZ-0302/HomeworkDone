import { toast } from "sonner";
import { Info } from "lucide-react";
import { useEffect, useMemo, useCallback } from "react";
import { useGeminiStore } from "@/store/gemini-store";
import ActionsCard from "../cards/ActionsCard";
import PreviewCard from "../cards/PreviewCard";
import { GeminiAi } from "@/ai/gemini";
import { SOLVE_SYSTEM_PROMPT } from "@/ai/prompts";
import { uint8ToBase64 } from "@/utils/encoding";
import { parseSolveResponse } from "@/ai/response";

import {
  useProblemsStore,
  type FileItem as FileItem,
  type ProblemSolution,
} from "@/store/problems-store";
import SolutionsArea from "../areas/SolutionsArea";
import { rasterizeImageFile } from "@/utils/rasterize";

export default function ScanPage() {
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
  } = useProblemsStore((s) => s);

  // Zustand store for Gemini API configuration.
  const geminiModel = useGeminiStore((state) => state.geminiModel);
  const geminiKey = useGeminiStore((state) => state.geminiKey);
  const geminiBaseUrl = useGeminiStore((state) => state.geminiBaseUrl);
  const geminiTraits = useGeminiStore((state) => state.traits);

  // State to track if the AI is currently processing images.
  const setWorking = useProblemsStore((s) => s.setWorking);

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
      const arr = Array.from(files).filter((f) => {
        return f.type.startsWith("image/") || f.type === "application/pdf";
      });
      if (arr.length === 0) return;

      const initialItems: FileItem[] = arr.map((file) => ({
        id: crypto.randomUUID(),
        file,
        mimeType: file.type,
        url: URL.createObjectURL(file),
        source,
        status: file.type.startsWith("image/") ? "rasterizing" : "success",
      }));

      addFileItems(initialItems);

      initialItems.forEach((item) => {
        if (item.status === "rasterizing") {
          rasterizeImageFile(item.file)
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
    },
    [addFileItems, updateFileItem],
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
    throw lastError;
  };

  /**
   * Main function to start the scanning process.
   * It sends images to the Gemini AI and processes the results concurrently.
   */
  const startScan = async () => {
    // Validation checks... (omitted for brevity, assume they pass)
    if (!geminiModel || geminiModel.length === 0) {
      toast("You're almost there", {
        description:
          "Please specific a Gemini model in settings to start skidding!",
      });
      return;
    }
    if (!geminiKey) {
      toast("You're almost there", {
        description:
          "Please set a Gemini API key before you scan your homework.",
      });
      return;
    }

    // Filter the items list to get only the images that need processing.
    const itemsToProcess = items.filter(
      (item) => item.status === "pending" || item.status === "failed",
    );

    if (itemsToProcess.length === 0) {
      toast("All images processed", {
        description: "There are no pending or failed images to scan.",
      });
      return;
    }

    toast("Working...", {
      description: `Sending ${itemsToProcess.length} file(s) to Gemini... Your time is being saved...`,
    });
    setWorking(true);

    try {
      const ai = new GeminiAi(geminiKey, geminiBaseUrl);

      if (geminiTraits) {
        // inject traits into prompt
        ai.setSystemPrompt(
          SOLVE_SYSTEM_PROMPT +
            `\nUser defined traits:
<traits>
${geminiTraits}
</traits>
`,
        );
      } else {
        ai.setSystemPrompt(SOLVE_SYSTEM_PROMPT);
      }

      // Concurrency limit for processing images.
      const concurrency = 4;
      const n = itemsToProcess.length;

      // Prepare to remove existing solutions for images that are being re-processed.
      const urlsToProcess = new Set(itemsToProcess.map((item) => item.url));

      // Use the store action to safely filter out existing solutions.
      removeSolutionsByUrls(urlsToProcess);

      /**
       * Processes a single image item.
       * @param item The ImageItem to process.
       */
      const processOne = async (item: FileItem) => {
        const callback = (text: string) => {
          appendStreamedOutput(item.url, text);
        };

        try {
          console.log(`Processing ${item.id}`);

          // add the placeholder solution
          addSolution({
            imageUrl: item.url,
            status: "processing",
            problems: [],
          });

          const buf = await item.file.arrayBuffer();
          const bytes = new Uint8Array(buf);

          // Send file to AI with retry logic.
          const resText = await retryAsyncOperation(() =>
            ai.sendMedia(
              uint8ToBase64(bytes),
              item.mimeType,
              undefined,
              geminiModel,
              callback,
            ),
          );

          const res = parseSolveResponse(resText);

          updateSolution(item.url, {
            status: "success",
            problems: res?.problems ?? [],
          });

          updateItemStatus(item.id, "success");
        } catch (err) {
          console.error(
            `Failed to process ${item.id} after multiple retries:`,
            err,
          );

          const failureProblem: ProblemSolution = {
            problem: "Processing failed after multiple retries.",
            answer: "Please check the console for errors and try again.",
            explanation: String(err),
          };

          addSolution({
            imageUrl: item.url,
            status: "failed",
            problems: [failureProblem],
          });

          updateItemStatus(item.id, "failed");
        }
      };

      // Create a worker pool to process images concurrently.
      let nextIndex = 0;
      const worker = async () => {
        while (true) {
          const i = nextIndex++;
          if (i >= n) break;
          await processOne(itemsToProcess[i]);
        }
      };

      const workers = Array(Math.min(concurrency, n))
        .fill(0)
        .map(() => worker());

      await Promise.all(workers);
    } catch (e) {
      console.error(e);
      toast("An unexpected error occurred", {
        description:
          "Something went wrong during the process. Please check the console.",
      });
    } finally {
      toast("All done!", {
        description: "Your homework has been processed.",
      });
      setWorking(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Scan your homework
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="h-4 w-4" /> Images stay local. We never upload
            without your action.
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
            Licensed under GPL-3.0. Students' life matter{" "}
            <a
              className="underline"
              href="https://github.com/cubewhy/skid-homework"
              target="_blank"
            >
              Source code
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
