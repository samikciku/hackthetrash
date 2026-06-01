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
 * Set HF_API_TOKEN, HF_MODEL, AI_PROVIDER=huggingface, and AI_USE_HUGGINGFACE=1.
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
    const timeoutMs = Math.min(
      60_000,
      Math.max(3_000, Number(process.env.AI_HF_FETCH_TIMEOUT_MS || 12_000))
    );
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(`https://api-inference.huggingface.co/models/${this.model}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/octet-stream"
        },
        body: data,
        signal: ac.signal
      });
    } catch (e: unknown) {
      const aborted = e instanceof Error && e.name === "AbortError";
      console.warn(`[AI] HF fetch ${aborted ? "timed out" : "failed"}, falling back to mock`, e);
      return new MockClassifier().classify(imagePath);
    } finally {
      clearTimeout(timer);
    }
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

// Factory: mock by default. Hugging Face runs only with explicit opt-in (avoids accidental
// slow/outbound calls on Vercel when AI_PROVIDER was set to huggingface without intent).
export function makeClassifier(): IClassifier {
  const wantsHf = process.env.AI_PROVIDER === "huggingface";
  const hfEnabled = process.env.AI_USE_HUGGINGFACE === "1";
  if (wantsHf && !hfEnabled) {
    console.warn(
      "[AI] AI_PROVIDER=huggingface but AI_USE_HUGGINGFACE is not 1 — using mock classifier. " +
        "Set AI_USE_HUGGINGFACE=1 (and HF_API_TOKEN) to enable Hugging Face."
    );
  }
  if (wantsHf && hfEnabled) return new HuggingFaceClassifier();
  return new MockClassifier();
}
