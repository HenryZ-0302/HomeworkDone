import "react-photo-view/dist/react-photo-view.css";
import { ImageIcon, Trash2, X } from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { twMerge } from "tailwind-merge";
import type { FileItem } from "@/store/problems-store";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export type PreviewCardProps = {
  items: FileItem[];
  appendFiles: (files: File[] | FileList, source: FileItem["source"]) => void;
  removeItem: (id: string) => void;
};

function getColorClassByStatus(
  status: "success" | "failed" | "pending" | "rasterizing",
) {
  switch (status) {
    case "success":
      return "border-green-500";
    case "failed":
      return "border-red-500";
    case "pending":
      return "border-amber-500";
    case "rasterizing":
      return "border-cyan-500";
  }
}

export default function PreviewCard({
  items,
  removeItem,
  appendFiles,
}: PreviewCardProps) {
  const { t } = useTranslation("commons", { keyPrefix: "preview" });

  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        appendFiles(e.dataTransfer.files, "upload");
      }
    },
    [appendFiles],
  );

  return (
    <Card className="md:col-span-2 border-white/10 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent
        className="flex flex-col gap-2"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
      >
        {items.length === 0 ? (
          <div
            className={cn(
              "flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-slate-400",
              isDragging
                ? "border-indigo-400 bg-indigo-500/10"
                : "border-white/15",
            )}
            onDrop={onDrop}
          >
            <ImageIcon className="mb-2 h-6 w-6" />
            <p className="text-sm">
              {/* No images yet. Upload or take a photo to begin. */}
              {t("no-files")}
            </p>
            <p className="text-sm">
              {/* You can drag your files to this panel. */}
              {t("drag-tip")}
            </p>
          </div>
        ) : (
          <ScrollArea className="rounded-lg">
            <PhotoProvider>
              <div
                className={cn(
                  "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4",
                  isDragging
                    ? "border-indigo-400 bg-indigo-500/10"
                    : "border-white/15",
                )}
                onDrop={onDrop}
              >
                {items.map((it) => (
                  <figure
                    key={it.id}
                    className={twMerge(
                      "group relative overflow-hidden rounded-xl border border-white/10",
                      getColorClassByStatus(it.status),
                    )}
                  >
                    {it.mimeType.startsWith("image/") ? (
                      <PhotoView src={it.url}>
                        <img
                          src={it.url}
                          alt="homework"
                          className="h-40 w-full object-cover cursor-pointer"
                        />
                      </PhotoView>
                    ) : (
                      <div className="h-40 w-full object-cover flex items-center justify-center select-none">
                        {it.mimeType === "application/pdf" ? (
                          <>PDF</>
                        ) : (
                          <>Unknown Type</>
                        )}
                      </div>
                    )}
                    <figcaption className="flex items-center justify-between px-3 py-2 text-xs text-slate-300">
                      <span className="truncate" title={it.file.name}>
                        {it.file.name}
                      </span>
                      <Badge variant="outline" className="border-white/20">
                        {it.source}
                      </Badge>
                    </figcaption>
                    <button
                      className="absolute right-2 top-2 hidden rounded-md bg-black/40 p-1 text-white/90 backdrop-blur transition group-hover:block"
                      onClick={() => removeItem(it.id)}
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </figure>
                ))}
              </div>
            </PhotoProvider>
          </ScrollArea>
        )}

        {isDragging && (
          <div
            className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed text-slate-400 border-red-500 bg-red-500/10"
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
          >
            <Trash2 />
            Drag to here to cancel
          </div>
        )}
      </CardContent>
    </Card>
  );
}
