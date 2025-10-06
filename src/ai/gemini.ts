import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";

export interface GeminiModel {
  name: string;
  displayName: string;
}

export interface GeminiConfig {
  thinkingBudget?: number;
  safetySettings?: Array<{
    category: HarmCategory;
    threshold: HarmBlockThreshold;
  }>;
}

export class GeminiAi {
  private ai: GoogleGenAI;
  private systemPrompt?: string;
  private config: GeminiConfig;

  constructor(key: string, baseUrl?: string, config?: GeminiConfig) {
    this.ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        baseUrl: baseUrl,
      },
    });

    this.config = {
      thinkingBudget: config?.thinkingBudget ?? -1,
      safetySettings: config?.safetySettings ?? [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    };
  }

  setSystemPrompt(prompt: string) {
    this.systemPrompt = prompt;
  }

  async sendText(userText: string, model = "gemini-2.5-pro") {
    const contents = [];

    if (this.systemPrompt) {
      contents.push({
        role: "user",
        parts: [{ text: this.systemPrompt }],
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: userText }],
    });

    const response = await this.ai.models.generateContentStream({
      model,
      config: {
        thinkingConfig: { thinkingBudget: this.config.thinkingBudget },
        safetySettings: this.config.safetySettings,
      },
      contents,
    });

    let result = "";
    for await (const chunk of response) {
      if (chunk.text) {
        result += chunk.text;
      }
    }
    return result;
  }

  async sendImage(image: string, prompt?: string, model = "gemini-2.5-pro") {
    const contents = [];

    if (this.systemPrompt) {
      contents.push({
        role: "user",
        parts: [{ text: this.systemPrompt }],
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parts: any[] = [];
    if (prompt) {
      parts.push({ text: prompt });
    }

    if (image.startsWith("http")) {
      parts.push({
        fileData: {
          mimeType: "image/png",
          fileUri: image,
        },
      });
    } else {
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: image, // base64
        },
      });
    }

    contents.push({
      role: "user",
      parts,
    });

    const response = await this.ai.models.generateContentStream({
      model,
      config: {
        thinkingConfig: { thinkingBudget: this.config.thinkingBudget },
        safetySettings: this.config.safetySettings,
      },
      contents,
    });

    let result = "";
    for await (const chunk of response) {
      if (chunk.text) {
        result += chunk.text;
      }
    }
    return result;
  }

  async getAvailableModels(): Promise<GeminiModel[]> {
    const models = await this.ai.models.list();
    return models.page.map((it) => ({
      name: it.name!,
      displayName: it.displayName ?? it.name!,
    }));
  }
}
