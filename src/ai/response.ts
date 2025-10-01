import type { ProblemSolution } from "@/store/problems-store";

export interface SolveResponse {
  problems: ProblemSolution[];
}

/**
 * Parses a string response from the AI, which could be in JSON or XML format.
 * It handles both raw responses and responses wrapped in markdown code blocks.
 * @param response The raw string response from the AI.
 * @returns A SolveResponse object if parsing is successful, otherwise null.
 */
export function parseResponse(response: string): SolveResponse | null {
  if (response.startsWith("```json")) {
    // The response is a JSON object inside a markdown block.
    // Strip the markdown fence before parsing.
    const trimmed = response
      .replace(/^```json\s*/, "")
      .replace(/```$/, "")
      .trim();
    try {
      return JSON.parse(trimmed) as SolveResponse;
    } catch (e) {
      console.error("Failed to parse JSON from markdown block:", e, trimmed);
      return null;
    }
  } else if (response.startsWith("{")) {
    // The response appears to be a raw JSON object.
    try {
      return JSON.parse(response) as SolveResponse;
    } catch (e) {
      console.error("Failed to parse raw JSON:", e, response);
      return null;
    }
  } else if (response.startsWith("```xml")) {
    // The response is an XML document inside a markdown block.
    // Strip the markdown fence before parsing.
    const trimmed = response
      .replace(/^```xml\s*/, "")
      .replace(/```$/, "")
      .trim();
    return parseXmlToSolveResponse(trimmed);
  } else if (response.startsWith("<")) {
    // The response appears to be a raw XML document.
    return parseXmlToSolveResponse(response);
  } else {
    // The response format is unknown or not supported.
    console.error("Failed to parse response due to unknown format:", response);
    return null;
  }
}

/**
 * Helper function to parse an XML string into a SolveResponse object.
 * This implementation uses the browser's built-in DOMParser.
 * For Node.js environments, a library like 'fast-xml-parser' or 'jsdom' would be needed.
 * @param xmlString The XML string to parse.
 * @returns A SolveResponse object if parsing is successful, otherwise null.
 */
function parseXmlToSolveResponse(xmlString: string): SolveResponse | null {
  try {
    // Use the native browser DOMParser to parse the XML string.
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");

    // DOMParser does not throw an error for malformed XML.
    // Instead, it returns a document with a <parsererror> node.
    const parseError = xmlDoc.getElementsByTagName("parsererror");
    if (parseError.length > 0) {
      console.error("Failed to parse XML:", parseError[0].textContent);
      return null;
    }

    // Find all <problem> elements in the document.
    const problemNodes = Array.from(xmlDoc.getElementsByTagName("problem"));

    // Map each <problem> XML node to a ProblemSolution object.
    const problems: ProblemSolution[] = problemNodes.map((node) => {
      // Helper function to safely get text content from a child element.
      const getTextContent = (tagName: string): string => {
        const element = node.getElementsByTagName(tagName)[0];
        // Return the text content or an empty string if the element is not found.
        // This handles CDATA sections in <explanation> correctly.
        return element?.textContent ?? "";
      };

      return {
        problem: getTextContent("problem_text"),
        answer: getTextContent("answer"),
        explanation: getTextContent("explanation"),
      };
    });

    // Return the final structured object.
    return { problems };
  } catch (e) {
    // Catch any other unexpected errors during the process.
    console.error(
      "An unexpected error occurred during XML parsing:",
      e,
      xmlString,
    );
    return null;
  }
}
