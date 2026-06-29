// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { lessonsApi, casesApi, progressApi } from '../../src/lib/api';
import { Lesson, Case } from '../../src/shared';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { colors, fontSize, spacing, radius } from '../../src/theme';
import { POINTS } from '../../src/shared';

const LOCAL_VIDEO_MODULES: Record<string, any> = {
  avida: require('../../assets/avida.mp4'),
  cadkatan: require('../../assets/cadkatan.mp4'),
};

type Phase = 'intro' | 'source' | 'video' | 'cases';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [phase, setPhase] = useState<Phase>('intro');
  const [videoWatched, setVideoWatched] = useState(false);
  const [videoSource, setVideoSource] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([lessonsApi.getById(id), casesApi.getByLesson(id)])
      .then(([lRes, cRes]) => {
        setLesson(lRes.data);
        setCases(cRes.data);
        setPhase(lRes.data.content ? 'intro' : lRes.data.sourceContent ? 'source' : 'cases');
        const url: string | null = lRes.data.videoUrl;
        if (url?.startsWith('asset:')) {
          const key = url.replace('asset:', '');
          const mod = LOCAL_VIDEO_MODULES[key];
          if (mod) setVideoSource(mod);
        } else if (url) {
          setVideoSource({ uri: url });
        }
      })
      .catch(() => {});
  }, [id]);

  async function handleVideoEnd() {
    setVideoWatched(true);
    if (lesson) {
      await progressApi.update(lesson.roomId, {
        action: 'watch_video',
        lessonId: id,
        points: POINTS.WATCH_VIDEO,
      }).catch(() => {});
    }
    Alert.alert('כל הכבוד!', `צברת ${POINTS.WATCH_VIDEO} נקודות על צפייה בסרטון`);
  }

  if (!lesson) return null;

  const hasVideo = !!lesson.videoUrl;
  const hasIntro = !!lesson.content;
  const hasSource = !!lesson.sourceContent;
  const phases: Phase[] = [
    ...(hasIntro ? (['intro'] as Phase[]) : []),
    ...(hasSource ? (['source'] as Phase[]) : []),
    ...(hasVideo ? (['video'] as Phase[]) : []),
    'cases',
  ];
  const phaseLabels: Record<Phase, string> = {
    intro: hasSource ? 'מבוא' : 'סיכום',
    source: 'מקור',
    video: 'סרטון',
    cases: 'תיקים',
  };
  const afterIntroPhase: Phase = hasSource ? 'source' : hasVideo ? 'video' : 'cases';
  const afterIntroLabel = hasSource ? 'המשך למקור' : hasVideo ? 'המשך לסרטון' : 'התקדם לתיקים';

  return (
    <LinearGradient colors={['#1a0a2e', '#2d1b4e']} style={styles.bg}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-forward" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{lesson.title}</Text>
      </View>

      {/* Phase tabs */}
      <View style={styles.tabs}>
        {phases.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.tab, phase === p && styles.activeTab]}
            onPress={() => setPhase(p)}
          >
            <Text style={[styles.tabText, phase === p && styles.activeTabText]}>
              {phaseLabels[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {phase === 'video' ? (
        <View style={styles.videoWrapper}>
          {videoSource ? (
            <>
              <Video
                source={videoSource}
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={false}
                onPlaybackStatusUpdate={(status) => {
                  if (status.isLoaded && status.didJustFinish && !videoWatched) {
                    handleVideoEnd();
                  }
                }}
              />
              {videoWatched && (
                <Button
                  title="התקדם לתיקים"
                  onPress={() => setPhase('cases')}
                  style={{ margin: spacing.md }}
                />
              )}
            </>
          ) : (
            <View style={styles.videoLoading}>
              <ActivityIndicator color={colors.gold.primary} size="large" />
              <Text style={styles.videoLoadingText}>הסרטון נטען...</Text>
            </View>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {phase === 'intro' && (
            <Card>
              <Text style={styles.bodyText}>{lesson.content}</Text>
              <Button
                title={afterIntroLabel}
                onPress={() => setPhase(afterIntroPhase)}
                style={{ marginTop: spacing.md }}
              />
            </Card>
          )}

          {phase === 'source' && (
            <View style={styles.sourceSection}>
              <Card glow>
                <Text style={styles.sourceLabel}>📜 מקור</Text>
                <Text style={styles.sourceText}>{lesson.sourceContent ?? lesson.content}</Text>
              </Card>
              <Button
                title={hasVideo ? 'המשך לסרטון' : 'התקדם לתיקים'}
                onPress={() => setPhase(hasVideo ? 'video' : 'cases')}
                style={{ marginTop: spacing.md }}
              />
            </View>
          )}

          {phase === 'cases' && (
            <View style={styles.casesSection}>
              <Text style={styles.sectionTitle}>תיקי חקירה</Text>
              {cases.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.caseCard}
                  onPress={() => router.push(`/case/${c.id}`)}
                >
                  <Text style={styles.caseTitle}>{c.title}</Text>
                  <Text style={styles.caseScenario} numberOfLines={2}>
                    {c.scenario}
                  </Text>
                  <View style={styles.caseFooter}>
                    <Text style={styles.casePoints}>50 נק'</Text>
                    <Ionicons name="chevron-back" size={16} color={colors.gold.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
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
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'right',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    alignItems: 'center',
    backgroundColor: colors.bg.card,
  },
  activeTab: { backgroundColor: colors.gold.dark },
  tabText: { fontSize: fontSize.xs, color: colors.text.muted },
  activeTabText: { color: '#1a0a2e', fontWeight: '700' },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  bodyText: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    lineHeight: 24,
    textAlign: 'right',
  },
  videoWrapper: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  video: { width: '100%', aspectRatio: 16 / 9 },
  videoLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  videoLoadingText: { color: colors.text.muted, fontSize: fontSize.sm },
  sourceSection: { gap: spacing.md },
  sourceLabel: {
    fontSize: fontSize.sm,
    color: colors.gold.primary,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'right',
  },
  sourceText: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    lineHeight: 28,
    textAlign: 'right',
  },
  casesSection: { gap: spacing.sm },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  caseCard: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    gap: spacing.xs,
  },
  caseTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'right',
  },
  caseScenario: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'right',
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  casePoints: { fontSize: fontSize.xs, color: colors.gold.primary },
});
