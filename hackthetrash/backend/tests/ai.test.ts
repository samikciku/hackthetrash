import { MockClassifier } from "../src/ai/classifier";
import { autoModerate } from "../src/ai/moderation";

describe("AI MockClassifier", () => {
  it("returns a deterministic uncertain result for non-existent files", async () => {
    const c = new MockClassifier();
    const result = await c.classify("/does/not/exist.png");
    expect(result.label).toBe("uncertain");
    expect(result.score).toBe(0.5);
  });
});

describe("autoModerate", () => {
  it("queues the report for review when there are no images", async () => {
    const result = await autoModerate([]);
    expect(result.recommendation).toBe("queue_for_review");
    expect(result.perImage).toEqual([]);
  });

  it("queues the report when classification is uncertain", async () => {
    const result = await autoModerate(["/missing/photo-1.jpg"]);
    expect(result.recommendation).toBe("queue_for_review");
    expect(result.best.label).toBe("uncertain");
  });
});
