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
wrangler secret put TRELLO_API_KEY
wrangler secret put TRELLO_TOKEN
```

#### 担当者メンション設定（オプション）

担当者名とMattermostメンションのマッピングを設定する場合：

1. `taiou.csv`ファイルを作成し、以下の形式で担当者とメンションを記載：
   ```csv
   担当者名,@mention
   折田,@yuki_orita
   藤原,@ryusei.f
   ```

2. マッピングのJSON文字列を生成：
   ```bash
   node setup-assignee-mapping.js
   ```

3. 出力されたJSON文字列を環境変数に設定：
   ```bash
   # ローカル開発環境（.dev.vars）
   ASSIGNEE_MENTIONS='{"折田":"@yuki_orita","藤原":"@ryusei.f",...}'

   # 本番環境
   wrangler secret put ASSIGNEE_MENTIONS
   # または Cloudflare Workers Dashboardで設定
   ```

**注意**: `taiou.csv`は機密情報を含むため、Gitには含まれません（`.gitignore`に追加済み）。

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

### 担当者メンション設定なしの場合
```
✅ タスクが割り当てられました
- 担当者: **{ラベル名}**
- タスク: [{カード名}]({カードURL})
```

### 担当者メンション設定ありの場合
```
✅ タスクが割り当てられました
- 担当者: **{ラベル名}-{メンション}**
- タスク: [{カード名}]({カードURL})
```

例：
```
✅ タスクが割り当てられました
- 担当者: **折田-@yuki_orita**
- タスク: [新機能の実装](https://trello.com/c/abc123)
```
