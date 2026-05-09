// AI image classifier — pluggable interface.
// MVP: heuristic mock. Production: HuggingFace Inference API / TF.js / custom model.

import fs from "fs";

export type ClassificationResult = {
  label: "trash" | "not_trash" | "uncertain";
  score: number;             // 0..1 confidence
  details?: Record<string, number>;
};

export interface IClassifier {
  classify(imagePath: string): Promise<ClassificationResult>;
}

/**
 * Mock classifier: deterministic pseudo-result based on file size & name.
 * Replace with real model in production.
 */
export class MockClassifier implements IClassifier {
  async classify(imagePath: string): Promise<ClassificationResult> {
    try {
      const stat = fs.statSync(imagePath);
      // Simple heuristic: bigger files -> more "trash-like"
      const score = Math.min(0.95, 0.5 + (stat.size % 1000) / 2000);
      const label: ClassificationResult["label"] =
        score > 0.7 ? "trash" : score > 0.4 ? "uncertain" : "not_trash";
      return { label, score: Number(score.toFixed(3)), details: { mock: 1 } };
    } catch {
      return { label: "uncertain", score: 0.5 };
    }
  }
}

/**
 * HuggingFace Inference API classifier (skeleton).
 * Set HF_API_TOKEN and HF_MODEL env vars.
 */
export class HuggingFaceClassifier implements IClassifier {
  constructor(
    private model = process.env.HF_MODEL || "google/vit-base-patch16-224",
    private token = process.env.HF_API_TOKEN
  ) {}

  async classify(imagePath: string): Promise<ClassificationResult> {
    if (!this.token) {
      console.warn("[AI] HF_API_TOKEN not set, falling back to mock");
      return new MockClassifier().classify(imagePath);
    }
    const data = fs.readFileSync(imagePath);
    const res = await fetch(
      `https://api-inference.huggingface.co/models/${this.model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/octet-stream"
        },
        body: data
      }
    );
    if (!res.ok) {
      console.warn(`[AI] HF returned ${res.status}, falling back to mock`);
      return new MockClassifier().classify(imagePath);
    }
    const json = (await res.json()) as Array<{ label: string; score: number }>;
    // Map any label containing trash-related words to "trash"
    const trashKeywords = /trash|garbage|waste|debris|litter|junk|landfill/i;
    const top = json[0];
    const isTrash = trashKeywords.test(top?.label || "");
    return {
      label: isTrash ? "trash" : "not_trash",
      score: top?.score ?? 0.5,
      details: Object.fromEntries(json.slice(0, 5).map((d) => [d.label, d.score]))
    };
  }
}

// Factory: pick implementation based on env
export function makeClassifier(): IClassifier {
  if (process.env.AI_PROVIDER === "huggingface") return new HuggingFaceClassifier();
  return new MockClassifier();
}
