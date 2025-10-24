import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  DialogHeader,
  DialogFooter,
  DialogClose,
  Dialog,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogContent,
} from "../ui/dialog";
import { Kbd } from "../ui/kbd";
import { Textarea } from "../ui/textarea";
import type { OrderedSolution } from "../areas/SolutionsArea";
import { useProblemsStore, type ProblemSolution } from "@/store/problems-store";
import { parseImproveResponse, type ImproveResponse } from "@/ai/response";
import { useAiStore } from "@/store/ai-store";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { renderImproveXml } from "@/ai/request";
import { IMPROVE_SYSTEM_PROMPT } from "@/ai/prompts";
import { uint8ToBase64 } from "@/utils/encoding";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export type ImproveSolutionDialogProps = {
  entry: OrderedSolution;
  activeProblem: ProblemSolution | null;
  updateSolution: (solution: ImproveResponse) => void;
};

export type ImproveSolutionDialogHandle = {
  openDialog: () => void;
};

export const ImproveSolutionDialog = forwardRef<
  ImproveSolutionDialogHandle,
  ImproveSolutionDialogProps
>(({ entry, activeProblem, updateSolution }, ref) => {
  const sources = useAiStore((s) => s.sources);
  const activeSourceId = useAiStore((s) => s.activeSourceId);
  const getClientForSource = useAiStore((s) => s.getClientForSource);
  const { appendStreamedOutput, clearStreamedOutput } = useProblemsStore(
    (s) => s,
  );
  const { t } = useTranslation("commons", { keyPrefix: "improve-dialog" });

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

  useImperativeHandle(ref, () => ({
    openDialog: () => {
      setDialogOpen(true);
    },
  }));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [improveSolutionPrompt, setImproveSolutionPrompt] = useState("");
  const [isImproving, setImproving] = useState(false);

  const handleImproveSolution = async () => {
    if (!activeProblem) return;
    if (!enabledSources.length) {
      toast(t("toasts.no-source.title"), {
        description: t("toasts.no-source.description"),
      });
      return;
    }

    const buf = await entry.item.file.arrayBuffer();
    const base64 = uint8ToBase64(new Uint8Array(buf));

    const prompt = renderImproveXml({
      user_suggestion: improveSolutionPrompt,
      answer: activeProblem.answer,
      explanation: activeProblem.explanation,
      problem: activeProblem.problem,
    });

    try {
      toast(t("toasts.processing.title"), {
        description: t("toasts.processing.description"),
      });
      setImproving(true);

      let lastError: unknown = null;

      for (const source of enabledSources) {
        const ai = getClientForSource(source.id);
        if (!ai) {
          lastError = new Error(t("toasts.no-key.description", { provider: source.name }));
          continue;
        }

        const traitsPrompt = source.traits
          ? `\nUser defined traits:
<traits>
${source.traits}
</traits>
`
          : "";

        ai.setSystemPrompt(IMPROVE_SYSTEM_PROMPT + traitsPrompt);

        try {
          clearStreamedOutput(entry.item.url);

          const resText = await ai.sendMedia(
            base64,
            entry.item.mimeType,
            prompt,
            source.model,
            (text) => appendStreamedOutput(entry.item.url, text),
          );

          const res = parseImproveResponse(resText);
          if (!res) {
            throw new Error(t("toasts.failed.parse"));
          }

          updateSolution(res);
          clearStreamedOutput(entry.item.url);
          return;
        } catch (error) {
          lastError = error;
          clearStreamedOutput(entry.item.url);
        }
      }

      throw lastError ?? new Error(t("toasts.failed.parse"));
    } catch (e) {
      toast(t("toasts.failed.title"), {
        description: t("toasts.failed.description", { error: String(e) }),
      });
      return;
    } finally {
      setImproving(false);
    }
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    // 现在只处理 Dialog 内部的快捷键
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault(); // 阻止默认行为（如换行）
      setDialogOpen(false);
      handleImproveSolution();
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={isImproving}>
          {isImproving && <Loader2 className="animate-spin mr-2" />}
          {t("trigger")} <Kbd>/</Kbd>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={improveSolutionPrompt}
          onChange={(e) => setImproveSolutionPrompt(e.target.value)}
          onKeyDown={onKeyDown} // 在 Textarea 上监听快捷键
          className="h-40"
          placeholder={t("placeholder")}
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="secondary"
              onClick={handleImproveSolution}
              disabled={!improveSolutionPrompt || isImproving}
            >
              {t("submit")} <Kbd>Ctrl+Enter</Kbd>
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

ImproveSolutionDialog.displayName = "ImproveSolutionDialog";
