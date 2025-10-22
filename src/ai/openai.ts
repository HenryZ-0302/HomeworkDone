import OpenAI from "openai";

export type OpenAiModel = {
  name: string;
  displayName: string;
};

export interface OpenAiConfig {
  pollIntervalMs?: number;
  maxPollMs?: number;
}

const DEFAULT_OPENAI_ROOT = "https://api.openai.com";
const OPENAI_PATH_SUFFIX = "/v1";

function normalizeBaseUrl(baseUrl?: string) {
  const normalized = (baseUrl ?? DEFAULT_OPENAI_ROOT).replace(/\/$/, "");
  return normalized.endsWith(OPENAI_PATH_SUFFIX)
    ? normalized
    : `${normalized}${OPENAI_PATH_SUFFIX}`;
}

type OpenAiResponse = OpenAI.Responses.Response;

function collectOutputText(
  output: OpenAI.Responses.ResponseOutput[] | undefined,
): string {
  if (!output) return "";
  return output
    .flatMap((item) => ("content" in item ? item.content : []))
    .map((contentPart) => {
      if (contentPart.type === "output_text" || contentPart.type === "text") {
        return contentPart.text ?? "";
      }
      if ("delta" in contentPart && contentPart.type === "output_text.delta") {
        return contentPart.delta ?? "";
      }
      return "";
    })
    .join("")
    .trim();
}

function extractTextFromResponse(response: OpenAiResponse): string {
  if (response.output_text && response.output_text.length > 0) {
    return response.output_text.trim();
  }
  return collectOutputText(response.output);
}

export class OpenAiClient {
  private client: OpenAI;
  private systemPrompt?: string;
  private config: Required<OpenAiConfig>;

  constructor(apiKey: string, baseUrl?: string, config?: OpenAiConfig) {
    this.client = new OpenAI({
      apiKey,
      baseURL: normalizeBaseUrl(baseUrl),
    });
    this.config = {
      pollIntervalMs: config?.pollIntervalMs ?? 1_000,
      maxPollMs: config?.maxPollMs ?? 30_000,
    };
  }

  setSystemPrompt(prompt: string) {
    this.systemPrompt = prompt;
  }

  async sendMedia(
    media: string,
    mimeType: string,
    prompt?: string,
    model = "gpt-4.1-mini",
    callback?: (text: string) => void,
  ) {
    const input = [];

    if (this.systemPrompt) {
      input.push({
        role: "system" as const,
        content: [
          {
            type: "text" as const,
            text: this.systemPrompt,
          },
        ],
      });
    }

    const userContent = [];
    if (prompt) {
      userContent.push({
        type: "text" as const,
        text: prompt,
      });
    }
    userContent.push({
      type: "input_image" as const,
      image_base64: media,
      mime_type: mimeType,
    });

    input.push({
      role: "user" as const,
      content: userContent,
    });

    const controller = new AbortController();

    const stream = await this.client.responses.stream(
      {
        model,
        input,
      },
      {
        signal: controller.signal,
      },
    );

    let aggregated = "";
    const startTime = Date.now();

    for await (const event of stream) {
      if (
        event.type === "response.output_text.delta" &&
        typeof event.delta === "string"
      ) {
        aggregated += event.delta;
        callback?.(event.delta);
      } else if (event.type === "response.error") {
        throw new Error(event.error.message);
      }

      if (Date.now() - startTime > this.config.maxPollMs) {
        controller.abort();
        throw new Error("OpenAI response polling timed out");
      }
    }

    const finalResponse = await stream.finalResponse();
    if (!aggregated) {
      aggregated = extractTextFromResponse(finalResponse);
    }

    return aggregated.trim();
  }

  async getAvailableModels(): Promise<OpenAiModel[]> {
    const response = await this.client.models.list();

    return response.data.map((model) => ({
      name: model.id,
      displayName: model.id,
    }));
  }
}
