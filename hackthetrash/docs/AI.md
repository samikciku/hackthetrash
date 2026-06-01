# AI Image Classification

The backend includes a pluggable image classifier under `backend/src/ai/`.

## Implementations

| Class                | Description                                   |
|----------------------|-----------------------------------------------|
| `MockClassifier`     | Deterministic mock for tests / dev            |
| `HuggingFaceClassifier` | Calls HuggingFace Inference API           |

## Configuration

In `backend/.env`:
```
AI_PROVIDER=mock                 # or "huggingface" (still needs opt-in below)
# Hugging Face — only active when BOTH are set:
# AI_PROVIDER=huggingface
# AI_USE_HUGGINGFACE=1
HF_API_TOKEN=hf_xxx              # required for real HF calls
HF_MODEL=google/vit-base-patch16-224
```

## How it works

1. User submits photos.
2. `autoModerate()` runs every photo through the classifier.
3. Each image gets a `{ label, score }` result.
4. Best score across photos drives a recommendation (for moderators / UI only):
   - `auto_verify` (label=trash, score >= 0.85)
   - `auto_reject` (label=not_trash, score >= 0.85)
   - `queue_for_review` (else)
5. Report is saved with `ai_score` + `ai_label`. **Workflow status always starts as `reported`** (red on the map) until an admin/moderator approves, rejects, or moves it to cleaning/cleaned.

## Replacing with a custom model

Implement the `IClassifier` interface:

```ts
export interface IClassifier {
  classify(imagePath: string): Promise<ClassificationResult>;
}
```

Then update `makeClassifier()` in `classifier.ts` to return your impl (or set `AI_PROVIDER=huggingface` and `AI_USE_HUGGINGFACE=1` for the built-in HF path).
