// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/store/useAuthStore';
import { api } from '../../src/lib/api';
import { colors, fontSize, spacing, radius } from '../../src/theme';

interface ClassStats {
  totalStudents: number;
  avgScore: number;
  avgCompletion: number;
  students: Array<{
    id: string;
    name: string;
    score: number;
    level: string;
    completedRooms: number;
  }>;
}

export default function TeacherScreen() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<ClassStats | null>(null);

  useEffect(() => {
    if (user?.role === 'teacher') {
      api.get('/teacher/class-stats').then((res) => setStats(res.data)).catch(() => {});
    }
  }, [user]);

  if (user?.role !== 'teacher') {
    return (
      <LinearGradient colors={['#1a0a2e', '#2d1b4e']} style={styles.bg}>
        <View style={styles.center}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockText}>אזור זה מיועד למורים בלבד</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a0a2e', '#2d1b4e']} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>👨‍🏫 אזור מורה</Text>

        {stats && (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{stats.totalStudents}</Text>
                <Text style={styles.statLabel}>תלמידים</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{stats.avgScore}</Text>
                <Text style={styles.statLabel}>ממוצע ניקוד</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{stats.avgCompletion}%</Text>
                <Text style={styles.statLabel}>השלמה</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>תלמידים</Text>
            {stats.students.map((s) => (
              <View key={s.id} style={styles.studentRow}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{s.name}</Text>
                  <Text style={styles.studentLevel}>{s.level}</Text>
                </View>
                <View style={styles.studentStats}>
                  <Text style={styles.studentScore}>{s.score} נק'</Text>
                  <Text style={styles.studentRooms}>{s.completedRooms} חדרים</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  lockIcon: { fontSize: 64 },
  lockText: { fontSize: fontSize.lg, color: colors.text.secondary },
  container: { padding: spacing.md, paddingTop: spacing.xxl },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.gold.primary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  statNum: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.gold.primary,
  },
  statLabel: { fontSize: fontSize.xs, color: colors.text.muted },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  studentRow: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  studentInfo: { gap: 2 },
  studentName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'right',
  },
  studentLevel: { fontSize: fontSize.xs, color: colors.text.muted },
  studentStats: { alignItems: 'flex-end', gap: 2 },
  studentScore: { fontSize: fontSize.sm, color: colors.gold.primary, fontWeight: '600' },
  studentRooms: { fontSize: fontSize.xs, color: colors.text.muted },
});
