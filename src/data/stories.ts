/**
 * stories.ts — 粵語故事內容
 * 每個故事附帶生詞、難度、時長
 */

export interface Story {
  id: string;
  title_zh: string;
  title_en: string;
  cover_emoji: string;
  cover_bg: string;         // 封面漸層色
  level: '初級' | '中級' | '高級';
  level_en: 'Beginner' | 'Intermediate' | 'Advanced';
  duration_min: number;
  topic_ids: string[];
  vocab_zh: string[];       // 故事生詞
  description_zh: string;
  paragraphs: {
    zh: string;
    jyutping: string;
  }[];
}

export const STORIES: Story[] = [
  {
    id: 'mooncake',
    title_zh: '中秋節的月亮',
    title_en: 'The Mid-Autumn Moon',
    cover_emoji: '🌕',
    cover_bg: '#1e3a5f',
    level: '初級',
    level_en: 'Beginner',
    duration_min: 5,
    topic_ids: ['culture'],
    vocab_zh: ['月亮', '月餅', '燈籠', '家人', '開心'],
    description_zh: '小熊和兔子一起過中秋節，他們賞月、食月餅，還學會了關於中秋節的傳統習俗！',
    paragraphs: [
      {
        zh: '今天是中秋節。天上有一個大大的月亮。',
        jyutping: 'gam1 jat6 hai6 zung1 cau1 zit3。tin1 soeng6 jau5 jat1 go3 daai6 daai6 ge3 jyut6 leong4。',
      },
      {
        zh: '小熊和兔子坐在花園裏，一起賞月。',
        jyutping: 'siu2 hung4 wo4 tou3 zi2 co5 hai2 faa1 jyun4 leoi5，jat1 cai4 soeng2 jyut6。',
      },
      {
        zh: '媽媽帶來了月餅。月餅又甜又香！',
        jyutping: 'maa1 maa1 daai3 lai4 zo2 jyut6 beng2。jyut6 beng2 jau6 tim4 jau6 hoeng1！',
      },
      {
        zh: '小熊說：「中秋節真好！我愛我的家人！」',
        jyutping: 'siu2 hung4 waa6：「zung1 cau1 zit3 zan1 hou2！ngo5 oi3 ngo5 ge3 gaa1 jan4！」',
      },
    ],
  },
  {
    id: 'little_panda',
    title_zh: '小熊貓上學記',
    title_en: 'Little Panda Goes to School',
    cover_emoji: '🐼',
    cover_bg: '#2d4a1e',
    level: '初級',
    level_en: 'Beginner',
    duration_min: 4,
    topic_ids: ['school', 'daily_life'],
    vocab_zh: ['書包', '鉛筆', '老師', '同學', '學校'],
    description_zh: '小熊貓第一天上學，又緊張又興奮。他會認識新朋友嗎？',
    paragraphs: [
      {
        zh: '今天是小熊貓第一天上學。',
        jyutping: 'gam1 jat6 hai6 siu2 hung4 maau1 dai6 jat1 tin1 soeng5 hok6。',
      },
      {
        zh: '他背上書包，高高興興地出門了。',
        jyutping: 'keoi5 bui3 soeng6 syu1 baau1，gou1 gou1 hing3 hing3 dei6 ceot1 mun4 lo3。',
      },
      {
        zh: '學校裏有很多同學。老師說：「歡迎你！」',
        jyutping: 'hok6 haau6 leoi5 jau5 hou2 do1 tung4 hok6。lou5 si1 waa6：「fun1 jing4 nei5！」',
      },
      {
        zh: '小熊貓笑了。他喜歡上學！',
        jyutping: 'siu2 hung4 maau1 siu3 zo2。keoi5 zung1 ji3 soeng5 hok6！',
      },
    ],
  },
  {
    id: 'rainbow_fish',
    title_zh: '彩虹魚的朋友',
    title_en: 'Rainbow Fish Makes a Friend',
    cover_emoji: '🐟',
    cover_bg: '#0c4a6e',
    level: '中級',
    level_en: 'Intermediate',
    duration_min: 6,
    topic_ids: ['animals', 'emotions'],
    vocab_zh: ['朋友', '分享', '開心', '顏色', '漂亮'],
    description_zh: '彩虹魚有很多漂亮的鱗片，但他沒有朋友。他學懂了分享的重要！',
    paragraphs: [
      {
        zh: '彩虹魚身上有很多顏色的鱗片，非常漂亮。',
        jyutping: 'coi2 hung4 jyu2 san1 soeng6 jau5 hou2 do1 ngaan4 sik1 ge3 leon4 pin2，fei1 soeng4 leng3。',
      },
      {
        zh: '但是，彩虹魚沒有朋友，他很不開心。',
        jyutping: 'daan6 hai6，coi2 hung4 jyu2 mou5 jau5 pang4 jau5，keoi5 hou2 bat1 hoi1 sam1。',
      },
      {
        zh: '小藍魚說：「可以送我一片鱗片嗎？」',
        jyutping: 'siu2 laam4 jyu2 waa6：「ho2 ji5 sung3 ngo5 jat1 pin3 leon4 pin2 maa3？」',
      },
      {
        zh: '彩虹魚分享了鱗片。他發現：分享讓人開心！',
        jyutping: 'coi2 hung4 jyu2 fan1 hoeng2 zo2 leon4 pin2。keoi5 faat3 jin6：fan1 hoeng2 jyun6 jan4 hoi1 sam1！',
      },
    ],
  },
];

export function getStoryById(id: string): Story | undefined {
  return STORIES.find(s => s.id === id);
}

export function getStoriesByTopic(topicId: string): Story[] {
  return STORIES.filter(s => s.topic_ids.includes(topicId));
}
