#!/bin/bash

echo "=== Trello Webhook Signature Verification Setup ==="
echo ""
echo "このスクリプトは必要な環境変数を設定します。"
echo ""

# TRELLO_WEBHOOK_SECRET
echo "1. TRELLO_WEBHOOK_SECRET の設定"
echo "   https://trello.com/app-key を開いて、OAuth Secret を確認してください。"
echo ""
read -p "   OAuth Secret を入力してください: " WEBHOOK_SECRET
if [ -n "$WEBHOOK_SECRET" ]; then
  echo "$WEBHOOK_SECRET" | wrangler secret put TRELLO_WEBHOOK_SECRET
  echo "   ✅ TRELLO_WEBHOOK_SECRET を設定しました"
else
  echo "   ⚠️  スキップしました"
fi
echo ""

# TRELLO_CALLBACK_URL
echo "2. TRELLO_CALLBACK_URL の設定"
echo "   Cloudflare Dashboard (https://dash.cloudflare.com) の Workers & Pages で"
echo "   trello-mattermost-bot のURLを確認してください。"
echo "   例: https://trello-mattermost-bot.xxxxx.workers.dev"
echo ""
read -p "   Worker の URL を入力してください: " CALLBACK_URL
if [ -n "$CALLBACK_URL" ]; then
  echo "$CALLBACK_URL" | wrangler secret put TRELLO_CALLBACK_URL
  echo "   ✅ TRELLO_CALLBACK_URL を設定しました"
else
  echo "   ⚠️  スキップしました"
fi
echo ""

echo "=== セットアップ完了 ==="
echo ""
echo "設定された環境変数を確認："
wrangler secret list
echo ""
echo "次のステップ："
echo "1. git checkout main"
echo "2. git merge feature/add-webhook-signature-verification"
echo "3. wrangler deploy"
