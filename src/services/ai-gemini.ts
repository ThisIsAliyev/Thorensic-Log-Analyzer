import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiKey } from "@/lib/keys";

const MODEL_NAME = "gemini-1.5-flash";

export interface AnalysisStats {
  summary: string;
  topIPs: Array<{ key: string; count: number }>;
  topPaths: Array<{ key: string; count: number }>;
  anomalies?: Array<{ type: string; description: string }>;
  virusTotal?: Array<{ ioc: string; malicious: number; suspicious: number; country?: string }>;
}

export async function analyzeWithGemini(
  stats: AnalysisStats,
  userQuery: string
): Promise<string> {
  const key = getGeminiKey();
  if (!key) {
    throw new Error("Missing Gemini API key");
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  let vtSummary = "";
  if (stats.virusTotal && stats.virusTotal.length > 0) {
    const highRisk = stats.virusTotal.filter((v) => v.malicious > 0 || v.suspicious > 2);
    if (highRisk.length > 0) {
      vtSummary = `\n\nThreat Intelligence (VirusTotal):\n${highRisk
        .map((v) => `- ${v.ioc}: ${v.malicious} malicious, ${v.suspicious} suspicious${v.country ? ` (${v.country})` : ""}`)
        .join("\n")}`;
    }
  }

  const prompt = `You are a cybersecurity log analyst. Analyze the following log statistics and provide concise insights.

User Query: ${userQuery}

Statistics:
${JSON.stringify(
  {
    summary: stats.summary,
    topIPs: stats.topIPs.slice(0, 5),
    topPaths: stats.topPaths.slice(0, 5),
    anomalies: stats.anomalies || [],
  },
  null,
  2
)}${vtSummary}

Provide:
1. Key findings (3-5 bullet points)
2. Security recommendations (3-5 actionable items)
3. Any notable anomalies or patterns

Format as clear, concise bullet points. Be specific and data-driven.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error: any) {
    console.error("Gemini API error:", error);
    throw new Error(`Gemini API failed: ${error.message}`);
  }
}

