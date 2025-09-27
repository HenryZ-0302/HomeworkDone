import { useGeminiStore } from "@/store/gemini-store";
import ActionsArea from "./ActionsArea";
import InfoArea from "./InfoArea";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import UploadArea from "./UploadArea";
import type { ImageItem } from "./pages/ScanPage";

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
  const geminiModel = useGeminiStore((state) => state.geminiModel);
  const setGeminiModel = useGeminiStore((state) => state.setGeminiModel);
  const clearGeminiKey = useGeminiStore((state) => state.clearGeminiKey);

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

        <div className="flex flex-col gap-2">
          <label>AI Settings</label>
          <Input
            placeholder="Gemini Model"
            value={geminiModel}
            onChange={(e) => setGeminiModel(e.target.value)}
          />
          <Button variant="destructive" onClick={clearGeminiKey}>
            Clear API Key
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
