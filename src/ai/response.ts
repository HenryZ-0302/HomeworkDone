import type { ProblemSolution } from "@/components/pages/ScanPage";

interface SolveResponse {
  problems: ProblemSolution[];
}

export function parseResponse(response: string): SolveResponse | null {
  if (response.startsWith("```json")) {
    // strip markdown block
    const trimmed = response
      .replace(/^```json\s*/, "")
      .replace(/```$/, "")
      .trim();
    try {
      return JSON.parse(trimmed) as SolveResponse;
    } catch (e) {
      console.error("Failed to parse JSON:", e, trimmed);
      return null;
    }
  } else if (response.startsWith("{")) {
    try {
      return JSON.parse(response) as SolveResponse;
    } catch (e) {
      console.error("Failed to parse JSON:", e, response);
      return null;
    }
  } else {
    // Unknown response
    console.error("Failed to parse response:", response);
    return null;
  }
}
