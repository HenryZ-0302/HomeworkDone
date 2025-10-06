import type { ImageItem } from "@/store/problems-store";
import ActionsArea from "../areas/ActionsArea";
import InfoArea from "../UploadsInfo";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import UploadArea from "../areas/UploadArea";
import { useNavigate } from "react-router-dom";
import { useHotkeys } from "react-hotkeys-hook";

export type ActionsCardProps = {
  items: ImageItem[];
  appendFiles: (files: File[] | FileList, source: ImageItem["source"]) => void;
  totalBytes: number;
  clearAll: () => void;
  startScan: () => Promise<void>;
};

export default function ActionsCard({
  items,
  appendFiles,
  totalBytes,
  clearAll,
  startScan,
}: ActionsCardProps) {
  const navigate = useNavigate();

  const handleSettingsBtnClick = () => {
    navigate("/settings");
  };

  useHotkeys("ctrl+5", handleSettingsBtnClick);

  return (
    <Card className="md:col-span-1 border-white/10 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-base">Add Images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <UploadArea appendFiles={appendFiles} />

        <Separator className="my-2" />

        <InfoArea itemsLength={items.length} totalBytes={totalBytes} />

        <ActionsArea
          itemsLength={items.length}
          clearAll={clearAll}
          startScan={startScan}
        />

        <Button
          className="w-full"
          variant="secondary"
          onClick={handleSettingsBtnClick}
        >
          Settings (Ctrl+5)
        </Button>
      </CardContent>
    </Card>
  );
}
