# Git workflow

## Small changes

## 1. Make sure you’re on main and up to date

```bash
git checkout main
git pull origin main
```

This puts you on `main` and syncs with the remote before you commit.[1][2]

## 2. See what changed

```bash
git status
```

Check that only the files you expect are modified/untracked.[3]

Optionally review the diff:

```bash
git diff
# or for a specific file:
git diff path/to/file.tsx
```

## 3. Stage the relevant file(s)

```bash
git add path/to/changed-file.tsx
# or multiple files:
git add file1 file2
```

Staging lets you commit only the changes you want.[2][3]

## 4. Commit with a clear message

```bash
git commit -m "fix: scroll to top on app detail page"
```

Keep it small and single‑purpose, describing what changed and why at a glance.[4][5]

## 5. Push to main

```bash
git push origin main
```

This updates the remote `main` branch with your new commit.[1]

## 6. Sanity check

Optional but nice:

```bash
git status
```

You should see:

```text
On branch main
nothing to commit, working tree clean
```

### 1. Make sure main is up to date

```bash
git checkout main
git pull origin main
```


## Medium > changes

### 1. Make sure main is up to date

```bash
git checkout main
git pull origin main
```

### 2. Create a feature branch

```bash
git checkout -b fix/scroll-to-top-detail
```

Name can be anything, but short and descriptive is best.

### 3. Stage and commit your change

```bash
git status   # sanity check
git add src/pages/AppDetailPage.tsx   # adjust path as needed
git commit -m "fix: scroll to top on app detail page"
```

### 4. Push the branch

```bash
git push -u origin fix/scroll-to-top-detail
```

The `-u` sets up tracking so future `git push`/`pull` work without extra args.

### 5. Open a pull request on GitHub

- Go to the repo in GitHub; you’ll see a banner for your new branch with a “Compare & pull request” button.  
- Click it, set:
  - Base: `main`
  - Compare: `fix/scroll-to-top-detail`
- Add a short title and description (what changed, why).  
- Create the PR and request a review from a teammate.

### 6. Address review comments (if any)

- Make edits locally on the same branch.  
- Then:

```bash
git add .
git commit -m "chore: address review feedback"
git push
```

GitHub updates the existing PR automatically.

### 7. Merge and clean up

Once approved and checks pass:

- On GitHub: click “Merge” (often “Squash and merge” or “Rebase and merge”, depending on team preference).  
- After merge, locally:

```bash
git checkout main
git pull origin main
git branch -d fix/scroll-to-top-detail
git push origin --delete fix/scroll-to-top-detail
```