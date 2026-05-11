/**
 * generate-audio.mjs — 生成真實粵語音檔
 *
 * 使用 Google Cloud Text-to-Speech API
 * Voice: yue-HK-Standard-A（真正廣東話，非普通話）
 *
 * 使用方式：
 *   GOOGLE_TTS_API_KEY=你的金鑰 node scripts/generate-audio.mjs
 *
 * 設定步驟：
 *   1. 前往 https://console.cloud.google.com
 *   2. 建立專案 → 啟用「Cloud Text-to-Speech API」
 *   3. 憑證 → 建立 API 金鑰 → 複製金鑰
 *   4. 設定環境變數：export GOOGLE_TTS_API_KEY=你的金鑰
 *   5. 執行此腳本
 *
 * 輸出：
 *   assets/audio/cantonese/*.mp3 （約 98 個檔案）
 *   src/data/audioMap.ts         （自動更新）
 *
 * 費用估算：
 *   每月首 1,000,000 字元免費（Standard voices）
 *   100 個字 × 平均 2 字元 = 約 200 字元，遠低於免費額度
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'assets', 'audio', 'cantonese');
const MAP_FILE  = path.join(ROOT, 'src', 'data', 'audioMap.ts');

// ── 全部 100 個漢字（含 jyutping）────────────────────────────────────
// 注意：相同 jyutping 只生成一個檔案（如 六/綠 同為 luk6）
const WORDS = [
  // seedling
  { char: '山', jyutping: 'saan1' },
  { char: '水', jyutping: 'seoi2' },
  { char: '火', jyutping: 'fo2'   },
  { char: '木', jyutping: 'muk6'  },
  { char: '日', jyutping: 'jat6'  },
  { char: '月', jyutping: 'jyut6' },
  { char: '人', jyutping: 'jan4'  },
  { char: '口', jyutping: 'hau2'  },
  { char: '手', jyutping: 'sau2'  },
  { char: '心', jyutping: 'sam1'  },
  // sapling
  { char: '貓', jyutping: 'maau1' },
  { char: '狗', jyutping: 'gau2'  },
  { char: '魚', jyutping: 'jyu2'  },
  { char: '鳥', jyutping: 'niu5'  },
  { char: '花', jyutping: 'faa1'  },
  { char: '草', jyutping: 'cou2'  },
  { char: '雨', jyutping: 'jyu5'  },
  { char: '風', jyutping: 'fung1' },
  { char: '天', jyutping: 'tin1'  },
  { char: '地', jyutping: 'dei6'  },
  // tree
  { char: '書', jyutping: 'syu1'  },
  { char: '學', jyutping: 'hok6'  },
  { char: '玩', jyutping: 'waan2' },
  { char: '食', jyutping: 'sik6'  },
  { char: '飲', jyutping: 'jam2'  },
  { char: '大', jyutping: 'daai6' },
  { char: '小', jyutping: 'siu2'  },
  { char: '好', jyutping: 'hou2'  },
  { char: '多', jyutping: 'do1'   },
  { char: '家', jyutping: 'gaa1'  },
  // sunflower
  { char: '一', jyutping: 'jat1'  },
  { char: '二', jyutping: 'ji6'   },
  { char: '三', jyutping: 'saam1' },
  { char: '四', jyutping: 'sei3'  },
  { char: '五', jyutping: 'ng5'   },
  { char: '六', jyutping: 'luk6'  }, // 同 綠，共用音檔
  { char: '七', jyutping: 'cat1'  },
  { char: '八', jyutping: 'baat3' },
  { char: '九', jyutping: 'gau2'  }, // 同 狗，跳過（已存在）
  { char: '十', jyutping: 'sap6'  },
  // rainbow
  { char: '紅', jyutping: 'hung4' },
  { char: '橙', jyutping: 'caang2'},
  { char: '黃', jyutping: 'wong4' },
  { char: '綠', jyutping: 'luk6'  }, // 同 六，跳過（已存在）
  { char: '藍', jyutping: 'laam4' },
  { char: '頭', jyutping: 'tau4'  },
  { char: '眼', jyutping: 'ngaan5'},
  { char: '耳', jyutping: 'ji5'   },
  { char: '鼻', jyutping: 'bei6'  },
  { char: '腳', jyutping: 'goek3' },
  // galaxy
  { char: '爸', jyutping: 'baa1'  },
  { char: '媽', jyutping: 'maa1'  },
  { char: '哥', jyutping: 'go1'   },
  { char: '姐', jyutping: 'ze2'   },
  { char: '弟', jyutping: 'dai6'  },
  { char: '妹', jyutping: 'mui6'  },
  { char: '爺', jyutping: 'je4'   },
  { char: '嫲', jyutping: 'maa4'  },
  { char: '公', jyutping: 'gung1' },
  { char: '婆', jyutping: 'po4'   },
  // bamboo
  { char: '讀', jyutping: 'duk6'  },
  { char: '寫', jyutping: 'se2'   },
  { char: '課', jyutping: 'fo3'   },
  { char: '問', jyutping: 'man6'  },
  { char: '答', jyutping: 'daap3' },
  { char: '跑', jyutping: 'paau2' },
  { char: '跳', jyutping: 'tiu3'  },
  { char: '笑', jyutping: 'siu3'  },
  { char: '哭', jyutping: 'huk1'  },
  { char: '唱', jyutping: 'coeng3'},
  { char: '聽', jyutping: 'teng1' },
  { char: '畫', jyutping: 'waak6' },
  { char: '河', jyutping: 'ho4'   },
  { char: '海', jyutping: 'hoi2'  },
  { char: '朋', jyutping: 'pang4' },
  { char: '友', jyutping: 'jau5'  },
  { char: '快', jyutping: 'faai3' },
  { char: '慢', jyutping: 'maan6' },
  { char: '開', jyutping: 'hoi1'  },
  { char: '關', jyutping: 'gwaan1'},
  // jade
  { char: '思', jyutping: 'si1'   },
  { char: '想', jyutping: 'soeng2'},
  { char: '夢', jyutping: 'mung6' },
  { char: '望', jyutping: 'mong6' },
  { char: '美', jyutping: 'mei5'  },
  { char: '善', jyutping: 'sin6'  },
  { char: '勇', jyutping: 'jung5' },
  { char: '智', jyutping: 'zi3'   },
  { char: '真', jyutping: 'zan1'  },
  { char: '明', jyutping: 'ming4' },
  { char: '行', jyutping: 'haang4'},
  { char: '發', jyutping: 'faat3' },
  { char: '打', jyutping: 'daa2'  },
  { char: '長', jyutping: 'coeng4'},
  { char: '觀', jyutping: 'gun1'  },
  { char: '察', jyutping: 'caat3' },
  { char: '創', jyutping: 'cong3' },
  { char: '研', jyutping: 'jin4'  },
  { char: '識', jyutping: 'sik1'  },
  { char: '情', jyutping: 'cing4' },
];

// ── 去重（相同 jyutping 只處理一次）──────────────────────────────────
const UNIQUE = [];
const seenJyutping = new Set();
for (const w of WORDS) {
  if (!seenJyutping.has(w.jyutping)) {
    seenJyutping.add(w.jyutping);
    UNIQUE.push(w);
  }
}

console.log(`共 ${UNIQUE.length} 個唯一 jyutping 需要生成\n`);

// ── Google Cloud TTS 設定 ────────────────────────────────────────────
const API_KEY = process.env.GOOGLE_TTS_API_KEY;
if (!API_KEY) {
  console.error('❌ 缺少 GOOGLE_TTS_API_KEY 環境變數');
  console.error('   請先執行：export GOOGLE_TTS_API_KEY=你的金鑰');
  console.error('   金鑰申請：https://console.cloud.google.com/apis/credentials');
  process.exit(1);
}

const TTS_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

// ── 生成單個音檔 ──────────────────────────────────────────────────────
async function generateAudio(char, jyutping) {
  const outPath = path.join(AUDIO_DIR, `${jyutping}.mp3`);

  // 已存在則跳過
  if (fs.existsSync(outPath)) {
    process.stdout.write(`  ⏭  ${char} (${jyutping}) — 已存在，跳過\n`);
    return true;
  }

  const body = {
    input: {
      ssml: `<speak><prosody rate="0.80" pitch="+1st">${char}</prosody></speak>`,
    },
    voice: {
      languageCode: 'yue-Hant-HK',   // ← 真正廣東話
      name: 'yue-HK-Standard-A',      // A = 女聲  B = 男聲
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.85,
      pitch: 1.0,
      volumeGainDb: 2.0,
      effectsProfileId: ['small-bluetooth-speaker-class-device'],
    },
  };

  try {
    const res = await fetch(TTS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }

    const { audioContent } = await res.json();
    const buf = Buffer.from(audioContent, 'base64');
    fs.writeFileSync(outPath, buf);
    process.stdout.write(`  ✅ ${char} (${jyutping}) — ${buf.length} bytes\n`);
    return true;
  } catch (e) {
    process.stdout.write(`  ❌ ${char} (${jyutping}) — ${e.message}\n`);
    return false;
  }
}

// ── 生成 audioMap.ts ─────────────────────────────────────────────────
function generateAudioMap(successJyutpings) {
  const lines = successJyutpings.map(
    (jp) => `  '${jp}': require('../../assets/audio/cantonese/${jp}.mp3'),`
  );

  const content = `/**
 * audioMap.ts — 廣東話音檔對照表
 *
 * ⚠️  此檔案由 scripts/generate-audio.mjs 自動生成，請勿手動修改。
 * ⚠️  如需重新生成，請執行：
 *     GOOGLE_TTS_API_KEY=你的金鑰 node scripts/generate-audio.mjs
 *
 * Voice: yue-HK-Standard-A（Google Cloud TTS — 真正廣東話）
 * 生成時間：${new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' })}
 */

