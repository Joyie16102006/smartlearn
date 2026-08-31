import fs from "fs";
import path from "path";
import Groq from "groq-sdk";

/**
 * AI Provider Interface
 * Decouples AI models from business logic so any provider can be plugged in seamlessly.
 */
export interface AIProvider {
  name: string;
  generateText(prompt: string, systemPrompt?: string): Promise<string>;
  generateJSON<T>(prompt: string, systemPrompt?: string): Promise<T>;
}

// Runtime helper to read .env.local even without process restart
function getEnv(key: string): string | undefined {
  if (process.env[key]) return process.env[key]?.replace(/^["']|["']$/g, "");
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(new RegExp(`^${key}=([^\\r\\n]+)`, "m"));
      if (match) return match[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
  return undefined;
}

export function parseJSON<T>(rawText: string): T {
  let cleaned = rawText.trim();

  // Strip <think>...</think> reasoning tokens from reasoning models
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // Extract JSON block if surrounded by markdown code fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  } else {
    // If no code fence, extract outermost JSON object or array
    const startObj = cleaned.indexOf("{");
    const endObj = cleaned.lastIndexOf("}");
    const startArr = cleaned.indexOf("[");
    const endArr = cleaned.lastIndexOf("]");

    if (startObj !== -1 && endObj !== -1 && (startArr === -1 || startObj < startArr)) {
      cleaned = cleaned.slice(startObj, endObj + 1);
    } else if (startArr !== -1 && endArr !== -1) {
      cleaned = cleaned.slice(startArr, endArr + 1);
    }
  }

  // Remove trailing commas before closing braces/brackets
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  return JSON.parse(cleaned) as T;
}

/**
 * NVIDIA NIM Provider (Nemotron 550B & Llama)
 * Powers Model 1 (Deep Knowledge Distillation) & Model 2 (DAG Flowchart & Curriculum Architect)
 */
class NvidiaProvider implements AIProvider {
  name = "NVIDIA Nemotron";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || "nvidia/nemotron-3-ultra-550b-a55b";
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: Array<{ role: "system" | "user"; content: string }> = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.2,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`NVIDIA Nemotron API error (${response.status}): ${await response.text()}`);
    }
    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "";
  }

  async generateJSON<T>(prompt: string, systemPrompt?: string): Promise<T> {
    const text = await this.generateText(prompt, systemPrompt);
    return parseJSON<T>(text);
  }
}

/**
 * Groq LPU Provider
 */
class GroqProvider implements AIProvider {
  name = "Groq";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || "openai/gpt-oss-120b";
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    const groq = new Groq({ apiKey: this.apiKey });
    const messages: Array<{ role: "system" | "user"; content: string }> = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });

    const completion = await groq.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.3,
      max_completion_tokens: 4096,
    });
    return completion.choices[0]?.message?.content || "";
  }

  async generateJSON<T>(prompt: string, systemPrompt?: string): Promise<T> {
    const text = await this.generateText(prompt, systemPrompt);
    return parseJSON<T>(text);
  }
}

/**
/**
 * Google Gemini Provider (Gemini 2.5 Flash)
 * Powers Model 3 (Daily Educational Workspace Lesson Generator)
 */
class GeminiProvider implements AIProvider {
  name: string;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || getEnv("GEMINI_MODEL") || "gemini-2.5-flash";
    this.name = `Google Gemini (${this.model})`;
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        // Enable Google Search Grounding — gives Gemini live internet access to search for valid real-time course URLs
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 8192 },
      }),
    });

    if (!response.ok) {
      // If tools/google_search fails for any reason, fallback to standard generation without tools
      const fallbackRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 8192 },
        }),
      });
      if (!fallbackRes.ok) {
        throw new Error(`Gemini API error (${fallbackRes.status}): ${await fallbackRes.text()}`);
      }
      const fallbackData = await fallbackRes.json();
      return fallbackData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract live web search grounded sources from Google Search
    const groundingChunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (Array.isArray(groundingChunks) && groundingChunks.length > 0) {
      const liveSources: string[] = [];
      const seen = new Set<string>();

      for (const chunk of groundingChunks) {
        const uri = chunk?.web?.uri;
        const title = chunk?.web?.title || "Web Reference";
        if (uri && !seen.has(title)) {
          seen.add(title);
          liveSources.push(`- [${title}](${uri}) — Live web verified learning resource`);
        }
      }

      if (liveSources.length > 0) {
        text += `\n\n---\n\n## 🌐 Verified Online Sources (Google Search Grounded)\n\n${liveSources.slice(0, 6).join("\n")}\n`;
      }
    }

    return text;
  }

  async generateJSON<T>(prompt: string, systemPrompt?: string): Promise<T> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        // Force JSON output to eliminate markdown wrapper hallucinations
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 3000,
          response_mime_type: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error (${response.status}): ${await response.text()}`);
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return parseJSON<T>(text);
  }
}

/**
 * OpenAI Provider
 */
class OpenAIProvider implements AIProvider {
  name = "OpenAI";
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || "gpt-4o-mini";
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: Array<{ role: "system" | "user"; content: string }> = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error (${response.status}): ${await response.text()}`);
    }
    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "";
  }

  async generateJSON<T>(prompt: string, systemPrompt?: string): Promise<T> {
    const text = await this.generateText(prompt, systemPrompt);
    return parseJSON<T>(text);
  }
}

/**
 * Factory to get the active AI Provider based on configured environment keys and service role.
 * Model 3 (Daily Lesson Generator) utilizes Google Gemini 2.5 Flash.
 */
export function getAIProvider(serviceType?: "curriculum" | "lesson" | "assessment" | "revision" | "assistant" | "model3" | "model1" | "model2" | "model4" | "model5" | "model6" | string): AIProvider | null {
  const geminiKey = getEnv("GEMINI_API_KEY");
  const groqKey = getEnv("GROQ_API_KEY");
  const nvidiaKey = getEnv("NVIDIA_API_KEY") || getEnv("NVAPI_KEY");
  const openaiKey = getEnv("OPENAI_API_KEY");

  // Prioritize Gemini 2.5 Flash for all interactive workflows (3s ultra-fast generation & live search grounding)
  if (geminiKey && !geminiKey.startsWith("#")) {
    return new GeminiProvider(geminiKey, getEnv("GEMINI_MODEL") || "gemini-2.5-flash");
  }

  if (groqKey && !groqKey.startsWith("#")) {
    return new GroqProvider(groqKey, getEnv("GROQ_MODEL"));
  }

  if (nvidiaKey && !nvidiaKey.startsWith("#")) {
    return new NvidiaProvider(nvidiaKey, getEnv("NVIDIA_MODEL"));
  }

  if (openaiKey && !openaiKey.startsWith("#")) {
    return new OpenAIProvider(openaiKey, getEnv("OPENAI_MODEL"));
  }

  return null;
}

