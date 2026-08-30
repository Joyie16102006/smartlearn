import fs from "fs";
import path from "path";

function getEnv(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(new RegExp(`^${key}=([^\\r\\n]+)`, "m"));
      if (match) return match[1].trim().replace(/^["']|["']$/g, '');
    }
  } catch {}
  return undefined;
}

async function testGrounding() {
  const apiKey = getEnv("GEMINI_API_KEY");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: "Explain BJT characteristics and include live web reference links from Wikipedia and educational sites."
          }
        ]
      }
    ],
    tools: [
      {
        google_search: {}
      }
    ]
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  const grounding = data?.candidates?.[0]?.groundingMetadata;
  console.log("Grounding Chunks (Live URLs):", JSON.stringify(grounding?.groundingChunks, null, 2));
}

testGrounding().catch(console.error);
