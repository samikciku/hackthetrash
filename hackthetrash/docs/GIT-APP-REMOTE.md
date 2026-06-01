# Git: `origin` vs deploy mirror **`hackthetrash-2`**

This workspace is a **monorepo**: the Next/Express app lives under **`hackthetrash/`**.

**[samikciku/hackthetrash-2](https://github.com/samikciku/hackthetrash-2)** is the **deploy mirror** for the app (Vercel, CI, etc.): it should track the **same `main` branch** as `origin`, i.e. the full tree (dossier, `hackthetrash/`, …).

> **For agents / future work:** After you commit on `main`, push **both** `origin` and `app` unless the user says otherwise:
> ```bash
> git push origin main
> git push app main
> ```
> Remote **`app`** points at `https://github.com/samikciku/hackthetrash-2.git`.

## Remotes

| Remote   | URL | Use |
|----------|-----|-----|
| **`origin`** | `https://github.com/samikciku/hackthetrash.git` | Day-to-day **`git push` / `git pull`**. |
| **`app`**    | `https://github.com/samikciku/hackthetrash-2.git` | **Deploy mirror** — push the same `main` here so Vercel (or other hooks on `-2`) see updates. |

First-time setup of `app` (if missing):

```bash
git remote add app https://github.com/samikciku/hackthetrash-2.git
```

## Vercel (repo = `hackthetrash-2`)

The GitHub root contains the **monorepo** layout, not a flattened copy of `hackthetrash/` only.

Set **Root Directory** to **`hackthetrash/frontend`** (see [VERCEL.md](./VERCEL.md)).

## If `git push app main` is rejected (non–fast-forward)

Histories can diverge if someone pushed only one remote. To align **`hackthetrash-2`** with your local `main` (overwrites `main` on `-2`):

```bash
git push app main --force-with-lease
```

Use only when you intend `-2` to match this clone’s `main`.

---

## Optional: subtree push (flat repo root)

Some setups keep `-2` as **only** the contents of `hackthetrash/` at the repo root (no outer dossier). That workflow uses **subtree**, not a plain `git push`:

```bash
git subtree push --prefix=hackthetrash app main
```

Or on Windows:

```powershell
pwsh hackthetrash/scripts/push-app-remote.ps1
```

Do **not** mix subtree and full-mirror pushes on the same branch without coordinating history; pick one model per repo.
