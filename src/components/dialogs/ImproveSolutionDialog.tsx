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
import { useGeminiStore } from "@/store/gemini-store";
import { forwardRef, useImperativeHandle, useState } from "react";
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
  const getGemini = useGeminiStore((s) => s.getGemini);
  const geminiModel = useGeminiStore((s) => s.geminiModel);
  const { appendStreamedOutput, clearStreamedOutput } = useProblemsStore(
    (s) => s,
  );
  const { t } = useTranslation("commons", { keyPrefix: "improve-dialog" });

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
    const ai = getGemini();
    if (!ai) {
      toast(t("toasts.no-key.title"), {
        description: t("toasts.no-key.description"),
      });
      return;
    }

    // apply system prompt
    ai.setSystemPrompt(IMPROVE_SYSTEM_PROMPT);

    const buf = await entry.item.file.arrayBuffer();
    const bytes = new Uint8Array(buf);

    const prompt = renderImproveXml({
      user_suggestion: improveSolutionPrompt,
      answer: activeProblem.answer,
      explanation: activeProblem.explanation,
      problem: activeProblem.problem,
    });

    const callback = (text: string) => {
      appendStreamedOutput(entry.item.url, text);
    };

    try {
      toast(t("toasts.processing.title"), {
        description: t("toasts.processing.description"),
      });
      setImproving(true);
      const resText = await ai?.sendMedia(
        uint8ToBase64(bytes),
        entry.item.mimeType,
        prompt,
        geminiModel,
        callback,
      );
      // console.log(resText);

      const res = parseImproveResponse(resText);

      // console.log(res);
      if (!res) {
        toast(t("toasts.failed.title"), {
          description: t("toasts.failed.parse"),
        });
        return;
      }
      updateSolution(res);
      // clear streaming output
      clearStreamedOutput(entry.item.url);
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
