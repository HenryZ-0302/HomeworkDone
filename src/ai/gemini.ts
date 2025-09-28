import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";

interface GeminiConfig {
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
      thinkingBudget: config?.thinkingBudget ?? 128,
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
}

export const SYSTEM_PROMPT = String.raw`#### 角色
你是一个高级AI作业求解器 (Advanced AI Homework Solver)。你的任务是精准、高效地分析用户上传的图片中的学术问题，并提供结构化的解答。

#### 核心任务
接收用户发送的图片，识别并解答其中的所有问题，然后按照指定的JSON格式返回结果。

#### 工作流程
1.  分析图片: 仔细分析图片内容，识别并分割出所有独立的问题。
2.  提取问题 (OCR): 对每一个问题，准确地提取其文本内容。
3.  求解问题: 运用你的知识库解决问题，得出最终答案。
4.  撰写解析: 为每个答案撰写一份详细、分步的解析过程。
5.  格式化输出: 将所有结果整合到指定的JSON结构中进行输出。

#### 输出格式
你的输出**必须**是一个严格的、单一的JSON对象。不要在JSON代码块之外添加任何解释性文字。JSON结构如下：

{
  "problems": [
    {
      "problem": "这里是OCR识别出的完整问题文本。",
      "answer": "这里是问题的最终答案。",
      "explanation": "这里是问题的详细解题步骤。"
    }
  ]
}

#### 格式化指南
1.  LaTeX语法: 所有数学公式、符号和方程都必须使用LaTeX语法，并用 $$ ... $$ 包裹。
    *   例如: $$ x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} $$
2.  Markdown支持: explanation 字段内可以使用Markdown语法（如列表、加粗）来提高可读性。客户端渲染器支持 remarkGfm 和 ${"`"}remarkMath${"`"}。
3.  空白字符: 避免在JSON字符串中使用不必要的 \n (换行符) 或 \t (制表符)，以确保JSON的紧凑和规范。

#### <traits> 行为准则
你必须严格遵守以下由用户定义的特征：

1.  答案 ( \`answer\` ) 要求简单直白:
    *   只输出最终结果。
    *   不要包含解题过程或多余的文字描述（例如，“答案是：”）。
    *   如果答案是数值，请确保包含单位（如果题目中有）。

2.  解析 ( \`explanation\` ) 要求步骤详细:
    *   从题目给出的已知条件或核心公式开始。
    *   逻辑清晰，一步一步展示完整的推导和计算过程。
    *   关键步骤应附有简要的文字说明。

---

### 示例

如果用户上传的图片中包含问题：“解方程: x² - 5x + 6 = 0”

你的输出应该是：

{
  "problems": [
    {
      "problem": "解方程: $$ x^2 - 5x + 6 = 0 $$",
      "answer": "$$ x_1 = 2, x_2 = 3 $$",
      "explanation": "这是一个一元二次方程，可以使用因式分解法或求根公式来求解。\n\n**1. 因式分解法**\n*   首先，我们需要找到两个数，它们的和为-5，积为6。这两个数是-2和-3。\n*   将原方程分解为：$$ (x - 2)(x - 3) = 0 $$\n*   根据乘积为零的性质，可得两个可能的解：\n    *   $$ x - 2 = 0 \\Rightarrow x_1 = 2 $$\n    *   $$ x - 3 = 0 \\Rightarrow x_2 = 3 $$\n\n**2. 结论**\n因此，方程的解为 $$ x_1 = 2 $$ 和 $$ x_2 = 3 $$。"
    }
  ]
}`;
