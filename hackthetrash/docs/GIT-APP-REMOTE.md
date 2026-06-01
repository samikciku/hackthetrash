# Git: monorepo (`hackthetrash`) vs app repo (`hackthetrash-2`)

This workspace is a **monorepo**: the Next/Express app lives under **`hackthetrash/`**.  
**[samikciku/hackthetrash-2](https://github.com/samikciku/hackthetrash-2)** is the **flat** copy used for Vercel (root = `frontend/`, not `hackthetrash/frontend`).

## Remotes (recommended)

| Remote | URL | Use |
|--------|-----|-----|
| **`origin`** | `https://github.com/samikciku/hackthetrash.git` | Normal **`git push` / `git pull`** for the full repo (dossier, nested `hackthetrash/`, etc.). |
| **`app`** | `https://github.com/samikciku/hackthetrash-2.git` | **Only** via subtree (see below). **Do not** `git push app main` from the monorepo root without subtree — you would overwrite the flat layout. |

Do **not** point `origin` at `hackthetrash-2` while your local tree still has the outer `hackthetrash/` folder; a plain push would publish the wrong directory layout.

## Push app changes to `hackthetrash-2`

From the **git repo root** (parent of the inner `hackthetrash/` folder):

```bash
git subtree push --prefix=hackthetrash app main
```

Or on Windows:

```powershell
pwsh hackthetrash/scripts/push-app-remote.ps1
```

First-time setup of the `app` remote (if missing):

```bash
git remote add app https://github.com/samikciku/hackthetrash-2.git
```

## Vercel

For **hackthetrash-2**, set **Root Directory** to **`frontend`** (not `hackthetrash/frontend`). See [VERCEL.md](./VERCEL.md).
