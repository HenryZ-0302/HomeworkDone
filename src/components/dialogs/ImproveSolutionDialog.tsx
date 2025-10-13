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
      toast("You're almost there", {
        description: "You need to set your API key in settings to use the AI.",
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
      toast("Processing", {
        description:
          "Improving your solution with AI...Please wait for a while...",
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
        toast("Failed to improve your solution", {
          description:
            "Failed to parse response, see the developer tools for more details.",
        });
        return;
      }
      updateSolution(res);
      // clear streaming output
      clearStreamedOutput(entry.item.url);
    } catch (e) {
      toast("Failed to improve your solution", {
        description: `Something went wrong: ${e}`,
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
          Improve the Solution <Kbd>/</Kbd>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Improve the Solution</DialogTitle>
          <DialogDescription>
            Generate a more detailed solution using the current solution and
            your prompt.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={improveSolutionPrompt}
          onChange={(e) => setImproveSolutionPrompt(e.target.value)}
          onKeyDown={onKeyDown} // 在 Textarea 上监听快捷键
          className="h-40"
          placeholder="Make it more detailed..."
        />
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="secondary"
              onClick={handleImproveSolution}
              disabled={!improveSolutionPrompt || isImproving}
            >
              Submit <Kbd>Ctrl+Enter</Kbd>
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

ImproveSolutionDialog.displayName = "ImproveSolutionDialog";
