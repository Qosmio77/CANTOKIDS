/**
 * MapScreen — 神話王國地圖（Island Realm 版）
 *
 * 視覺：8 個神話領域島嶼卡片，每張卡片有主題色彩、守護神，
 *       課節以格子排列，完成後解鎖 Boss 戰。
 * 邏輯：與舊版完全相同（Premium gate、Boss 戰、解鎖機制）。
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useProgressStore, BOSSES, getBossName } from '../store/useProgressStore';
import { Colors } from '../theme/colors';
import { useTranslation } from '../hooks/useTranslation';
import { FREE_LESSON_LIMIT } from '../services/iap/iapService';
import { Word } from '../types/word';
import {
  SEEDLING_WORDS, SAPLING_WORDS, TREE_WORDS,
  SUNFLOWER_WORDS, RAINBOW_WORDS, GALAXY_WORDS,
  BAMBOO_WORDS, JADE_WORDS, ALL_WORDS,
  VOCAB_WORDS, IDIOM_WORDS,
  VOCAB_UNLOCK_THRESHOLD, IDIOM_UNLOCK_THRESHOLD,
  FIRST_VOCAB_LESSON_ID, FIRST_IDIOM_LESSON_ID,
} from '../data/allWords';

const { width: SW } = Dimensions.get('window');

// ── Realm 定義 ──────────────────────────────────────────────────────────────
interface RealmDef {
  bossId:       string;
  nameZh:       string;
  nameEn:       string;
  nameSc:       string;
  guardian:     string;   // 守護神 emoji
  scenery:      string;   // 背景裝飾 emoji
  bgColor:      string;
  accentColor:  string;
  borderColor:  string;
  nodeBg:       string;
  nodeDoneBg:   string;
  nodeDoneBorder: string;
}

const REALMS: RealmDef[] = [
  {
    bossId:       'boss_seedling',
    nameZh:       '翠林島',
    nameEn:       'Jade Forest Isle',
    nameSc:       '翠林岛',
    guardian:     '🦊',
    scenery:      '🌿🌿🌿',
    bgColor:      '#F0FDF4',
    accentColor:  '#16A34A',
    borderColor:  '#BBF7D0',
    nodeBg:       '#ffffff',
    nodeDoneBg:   '#DCFCE7',
    nodeDoneBorder: '#86EFAC',
  },
  {
    bossId:       'boss_sapling',
    nameZh:       '月光谷',
    nameEn:       'Moonlight Valley',
    nameSc:       '月光谷',
    guardian:     '🐯',
    scenery:      '🌙✨🌙',
    bgColor:      '#EFF6FF',
    accentColor:  '#2563EB',
    borderColor:  '#BFDBFE',
    nodeBg:       '#ffffff',
    nodeDoneBg:   '#DBEAFE',
    nodeDoneBorder: '#93C5FD',
  },
  {
    bossId:       'boss_tree',
    nameZh:       '火焰山',
    nameEn:       'Flame Mountain',
    nameSc:       '火焰山',
    guardian:     '🐦',
    scenery:      '🔥🌋🔥',
    bgColor:      '#FFF7ED',
    accentColor:  '#EA580C',
    borderColor:  '#FED7AA',
    nodeBg:       '#ffffff',
    nodeDoneBg:   '#FFEDD5',
    nodeDoneBorder: '#FDBA74',
  },
  {
    bossId:       'boss_sunflower',
    nameZh:       '雲海峰',
    nameEn:       'Cloud Sea Peak',
    nameSc:       '云海峰',
    guardian:     '🦄',
    scenery:      '☁️🌤️☁️',
    bgColor:      '#F0F9FF',
    accentColor:  '#0284C7',
    borderColor:  '#BAE6FD',
    nodeBg:       '#ffffff',
    nodeDoneBg:   '#E0F2FE',
    nodeDoneBorder: '#7DD3FC',
  },
  {
    bossId:       'boss_rainbow',
    nameZh:       '彩虹橋',
    nameEn:       'Rainbow Bridge',
    nameSc:       '彩虹桥',
    guardian:     '🐉',
    scenery:      '🌈🏔️🌈',
    bgColor:      '#FAF5FF',
    accentColor:  '#7C3AED',
    borderColor:  '#DDD6FE',
    nodeBg:       '#ffffff',
    nodeDoneBg:   '#EDE9FE',
    nodeDoneBorder: '#C4B5FD',
  },
  {
    bossId:       'boss_galaxy',
    nameZh:       '星河殿',
    nameEn:       'Galaxy Palace',
    nameSc:       '星河殿',
    guardian:     '🦁',
    scenery:      '⭐🌌⭐',
    bgColor:      '#F5F3FF',
    accentColor:  '#6D28D9',
    borderColor:  '#C4B5FD',
    nodeBg:       '#ffffff',
    nodeDoneBg:   '#EDE9FE',
    nodeDoneBorder: '#A78BFA',
  },
  {
    bossId:       'boss_bamboo',
    nameZh:       '竹林秘境',
    nameEn:       'Bamboo Sanctuary',
    nameSc:       '竹林秘境',
    guardian:     '🐢',
    scenery:      '🎋🐉🎋',
    bgColor:      '#F0FDF4',
    accentColor:  '#15803D',
    borderColor:  '#A7F3D0',
    nodeBg:       '#ffffff',
    nodeDoneBg:   '#D1FAE5',
    nodeDoneBorder: '#6EE7B7',
  },
  {
    bossId:       'boss_jade',
    nameZh:       '玉龍宮',
    nameEn:       'Jade Dragon Palace',
    nameSc:       '玉龙宫',
    guardian:     '🐲',
    scenery:      '💎✨💎',
    bgColor:      '#FFFBEB',
    accentColor:  '#B45309',
    borderColor:  '#FDE68A',
    nodeBg:       '#ffffff',
    nodeDoneBg:   '#FEF3C7',
    nodeDoneBorder: '#FCD34D',
  },
];

// ── RealmZoneCard ────────────────────────────────────────────────────────────
interface RealmZoneCardProps {
  realm:           RealmDef;
  words:           Word[];
  lessonOffset:    number;
  isPremium:       boolean;
  unlockedLessons: number[];
  wordProgress:    Record<number, any>;
  bossesDefeated:  string[];
  navigation:      any;
  forceAllPremium?: boolean;
  language:        string;
}

function RealmZoneCard({
  realm, words, lessonOffset, isPremium, unlockedLessons,
  wordProgress, bossesDefeated, navigation,
  forceAllPremium = false, language,
}: RealmZoneCardProps) {
  const { t } = useTranslation();

  const learnedCount = words.filter((w) => wordProgress[w.id]?.learned).length;
  const totalCount   = words.length;
  const progress     = learnedCount / totalCount;

  const levelComplete = isPremium
    ? words.every((w) => wordProgress[w.id]?.learned)
    : words
        .filter((_, idx) => {
          const lessonId = lessonOffset + idx + 1;
          return !forceAllPremium && lessonId <= FREE_LESSON_LIMIT;
        })
        .every((w) => wordProgress[w.id]?.learned);

  const bossDefeated = bossesDefeated.includes(realm.bossId);
  const boss = BOSSES.find((b) => b.id === realm.bossId);

  const realmName = language === 'en' ? realm.nameEn : language === 'sc' ? realm.nameSc : realm.nameZh;

  return (
    <View style={[s.realmCard, { backgroundColor: realm.bgColor, borderColor: realm.borderColor }]}>

      {/* ── 卡片頂部橫幅 ── */}
      <View style={s.realmHeader}>
        <View style={s.realmHeaderLeft}>
          <AppText style={[s.realmName, { color: realm.accentColor }]}>{realmName}</AppText>
          <AppText style={s.realmProgress}>
            {learnedCount}/{totalCount} {language === 'en' ? 'words' : '個漢字'}
          </AppText>
          {/* 進度條 */}
          <View style={[s.progressTrack, { backgroundColor: realm.borderColor }]}>
            <View style={[s.progressFill, { width: `${progress * 100}%` as any, backgroundColor: realm.accentColor }]} />
          </View>
        </View>
        <AppText style={s.realmGuardian}>{realm.guardian}</AppText>
      </View>

      {/* ── 課節格子 ── */}
      <View style={s.nodeGrid}>
        {words.map((word, index) => {
          const lessonId       = lessonOffset + index + 1;
          const isPremiumLesson= forceAllPremium || lessonId > FREE_LESSON_LIMIT;
          const isAvailable    = isPremium || !isPremiumLesson;
          const isUnlocked     = isAvailable && (unlockedLessons.includes(lessonId) || lessonId === 1);
          const isLearned      = wordProgress[word.id]?.learned ?? false;

          return (
            <TouchableOpacity
              key={word.id}
              style={[
                s.node,
                { backgroundColor: realm.nodeBg, borderColor: realm.borderColor },
                isLearned && isAvailable && {
                  backgroundColor: realm.nodeDoneBg, borderColor: realm.nodeDoneBorder,
                },
                !isUnlocked && !isPremiumLesson && s.nodeLocked,
                isPremiumLesson && !isPremium && s.nodePremium,
              ]}
              onPress={() => {
                if (!isAvailable) {
                  navigation.navigate('ParentLogin');
                } else if (isUnlocked) {
                  navigation.navigate('Lesson', { wordId: word.id, lessonId });
                }
              }}
              accessibilityLabel={`${lessonId} ${word.character}`}
            >
              {isLearned && isAvailable ? (
                <Ionicons name="checkmark-circle" size={22} color={realm.accentColor} />
              ) : isPremiumLesson && !isPremium ? (
                <>
                  <Ionicons name="diamond" size={16} color="#A78BFA" />
                  <AppText style={s.nodeNumPremium}>{lessonId}</AppText>
                </>
              ) : isUnlocked ? (
                <>
                  <AppText style={[s.nodeChar, { color: realm.accentColor }]}>{word.character}</AppText>
                  <AppText style={[s.nodeNum, { color: realm.accentColor + '99' }]}>{lessonId}</AppText>
                </>
              ) : (
                <Ionicons name="lock-closed" size={18} color={Colors.textMuted} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Boss 戰入口 ── */}
      {levelComplete && boss && (
        <TouchableOpacity
          style={[s.bossBtn, { backgroundColor: bossDefeated ? realm.nodeDoneBg : realm.accentColor,
            borderColor: bossDefeated ? realm.nodeDoneBorder : realm.accentColor }]}
          onPress={() => navigation.navigate('BossBattle', { bossId: realm.bossId })}
        >
          {bossDefeated ? (
            <>
              <Ionicons name="checkmark-circle" size={18} color={realm.accentColor} />
              <AppText style={[s.bossBtnTextDefeated, { color: realm.accentColor }]}>
                {boss.emoji} {t('mapBossDefeated').replace('{name}', getBossName(boss, language))}
              </AppText>
            </>
          ) : (
            <>
              <AppText style={s.bossBtnEmoji}>{boss.emoji}</AppText>
              <AppText style={s.bossBtnText}>
                {t('bossChallenge')} · {getBossName(boss, language)}
              </AppText>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── MultiCharSection ─────────────────────────────────────────────────────────
interface MultiCharSectionProps {
  label:           string;
  words:           Word[];
  firstLessonId:   number;
  isPremium:       boolean;
  unlockedLessons: number[];
  wordProgress:    Record<number, any>;
  navigation:      any;
  accentColor:     string;
  bgColor:         string;
  borderColor:     string;
}

function MultiCharSection({
  label, words, firstLessonId, isPremium,
  unlockedLessons, wordProgress, navigation,
  accentColor, bgColor, borderColor,
}: MultiCharSectionProps) {
  const { t } = useTranslation();
  const learnedCount = words.filter((w) => wordProgress[w.id]?.learned).length;

  return (
    <View style={[s.realmCard, { backgroundColor: bgColor, borderColor }]}>
      <View style={s.realmHeader}>
        <View style={s.realmHeaderLeft}>
          <AppText style={[s.realmName, { color: accentColor }]}>{label}</AppText>
          <AppText style={s.realmProgress}>{learnedCount}/{words.length}</AppText>
          <View style={[s.progressTrack, { backgroundColor: borderColor }]}>
            <View style={[s.progressFill, {
              width: `${(learnedCount / words.length) * 100}%` as any,
              backgroundColor: accentColor,
            }]} />
          </View>
        </View>
      </View>
      <View style={s.nodeGrid}>
        {words.map((word, index) => {
          const lessonId   = firstLessonId + index;
          const isUnlocked = unlockedLessons.includes(lessonId) || lessonId === firstLessonId;
          const isLearned  = wordProgress[word.id]?.learned ?? false;

          return (
            <TouchableOpacity
              key={word.id}
              style={[
                s.node, s.nodeWide,
                { backgroundColor: '#fff', borderColor },
                isLearned && { backgroundColor: bgColor },
                !isUnlocked && s.nodeLocked,
              ]}
              onPress={() => {
                if (isUnlocked) {
                  navigation.navigate('Lesson', { wordId: word.id, lessonId });
                }
              }}
            >
              {isLearned ? (
                <Ionicons name="checkmark-circle" size={20} color={accentColor} />
              ) : isUnlocked ? (
                <AppText style={[s.nodeCharWide, { color: accentColor }]}>{word.character}</AppText>
              ) : (
                <Ionicons name="lock-closed" size={18} color={Colors.textMuted} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── LockedGate ────────────────────────────────────────────────────────────────
function LockedGate({
  icon, label, hint, accentColor, bgColor, borderColor,
}: { icon: string; label: string; hint: string; accentColor: string; bgColor: string; borderColor: string }) {
  return (
    <View style={[s.realmCard, s.lockedGateCard, { backgroundColor: bgColor, borderColor }]}>
      <AppText style={s.lockedIcon}>{icon}</AppText>
      <View style={{ flex: 1 }}>
        <AppText style={[s.realmName, { color: accentColor }]}>{label}</AppText>
        <AppText style={s.lockedHint}>{hint}</AppText>
      </View>
      <Ionicons name="lock-closed" size={20} color={accentColor} />
    </View>
  );
}

// ── Path Connector ────────────────────────────────────────────────────────────
function PathConnector({ unlocked }: { unlocked: boolean }) {
  return (
    <View style={s.pathConnector}>
      <View style={[s.pathLine, !unlocked && s.pathLineLocked]} />
      <View style={[s.pathArrow, !unlocked && s.pathArrowLocked]}>
        <Ionicons name="chevron-down" size={14} color={unlocked ? Colors.primary : Colors.textMuted} />
      </View>
      <View style={[s.pathLine, !unlocked && s.pathLineLocked]} />
    </View>
  );
}

// ── MapScreen ─────────────────────────────────────────────────────────────────
export default function MapScreen({ navigation }: any) {
  const { unlockedLessons, wordProgress, isPremium, bossesDefeated, language } = useProgressStore();
  const { t } = useTranslation();

  const learnedCharCount  = ALL_WORDS.filter(
    (w) => (!w.contentType || w.contentType === 'character') && wordProgress[w.id]?.learned,
  ).length;
  const learnedVocabCount = VOCAB_WORDS.filter((w) => wordProgress[w.id]?.learned).length;
  const vocabUnlocked     = isPremium && learnedCharCount  >= VOCAB_UNLOCK_THRESHOLD;
  const idiomUnlocked     = isPremium && learnedVocabCount >= IDIOM_UNLOCK_THRESHOLD;

  const levels = [
    { words: SEEDLING_WORDS, offset: 0, forceAllPremium: false },
    { words: SAPLING_WORDS,  offset: SEEDLING_WORDS.length, forceAllPremium: true },
    { words: TREE_WORDS,     offset: SEEDLING_WORDS.length + SAPLING_WORDS.length, forceAllPremium: true },
    { words: SUNFLOWER_WORDS,offset: SEEDLING_WORDS.length + SAPLING_WORDS.length + TREE_WORDS.length, forceAllPremium: true },
    { words: RAINBOW_WORDS,  offset: SEEDLING_WORDS.length + SAPLING_WORDS.length + TREE_WORDS.length + SUNFLOWER_WORDS.length, forceAllPremium: true },
    { words: GALAXY_WORDS,   offset: SEEDLING_WORDS.length + SAPLING_WORDS.length + TREE_WORDS.length + SUNFLOWER_WORDS.length + RAINBOW_WORDS.length, forceAllPremium: true },
    { words: BAMBOO_WORDS,   offset: SEEDLING_WORDS.length + SAPLING_WORDS.length + TREE_WORDS.length + SUNFLOWER_WORDS.length + RAINBOW_WORDS.length + GALAXY_WORDS.length, forceAllPremium: true },
    { words: JADE_WORDS,     offset: SEEDLING_WORDS.length + SAPLING_WORDS.length + TREE_WORDS.length + SUNFLOWER_WORDS.length + RAINBOW_WORDS.length + GALAXY_WORDS.length + BAMBOO_WORDS.length, forceAllPremium: true },
  ];

  return (
    <SafeAreaView style={s.safe}>
      {/* ── 頂部欄 ── */}
      <View style={s.topBar}>
        <View>
          <AppText style={s.title}>{t('learningMap')}</AppText>
          <AppText style={s.subtitle}>{t('mapSubtitle')}</AppText>
        </View>
        <TouchableOpacity
          style={s.parentBtn}
          onPress={() => navigation.navigate('ParentLogin')}
        >
          <Ionicons name="people" size={18} color={Colors.primary} />
          <AppText style={s.parentBtnText}>{t('mapParentBtn')}</AppText>
        </TouchableOpacity>
      </View>

      {/* ── 免費版橫幅 ── */}
      {!isPremium && (
        <TouchableOpacity
          style={s.upgradeBanner}
          onPress={() => navigation.navigate('ParentLogin')}
          activeOpacity={0.8}
        >
          <Ionicons name="diamond" size={15} color="#fff" />
          <AppText style={s.upgradeBannerText}>{t('unlockBanner')}</AppText>
          <Ionicons name="chevron-forward" size={13} color="#fff" />
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={s.scroll}>

        {/* ── 8 個神話領域 ── */}
        {levels.map((level, idx) => {
          const realm = REALMS[idx];
          const prevComplete = idx === 0 || REALMS[idx - 1]
            ? (isPremium || !level.forceAllPremium)
            : false;
          return (
            <React.Fragment key={realm.bossId}>
              <RealmZoneCard
                realm={realm}
                words={level.words}
                lessonOffset={level.offset}
                isPremium={isPremium}
                unlockedLessons={unlockedLessons}
                wordProgress={wordProgress}
                bossesDefeated={bossesDefeated}
                navigation={navigation}
                forceAllPremium={level.forceAllPremium}
                language={language}
              />
              {idx < levels.length - 1 && (
                <PathConnector unlocked={!level.forceAllPremium || isPremium} />
              )}
            </React.Fragment>
          );
        })}

        {/* ── 詞語關卡 ── */}
        <PathConnector unlocked={vocabUnlocked} />
        {isPremium ? (
          vocabUnlocked ? (
            <MultiCharSection
              label={t('levelVocab')}
              words={VOCAB_WORDS}
              firstLessonId={FIRST_VOCAB_LESSON_ID}
              isPremium={isPremium}
              unlockedLessons={unlockedLessons}
              wordProgress={wordProgress}
              navigation={navigation}
              accentColor="#059669"
              bgColor="#F0FDF4"
              borderColor="#A7F3D0"
            />
          ) : (
            <LockedGate
              icon="📝"
              label={t('levelVocab')}
              hint={t('vocabLocked', { n: VOCAB_UNLOCK_THRESHOLD })}
              accentColor="#059669"
              bgColor="#F0FDF4"
              borderColor="#A7F3D0"
            />
          )
        ) : (
          <LockedGate
            icon="📝"
            label={t('levelVocab')}
            hint={t('mapVocabLockFree')}
            accentColor="#059669"
            bgColor="#F0FDF4"
            borderColor="#A7F3D0"
          />
        )}

        {/* ── 成語關卡 ── */}
        <PathConnector unlocked={idiomUnlocked} />
        {isPremium ? (
          idiomUnlocked ? (
            <MultiCharSection
              label={t('levelIdiom')}
              words={IDIOM_WORDS}
              firstLessonId={FIRST_IDIOM_LESSON_ID}
              isPremium={isPremium}
              unlockedLessons={unlockedLessons}
              wordProgress={wordProgress}
              navigation={navigation}
              accentColor="#7C3AED"
              bgColor="#FAF5FF"
              borderColor="#DDD6FE"
            />
          ) : (
            <LockedGate
              icon="🏮"
              label={t('levelIdiom')}
              hint={t('idiomLocked', { n: IDIOM_UNLOCK_THRESHOLD })}
              accentColor="#7C3AED"
              bgColor="#FAF5FF"
              borderColor="#DDD6FE"
            />
          )
        ) : (
          <LockedGate
            icon="🏮"
            label={t('levelIdiom')}
            hint={t('mapIdiomLockFree')}
            accentColor="#7C3AED"
            bgColor="#FAF5FF"
            borderColor="#DDD6FE"
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const NODE_GAP  = 10;
const NODE_SIZE = Math.floor((SW - 40 - 20 - NODE_GAP * 3) / 4); // 4 columns

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.primaryBg },

  topBar: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4,
  },
  title:    { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  parentBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryMuted,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  parentBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  upgradeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.cantonese,
    marginHorizontal: 20, marginTop: 8, marginBottom: 4,
    borderRadius: 12, padding: 10,
  },
  upgradeBannerText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#fff' },

  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 },

  // ── Realm Card ──
  realmCard: {
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  realmHeader: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 14,
  },
  realmHeaderLeft: { flex: 1, gap: 4 },
  realmName:     { fontSize: 20, fontWeight: '800' },
  realmProgress: { fontSize: 13, color: Colors.textSecondary },
  progressTrack: {
    height: 5, borderRadius: 3, overflow: 'hidden', marginTop: 4,
  },
  progressFill:  { height: 5, borderRadius: 3 },
  realmGuardian: { fontSize: 48, lineHeight: 56 },

  // ── Lesson Nodes ──
  nodeGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: NODE_GAP,
  },
  node: {
    width: NODE_SIZE, height: NODE_SIZE,
    borderRadius: 14, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  nodeWide: {
    width: (SW - 40 - 20 - NODE_GAP) / 2,
    height: 52, aspectRatio: undefined,
  },
  nodeLocked: {
    backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', opacity: 0.65,
  },
  nodePremium: {
    backgroundColor: '#F5F3FF', borderColor: '#DDD6FE',
  },
  nodeChar:       { fontSize: 24, fontWeight: '700' },
  nodeNum:        { fontSize: 10, marginTop: 0 },
  nodeNumPremium: { fontSize: 10, color: '#7C3AED', marginTop: 1 },
  nodeCharWide:   { fontSize: 18, fontWeight: '800', textAlign: 'center' },

  // ── Boss Button ──
  bossBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 18,
    marginTop: 14, borderWidth: 2,
  },
  bossBtnEmoji:        { fontSize: 20 },
  bossBtnText:         { fontSize: 15, fontWeight: '800', color: '#fff', flex: 1, textAlign: 'center' },
  bossBtnTextDefeated: { fontSize: 14, fontWeight: '700', flex: 1 },

  // ── Path Connector ──
  pathConnector: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 4, gap: 2,
  },
  pathLine:       { width: 2, height: 10, backgroundColor: Colors.primaryLight },
  pathLineLocked: { backgroundColor: Colors.borderLight },
  pathArrow: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primaryMuted,
    justifyContent: 'center', alignItems: 'center',
  },
  pathArrowLocked: { backgroundColor: Colors.borderLight },

  // ── Locked Gate ──
  lockedGateCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, opacity: 0.8,
  },
  lockedIcon: { fontSize: 26 },
  lockedHint: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
});
