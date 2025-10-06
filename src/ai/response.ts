import type { ProblemSolution } from "@/store/problems-store";

// SECTION: Type Definitions

export interface SolveResponse {
  problems: ProblemSolution[];
}

export interface ImproveResponse {
  improved_answer: string;
  improved_explanation: string;
}

// SECTION: Shared Utilities

/**
 * Trims markdown code fences (e.g., ```xml) from a string.
 * @param content The string which may be wrapped in a markdown code block.
 * @returns The unwrapped, trimmed content.
 */
function trimMarkdownFence(content: string): string {
  const regex = /^```(?:\w+\s*)?\n?([\s\S]*)\n?```$/;
  const match = content.trim().match(regex);

  return match ? match[1].trim() : content.trim();
}

/**
 * Parses an XML string using the browser's DOMParser and checks for parsing errors.
 * @param xmlString The XML string to parse.
 * @returns The parsed XMLDocument or null if an error occurs.
 */
function parseXmlString(xmlString: string): Document | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    const parseError = xmlDoc.getElementsByTagName("parsererror");
    if (parseError.length > 0) {
      // Access the first error element to get its content.
      console.error("Failed to parse XML: ", parseError);
      return null;
    }
    return xmlDoc;
  } catch (e) {
    console.error(
      "An unexpected error occurred during XML parsing:",
      e,
      xmlString,
    );
    return null;
  }
}

/**
 * Safely gets text content from the first child element with a given tag name.
 * @param node The parent XML element.
 * @param tagName The tag name of the child element to find.
 * @returns The text content or an empty string if the element is not found.
 */
function getXmlTextContent(node: Element, tagName: string): string {
  const elements = node.getElementsByTagName(tagName);
  // Correctly access the FIRST element in the collection (at index 0)
  // before getting its textContent. If no element is found, it will be undefined.
  return elements[0]?.textContent ?? "";
}

// SECTION: Solve Response Parsing (Refactored)

/**
 * Helper function to parse an XML string into a SolveResponse object.
 * @param xmlString The XML string to parse.
 * @returns A SolveResponse object if parsing is successful, otherwise null.
 */
function parseXmlToSolveResponse(xmlString: string): SolveResponse | null {
  const xmlDoc = parseXmlString(xmlString);
  if (!xmlDoc) {
    return null;
  }

  const problemNodes = Array.from(xmlDoc.getElementsByTagName("problem"));
  const problems: ProblemSolution[] = problemNodes.map((node) => ({
    problem: getXmlTextContent(node, "problem_text"),
    answer: getXmlTextContent(node, "answer"),
    explanation: getXmlTextContent(node, "explanation"),
  }));

  return { problems };
}

/**
 * Parses a string response from the AI for a "solve" request.
 * It handles JSON or XML, either raw or wrapped in a markdown code block.
 * @param response The raw string response from the AI.
 * @returns A SolveResponse object if parsing is successful, otherwise null.
 */
export function parseSolveResponse(response: string): SolveResponse | null {
  const content = trimMarkdownFence(response);

  if (content.startsWith("{")) {
    try {
      return JSON.parse(content) as SolveResponse;
    } catch (e) {
      console.error("Failed to parse JSON:", e, content);
      return null;
    }
  }

  if (content.startsWith("<")) {
    return parseXmlToSolveResponse(content);
  }

  console.error("Failed to parse response due to unknown format:", response);
  return null;
}

// SECTION: Improve Response Parsing (New)

/**
 * Helper function to parse an XML string into an ImproveResponse object.
 * @param xmlString The XML string to parse.
 * @returns An ImproveResponse object if parsing is successful, otherwise null.
 */
function parseXmlToImproveResponse(xmlString: string): ImproveResponse | null {
  const xmlDoc = parseXmlString(xmlString);
  if (!xmlDoc) {
    return null;
  }

  const solutionNode = xmlDoc.getElementsByTagName("solution").item(0);
  if (!solutionNode) {
    console.error("Root <solution> tag not found in XML response.");
    return null;
  }

  return {
    improved_answer: getXmlTextContent(solutionNode, "improved_answer"),
    improved_explanation: getXmlTextContent(
      solutionNode,
      "improved_explanation",
    ),
  };
}

/**
 * Parses a string response from the AI for an "improve" request.
 * The expected format is XML, either raw or wrapped in a markdown code block.
 * @param response The raw string response from the AI.
 * @returns An ImproveResponse object if parsing is successful, otherwise null.
 */
export function parseImproveResponse(response: string): ImproveResponse | null {
  const content = trimMarkdownFence(response);

  if (content.startsWith("<")) {
    return parseXmlToImproveResponse(content);
  }

  console.error("Failed to parse response: XML format expected.", response);
  return null;
}
