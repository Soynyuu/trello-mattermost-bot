# Trello to Mattermost Bot

Cloudflare Workers を使用した Trello から Mattermost への通知 Bot です。

## 機能

Trello の特定リスト「todo(アプリ・サーバー)」でカードにラベルが追加されたら、Mattermost の指定チャンネルに通知を送信します。

## セットアップ

### 環境変数

以下の環境変数を設定してください：

```bash
wrangler secret put MATTERMOST_BOT_TOKEN
wrangler secret put MATTERMOST_HOST
wrangler secret put MATTERMOST_CHANNEL_ID
```

### デプロイ

```bash
wrangler deploy
```

### Trello Webhook の登録

デプロイ後、以下のコマンドで Trello Webhook を登録します：

```bash
curl -X POST \
  "https://api.trello.com/1/tokens/{YOUR_TOKEN}/webhooks/?key={YOUR_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Mattermost integration",
    "callbackURL": "{デプロイした Worker の URL}",
    "idModel": "{YOUR_BOARD_ID}"
  }'
```

## 通知フォーマット

```
✅ タスクが割り当てられました
- 担当者: **{ラベル名}**
- タスク: [{カード名}]({カードURL})
```
