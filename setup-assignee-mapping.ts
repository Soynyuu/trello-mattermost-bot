#!/usr/bin/env node
/**
 * CSV形式の担当者メンションマッピングファイルを読み込み、
 * 環境変数用のJSON文字列を生成するスクリプト
 *
 * Usage:
 *   npm run setup-assignees
 *
 * Output:
 *   環境変数ASSIGNEE_MENTIONSに設定すべきJSON文字列を出力
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CSV_FILE = join(__dirname, 'taiou.csv');

interface AssigneeMentions {
  [key: string]: string;
}

function parseCSV(csvContent: string): AssigneeMentions {
  const lines = csvContent.trim().split('\n');
  const mapping: AssigneeMentions = {};

  for (const line of lines) {
    const [name, mention] = line.split(',').map(s => s.trim());
    if (name && mention) {
      mapping[name] = mention;
    }
  }

  return mapping;
}

function main(): void {
  try {
    // CSVファイルを読み込み
    const csvContent = readFileSync(CSV_FILE, 'utf-8');

    // CSVをパースしてJSONオブジェクトに変換
    const mapping = parseCSV(csvContent);

    // JSON文字列として出力
    const jsonString = JSON.stringify(mapping);

    console.log('\n=== 環境変数設定用の値 ===');
    console.log('以下の値を環境変数 ASSIGNEE_MENTIONS に設定してください:\n');
    console.log(jsonString);
    console.log('\n=== .dev.vars への追加例 ===');
    console.log(`ASSIGNEE_MENTIONS='${jsonString}'`);
    console.log('\n=== Cloudflare Workers Dashboardでの設定 ===');
    console.log('1. Cloudflare Workers Dashboardにアクセス');
    console.log('2. 環境変数セクションで ASSIGNEE_MENTIONS を追加');
    console.log(`3. 値: ${jsonString}`);
    console.log('\n=== マッピング内容 ===');
    console.log(JSON.stringify(mapping, null, 2));

  } catch (error) {
    console.error('エラーが発生しました:', (error as Error).message);
    process.exit(1);
  }
}

main();