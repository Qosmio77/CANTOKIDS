/**
 * dailyPhrases.ts — 每日一句
 * 根據星期幾輪播，三語顯示
 */

export interface DailyPhrase {
  zh: string;
  jyutping: string;
  en: string;
  emoji: string;
}

export const DAILY_PHRASES: DailyPhrase[] = [
  {
    zh: '今天天氣很好！',
    jyutping: 'gam1 tin1 tin1 hei3 hou2!',
    en: 'The weather is great today!',
    emoji: '☀️',
  },
  {
    zh: '早晨，你好！',
    jyutping: 'zou2 san4, nei5 hou2!',
    en: 'Good morning!',
    emoji: '🌅',
  },
  {
    zh: '我愛學習中文！',
    jyutping: 'ngo5 oi3 hok6 zaap6 zung1 man4!',
    en: 'I love learning Chinese!',
    emoji: '📚',
  },
  {
    zh: '今天我很開心！',
    jyutping: 'gam1 jat6 ngo5 hou2 hoi1 sam1!',
    en: "I'm very happy today!",
    emoji: '😊',
  },
  {
    zh: '我肚子餓了！',
    jyutping: 'ngo5 tou5 zi2 ngo6 zo3!',
    en: "I'm hungry!",
    emoji: '🍜',
  },
  {
    zh: '謝謝你的幫忙！',
    jyutping: 'ze6 ze6 nei5 ge3 bong1 mong4!',
    en: 'Thank you for your help!',
    emoji: '🙏',
  },
  {
    zh: '我喜歡玩耍！',
    jyutping: 'ngo5 zung1 ji3 waan2 saa3!',
    en: 'I love to play!',
    emoji: '🎮',
  },
];

/** 根據今天星期幾取得每日一句（0=Sunday） */
export function getTodayPhrase(): DailyPhrase {
  const day = new Date().getDay();
  return DAILY_PHRASES[day];
}
