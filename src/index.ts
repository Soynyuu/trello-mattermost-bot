// Cloudflare Workers for Trello → Mattermost integration

interface Env {
  MATTERMOST_BOT_TOKEN: string;
  MATTERMOST_HOST: string;
  MATTERMOST_CHANNEL_ID: string;
  TRELLO_API_KEY: string;
  TRELLO_TOKEN: string;
  ASSIGNEE_MENTIONS?: string;
}

interface TrelloWebhookData {
  action?: {
    type: string;
    data: {
      card?: {
        id: string;
        name: string;
        shortLink: string;
      };
      label?: {
        name: string;
      };
      list?: {
        name: string;
      };
    };
  };
}

interface TrelloCardDetails {
  list?: {
    name: string;
  };
}

interface MattermostPostPayload {
  channel_id: string;
  message: string;
}

interface AssigneeMentions {
  [key: string]: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Trello webhookの検証（HEADリクエスト）
    if (request.method === 'HEAD') {
      return new Response('OK', { status: 200 });
    }

    // POSTリクエストのみ処理
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const data = await request.json() as TrelloWebhookData;

      // デバッグ: 受信したデータをログに記録
      console.log('Received webhook data:', JSON.stringify(data, null, 2));

      if (data.action) {
        console.log('Event type:', data.action.type);
        console.log('Card:', data.action.data?.card?.name);
        console.log('List:', data.action.data?.list?.name);
        console.log('Label:', data.action.data?.label?.name);
      }

      // ラベル追加イベントのみ処理
      if (data.action?.type === 'addLabelToCard') {
        const card = data.action.data.card;
        const label = data.action.data.label;

        if (!card || !label) {
          return new Response('OK', { status: 200 });
        }

        console.log('Label added to card:', card.name, 'Label:', label.name);

        // Trello APIでカード情報を取得してリスト名を確認
        const cardDetails = await getCardDetails(env, card.id);
        const listName = cardDetails.list?.name;

        console.log('Card is in list:', listName);

        // 特定のリスト「ToDo (アプリ)」または「ToDo (サーバー)」のみ処理
        if (listName === 'ToDo (アプリ)' || listName === 'ToDo (サーバー)') {
          console.log('Matching list found! Posting to Mattermost...');
          // カードのURLを生成
          const cardUrl = `https://trello.com/c/${card.shortLink}`;
          await postToMattermost(env, label.name, card.name, cardUrl);
          console.log('Posted to Mattermost successfully');
        } else {
          console.log('List name does not match. Expected: "ToDo (アプリ)" or "ToDo (サーバー)", Got:', listName);
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
 * Trello APIでカード詳細を取得する関数
 */
async function getCardDetails(env: Env, cardId: string): Promise<TrelloCardDetails> {
  const url = `https://api.trello.com/1/cards/${cardId}?key=${env.TRELLO_API_KEY}&token=${env.TRELLO_TOKEN}&list=true`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Trello API error: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Mattermostに投稿する関数
 */
async function postToMattermost(env: Env, 担当者名: string, タスク名: string, cardUrl: string): Promise<void> {
  // 担当者メンションマッピングを取得
  let assigneeMentions: AssigneeMentions = {};
  try {
    if (env.ASSIGNEE_MENTIONS) {
      assigneeMentions = JSON.parse(env.ASSIGNEE_MENTIONS);
    }
  } catch (error) {
    console.error('Failed to parse ASSIGNEE_MENTIONS:', error);
  }

  // 担当者名に対応するメンションを取得
  const mention = assigneeMentions[担当者名] || '';

  // メッセージフォーマット
  // 担当者：{担当者名}-{メンション} の形式
  const assigneeText = mention ? `${担当者名}-${mention}` : 担当者名;

  const message = `✅ タスクが割り当てられました
- 担当者: **${assigneeText}**
- タスク: [${タスク名}](${cardUrl})`;

  // Mattermost API v4に投稿
  const payload: MattermostPostPayload = {
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

  await response.json();
}