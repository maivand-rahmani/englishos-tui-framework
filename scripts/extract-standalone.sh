#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-$(pwd)}"
TARGET_DIR="${2:-${ROOT_DIR}/../englishos-tui-framework}"
SPLIT_BRANCH="${3:-codex/tui-framework-split}"

cd "${ROOT_DIR}"

if [[ ! -d ".git" ]]; then
  echo "Run this script from the monorepo root (git repository)." >&2
  exit 1
fi

git subtree split --prefix=packages/tui-framework -b "${SPLIT_BRANCH}"

if [[ -d "${TARGET_DIR}" ]]; then
  echo "Target directory already exists: ${TARGET_DIR}" >&2
  echo "Remove it first or provide a different path." >&2
  exit 1
fi

git clone . "${TARGET_DIR}" --branch "${SPLIT_BRANCH}" --single-branch
cd "${TARGET_DIR}"
git branch -M main

echo "Standalone repo created at: ${TARGET_DIR}"
echo "Next steps:"
echo "  cd ${TARGET_DIR}"
echo "  git remote remove origin"
echo "  git remote add origin <new-github-repo-url>"
echo "  npm install"
echo "  npm run build"
