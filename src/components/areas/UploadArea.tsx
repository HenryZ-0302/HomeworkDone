import { Camera, Info, Upload } from "lucide-react";
import { Button } from "../ui/button";
import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useHotkeys } from "react-hotkeys-hook";
import { useProblemsStore, type FileItem } from "@/store/problems-store";
import { Kbd } from "../ui/kbd";
import { Trans, useTranslation } from "react-i18next";

export type UploadAreaProps = {
  appendFiles: (files: File[] | FileList, source: FileItem["source"]) => void;
};

export default function UploadArea({ appendFiles }: UploadAreaProps) {
  const { t } = useTranslation("commons", { keyPrefix: "upload-area" });
  const cameraTips = t("camera-tip.tips", {
    returnObjects: true,
  }) as string[];

  const isWorking = useProblemsStore((s) => s.isWorking);
  // const [isDragging, setIsDragging] = useState(false);
  const [cameraTipOpen, setCameraTipOpen] = useState(false);

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadBtnRef = useRef<HTMLButtonElement | null>(null);
  const cameraBtnRef = useRef<HTMLButtonElement | null>(null);

  const handleUploadBtnClicked = () => {
    if (isWorking) return;
    uploadInputRef.current?.click();
  };

  const handleCameraBtnClicked = () => {
    if (isWorking) return;
    cameraInputRef.current?.click();
  };

  // Add keybindings
  useHotkeys("ctrl+1", handleUploadBtnClicked);
  useHotkeys("ctrl+2", handleCameraBtnClicked);

  return (
    <>
      <p className="text-sm">{t("upload-tip")}</p>
      <div className="flex gap-2">
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*, application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.currentTarget.files)
              appendFiles(e.currentTarget.files, "upload");
            e.currentTarget.value = ""; // allow re-select same files
          }}
        />
        <Button
          className="flex-1"
          ref={uploadBtnRef}
          disabled={isWorking}
          onClick={handleUploadBtnClicked}
        >
          <Upload className="mr-2 h-4 w-4" />
          <label>{t("upload")}</label>
          <Kbd>Ctrl+1</Kbd>
        </Button>
      </div>
      <div className="flex gap-2">
        <input
          ref={cameraInputRef}
          disabled={isWorking}
          type="file"
          accept="image/*, application/pdf"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.currentTarget.files)
              appendFiles(e.currentTarget.files, "camera");
            e.currentTarget.value = "";
          }}
        />
        <Button
          ref={cameraBtnRef}
          variant="secondary"
          className="flex-1"
          disabled={isWorking}
          onClick={handleCameraBtnClicked}
        >
          <Camera className="mr-2 h-4 w-4" />
          <label>{t("take-photo")}</label>
          <Kbd>Ctrl+2</Kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCameraTipOpen(true)}
          aria-label={t("camera-help-aria")}
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>
      {/* Camera help dialog */}
      <Dialog open={cameraTipOpen} onOpenChange={setCameraTipOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("camera-tip.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>
              <Trans
                i18nKey="upload-area.camera-tip.intro"
                components={{
                  takePhoto: <code />,
                  capture: <code />,
                }}
              />
            </p>
            <ul className="list-disc pl-5 dark:text-slate-400">
              {cameraTips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setCameraTipOpen(false)}>
              {t("camera-tip.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
