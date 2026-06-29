// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, spacing, radius } from '../../theme';
import { UserLevel, SCORE_THRESHOLDS, LEVEL_LABELS, LEVEL_COLORS } from '../../shared';

interface ScoreBarProps {
  score: number;
  level: UserLevel;
}

const LEVEL_ORDER: UserLevel[] = [
  'student',
  'trainee_judge',
  'judge',
  'chief_judge',
  'expert_judge',
];

export function ScoreBar({ score, level }: ScoreBarProps) {
  const currentIdx = LEVEL_ORDER.indexOf(level);
  const nextLevel = LEVEL_ORDER[currentIdx + 1];
  const current = SCORE_THRESHOLDS[level];
  const next = nextLevel ? SCORE_THRESHOLDS[nextLevel] : score;
  const progress = nextLevel ? (score - current) / (next - current) : 1;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.level, { color: LEVEL_COLORS[level] }]}>
          {LEVEL_LABELS[level]}
        </Text>
        <Text style={styles.score}>{score} נק'</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: LEVEL_COLORS[level] },
          ]}
        />
      </View>
      {nextLevel && (
        <Text style={styles.next}>
          {next - score} נק' עד {LEVEL_LABELS[nextLevel]}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  level: { fontSize: fontSize.sm, fontWeight: '700' },
  score: { fontSize: fontSize.sm, color: colors.text.secondary },
  track: {
    height: 8,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
  next: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    textAlign: 'right',
  },
});
