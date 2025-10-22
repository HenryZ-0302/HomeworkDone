import { useEffect, useState } from "react";

/**
 * Subscribes to a CSS media query and returns whether it currently matches.
 * Falls back to `false` during SSR or environments without `window`.
 */
export function useMediaQuery(query: string) {
  const getMatches = () =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false;

  const [matches, setMatches] = useState(getMatches);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    // Update immediately in case query changed before subscription
    setMatches(mql.matches);
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

