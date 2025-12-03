import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY,
  model: process.env.GOOGLE_AI_MODEL ?? "gemini-flash-latest",
  temperature: Number(process.env.GOOGLE_AI_TEMPERATURE ?? 0.7),
});

export async function generateBlog(prompt: string) {
  const res = await llm.invoke([
    new SystemMessage("You are a helpful blog writer that produces clear, accurate, well-structured markdown articles."),
    new HumanMessage(
      `Write a high-quality blog post in markdown.\n` +
      `Requirements:\n` +
      `- Start with an H1 title\n` +
      `- Use subheadings, lists, and short paragraphs\n` +
      `- Be factual; if unsure, say so (no hallucinations)\n` +
      `- Aim for ~900–1200 words\n\n` +
      `Topic and guidance:\n${prompt}`
    ),
  ]);

  return typeof res.content === "string" ? res.content : JSON.stringify(res.content);
}

function normalize(res: any): string {
  if (typeof res?.content === "string") return res.content;
  if (Array.isArray(res?.content) && res.content[0]?.type === "text") {
    return res.content[0].text ?? "";
  }
  return JSON.stringify(res?.content ?? "");
}

function indexOfCI(haystack: string, needle: string, from = 0) {
  return haystack.toLowerCase().indexOf(needle.toLowerCase(), from);
}

function findRangeByDescriptor(current: string, what: string):
  | { start: number; end: number }
  | null {
  if (!what) return null;

  // 1) exact
  let i = current.indexOf(what);
  if (i !== -1) return { start: i, end: i + what.length };

  // 2) case-insensitive
  i = indexOfCI(current, what);
  if (i !== -1) return { start: i, end: i + what.length };

  // 3) starts/ends pattern
  const m = /starts?\s+with\s+(.+?)\s+ends?\s+with\s+(.+)/i.exec(what);
  if (m) {
    const startPhrase = m[1].trim().replace(/^["']|["']$/g, "");
    const endPhrase = m[2].trim().replace(/^["']|["']$/g, "");
    const startIdx = indexOfCI(current, startPhrase);
    if (startIdx !== -1) {
      const afterStart = startIdx + startPhrase.length;
      const endIdxPhrase = indexOfCI(current, endPhrase, afterStart);
      if (endIdxPhrase !== -1) {
        const endIdx = endIdxPhrase + endPhrase.length;
        return { start: startIdx, end: endIdx };
      }
    }
  }

  return null;
}

export async function updateBlog(args: {
  current: string;
  what: string;
  how: string;
}): Promise<string> {
  const { current, what, how } = args;
  const range = findRangeByDescriptor(current, what);
  if (!range) {
    const err: any = new Error("TARGET_NOT_FOUND");
    err.code = "TARGET_NOT_FOUND";
    throw err;
  }

  const { start, end } = range;
  const excerpt = current.slice(start, end);

  // small context for coherence (not rewritten)
  const leftCtx = current.slice(Math.max(0, start - 300), start);
  const rightCtx = current.slice(end, Math.min(current.length, end + 300));

  const res = await llm.invoke([
    new SystemMessage(
      "You are a precise editor. Rewrite ONLY the excerpt provided. " +
      "Keep tone and markdown style consistent with the surrounding context. " +
      "Return ONLY the rewritten excerpt — no extra commentary."
    ),
    new HumanMessage(
      `HOW to change it:\n${how}\n\n` +
      `Left context (do NOT rewrite):\n<<<\n${leftCtx}\n>>>\n\n` +
      `Excerpt to rewrite (rewrite ONLY this):\n---\n${excerpt}\n---\n\n` +
      `Right context (do NOT rewrite):\n<<<\n${rightCtx}\n>>>`
    ),
  ]);

  const rewritten = normalize(res);
  return current.slice(0, start) + rewritten + current.slice(end);
}