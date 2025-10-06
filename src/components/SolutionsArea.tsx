import { TabsTrigger } from "@radix-ui/react-tabs";
import { Card, CardContent, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList } from "./ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useProblemsStore } from "@/store/problems-store";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";

export default function SolutionsArea() {
  const {
    imageItems: items,
    imageSolutions,
    selectedImage,
    selectedProblem,
    setSelectedImage,
    setSelectedProblem,
    isWorking,
  } = useProblemsStore((s) => s);

  const [detailedViewFocus, setDetailedViewFocus] = useState(false);

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
    if (detailedViewFocus) return;
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

  return (
    <>
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
                      <TabsTrigger key={entry.item.id} value={entry.item.url}>
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
                            <section
                              className="md:col-span-2"
                              onFocus={() => setDetailedViewFocus(true)}
                              onBlur={() => setDetailedViewFocus(false)}
                            >
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
                                        remarkPlugins={[remarkGfm, remarkMath]}
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
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[
                                          [rehypeKatex, { output: "html" }],
                                        ]}
                                      >
                                        {activeProblem?.explanation ?? ""}
                                      </Markdown>
                                    </div>
                                  </div>

                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline">
                                        Improve the Solution
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>
                                          Improve the Solution
                                        </DialogTitle>
                                        <DialogDescription>
                                          Generate a more detailed solution
                                          using the current solution and your
                                          prompt
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="flex flex-col items-center gap-2">
                                        <Textarea
                                          className="h-40"
                                          placeholder="Make it more detailed..."
                                        />
                                      </div>

                                      <DialogFooter className="sm:justify-start">
                                        <DialogClose asChild>
                                          {/* TODO: submit the prompt to ai */}
                                          <Button variant="outline">
                                            Submit
                                          </Button>
                                        </DialogClose>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>

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
                                          entry.solutions.problems.length - 1
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
    </>
  );
}
