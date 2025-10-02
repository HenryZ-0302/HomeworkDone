import { Loader2Icon, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";

export type ActionsAreaProps = {
  isWorking: boolean;
  startScan: () => Promise<void>;
  clearAll: () => void;
  itemsLength: number;
};

export default function ActionsArea({
  isWorking,
  startScan,
  itemsLength,
  clearAll,
}: ActionsAreaProps) {
  const handleSkidBtnClicked = () => {
    if (isWorking) return;
    startScan();
  };

  const clearAllBtnRef = useRef<HTMLButtonElement | null>(null);
  const skidBtnRef = useRef<HTMLButtonElement | null>(null);

  useHotkeys("ctrl+3", () => skidBtnRef.current?.click());
  useHotkeys("ctrl+4", () => clearAllBtnRef.current?.click());

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        ref={clearAllBtnRef}
        variant="destructive"
        className="flex-1"
        disabled={itemsLength === 0 || isWorking}
        onClick={clearAll}
      >
        {/* TODO: confirm before delete */}
        <Trash2 className="mr-2 h-4 w-4" /> Clear All (Ctrl+4)
      </Button>
      <Button
        ref={skidBtnRef}
        className="flex-1"
        disabled={itemsLength === 0 || isWorking}
        onClick={handleSkidBtnClicked}
      >
        {isWorking ? (
          <>
            <Loader2Icon className="animate-spin" /> Processing...
          </>
        ) : (
          <>Let's Skid (Ctrl+3)</>
        )}
      </Button>
    </div>
  );
}
