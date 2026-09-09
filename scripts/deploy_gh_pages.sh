#!/usr/bin/env bash
# 把 dist/ 发布到 gh-pages 分支。
#
# 为什么不用 GitHub Actions：当前 gh 的 OAuth token 没有 `workflow` scope，
# 无法推送 .github/workflows/ 下的文件。分支部署同样能上 Pages。
# 若之后执行了 `gh auth refresh -s workflow`，可以把
# docs/deploy-workflow.yml.example 移回 .github/workflows/deploy.yml 改用 Actions 自动构建。
set -euo pipefail

REPO_URL="https://github.com/Renko6626/c156-power-ranking.git"
cd "$(dirname "$0")/.."

echo "==> building"
npm run build

echo "==> staging dist into .deploy"
rm -rf .deploy
mkdir -p .deploy
cp -r dist/. .deploy/

cd .deploy
git init -b gh-pages -q
git add -A
git -c user.name="Renko6626" -c user.email="Renko6626@users.noreply.github.com" \
  commit -q -m "deploy: $(date '+%Y-%m-%d %H:%M:%S')"
git remote add origin "$REPO_URL" 2>/dev/null || true

echo "==> pushing gh-pages"
git -c credential.helper='!gh auth git-credential' push -f origin gh-pages
echo "==> done"
