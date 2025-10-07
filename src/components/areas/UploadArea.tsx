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

export type UploadAreaProps = {
  appendFiles: (files: File[] | FileList, source: FileItem["source"]) => void;
};

export default function UploadArea({ appendFiles }: UploadAreaProps) {
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

  // const onDrop = useCallback(
  //   (e: React.DragEvent<HTMLDivElement>) => {
  //     e.preventDefault();
  //     setIsDragging(false);
  //     if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
  //       appendFiles(e.dataTransfer.files, "upload");
  //     }
  //   },
  //   [appendFiles],
  // );

  return (
    <>
      <p className="text-sm">PDF & Image files are supported</p>
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
          <Upload className="mr-2 h-4 w-4" /> Upload Files <Kbd>Ctrl+1</Kbd>
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
          <Camera className="mr-2 h-4 w-4" /> Take Photo <Kbd>Ctrl+2</Kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCameraTipOpen(true)}
          aria-label="Camera help"
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>
      {/* Camera help dialog */}
      <Dialog open={cameraTipOpen} onOpenChange={setCameraTipOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Taking photos on different devices</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-slate-300">
            <p>
              The <code>Take Photo</code> button uses the browser's native
              camera picker (<code>capture="environment"</code>). On phones, it
              opens the camera directly. On desktops, it usually falls back to
              the file chooser.
            </p>
            <ul className="list-disc pl-5 text-slate-400">
              <li>Prefer natural light and avoid glare.</li>
              <li>Fill the frame with the problem. Keep text sharp.</li>
              <li>One question per shot yields better recognition.</li>
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setCameraTipOpen(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
