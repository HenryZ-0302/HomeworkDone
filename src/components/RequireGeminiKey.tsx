import { Navigate, useLocation } from "react-router-dom";
import { useHasGeminiKey } from "../store/gemini-store";
import type { PropsWithChildren } from "react";

type RequireGeminiKeyProps = PropsWithChildren<{
  fallback: string;
}>;

export default function RequireGeminiKey({
  children,
  fallback,
}: RequireGeminiKeyProps) {
  const hasKey = useHasGeminiKey();
  const location = useLocation();

  if (!hasKey) {
    return <Navigate to={fallback} replace state={{ from: location }} />;
  }
  return children;
}
