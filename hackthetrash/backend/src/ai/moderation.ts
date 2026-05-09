import { makeClassifier, ClassificationResult } from "./classifier";

const classifier = makeClassifier();

export async function autoModerate(imagePaths: string[]): Promise<{
  best: ClassificationResult;
  perImage: ClassificationResult[];
  recommendation: "auto_verify" | "queue_for_review" | "auto_reject";
}> {
  const perImage: ClassificationResult[] = [];
  for (const p of imagePaths) {
    perImage.push(await classifier.classify(p));
  }
  const best = perImage.reduce((a, b) => (b.score > a.score ? b : a),
    { label: "uncertain", score: 0 } as ClassificationResult);

  let recommendation: "auto_verify" | "queue_for_review" | "auto_reject";
  if (best.label === "trash" && best.score >= 0.85) recommendation = "auto_verify";
  else if (best.label === "not_trash" && best.score >= 0.85) recommendation = "auto_reject";
  else recommendation = "queue_for_review";

  return { best, perImage, recommendation };
}
