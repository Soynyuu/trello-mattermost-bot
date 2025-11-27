// Cloudflare Workers for Trello → Mattermost integration

export default {
  async fetch(request, env) {
    // Trello webhookの検証（HEADリクエスト）
    if (request.method === 'HEAD') {
      return new Response('OK', { status: 200 });
    }

    // POSTリクエストのみ処理
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const data = await request.json();

      // ラベル追加イベントのみ処理
      if (data.action?.type === 'addLabelToCard') {
        const card = data.action.data.card;
        const label = data.action.data.label;
        const list = data.action.data.list;

        // 特定のリスト「todo(アプリ・サーバー)」のみ処理
        if (list?.name === 'todo(アプリ・サーバー)') {
          // カードのURLを生成
          const cardUrl = `https://trello.com/c/${card.shortLink}`;
          await postToMattermost(env, label.name, card.name, cardUrl);
        }
      }

      return new Response('OK', { status: 200 });
    } catch (error) {
      console.error('Error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
};

/**
 * Mattermostに投稿する関数
 */
async function postToMattermost(env, 担当者名, タスク名, cardUrl) {
  // メッセージフォーマット
  const message = `✅ タスクが割り当てられました
- 担当者: **${担当者名}**
- タスク: [${タスク名}](${cardUrl})`;

  // Mattermost API v4に投稿
  const payload = {
    channel_id: env.MATTERMOST_CHANNEL_ID,
    message: message
  };

  const response = await fetch(`https://${env.MATTERMOST_HOST}/api/v4/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.MATTERMOST_BOT_TOKEN}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mattermost API error: ${response.status} ${errorText}`);
  }

  return response.json();
}
