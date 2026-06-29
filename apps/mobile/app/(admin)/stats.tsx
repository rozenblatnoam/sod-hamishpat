// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { api } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { colors, fontSize, spacing, radius } from '../../src/theme';

export default function AdminStatsScreen() {
  const [stats, setStats] = useState(null);
  const logout = useAuthStore((s) => s.logout);

  const load = useCallback(async () => {
    try {
      const r = await api.get('/admin/stats');
      setStats(r.data);
    } catch {
      Alert.alert('שגיאה', 'לא ניתן לטעון נתונים');
    }
  }, []);

  useEffect(() => { load(); }, []);

  function handleLogout() {
    Alert.alert('יציאה', 'לצאת מחשבון המנהל?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'יציאה', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/login'); } },
    ]);
  }

  const LEVEL_LABEL = { student: 'תלמיד', trainee_judge: 'דיין מתמחה', judge: 'דיין', chief_judge: 'אב בית דין', expert_judge: 'דיין מומחה' };

  return (
    <LinearGradient colors={['#0d0d0d', '#1a0000']} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🔐 לוח בקרה — מנהל</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>יציאה</Text>
          </TouchableOpacity>
        </View>

        {stats && (
          <>
            <View style={styles.grid}>
              {[
                { label: 'סה"כ משתמשים', value: stats.totalUsers, icon: '👥' },
                { label: 'מורים', value: stats.totalTeachers, icon: '🎓' },
                { label: 'תלמידים', value: stats.totalStudents, icon: '📚' },
                { label: 'כיתות', value: stats.totalClasses, icon: '🏫' },
                { label: 'חדרי בריחה', value: stats.totalRooms, icon: '🚪' },
              ].map((item) => (
                <View key={item.label} style={styles.statCard}>
                  <Text style={styles.statIcon}>{item.icon}</Text>
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>🏆 תלמידים מובילים</Text>
            {stats.topStudents.map((s, i) => (
              <View key={s.id} style={styles.row}>
                <Text style={styles.rowScore}>{s.score} נק'</Text>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{s.name}</Text>
                  <Text style={styles.rowSub}>{LEVEL_LABEL[s.level] ?? s.level}</Text>
                </View>
                <Text style={styles.rowRank}>{['🥇','🥈','🥉','4','5'][i]}</Text>
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
  container: { padding: spacing.md, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: '#FF5252' },
  logoutBtn: { backgroundColor: 'rgba(255,82,82,0.15)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255,82,82,0.4)' },
  logoutText: { color: '#FF5252', fontWeight: '700', fontSize: fontSize.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { width: '47%', backgroundColor: '#1a1a1a', borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,82,82,0.2)' },
  statIcon: { fontSize: 28, marginBottom: spacing.xs },
  statValue: { fontSize: 32, fontWeight: '900', color: '#FF5252' },
  statLabel: { fontSize: fontSize.xs, color: colors.text.muted, textAlign: 'center', marginTop: 2 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text.primary, textAlign: 'right', marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xs, gap: spacing.md },
  rowRank: { fontSize: 22 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text.primary, textAlign: 'right' },
  rowSub: { fontSize: fontSize.xs, color: colors.text.muted, textAlign: 'right' },
  rowScore: { fontSize: fontSize.md, fontWeight: '800', color: '#FF5252' },
});
