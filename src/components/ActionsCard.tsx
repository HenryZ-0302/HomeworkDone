import type { ImageItem } from "@/store/problems-store";
import ActionsArea from "./ActionsArea";
import InfoArea from "./InfoArea";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import UploadArea from "./UploadArea";
import { useNavigate } from "react-router-dom";

export type ActionsCardProps = {
  items: ImageItem[];
  appendFiles: (files: File[] | FileList, source: ImageItem["source"]) => void;
  isWorking: boolean;
  totalBytes: number;
  clearAll: () => void;
  startScan: () => Promise<void>;
};

export default function ActionsCard({
  items,
  appendFiles,
  isWorking,
  totalBytes,
  clearAll,
  startScan,
}: ActionsCardProps) {
  const navigate = useNavigate();

  const handleSettingsBtnClick = () => {
    navigate("/settings");
  };

  return (
    <Card className="md:col-span-1 border-white/10 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-base">Add Images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <UploadArea appendFiles={appendFiles} isWorking={isWorking} />

        <Separator className="my-2" />

        <InfoArea itemsLength={items.length} totalBytes={totalBytes} />

        <ActionsArea
          itemsLength={items.length}
          isWorking={isWorking}
          clearAll={clearAll}
          startScan={startScan}
        />

        <Button
          className="w-full"
          variant="secondary"
          onClick={handleSettingsBtnClick}
        >
          Settings
        </Button>
      </CardContent>
    </Card>
  );
}
