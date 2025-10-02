import { toast } from "sonner";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import Markdown from "react-markdown";
import { Info } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardTitle } from "../ui/card";
import { useGeminiStore } from "@/store/gemini-store";
import ActionsCard from "../ActionsCard";
import PreviewCard from "../PreviewCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { GeminiAi, SYSTEM_PROMPT } from "@/ai/gemini";
import { uint8ToBase64 } from "@/utils/encoding";
import { parseResponse } from "@/ai/response";

import "katex/dist/katex.min.css";
// Import the new set of actions and state from the updated store
import {
  useProblemsStore,
  type ImageItem,
  type ProblemSolution,
} from "@/store/problems-store";

export default function ScanPage() {
  // Destructure all necessary state and new semantic actions from the store.
  const {
    imageItems: items,
    imageSolutions,
    selectedImage,
    selectedProblem,
    addImageItems,
    updateItemStatus,
    removeImageItem, // Rename to avoid conflict with local function
    clearAllItems,
    addImageSolution,
    removeSolutionsByUrls,
    clearAllSolutions,
    setSelectedImage,
    setSelectedProblem,
  } = useProblemsStore((s) => s);

  // Zustand store for Gemini API configuration.
  const geminiModel = useGeminiStore((state) => state.geminiModel);
  const geminiKey = useGeminiStore((state) => state.geminiKey);
  const geminiBaseUrl = useGeminiStore((state) => state.geminiBaseUrl);
  const geminiTraits = useGeminiStore((state) => state.traits);

  // State to track if the AI is currently processing images.
  const [isWorking, setWorking] = useState(false);

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
    (files: File[] | FileList, source: ImageItem["source"]) => {
      // Filter for image files only.
      const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (arr.length === 0) return;

      // Create new ImageItem objects for each valid file.
      const next: ImageItem[] = arr.map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "pending", // All new images start with a 'pending' status.
        url: URL.createObjectURL(file), // Create a temporary URL for preview.
        source,
      }));
      // Use the semantic action to add items safely.
      addImageItems(next);
    },
    [addImageItems],
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
    asyncFn: () => Promise<any>,
    maxRetries: number = 5,
    initialDelayMs: number = 5000,
  ): Promise<any> => {
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
          "Please specific a Gemini model to start skidding! For example, `gemini-1.5-pro-latest`",
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
      description: `Sending ${itemsToProcess.length} image(s) to Gemini... Your time is being saved...`,
    });
    setWorking(true);

    try {
      const ai = new GeminiAi(geminiKey, geminiBaseUrl);

      if (geminiTraits) {
        // inject traits into prompt
        ai.setSystemPrompt(
          SYSTEM_PROMPT +
            `\nUser defined traits:
<traits>
${geminiTraits}
</traits>
`,
        );
      } else {
        ai.setSystemPrompt(SYSTEM_PROMPT);
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
      const processOne = async (item: ImageItem) => {
        try {
          console.log(`Processing ${item.id}`);
          const buf = await item.file.arrayBuffer();
          const bytes = new Uint8Array(buf);

          // Send image to AI with retry logic.
          const resText = await retryAsyncOperation(() =>
            ai.sendImage(uint8ToBase64(bytes), undefined, geminiModel),
          );

          const res = parseResponse(resText);

          // FIX: Use addImageSolution action. This action uses a functional update
          // internally, ensuring safe concurrent state modification.
          addImageSolution({
            imageUrl: item.url,
            success: true,
            problems: res?.problems ?? [],
          });

          // FIX: Use updateItemStatus action for thread-safe item status update.
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

          // FIX: Add failure entry safely using the store action.
          addImageSolution({
            imageUrl: item.url,
            success: false,
            problems: [failureProblem],
          });

          // FIX: Update status to 'failed' safely.
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

  // Build a solutions list that matches the visual order of the uploaded items.
  const orderedSolutions = useMemo(() => {
    const byUrl = new Map(imageSolutions.map((s) => [s.imageUrl, s]));
    return items
      .filter((it) => byUrl.has(it.url)) // Only include items that have a solution entry.
      .map((it) => ({
        item: it,
        solutions: byUrl.get(it.url)!,
      }));
  }, [items, imageSolutions]); // Dependencies remain correct

  // Derive the index of the currently selected image.
  const currentImageIdx = useMemo(() => {
    if (!orderedSolutions.length) return -1;
    if (!selectedImage) return 0;
    const idx = orderedSolutions.findIndex((e) => e.item.url === selectedImage);
    return idx === -1 ? 0 : idx; // Default to the first image if not found.
  }, [orderedSolutions, selectedImage]);

  // Effect to keep the selectedImage state consistent if the data changes.
  useEffect(() => {
    if (!orderedSolutions.length) {
      if (selectedImage !== null) setSelectedImage(undefined);
      return;
    }
    const safeIdx = currentImageIdx === -1 ? 0 : currentImageIdx;
    const url = orderedSolutions[safeIdx].item.url;
    if (selectedImage !== url) setSelectedImage(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedSolutions.length, currentImageIdx]); // Depend on length and index

  // Get the current solution bundle (image + its problems).
  const currentBundle =
    currentImageIdx >= 0 ? orderedSolutions[currentImageIdx] : null;
  const problems = currentBundle?.solutions.problems ?? [];

  // Effect to clamp the selectedProblem index to a valid range when data changes.
  useEffect(() => {
    if (!problems.length) {
      if (selectedProblem !== 0) setSelectedProblem(0);
      return;
    }
    const clamped = Math.min(selectedProblem, problems.length - 1);
    if (clamped !== selectedProblem) setSelectedProblem(clamped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageIdx, problems.length]); // Re-run when image or problems change.

  // Navigation helpers for problems and images.
  const goNextProblem = () =>
    setSelectedProblem(
      Math.min(selectedProblem + 1, Math.max(0, problems.length - 1)),
    );
  const goPrevProblem = () =>
    setSelectedProblem(Math.max(selectedProblem - 1, 0));

  const goNextImage = () => {
    if (!orderedSolutions.length) return;
    const next = (currentImageIdx + 1) % orderedSolutions.length;
    setSelectedImage(orderedSolutions[next].item.url);
    setSelectedProblem(0); // Reset problem index when changing images.
  };
  const goPrevImage = () => {
    if (!orderedSolutions.length) return;
    const prev =
      (currentImageIdx - 1 + orderedSolutions.length) % orderedSolutions.length;
    setSelectedImage(orderedSolutions[prev].item.url);
    setSelectedProblem(0); // Reset problem index.
  };

  // Utility to copy text to the clipboard.
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied", { description: "Answer copied to clipboard." });
    } catch {
      toast("Copy failed", { description: "Please copy manually." });
    }
  };

  // Keyboard shortcuts handler for navigating solutions.
  const onKeyDownSolutions: React.KeyboardEventHandler<HTMLDivElement> = (
    e,
  ) => {
    // Tab/Shift+Tab for image navigation.
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) goPrevImage();
      else goNextImage();
      e.currentTarget.focus();
      return;
    }
    // Space/Shift+Space for problem navigation.
    if (e.code === "Space") {
      e.preventDefault();
      if (e.shiftKey) goPrevProblem();
      else goNextProblem();
      e.currentTarget.focus();
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
            isWorking={isWorking}
            appendFiles={appendFiles}
            clearAll={clearAll}
            startScan={startScan}
            totalBytes={totalBytes}
            items={items}
          />

          <PreviewCard removeItem={removeItem} items={items} />
        </div>

        {/* Solutions Section */}
        <div className="mt-6">
          <Card className="rounded-2xl p-4 shadow">
            <CardTitle>Solutions</CardTitle>
            <CardContent>
              {/* Focusable region to capture keyboard shortcuts for navigation. */}
              <div
                tabIndex={0}
                onKeyDown={onKeyDownSolutions}
                className="outline-none"
                aria-label="Solutions keyboard focus region (Tab/Shift+Tab for problems, Space/Shift+Space for images)"
              >
                {/* Conditional rendering based on whether solutions are available. */}
                {!orderedSolutions.length ? (
                  <div className="text-sm text-gray-400">
                    {isWorking
                      ? "Analyzing... extracting problems and solutions from your images."
                      : 'No solutions yet. Add images and click "Let\'s Skid" to see results here.'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Image Tabs for switching between different photos' solutions. */}
                    <Tabs
                      value={selectedImage ?? undefined}
                      onValueChange={(v) => {
                        setSelectedImage(v);
                        setSelectedProblem(0); // Reset problem index on tab change.
                      }}
                      className="w-full"
                    >
                      <TabsList className="flex flex-wrap gap-2">
                        {orderedSolutions.map((entry, idx) => (
                          <TabsTrigger
                            key={entry.item.id}
                            value={entry.item.url}
                          >
                            {entry.item.file.name || `Image ${idx + 1}`}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {/* Content for each image tab. */}
                      {orderedSolutions.map((entry, idx) => {
                        const problemCount = entry.solutions.problems.length;
                        const safeIndex = Math.min(
                          Math.max(0, selectedProblem),
                          Math.max(0, problemCount - 1),
                        );
                        const activeProblem =
                          problemCount > 0
                            ? entry.solutions.problems[safeIndex]
                            : null;

                        return (
                          <TabsContent
                            key={entry.item.id}
                            value={entry.item.url}
                            className="mt-4"
                          >
                            {/* Collapsible preview of the current photo. */}
                            <Collapsible defaultOpen>
                              <div className="flex items-center justify-between">
                                <div className="text-xs text-slate-400">
                                  Photo {idx + 1} • {entry.item.source}
                                </div>
                                <CollapsibleTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2"
                                  >
                                    Toggle Preview
                                  </Button>
                                </CollapsibleTrigger>
                              </div>
                              <CollapsibleContent className="mt-2">
                                <div className="overflow-hidden rounded-xl border border-slate-700">
                                  <img
                                    src={entry.item.url}
                                    alt={`Preview ${entry.item.file.name || idx + 1}`}
                                    className="block max-h-96 w-full object-contain bg-black/20"
                                  />
                                </div>
                              </CollapsibleContent>
                            </Collapsible>

                            <Separator className="my-4" />

                            {/* Display problems or a message if none were found. */}
                            {entry.solutions.problems.length === 0 ? (
                              <div className="text-sm text-slate-400">
                                {entry.solutions.success
                                  ? "No problems detected for this image."
                                  : "Failed to process this image. Please try again."}
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                {/* Left: List of problems for the current image. */}
                                <aside className="md:col-span-1">
                                  <ul className="space-y-2">
                                    {entry.solutions.problems.map((p, i) => (
                                      <li key={i}>
                                        <Button
                                          variant={
                                            i === selectedProblem
                                              ? "secondary"
                                              : "outline"
                                          }
                                          className="w-full justify-start whitespace-normal text-left"
                                          onClick={() => setSelectedProblem(i)}
                                        >
                                          <div className="min-w-0 flex-1">
                                            <div className="text-xs font-semibold">
                                              Problem {i + 1}
                                            </div>
                                            <div className="truncate text-xs opacity-80">
                                              {p.problem}
                                            </div>
                                          </div>
                                        </Button>
                                      </li>
                                    ))}
                                  </ul>
                                </aside>

                                {/* Right: Detailed view of the selected problem. */}
                                <section className="md:col-span-2">
                                  <div className="rounded-xl border border-slate-700 p-4">
                                    <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
                                      Problem{" "}
                                      <label className="font-extrabold text-amber-500">
                                        {selectedProblem + 1}
                                      </label>{" "}
                                      of {entry.solutions.problems.length}
                                    </div>

                                    {/* Markdown renderer for problem, answer, and explanation. */}
                                    <Markdown
                                      remarkPlugins={[remarkGfm, remarkMath]}
                                      rehypePlugins={[
                                        [rehypeKatex, { output: "html" }],
                                      ]}
                                    >
                                      {activeProblem?.problem ?? ""}
                                    </Markdown>

                                    <div className="mt-4 space-y-4">
                                      <div>
                                        <div className="mb-1 text-sm font-medium text-slate-300">
                                          Answer
                                        </div>
                                        <div className="rounded-lg bg-slate-900/60 p-3 text-sm">
                                          <Markdown
                                            remarkPlugins={[
                                              remarkGfm,
                                              remarkMath,
                                            ]}
                                            rehypePlugins={[
                                              [rehypeKatex, { output: "html" }],
                                            ]}
                                          >
                                            {activeProblem?.answer ?? ""}
                                          </Markdown>
                                        </div>
                                        <div className="mt-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              copyToClipboard(
                                                activeProblem?.answer ?? "",
                                              )
                                            }
                                          >
                                            Copy answer
                                          </Button>
                                        </div>
                                      </div>

                                      <div>
                                        <div className="mb-1 text-sm font-medium text-slate-300">
                                          Explanation
                                        </div>
                                        <div className="rounded-lg bg-slate-900/40 p-3 text-sm leading-relaxed">
                                          <Markdown
                                            remarkPlugins={[
                                              remarkGfm,
                                              remarkMath,
                                            ]}
                                            rehypePlugins={[
                                              [rehypeKatex, { output: "html" }],
                                            ]}
                                          >
                                            {activeProblem?.explanation ?? ""}
                                          </Markdown>
                                        </div>
                                      </div>

                                      {/* Navigation controls for problems and images. */}
                                      <div className="flex items-center justify-between pt-2">
                                        <div className="text-xs text-slate-500">
                                          Source image:&nbsp;
                                          <a
                                            href={entry.item.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="underline decoration-dotted"
                                          >
                                            open preview
                                          </a>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={goPrevProblem}
                                            disabled={selectedProblem === 0}
                                          >
                                            Prev (Shift+Space)
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={goNextProblem}
                                            disabled={
                                              selectedProblem >=
                                              entry.solutions.problems.length -
                                                1
                                            }
                                          >
                                            Next (Space)
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={goPrevImage}
                                          >
                                            ⟵ Image (Shift+Tab)
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={goNextImage}
                                          >
                                            Image ⟶ (Tab)
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </section>
                              </div>
                            )}
                          </TabsContent>
                        );
                      })}
                    </Tabs>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <footer className="mt-4">
          <p className="text-sm text-gray-500">
            Licensed under GPL-3.0. Students' life matter{" "}
            <a
              className="underline"
              href="https://github.com/cubewhy/skid-homework"
            >
              Source code
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
