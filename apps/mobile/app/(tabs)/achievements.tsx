// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { achievementsApi } from '../../src/lib/api';
import { Achievement } from '../../src/shared';
import { colors, fontSize, spacing, radius } from '../../src/theme';

export default function AchievementsScreen() {
  const [all, setAll] = useState<Achievement[]>([]);
  const [earned, setEarned] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([achievementsApi.getAll(), achievementsApi.getUserAchievements()])
      .then(([allRes, earnedRes]) => {
        setAll(allRes.data);
        setEarned(earnedRes.data.map((a: Achievement) => a.id));
      })
      .catch(() => {});
  }, []);

  return (
    <LinearGradient colors={['#1a0a2e', '#2d1b4e']} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🏆 הישגים</Text>
        <Text style={styles.count}>
          {earned.length}/{all.length} הושגו
        </Text>

        <View style={styles.grid}>
          {all.map((a) => {
            const isEarned = earned.includes(a.id);
            return (
              <View key={a.id} style={[styles.card, !isEarned && styles.locked]}>
                <Text style={styles.icon}>{isEarned ? a.icon : '🔒'}</Text>
                <Text style={[styles.cardTitle, !isEarned && styles.lockedText]}>
                  {a.titleHe}
                </Text>
                {isEarned && (
                  <Text style={styles.desc}>{a.description}</Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { padding: spacing.md, paddingTop: spacing.xxl },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.gold.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  count: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  card: {
    width: '47%',
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    gap: spacing.xs,
  },
  locked: {
    borderColor: 'rgba(255,255,255,0.05)',
    opacity: 0.5,
  },
  icon: { fontSize: 36 },
  cardTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  lockedText: { color: colors.text.muted },
  desc: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