/**
 * key   = jyutping（如 "saan1"）
 * value = require() result（Metro bundler 靜態資源）
 */
export const CANTONESE_AUDIO: Record<string, any> = {
${lines.join('\n')}
};
`;

  fs.writeFileSync(MAP_FILE, content, 'utf8');
  console.log(`\n📝 已更新 src/data/audioMap.ts（${successJyutpings.length} 個音檔）`);
}

// ── 主程式 ────────────────────────────────────────────────────────────
async function main() {
  console.log('🎙️  CantoKids 粵語音檔生成器');
  console.log('   Voice: yue-HK-Standard-A（真正廣東話）\n');

  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  const successJyutpings = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < UNIQUE.length; i++) {
    const { char, jyutping } = UNIQUE[i];
    process.stdout.write(`[${String(i + 1).padStart(2)}/${UNIQUE.length}] `);
    const ok = await generateAudio(char, jyutping);
    if (ok) {
      successJyutpings.push(jyutping);
      successCount++;
    } else {
      failCount++;
    }
    // 速率限制：每個請求間隔 120ms（避免 API 限流）
    await new Promise((r) => setTimeout(r, 120));
  }

  console.log(`\n═══════════════════════════════════`);
  console.log(`✅ 成功：${successCount}  ❌ 失敗：${failCount}`);

  if (successJyutpings.length > 0) {
    generateAudioMap(successJyutpings);
    console.log('\n🚀 完成！重啟 Metro（npx expo start --clear）後即生效。');
  }

  if (failCount > 0) {
    console.log('\n⚠️  部分音檔生成失敗，請檢查：');
    console.log('   • API 金鑰是否正確');
    console.log('   • 是否已啟用 Cloud Text-to-Speech API');
    console.log('   • https://console.cloud.google.com/apis/library/texttospeech.googleapis.com');
  }
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
