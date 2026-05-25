/**
 * topics.ts — 學習主題定義
 *
 * 每個主題對應一個或多個 theme 標籤（來自 allWords.ts）
 * icon 暫用 Ionicons，PNG 到位後換 Image 組件
 */

import { Theme } from '../types/word';
import {
  THEME_HOME_WORDS,
  THEME_FOOD_WORDS,
  THEME_EMOTIONS_WORDS,
  THEME_ACTIONS_WORDS,
  THEME_HKCULTURE_WORDS,
  THEME_SCHOOL_WORDS,
  THEME_TRANSPORT_WORDS,
  THEME_ADJECTIVES_WORDS,
  SEEDLING_WORDS,
  SAPLING_WORDS,
} from './allWords';
import { Word } from '../types/word';

export interface TopicDef {
  id: string;
  title_zh: string;
  title_en: string;
  title_sc: string;
  emoji: string;
  iconName: string;
  iconPng: any;               // PNG icon (require())
  charImage: any;             // Carrot character image for topic card
  bgColor: string;
  borderColor: string;
  iconBgColor: string;
  themes: Theme[];
  words: Word[];              // 此主題所有詞彙
}

export const TOPICS: TopicDef[] = [
  {
    id: 'daily_life',
    title_zh: '日常生活',
    title_en: 'Daily Life',
    title_sc: '日常生活',
    emoji: '🏠',
    iconName: 'home',
    iconPng: require('../../assets/icons/icon_home.png'),
    charImage: require('../../assets/characters/char_carrot_wave.png'),
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    iconBgColor: '#DBEAFE',
    themes: ['home', 'actions'],
    words: [...THEME_HOME_WORDS, ...THEME_ACTIONS_WORDS],
  },
  {
    id: 'school',
    title_zh: '學校',
    title_en: 'School',
    title_sc: '学校',
    emoji: '🎒',
    iconName: 'school',
    iconPng: require('../../assets/icons/icon_backpack.png'),
    charImage: require('../../assets/characters/char_carrot_read.png'),
    bgColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    iconBgColor: '#D1FAE5',
    themes: ['school'],
    words: THEME_SCHOOL_WORDS,
  },
  {
    id: 'food',
    title_zh: '食物',
    title_en: 'Food',
    title_sc: '食物',
    emoji: '🍜',
    iconName: 'restaurant',
    iconPng: require('../../assets/icons/icon_mooncake.png'),
    charImage: require('../../assets/characters/char_carrot_idea.png'),
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    iconBgColor: '#FEF3C7',
    themes: ['food'],
    words: THEME_FOOD_WORDS,
  },
  {
    id: 'animals',
    title_zh: '動物',
    title_en: 'Animals',
    title_sc: '动物',
    emoji: '🐼',
    iconName: 'paw',
    iconPng: require('../../assets/icons/icon_panda.png'),
    charImage: require('../../assets/characters/char_carrot_jump.png'),
    bgColor: '#FFF7ED',
    borderColor: '#FDBA74',
    iconBgColor: '#FED7AA',
    themes: [],
    words: [...SEEDLING_WORDS, ...SAPLING_WORDS].filter(w =>
      ['貓','狗','魚','鳥','牛','馬','羊','豬','象','虎',
       '兔','熊','蛙','蟲','龍'].includes(w.character)
    ),
  },
  {
    id: 'transport',
    title_zh: '交通',
    title_en: 'Transport',
    title_sc: '交通',
    emoji: '🚌',
    iconName: 'bus',
    iconPng: require('../../assets/icons/icon_globe.png'),
    charImage: require('../../assets/characters/char_carrot_sign.png'),
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    iconBgColor: '#EDE9FE',
    themes: ['transport'],
    words: THEME_TRANSPORT_WORDS,
  },
  {
    id: 'culture',
    title_zh: '節日文化',
    title_en: 'Culture',
    title_sc: '节日文化',
    emoji: '🏮',
    iconName: 'sparkles',
    iconPng: require('../../assets/icons/icon_lantern.png'),
    charImage: require('../../assets/characters/char_carrot_teach.png'),
    bgColor: '#FFF1F2',
    borderColor: '#FECDD3',
    iconBgColor: '#FFE4E6',
    themes: ['hkculture'],
    words: THEME_HKCULTURE_WORDS,
  },
  {
    id: 'emotions',
    title_zh: '情緒感受',
    title_en: 'Emotions',
    title_sc: '情绪感受',
    emoji: '😊',
    iconName: 'happy',
    iconPng: require('../../assets/icons/icon_heart.png'),
    charImage: require('../../assets/characters/char_carrot_question.png'),
    bgColor: '#FDF4FF',
    borderColor: '#E9D5FF',
    iconBgColor: '#F3E8FF',
    themes: ['emotions', 'adjectives'],
    words: [...THEME_EMOTIONS_WORDS, ...THEME_ADJECTIVES_WORDS],
  },
];

export function getTopicById(id: string): TopicDef | undefined {
  return TOPICS.find(t => t.id === id);
}
