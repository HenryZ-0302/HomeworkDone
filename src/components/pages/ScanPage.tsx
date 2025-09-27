import { toast } from "sonner";
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

export type ImageItem = {
  id: string;
  file: File;
  url: string; // object URL for preview
  source: "upload" | "camera";
};

export type ImageSolution = {
  imageUrl: string;
  problems: ProblemSolution[];
};

export type ProblemSolution = {
  problem: string;
  answer: string;
  explanation: string;
};

export default function ScanPage() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [imageSolutions, setImageSolutions] = useState<ImageSolution[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedProblem, setSelectedProblem] = useState(0);

  const geminiModel = useGeminiStore((state) => state.geminiModel);
  // const geminiKey = useGeminiStore((state) => state.geminiKey);

  const [isWorking, setWorking] = useState(false);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((it) => URL.revokeObjectURL(it.url));
    };
  }, [items]);

  const totalBytes = useMemo(
    () => items.reduce((sum, it) => sum + it.file.size, 0),
    [items],
  );

  const appendFiles = useCallback(
    (files: File[] | FileList, source: ImageItem["source"]) => {
      const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (arr.length === 0) return;

      const next: ImageItem[] = arr.map((file) => ({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        source,
      }));
      setItems((prev) => [...prev, ...next]);
    },
    [],
  );

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    setItems((prev) => {
      prev.forEach((i) => URL.revokeObjectURL(i.url));
      return [];
    });
  };

  const startScan = async () => {
    if (geminiModel.length === 0) {
      toast("You're almost there", {
        description:
          "Please specific a Gemini model to start skidding! For example, `gemini-2.5-pro`",
      });
      return;
    }
    toast("Working...", {
      description:
        "Sending your homework to Gemini... Your time is being saved...",
    });
    setWorking(true);
    // Send images to gemini

    try {
      console.log("Sending images to AI");
      for (let item of items) {
        setImageSolutions((prev) => [
          ...prev,
          {
            imageUrl: item.url,
            problems: [
              {
                problem: "test problem",
                answer: "it works",
                explanation: "it just works",
              },
              {
                problem: "test problem 2",
                answer: "it works 2",
                explanation: "it just works 2",
              },
            ],
          },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWorking(false);
    }
  };

  // Build a solutions list in the same visual order as the uploaded items.
  // Each entry pairs the item (image) with its solutions by imageUrl.
  const orderedSolutions = useMemo(() => {
    const byUrl = new Map(imageSolutions.map((s) => [s.imageUrl, s]));
    return items
      .filter((it) => byUrl.has(it.url))
      .map((it) => ({
        item: it,
        solutions: byUrl.get(it.url)!,
      }));
  }, [items, imageSolutions]);

  // Current image index is derived from selectedImage (stores image URL).
  const currentImageIdx = useMemo(() => {
    if (!orderedSolutions.length) return -1;
    if (!selectedImage) return 0;
    const idx = orderedSolutions.findIndex((e) => e.item.url === selectedImage);
    return idx === -1 ? 0 : idx;
  }, [orderedSolutions, selectedImage]);

  // Keep selectedImage consistent if data changes
  useEffect(() => {
    if (!orderedSolutions.length) {
      if (selectedImage !== null) setSelectedImage(null);
      return;
    }
    const safeIdx = currentImageIdx === -1 ? 0 : currentImageIdx;
    const url = orderedSolutions[safeIdx].item.url;
    if (selectedImage !== url) setSelectedImage(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedSolutions.length]);

  // Access current problems
  const currentBundle =
    currentImageIdx >= 0 ? orderedSolutions[currentImageIdx] : null;
  const problems = currentBundle?.solutions.problems ?? [];

  // Clamp selectedProblem when switching images / data updates
  useEffect(() => {
    if (!problems.length) {
      if (selectedProblem !== 0) setSelectedProblem(0);
      return;
    }
    const clamped = Math.min(selectedProblem, problems.length - 1);
    if (clamped !== selectedProblem) setSelectedProblem(clamped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentImageIdx, problems.length]);

  // Navigation helpers
  const goNextProblem = () =>
    setSelectedProblem((i) =>
      Math.min(i + 1, Math.max(0, problems.length - 1)),
    );
  const goPrevProblem = () => setSelectedProblem((i) => Math.max(i - 1, 0));

  const goNextImage = () => {
    if (!orderedSolutions.length) return;
    const next = (currentImageIdx + 1) % orderedSolutions.length;
    setSelectedImage(orderedSolutions[next].item.url);
    setSelectedProblem(0);
  };
  const goPrevImage = () => {
    if (!orderedSolutions.length) return;
    const prev =
      (currentImageIdx - 1 + orderedSolutions.length) % orderedSolutions.length;
    setSelectedImage(orderedSolutions[prev].item.url);
    setSelectedProblem(0);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied", { description: "Answer copied to clipboard." });
    } catch {
      toast("Copy failed", { description: "Please copy manually." });
    }
  };

  // Keyboard shortcuts: Tab/Shift+Tab for problems; Space/Shift+Space for images.
  // Bind on a focusable container to avoid hijacking global page focus/scroll.
  const onKeyDownSolutions: React.KeyboardEventHandler<HTMLDivElement> = (
    e,
  ) => {
    // Space-based navigation
    if (e.code === "Space") {
      e.preventDefault();
      if (e.shiftKey) goPrevImage();
      else goNextImage();
      e.currentTarget.focus();
      return;
    }
    // Tab-based navigation
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) goPrevProblem();
      else goNextProblem();
      e.currentTarget.focus();
    }
  };

  return (
    <div className="min-h-screen text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
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
          {/* Left: Uploader / Actions */}
          <ActionsCard
            isWorking={isWorking}
            appendFiles={appendFiles}
            clearAll={clearAll}
            startScan={startScan}
            totalBytes={totalBytes}
            items={items}
          />

          {/* Right: Preview Grid */}
          <PreviewCard removeItem={removeItem} items={items} />
        </div>

        <div className="mt-6">
          <Card className="rounded-2xl p-4 shadow">
            <CardTitle>Solutions</CardTitle>
            <CardContent>
              {/* Focusable region to capture keyboard shortcuts */}
              <div
                tabIndex={0}
                onKeyDown={onKeyDownSolutions}
                className="outline-none"
                aria-label="Solutions keyboard focus region (Tab/Shift+Tab for problems, Space/Shift+Space for images)"
              >
                {/* Empty / working states */}
                {!orderedSolutions.length ? (
                  <div className="text-sm text-gray-400">
                    {isWorking
                      ? "Analyzing... extracting problems and solutions from your images."
                      : "No solutions yet. Add images and click Scan to see results here."}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Image Tabs (switch photos) */}
                    <Tabs
                      value={selectedImage ?? undefined}
                      onValueChange={(v) => {
                        setSelectedImage(v);
                        setSelectedProblem(0);
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

                      {orderedSolutions.map((entry, idx) => (
                        <TabsContent
                          key={entry.item.id}
                          value={entry.item.url}
                          className="mt-4"
                        >
                          {/* Collapsible preview of current photo */}
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

                          {/* Problems list + detail */}
                          {entry.solutions.problems.length === 0 ? (
                            <div className="text-sm text-slate-400">
                              No problems detected for this image.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                              {/* Left: Problems index */}
                              <aside className="md:col-span-1">
                                <ul className="space-y-2">
                                  {entry.solutions.problems.map((p, i) => {
                                    const isActive =
                                      selectedImage === entry.item.url &&
                                      i === selectedProblem;
                                    return (
                                      <li key={i}>
                                        <Button
                                          variant={
                                            isActive ? "secondary" : "outline"
                                          }
                                          className="w-full justify-start whitespace-normal"
                                          onClick={() => setSelectedProblem(i)}
                                        >
                                          <div className="text-left">
                                            <div className="text-xs font-semibold">
                                              Problem {i + 1}
                                            </div>
                                            <div className="line-clamp-2 text-xs opacity-80">
                                              {p.problem}
                                            </div>
                                          </div>
                                        </Button>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </aside>

                              {/* Right: Problem detail */}
                              <section className="md:col-span-2">
                                <div className="rounded-xl border border-slate-700 p-4">
                                  <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
                                    Problem {selectedProblem + 1} of{" "}
                                    {entry.solutions.problems.length}
                                  </div>

                                  <h3 className="mb-2 text-base font-semibold">
                                    {
                                      entry.solutions.problems[selectedProblem]
                                        .problem
                                    }
                                  </h3>

                                  <div className="mt-4 space-y-4">
                                    <div>
                                      <div className="mb-1 text-sm font-medium text-slate-300">
                                        Answer
                                      </div>
                                      <div className="rounded-lg bg-slate-900/60 p-3 text-sm">
                                        <pre className="whitespace-pre-wrap break-words">
                                          {
                                            entry.solutions.problems[
                                              selectedProblem
                                            ].answer
                                          }
                                        </pre>
                                      </div>
                                      <div className="mt-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            copyToClipboard(
                                              entry.solutions.problems[
                                                selectedProblem
                                              ].answer,
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
                                        <p className="whitespace-pre-wrap">
                                          {
                                            entry.solutions.problems[
                                              selectedProblem
                                            ].explanation
                                          }
                                        </p>
                                      </div>
                                    </div>

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
                                          Prev (Shift+Tab)
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
                                          Next (Tab)
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={goPrevImage}
                                        >
                                          ⟵ Image (Shift+Space)
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={goNextImage}
                                        >
                                          Image ⟶ (Space)
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </section>
                            </div>
                          )}
                        </TabsContent>
                      ))}
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
