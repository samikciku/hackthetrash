# Vercel: “Root Directory … does not exist” (but GitHub has the folder)

For this monorepo, the Next.js app path is:

`https://github.com/samikciku/hackthetrash/tree/main/hackthetrash/frontend`

Vercel **Root Directory** must be exactly (forward slashes, no spaces):

```text
hackthetrash/frontend
```

**Common typo:** the folder is **`hackthetrash`** (ends in **trash**), not `hackthethrash` or `hackthetrashh`. If Root Directory is wrong by one letter, the build fails or deploys the wrong tree.

If Vercel still says that path does not exist, try in order:

1. **Re-type the path**  
   Settings → General → Root Directory → clear the field → type `hackthetrash/frontend` again (don’t paste from Word/PDF; avoid hidden characters). Save → Redeploy.

2. **Confirm the connected repo**  
   Settings → Git → Repository should be **`samikciku/hackthetrash`** and branch **`main`**. If it’s another fork or old connection, fix it or **Disconnect** and **Reconnect** Git.

3. **Confirm the deployment commit**  
   On the failed deployment, the commit should be one that contains `hackthetrash/frontend` on GitHub (e.g. open  
   `https://github.com/samikciku/hackthetrash/tree/<commit>/hackthetrash/frontend`  
   in the browser). If that URL 404s, the deployment is building the wrong commit or repo.

4. **New Vercel project (last resort)**  
   Add Project → Import **`samikciku/hackthetrash`** again → when asked for the app directory, choose or enter **`hackthetrash/frontend`**. Copy **Environment Variables** from the old project, then delete the old project or pause it.

A persistent “does not exist” error is almost always **wrong repo link**, **typo/spaces in Root Directory** (check **hackthetrash** spelling), or **stale Git connection** on the Vercel side.
