import { Badge } from "./ui/badge";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("commons", { keyPrefix: "uploads-info" });
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="dark:text-slate-300">{t("selected")}</span>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-white bg-slate-800/80">
          {itemsLength}
        </Badge>
        <span className="text-slate-700 dark:text-slate-400">
          {bytesToReadable(totalBytes)}
        </span>
      </div>
    </div>
  );
}
