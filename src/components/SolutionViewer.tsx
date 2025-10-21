import "katex/dist/katex.min.css";
import { useRef, type ComponentProps } from "react";
import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import type { OrderedSolution } from "./areas/SolutionsArea";
import { useProblemsStore } from "@/store/problems-store";
import { toast } from "sonner";
import { type ImproveResponse } from "@/ai/response";
import { Kbd } from "./ui/kbd";
import { MemoizedMarkdown } from "./MarkdownRenderer";
import {
  ImproveSolutionDialog,
  type ImproveSolutionDialogHandle,
} from "./dialogs/ImproveSolutionDialog";
import { useTranslation } from "react-i18next";

export type SolutionViewerProps = {
  entry: OrderedSolution;
  goPrevImage: () => void;
  goNextImage: () => void;
  goNextProblem: () => void;
  goPrevProblem: () => void;

  updateSolution: (solution: ImproveResponse) => void;
} & ComponentProps<"section">;

export default function SolutionViewer({
  className,
  entry,
  goNextImage,
  goPrevImage,
  goNextProblem,
  goPrevProblem,
  updateSolution,
  ...props
}: SolutionViewerProps) {
  const selectedProblem = useProblemsStore((s) => s.selectedProblem);
  const { t } = useTranslation("commons", { keyPrefix: "solution-viewer" });

  const viewerRef = useRef<HTMLElement | null>(null);

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
      toast(t("copy.success.title"), {
        description: t("copy.success.description"),
      });
    } catch {
      toast(t("copy.failed.title"), {
        description: t("copy.failed.description"),
      });
    }
  };

  const dialogRef = useRef<ImproveSolutionDialogHandle>(null);

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === "TEXTAREA" ||
      target.tagName === "INPUT" ||
      target.isContentEditable
    ) {
      return;
    }

    if (e.key === "/") {
      e.preventDefault();
      // open the dialog
      dialogRef.current?.openDialog();
    }
    if (e.ctrlKey && e.shiftKey && e.key === "C") {
      if (!activeProblem) return;
      e.preventDefault();
      copyToClipboard(activeProblem.answer);
    }
  };

  return (
    <section
      ref={viewerRef}
      tabIndex={0}
      className={cn("md:col-span-2", className)}
      onKeyDown={onKeyDown}
      {...props}
    >
      <div className="rounded-xl border border-slate-700 p-4">
        <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">
          {t("progress.prefix")}{" "}
          <label className="font-extrabold text-amber-500">
            {selectedProblem + 1}
          </label>{" "}
          {t("progress.suffix", {
            total: entry.solutions.problems.length,
          })}
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
              {t("answer")}
            </div>
            <div className="rounded-lg bg-slate-900/60 p-3 text-sm">
              <MemoizedMarkdown source={activeProblem?.answer ?? ""} />
            </div>
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(activeProblem?.answer ?? "")}
              >
                {t("copy.button")} <Kbd>Ctrl+⇧+C</Kbd>
              </Button>
            </div>
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-slate-300">
              {t("explanation")}
            </div>
            <div className="rounded-lg bg-slate-900/40 p-3 text-sm leading-relaxed">
              <MemoizedMarkdown source={activeProblem?.explanation ?? ""} />
            </div>
          </div>

          <ImproveSolutionDialog
            ref={dialogRef}
            entry={entry}
            activeProblem={activeProblem}
            updateSolution={updateSolution}
          />

          {/* Navigation controls for problems and images. */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-500">
              {t("source-image")}&nbsp;
              <a
                href={entry.item.url}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-dotted"
              >
                {t("open-preview")}
              </a>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goPrevProblem}
                disabled={selectedProblem === 0}
              >
                {t("navigation.prev-problem")} <Kbd>⇧+␣</Kbd>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goNextProblem}
                disabled={
                  selectedProblem >= entry.solutions.problems.length - 1
                }
              >
                {t("navigation.next-problem")} <Kbd>␣</Kbd>
              </Button>
              <Button variant="outline" size="sm" onClick={goPrevImage}>
                {t("navigation.prev-image")} <Kbd>⇧+TAB</Kbd>
              </Button>
              <Button variant="outline" size="sm" onClick={goNextImage}>
                {t("navigation.next-image")} <Kbd>TAB</Kbd>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
