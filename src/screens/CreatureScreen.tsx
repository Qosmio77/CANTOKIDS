/**
 * CreatureScreen — 神獸庇護所
 *
 * 顯示所有 7 種神話生物的解鎖狀態、成長階段、餵食功能。
 * 解鎖條件：擊敗對應領域 Boss。
 * 進化條件：餵食足夠食物達到門檻。
 */

import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Modal, TextInput, Dimensions, Alert,
} from 'react-native';
import AppText from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useProgressStore } from '../store/useProgressStore';
import { CREATURES, getCreatureName, getStageName, xpNeededForNext, CreatureDef } from '../data/creatures';
import { useTranslation } from '../hooks/useTranslation';

const { width: SW } = Dimensions.get('window');
const CARD_W = (SW - 48 - 12) / 2;

// ── Stage badge styles ────────────────────────────────────────────────────────
const STAGE_LABELS_ZH = ['幼年', '少年', '成年', '神話'];
const STAGE_LABELS_EN = ['Baby', 'Teen', 'Adult', 'Mythic'];

// ── CreatureCard ──────────────────────────────────────────────────────────────
interface CreatureCardProps {
  def:      CreatureDef;
  unlocked: boolean;
  stage:    0 | 1 | 2 | 3;
  xp:       number;
  customName?: string;
  language: string;
  foodCount: number;
  onFeed:   () => void;
  onName:   () => void;
}

