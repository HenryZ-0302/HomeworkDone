import { Loader2Icon, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useProblemsStore } from "@/store/problems-store";

export type ActionsAreaProps = {
  startScan: () => Promise<void>;
  clearAll: () => void;
  itemsLength: number;
};

export default function ActionsArea({
  startScan,
  itemsLength,
  clearAll,
}: ActionsAreaProps) {
  const isWorking = useProblemsStore((s) => s.isWorking);
  const handleSkidBtnClicked = () => {
    if (isWorking) return;
    startScan();
  };

  const clearAllBtnRef = useRef<HTMLButtonElement | null>(null);
  const skidBtnRef = useRef<HTMLButtonElement | null>(null);

  const [confirmedClear, setConfirmedClear] = useState(false);

  useHotkeys("ctrl+3", () => skidBtnRef.current?.click());
  useHotkeys("ctrl+4", () => clearAllBtnRef.current?.click());

  const handleClearAll = () => {
    if (confirmedClear) {
      clearAll();
      setConfirmedClear(false);
    } else {
      setConfirmedClear(true);
    }
  };

  useEffect(() => {
    if (!confirmedClear) return; // do not modify the variable if it is already false
    const timeoutId = setTimeout(() => {
      setConfirmedClear(false);
    }, 3000);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [confirmedClear, setConfirmedClear]);

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        ref={clearAllBtnRef}
        variant="destructive"
        className="flex-1"
        disabled={itemsLength === 0 || isWorking}
        onClick={handleClearAll}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        {!confirmedClear ? (
          <label>Clear All</label>
        ) : (
          <label>Click again to confirm</label>
        )}{" "}
        (Ctrl+4)
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
