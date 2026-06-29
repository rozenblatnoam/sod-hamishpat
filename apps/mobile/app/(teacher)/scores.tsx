// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/lib/api';
import { colors, fontSize, spacing, radius } from '../../src/theme';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function ScoresScreen() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    api.get('/teacher/all-students').then((r) => setStudents(r.data)).catch(() => {});
  }, []);

  return (
    <LinearGradient colors={['#1a0a2e', '#2d1b4e']} style={s.bg}>
      <View style={s.header}>
        <Text style={s.headerTitle}>טבלת ציונים</Text>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        {students.length === 0 && (
          <Text style={s.empty}>אין תלמידים עדיין</Text>
        )}
        {students.map((st, idx) => (
          <View key={st.id} style={[s.row, idx === 0 && s.rowFirst]}>
            <Text style={s.rank}>{MEDALS[idx] ?? `#${idx + 1}`}</Text>
            <View style={s.info}>
              <Text style={s.name}>{st.name}</Text>
              <Text style={s.level}>{st.level}</Text>
            </View>
            <Text style={[s.score, idx === 0 && s.scoreGold]}>{st.score}</Text>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  header: { padding: spacing.md, paddingTop: spacing.xxl },
  headerTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text.primary, textAlign: 'right' },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  empty: { color: colors.text.muted, textAlign: 'center', marginTop: 60, fontSize: fontSize.md },
  row: {
    backgroundColor: colors.bg.card, borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.1)',
  },
  rowFirst: { borderColor: 'rgba(255,215,0,0.4)', backgroundColor: 'rgba(255,215,0,0.05)' },
  rank: { fontSize: 24, width: 36, textAlign: 'center' },
  info: { flex: 1 },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.text.primary, textAlign: 'right' },
  level: { fontSize: fontSize.xs, color: colors.text.muted, textAlign: 'right' },
  score: { fontSize: fontSize.xl, fontWeight: '900', color: colors.text.primary },
  scoreGold: { color: colors.gold.primary },
});