function CreatureCard({
  def, unlocked, stage, xp, customName, language, foodCount, onFeed, onName,
}: CreatureCardProps) {
  const needed = xpNeededForNext(def, stage);
  const stageName = getStageName(def, stage, language);
  const creatureName = customName || getCreatureName(def, language);
  const bgColor = def.bgColors[stage];
  const accent  = def.accentColors[stage];
  const stageLabel = language === 'en' ? STAGE_LABELS_EN[stage] : STAGE_LABELS_ZH[stage];

  if (!unlocked) {
    return (
      <View style={[s.card, s.cardLocked, { borderColor: '#E5E7EB' }]}>
        <AppText style={s.lockedEmoji}>❓</AppText>
        <AppText style={s.lockedName}>
          {language === 'en' ? def.realmEn : def.realmZh}
        </AppText>
        <AppText style={s.lockedHint}>
          {language === 'en' ? 'Defeat realm boss\nto unlock' : `擊敗${def.realmZh}\nBoss 解鎖`}
        </AppText>
        <View style={s.lockIcon}>
          <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: bgColor, borderColor: accent + '60' }]}
      onLongPress={onName}
      activeOpacity={0.88}
    >
      {/* Stage badge */}
      <View style={[s.stageBadge, { backgroundColor: accent }]}>
        <AppText style={s.stageBadgeText}>{stageLabel}</AppText>
      </View>

      {/* Creature emoji */}
      <AppText style={[
        s.creatureEmoji,
        stage === 3 && s.creatureEmojiMythic,
      ]}>
        {def.emoji}
      </AppText>

      {/* Name */}
      <AppText style={[s.creatureName, { color: accent }]} numberOfLines={1}>
        {creatureName}
      </AppText>
      <AppText style={[s.stageName, { color: accent + 'CC' }]} numberOfLines={1}>
        {stageName}
      </AppText>

      {/* XP bar */}
      {needed != null ? (
        <View style={s.xpSection}>
          <View style={[s.xpTrack, { backgroundColor: accent + '30' }]}>
            <View style={[s.xpFill, {
              width: `${Math.min(100, (xp / needed) * 100)}%` as any,
              backgroundColor: accent,
            }]} />
          </View>
          <AppText style={[s.xpLabel, { color: accent }]}>{xp}/{needed}🍖</AppText>
        </View>
      ) : (
        <AppText style={[s.mythicLabel, { color: accent }]}>✨ 最高階段</AppText>
      )}

      {/* Feed button */}
      {needed != null && (
        <TouchableOpacity
          style={[s.feedBtn, { backgroundColor: accent, opacity: foodCount >= 5 ? 1 : 0.5 }]}
          onPress={onFeed}
          disabled={foodCount < 5}
        >
          <AppText style={s.feedBtnText}>
            🍖×5 {language === 'en' ? 'Feed' : '餵食'}
          </AppText>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ── FeedModal ─────────────────────────────────────────────────────────────────
function FeedModal({
  visible, creature, stage, xp, foodCount, language, onFeed, onClose,
}: {
  visible: boolean;
  creature: CreatureDef;
  stage: 0|1|2|3;
  xp: number;
  foodCount: number;
  language: string;
  onFeed: (amount: number) => void;
  onClose: () => void;
}) {
  const needed   = xpNeededForNext(creature, stage);
  const accent   = creature.accentColors[stage];
  const remaining = needed != null ? Math.max(0, needed - xp) : 0;
  const maxFeed  = needed != null ? Math.min(foodCount, remaining) : 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={[s.modalBox, { borderColor: accent + '60' }]}>
          <AppText style={[s.modalTitle, { color: accent }]}>
            {getCreatureName(creature, language)} 🍖
          </AppText>
          <AppText style={s.modalEmoji}>{creature.emoji}</AppText>
          <AppText style={s.modalDesc}>
            {language === 'en'
              ? `You have ${foodCount} 🍖. Feed to gain XP and evolve!`
              : `你有 ${foodCount} 🍖 食物。餵食可以讓生物進化！`}
          </AppText>
          {needed != null && (
            <AppText style={[s.modalXP, { color: accent }]}>
              {xp} / {needed} 🍖 {language === 'en' ? 'to evolve' : '可進化'}
            </AppText>
          )}
          <View style={s.feedRow}>
            {[5, 10, 20].map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[s.feedAmtBtn, { borderColor: accent, opacity: foodCount >= amt ? 1 : 0.35 }]}
                onPress={() => foodCount >= amt && onFeed(amt)}
                disabled={foodCount < amt}
              >
                <AppText style={[s.feedAmtText, { color: accent }]}>×{amt}</AppText>
                <AppText style={s.feedAmtSub}>🍖</AppText>
              </TouchableOpacity>
            ))}
            {maxFeed > 0 && (
              <TouchableOpacity
                style={[s.feedAmtBtn, s.feedAmtBtnAll, { backgroundColor: accent }]}
                onPress={() => onFeed(maxFeed)}
              >
                <AppText style={s.feedAmtTextAll}>
                  {language === 'en' ? 'All' : '全部'}
                </AppText>
                <AppText style={s.feedAmtSubAll}>×{maxFeed}🍖</AppText>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={s.modalClose} onPress={onClose}>
            <AppText style={s.modalCloseText}>
              {language === 'en' ? 'Close' : '關閉'}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── NameModal ─────────────────────────────────────────────────────────────────
function NameModal({
  visible, current, language, onSave, onClose,
}: {
  visible: boolean;
  current: string;
  language: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(current);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={[s.modalBox, { borderColor: Colors.primary + '60' }]}>
          <AppText style={[s.modalTitle, { color: Colors.primary }]}>
            {language === 'en' ? '🏷️ Name Your Creature' : '🏷️ 為神獸命名'}
          </AppText>
          <TextInput
            style={s.nameInput}
            value={value}
            onChangeText={setValue}
            placeholder={language === 'en' ? 'Enter a name...' : '輸入名字…'}
            placeholderTextColor={Colors.textMuted}
            maxLength={12}
            autoFocus
          />
          <View style={s.feedRow}>
            <TouchableOpacity
              style={[s.feedAmtBtn, { borderColor: Colors.borderLight }]}
              onPress={onClose}
            >
              <AppText style={{ color: Colors.textMuted, fontWeight: '600' }}>
                {language === 'en' ? 'Cancel' : '取消'}
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.feedAmtBtn, s.feedAmtBtnAll, { backgroundColor: Colors.primary }]}
              onPress={() => { onSave(value.trim()); onClose(); }}
            >
              <AppText style={s.feedAmtTextAll}>
                {language === 'en' ? 'Save' : '儲存'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── CreatureScreen ─────────────────────────────────────────────────────────────
export default function CreatureScreen({ navigation }: any) {
  const { t } = useTranslation();
  const {
    language, creatureProgress, foodCount, bossesDefeated,
    feedCreature, nameCreature, addFood,
  } = useProgressStore();

  const [feedTarget, setFeedTarget] = useState<string | null>(null);
  const [nameTarget, setNameTarget] = useState<string | null>(null);
  const [justEvolved, setJustEvolved] = useState<string | null>(null);

  const handleFeed = (creatureId: string, amount: number) => {
    const evolved = feedCreature(creatureId, amount);
    if (evolved) {
      setFeedTarget(null);
      setJustEvolved(creatureId);
      setTimeout(() => setJustEvolved(null), 3000);
    }
  };

  // Map bossId → creatureId
  const bossToCreature: Record<string, string> = {
    boss_seedling:  'fox',
    boss_sapling:   'tiger',
    boss_tree:      'phoenix',
    boss_sunflower: 'qilin',
    boss_rainbow:   'dragon',
    boss_galaxy:    'pixiu',
    boss_bamboo:    'xuanwu',
  };

  const unlockedIds = bossesDefeated.map((bId) => bossToCreature[bId]).filter(Boolean);

  const feedTargetDef = feedTarget ? CREATURES.find((c) => c.id === feedTarget) : null;
  const feedTargetProgress = feedTarget ? creatureProgress[feedTarget] : null;
  const nameTargetDef = nameTarget ? CREATURES.find((c) => c.id === nameTarget) : null;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <AppText style={s.title}>
            {language === 'en' ? '🐉 Creature Sanctuary' : '🐉 神獸庇護所'}
          </AppText>
          <AppText style={s.subtitle}>
            {unlockedIds.length}/{CREATURES.length}{' '}
            {language === 'en' ? 'unlocked' : '已解鎖'}
          </AppText>
        </View>
        {/* Food counter */}
        <View style={s.foodChip}>
          <AppText style={s.foodEmoji}>🍖</AppText>
          <AppText style={s.foodCount}>{foodCount}</AppText>
        </View>
      </View>

      {/* Just evolved banner */}
      {justEvolved && (
        <View style={s.evolvedBanner}>
          <AppText style={s.evolvedText}>
            🎉 {getCreatureName(CREATURES.find((c) => c.id === justEvolved)!, language)}{' '}
            {language === 'en' ? 'evolved!' : '進化了！'}
          </AppText>
        </View>
      )}

      {/* Info card — how to earn food */}
      <View style={s.infoCard}>
        <AppText style={s.infoText}>
          {language === 'en'
            ? '🍖 Earn food by completing daily tasks · Feed creatures to help them evolve!'
            : '🍖 完成每日任務賺取食物 · 餵食神獸幫助牠們進化！'}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={s.grid}>
        {CREATURES.map((creature) => {
          const cp       = creatureProgress[creature.id];
          const unlocked = unlockedIds.includes(creature.id);
          const stage    = (cp?.stage ?? 0) as 0 | 1 | 2 | 3;
          const xp       = cp?.xp ?? 0;

          return (
            <CreatureCard
              key={creature.id}
              def={creature}
              unlocked={unlocked}
              stage={stage}
              xp={xp}
              customName={cp?.customName}
              language={language}
              foodCount={foodCount}
              onFeed={() => setFeedTarget(creature.id)}
              onName={() => nameTarget === null && setNameTarget(creature.id)}
            />
          );
        })}
      </ScrollView>

      {/* Feed Modal */}
      {feedTargetDef && feedTargetProgress && (
        <FeedModal
          visible={!!feedTarget}
          creature={feedTargetDef}
          stage={feedTargetProgress.stage as 0|1|2|3}
          xp={feedTargetProgress.xp}
          foodCount={foodCount}
          language={language}
          onFeed={(amount) => handleFeed(feedTarget!, amount)}
          onClose={() => setFeedTarget(null)}
        />
      )}

      {/* Name Modal */}
      {nameTargetDef && (
        <NameModal
          visible={!!nameTarget}
          current={creatureProgress[nameTarget!]?.customName ?? ''}
          language={language}
          onSave={(name) => nameCreature(nameTarget!, name)}
          onClose={() => setNameTarget(null)}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.primaryBg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, gap: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
  },
  headerCenter: { flex: 1 },
  title:    { fontSize: 20, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary },

  foodChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#FDE68A',
  },
  foodEmoji: { fontSize: 16 },
  foodCount: { fontSize: 17, fontWeight: '800', color: '#B45309' },

  evolvedBanner: {
    marginHorizontal: 16, marginBottom: 4,
    backgroundColor: '#DCFCE7', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: '#86EFAC',
  },
  evolvedText: { fontSize: 16, fontWeight: '700', color: '#15803D', textAlign: 'center' },

  infoCard: {
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: Colors.primaryMuted, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14,
  },
  infoText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 12, paddingBottom: 32,
  },

  // ── Creature Card ──
  card: {
    width: CARD_W, borderRadius: 20, borderWidth: 2,
    padding: 14, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOpacity: 0.07,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3,
    overflow: 'visible',
  },
  cardLocked: {
    backgroundColor: '#F9FAFB', borderColor: '#E5E7EB',
    opacity: 0.75, alignItems: 'center', justifyContent: 'center',
    minHeight: 180,
  },

  stageBadge: {
    alignSelf: 'flex-end', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, marginBottom: 2,
  },
  stageBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  creatureEmoji:      { fontSize: 56, lineHeight: 64 },
  creatureEmojiMythic: { fontSize: 64, lineHeight: 72 },

  creatureName: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  stageName:    { fontSize: 12, textAlign: 'center' },

  xpSection: { alignSelf: 'stretch', gap: 3 },
  xpTrack:   { height: 6, borderRadius: 3, overflow: 'hidden' },
  xpFill:    { height: 6, borderRadius: 3 },
  xpLabel:   { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  mythicLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },

  feedBtn: {
    alignSelf: 'stretch', paddingVertical: 8,
    borderRadius: 10, alignItems: 'center', marginTop: 2,
  },
  feedBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  lockedEmoji: { fontSize: 38 },
  lockedName:  { fontSize: 14, fontWeight: '700', color: '#6B7280', textAlign: 'center' },
  lockedHint:  { fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 16 },
  lockIcon:    { marginTop: 4 },

  // ── Modals ──
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalBox: {
    backgroundColor: Colors.primaryBg, borderRadius: 24,
    padding: 24, alignItems: 'center', gap: 12,
    borderWidth: 2, width: '100%',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  modalTitle:  { fontSize: 20, fontWeight: '800', color: Colors.text },
  modalEmoji:  { fontSize: 64 },
  modalDesc:   { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  modalXP:     { fontSize: 17, fontWeight: '700' },

  feedRow: {
    flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center',
  },
  feedAmtBtn: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12,
    alignItems: 'center', borderWidth: 2, minWidth: 70,
  },
  feedAmtBtnAll:  { borderWidth: 0 },
  feedAmtText:    { fontSize: 16, fontWeight: '800' },
  feedAmtSub:     { fontSize: 14 },
  feedAmtTextAll: { fontSize: 16, fontWeight: '800', color: '#fff' },
  feedAmtSubAll:  { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  modalClose:     { paddingVertical: 8, paddingHorizontal: 24 },
  modalCloseText: { fontSize: 16, color: Colors.textMuted, fontWeight: '600' },

  nameInput: {
    alignSelf: 'stretch', borderRadius: 14, borderWidth: 2,
    borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 20, fontWeight: '600', color: Colors.text,
    backgroundColor: Colors.primaryMuted, textAlign: 'center',
  },
});
