import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KNOWLEDGE_DIR = path.resolve(__dirname, "knowledge");

export interface KnowledgeRecord {
  topic: string;
  content: string;
}

let cache: KnowledgeRecord[] | null = null;

export function loadMedicalKnowledge(): KnowledgeRecord[] {
  if (cache) return cache;
  const files = fs.readdirSync(KNOWLEDGE_DIR).filter((f) => f.endsWith(".md"));
  cache = files.map((file) => {
    const content = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), "utf-8");
    const topic = path.basename(file, ".md").replace(/-/g, " ");
    return { topic, content };
  });
  return cache;
}

export function retrieveKnowledge(query: string, maxRecords = 2): string {
  const knowledge = loadMedicalKnowledge();
  const q = query.toLowerCase();
  const scored = knowledge
    .map((k) => ({
      ...k,
      score: k.topic.toLowerCase().split(" ").filter((w) => q.includes(w)).length +
             k.content.toLowerCase().split("\n").filter((line) => q.split(" ").some((w) => line.includes(w))).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxRecords);

  return scored.map((k) => `## ${k.topic}\n${k.content}`).join("\n\n");
}
