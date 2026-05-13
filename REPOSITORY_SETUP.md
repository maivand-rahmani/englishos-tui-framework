# Standalone Repository Setup

This package is maintained inside the monorepo, but is designed to be extracted into its own repository and published independently.

## 1. Extract with history

From the monorepo root:

```bash
./packages/tui-framework/scripts/extract-standalone.sh
```

Default output path:

`../englishos-tui-framework`

## 2. Connect to new GitHub repository

```bash
cd ../englishos-tui-framework
git remote remove origin
git remote add origin git@github.com:<org-or-user>/tui-framework.git
git push -u origin main
```

## 3. Configure repository settings

- Enable branch protection on `main`
- Require checks from `.github/workflows/ci.yml`
- Add repository secret `NPM_TOKEN`
- Ensure Actions permission allows PR creation and contents write

## 4. Publish flow

- Add a changeset: `npm run changeset`
- Merge to `main`
- `release.yml` creates/updates release PR
- Merging the release PR publishes with:
  - `--tag beta`
  - `--provenance`
  - `--access public`
