import { Badge } from "./ui/badge";

function bytesToReadable(size: number) {
  const units = ["B", "KB", "MB", "GB"];
  let u = 0;
  while (size >= 1024 && u < units.length - 1) {
    size /= 1024;
    u++;
  }
  return `${size.toFixed(u === 0 ? 0 : 1)} ${units[u]}`;
}

export type InfoAreaProps = {
  itemsLength: number;
  totalBytes: number;
};

export default function InfoArea({ itemsLength, totalBytes }: InfoAreaProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-300">Selected</span>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-slate-800/80">
          {itemsLength}
        </Badge>
        <span className="text-slate-400">{bytesToReadable(totalBytes)}</span>
      </div>
    </div>
  );
}
