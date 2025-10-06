import { useState, type ComponentProps } from "react";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
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
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import type { OrderedSolution } from "./areas/SolutionsArea";
import { useProblemsStore } from "@/store/problems-store";
import { toast } from "sonner";

export type SolutionViewerProps = {
  entry: OrderedSolution;
  goPrevImage: () => void;
  goNextImage: () => void;
  goNextProblem: () => void;
  goPrevProblem: () => void;
} & ComponentProps<"section">;

export default function SolutionViewer({
  className,
  entry,
  goNextImage,
  goPrevImage,
  goNextProblem,
  goPrevProblem,
  ...props
}: SolutionViewerProps) {
  const { selectedProblem } = useProblemsStore((s) => s);

  const [dialogOpen, setDialogOpen] = useState(false);

  const problemCount = entry.solutions.problems.length;
  const safeIndex = Math.min(
    Math.max(0, selectedProblem),
    Math.max(0, problemCount - 1),
  );

  const activeProblem =
    problemCount > 0 ? entry.solutions.problems[safeIndex] : null;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied", { description: "Answer copied to clipboard." });
    } catch {
      toast("Copy failed", { description: "Please copy manually." });
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (dialogOpen) {
      // handle Ctrl+Enter to submit the prompt
      if (e.ctrlKey && e.key === "Enter") {
        console.log("submit prompt!");
        setDialogOpen(false);
        // handleImprove();
      }
      return;
    } else {
      // handle navigation

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
      if (e.key === "/") {
        e.preventDefault();
        setDialogOpen(true);
      }
    }
  };

  return (
    <section
      tabIndex={0}
      className={cn("md:col-span-2", className)}
      onKeyDown={onKeyDown}
      {...props}
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
          rehypePlugins={[[rehypeKatex, { output: "html" }]]}
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
                rehypePlugins={[[rehypeKatex, { output: "html" }]]}
              >
                {activeProblem?.answer ?? ""}
              </Markdown>
            </div>
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(activeProblem?.answer ?? "")}
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
                rehypePlugins={[[rehypeKatex, { output: "html" }]]}
              >
                {activeProblem?.explanation ?? ""}
              </Markdown>
            </div>
          </div>

          <Dialog
            open={dialogOpen}
            onOpenChange={(state) => setDialogOpen(state)}
          >
            <DialogTrigger asChild>
              <Button variant="outline">Improve the Solution (/)</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Improve the Solution</DialogTitle>
                <DialogDescription>
                  Generate a more detailed solution using the current solution
                  and your prompt
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
                  <Button variant="outline">Submit (Ctrl+Enter)</Button>
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
                  selectedProblem >= entry.solutions.problems.length - 1
                }
              >
                Next (Space)
              </Button>
              <Button variant="outline" size="sm" onClick={goPrevImage}>
                ⟵ Image (Shift+Tab)
              </Button>
              <Button variant="outline" size="sm" onClick={goNextImage}>
                Image ⟶ (Tab)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
