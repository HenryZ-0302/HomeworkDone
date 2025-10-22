import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useHasActiveAiKey } from "@/store/ai-store";

type RequireAiKeyProps = PropsWithChildren<{
  fallback: string;
}>;

export default function RequireAiKey({
  children,
  fallback,
}: RequireAiKeyProps) {
  const hasKey = useHasActiveAiKey();
  const location = useLocation();

  if (!hasKey) {
    return <Navigate to={fallback} replace state={{ from: location }} />;
  }

  return children;
}
