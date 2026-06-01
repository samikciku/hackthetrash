import { makeClassifier, ClassificationResult } from "./classifier";

const classifier = makeClassifier();

const UNCERTAIN: ClassificationResult = { label: "uncertain", score: 0.5, details: { budget: 1 } };

function moderationPerImageBudgetMs(): number {
  return Math.min(90_000, Math.max(5_000, Number(process.env.AI_MODERATION_PER_IMAGE_BUDGET_MS || 25_000)));
}

export async function autoModerate(imagePaths: string[]): Promise<{
  best: ClassificationResult;
  perImage: ClassificationResult[];
  recommendation: "auto_verify" | "queue_for_review" | "auto_reject";
}> {
  const budget = moderationPerImageBudgetMs();
  const classifyOne = (p: string) =>
    Promise.race([
      classifier.classify(p),
      new Promise<ClassificationResult>((resolve) =>
        setTimeout(() => resolve(UNCERTAIN), budget)
      )
    ]);

  const perImage: ClassificationResult[] =
    imagePaths.length === 0 ? [] : await Promise.all(imagePaths.map(classifyOne));
  const best = perImage.reduce((a, b) => (b.score > a.score ? b : a),
    { label: "uncertain", score: 0 } as ClassificationResult);

  // Advisory only — `reportSubmission` keeps new reports as `reported` until a moderator changes status.
  let recommendation: "auto_verify" | "queue_for_review" | "auto_reject";
  if (best.label === "trash" && best.score >= 0.85) recommendation = "auto_verify";
  else if (best.label === "not_trash" && best.score >= 0.85) recommendation = "auto_reject";
  else recommendation = "queue_for_review";

  return { best, perImage, recommendation };
}
