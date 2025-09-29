import { ImageIcon, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { twMerge } from "tailwind-merge";
import type { ImageItem } from "@/store/problems-store";

export type PreviewCardProps = {
  items: ImageItem[];
  removeItem: (id: string) => void;
};

function getColorClassByStatus(status: "success" | "failed" | "pending") {
  switch (status) {
    case "success":
      return "border-green-500";
    case "failed":
      return "border-red-500";
    case "pending":
      return "border-amber-500";
  }
}

export default function PreviewCard({ items, removeItem }: PreviewCardProps) {
  return (
    <Card className="md:col-span-2 border-white/10 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-base">Preview</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 text-slate-400">
            <ImageIcon className="mb-2 h-6 w-6" />
            <p className="text-sm">
              No images yet. Upload or take a photo to begin.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[520px] rounded-lg">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {items.map((it) => (
                <figure
                  key={it.id}
                  className={twMerge(
                    "group relative overflow-hidden rounded-xl border border-white/10",
                    getColorClassByStatus(it.status),
                  )}
                >
                  <img
                    src={it.url}
                    alt="homework"
                    className="h-40 w-full object-cover"
                  />
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
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
