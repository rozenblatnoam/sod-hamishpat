// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { roomsApi, lessonsApi } from '../../src/lib/api';
import { Room, Lesson } from '../../src/shared';
import { colors, fontSize, spacing, radius } from '../../src/theme';

const POINTS_RULES = [
  { icon: '🎬', label: 'צפייה בסרטון', value: '+10' },
  { icon: '🧩', label: 'פתרון חידה', value: '+20' },
  { icon: '⚖️', label: 'פסיקה נכונה בתיק', value: '+50' },
  { icon: '⭐', label: 'בונוס: פסיקה נכונה בלי רמז', value: '+15' },
];

const LEVEL_RULES = [
  { label: 'תלמיד', score: 0 },
  { label: 'דיין מתלמד', score: 200 },
  { label: 'דיין', score: 600 },
  { label: 'אב בית דין', score: 1200 },
  { label: 'דיין מומחה', score: 2500 },
];

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showBriefing, setShowBriefing] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([roomsApi.getById(id), lessonsApi.getByRoom(id)])
      .then(([roomRes, lessonsRes]) => {
        setRoom(roomRes.data);
        setLessons(lessonsRes.data);
      })
      .catch(() => {});

    AsyncStorage.getItem(`briefing_seen_${id}`).then((seen) => {
      if (!seen) setShowBriefing(true);
    });
  }, [id]);

  function dismissBriefing() {
    AsyncStorage.setItem(`briefing_seen_${id}`, '1');
    setShowBriefing(false);
  }

  if (!room) return null;

  return (
    <LinearGradient colors={['#1a0a2e', '#2d1b4e']} style={styles.bg}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-forward" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{room.titleHe}</Text>
        <TouchableOpacity onPress={() => setShowBriefing(true)} style={styles.back}>
          <Ionicons name="information-circle-outline" size={24} color={colors.gold.primary} />
        </TouchableOpacity>
      </View>

      {/* Room Illustration */}
      <View style={styles.illustration}>
        <Text style={styles.roomEmoji}>🏛️</Text>
        <Text style={styles.topic}>{room.topic}</Text>
        <Text style={styles.description}>{room.description}</Text>
      </View>

      {room.isCompleted && (
        <View style={styles.escapeBanner}>
          <Text style={styles.escapeEmoji}>🎉</Text>
          <Text style={styles.escapeTitle}>בריחה מוצלחת!</Text>
          <Text style={styles.escapeSubtitle}>השלמת את כל התיקים בחדר הזה</Text>
        </View>
      )}

      {/* Lessons */}
      <ScrollView contentContainerStyle={styles.lessonsContainer}>
        <Text style={styles.sectionTitle}>שלבים</Text>
        {lessons.map((lesson, idx) => (
          <TouchableOpacity
            key={lesson.id}
            style={styles.lessonCard}
            onPress={() => router.push(`/lesson/${lesson.id}`)}
          >
            <View style={styles.lessonNum}>
              <Text style={styles.lessonNumText}>{idx + 1}</Text>
            </View>
            <View style={styles.lessonInfo}>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              {lesson.videoUrl && (
                <View style={styles.videoTag}>
                  <Ionicons name="play-circle" size={12} color={colors.gold.primary} />
                  <Text style={styles.videoTagText}>סרטון</Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-back" size={20} color={colors.text.muted} />
          </TouchableOpacity>
        ))}

        {lessons.length === 0 && (
          <Text style={styles.empty}>אין שלבים זמינים עדיין</Text>
        )}
      </ScrollView>

      {/* Briefing */}
      <Modal visible={showBriefing} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.briefingCard}>
            <ScrollView contentContainerStyle={styles.briefingScroll}>
              <Text style={styles.briefingEmoji}>📜</Text>
              <Text style={styles.briefingTitle}>תדריך לפני הכניסה לחדר</Text>
              <Text style={styles.briefingGoal}>
                המטרה: לפתור את כל התיקים בחדר ולברוח ממנו! פתרון נכון של כל התיקים פותח את החדר הבא.
              </Text>

              <Text style={styles.briefingSectionTitle}>איך נצברות נקודות?</Text>
              {POINTS_RULES.map((r) => (
                <View key={r.label} style={styles.ruleRow}>
                  <Text style={styles.ruleValue}>{r.value}</Text>
                  <Text style={styles.ruleLabel}>{r.label}</Text>
                  <Text style={styles.ruleIcon}>{r.icon}</Text>
                </View>
              ))}

              <Text style={styles.briefingSectionTitle}>דרגות שיפוט</Text>
              {LEVEL_RULES.map((l) => (
                <View key={l.label} style={styles.ruleRow}>
                  <Text style={styles.ruleValue}>{l.score}+</Text>
                  <Text style={styles.ruleLabel}>{l.label}</Text>
                  <Text style={styles.ruleIcon}>⚖️</Text>
                </View>
              ))}

              <TouchableOpacity style={styles.briefingBtn} onPress={dismissBriefing}>
                <Text style={styles.briefingBtnText}>הבנתי, בואו נתחיל!</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'right',
  },
  illustration: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  roomEmoji: { fontSize: 80 },
  topic: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gold.primary,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  escapeBanner: {
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(76,175,80,0.15)',
    borderWidth: 1,
    borderColor: '#4CAF50',
    gap: 4,
  },
  escapeEmoji: { fontSize: 40 },
  escapeTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text.primary },
  escapeSubtitle: { fontSize: fontSize.sm, color: colors.text.secondary },
  lessonsContainer: { padding: spacing.md, paddingBottom: spacing.xxl },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  lessonCard: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.15)',
  },
  lessonNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gold.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonNumText: { fontSize: fontSize.md, fontWeight: '700', color: '#1a0a2e' },
  lessonInfo: { flex: 1, gap: 4 },
  lessonTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'right',
  },
  videoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
  },
  videoTagText: { fontSize: fontSize.xs, color: colors.gold.primary },
  empty: {
    textAlign: 'center',
    color: colors.text.muted,
    marginTop: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  briefingCard: {
    backgroundColor: '#1a0a2e',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    maxHeight: '85%',
  },
  briefingScroll: { padding: spacing.lg, gap: spacing.sm, alignItems: 'center' },
  briefingEmoji: { fontSize: 48 },
  briefingTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.gold.primary,
    textAlign: 'center',
  },
  briefingGoal: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  briefingSectionTitle: {
    alignSelf: 'flex-end',
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: 6,
    gap: spacing.sm,
  },
  ruleIcon: { fontSize: 18 },
  ruleLabel: { flex: 1, fontSize: fontSize.sm, color: colors.text.primary, textAlign: 'right' },
  ruleValue: { fontSize: fontSize.sm, fontWeight: '800', color: colors.gold.primary },
  briefingBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.gold.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  briefingBtnText: { fontSize: fontSize.md, fontWeight: '800', color: '#1a0a2e' },
});
