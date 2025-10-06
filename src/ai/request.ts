/**
 * Defines the data structure for the XML generation.
 */
interface ImproveXmlData {
  problem: string;
  answer: string;
  explanation: string;
  user_suggestion: string;
}

/**
 * Sanitizes content to be safely placed inside a CDATA section.
 * The string "]]>" is not allowed within a CDATA section. This function escapes it
 * by splitting it into "]]]]><![CDATA[>".
 * @param content The raw string content.
 * @returns A sanitized string safe for CDATA embedding.
 */
function sanitizeForCData(content: string): string {
  if (!content) {
    return "";
  }
  return content.replace(/]]>/g, "]]]]><![CDATA[>");
}

/**
 * Renders an XML string based on the provided data object.
 * This function avoids any formatting and handles escaping via CDATA sections.
 * @param data An object containing the problem, answer, explanation, and user suggestion.
 * @returns A formatted XML string.
 */
export function renderImproveXml(data: ImproveXmlData): string {
  const xml = `<improve>
  <problem>
    <![CDATA[${sanitizeForCData(data.problem)}]]>
  </problem>
  <answer>
    <![CDATA[${sanitizeForCData(data.answer)}]]>
  </answer>
  <explanation>
    <![CDATA[${sanitizeForCData(data.explanation)}]]>
  </explanation>
  <user_suggestion>
    <![CDATA[${sanitizeForCData(data.user_suggestion)}]]>
  </user_suggestion>
</improve>`;

  return xml;
}
