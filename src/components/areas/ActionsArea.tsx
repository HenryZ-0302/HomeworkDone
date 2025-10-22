import { Loader2Icon, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useProblemsStore } from "@/store/problems-store";
import { Kbd } from "../ui/kbd";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export type ActionsAreaProps = {
  startScan: () => Promise<void>;
  clearAll: () => void;
  itemsLength: number;
  layout?: "default" | "mobile";
};

export default function ActionsArea({
  startScan,
  itemsLength,
  clearAll,
  layout = "default",
}: ActionsAreaProps) {
  const { t } = useTranslation("commons", { keyPrefix: "actions" });
  const isMobileLayout = layout === "mobile";

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
    <div
      className={cn("flex gap-2 flex-wrap", isMobileLayout && "flex-col gap-3")}
    >
      <Button
        ref={clearAllBtnRef}
        variant="destructive"
        className={cn(
          "flex-1 items-center justify-center",
          isMobileLayout && "py-6 text-base",
        )}
        size={isMobileLayout ? "lg" : "default"}
        disabled={itemsLength === 0 || isWorking}
        onClick={handleClearAll}
      >
        <span className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 shrink-0" />
          {!confirmedClear ? t("clear-all") : t("clear-confirmation")}
        </span>
        {!isMobileLayout && <Kbd>Ctrl+4</Kbd>}
      </Button>
      <Button
        ref={skidBtnRef}
        className={cn(
          "flex-1 items-center justify-center gap-2",
          isMobileLayout && "py-6 text-base",
        )}
        size={isMobileLayout ? "lg" : "default"}
        disabled={itemsLength === 0 || isWorking}
        onClick={handleSkidBtnClicked}
      >
        {isWorking ? (
          <>
            <Loader2Icon className="h-5 w-5 animate-spin" /> {t("processing")}
          </>
        ) : (
          <>
            {t("scan")} {!isMobileLayout && <Kbd>Ctrl+3</Kbd>}
          </>
        )}
      </Button>
    </div>
  );
}
