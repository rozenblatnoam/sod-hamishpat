// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';
import { api } from '../../src/lib/api';
import { colors, fontSize, spacing, radius } from '../../src/theme';
import { LEVEL_LABELS, LEVEL_COLORS } from '../../src/shared';

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [classCode, setClassCode] = useState('');
  const [joining, setJoining] = useState(false);

  function handleLogout() {
    Alert.alert('יציאה', 'האם אתה בטוח שברצונך לצאת?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'יציאה',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  async function handleJoinClass() {
    if (!classCode.trim()) return;
    setJoining(true);
    try {
      const res = await api.post('/teacher/join-class', { code: classCode.trim() });
      Alert.alert('הצטרפת!', `הצטרפת לכיתה: ${res.data.className}`);
      setClassCode('');
    } catch {
      Alert.alert('שגיאה', 'קוד כיתה לא נמצא');
    } finally {
      setJoining(false);
    }
  }

  if (!user) return null;

  return (
    <LinearGradient colors={['#1a0a2e', '#2d1b4e']} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>⚙️ הגדרות</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.levelBadge}>
              <Text style={[styles.levelText, { color: LEVEL_COLORS[user.level] }]}>
                {LEVEL_LABELS[user.level]}
              </Text>
            </View>
          </View>
        </View>

        {[
          { label: 'בית ספר', value: user.school },
          { label: 'כיתה', value: user.class },
          { label: 'ניקוד', value: `${user.score} נק'` },
        ].map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.rowValue}>{row.value}</Text>
            <Text style={styles.rowLabel}>{row.label}</Text>
          </View>
        ))}

        {user.role !== 'teacher' && (
          <View style={styles.joinSection}>
            <Text style={styles.joinTitle}>הצטרפות לכיתה</Text>
            <Text style={styles.joinHint}>קיבלת קוד מהמורה? הזן אותו כאן</Text>
            <View style={styles.joinRow}>
              <TouchableOpacity
                style={[styles.joinBtn, joining && { opacity: 0.6 }]}
                onPress={handleJoinClass}
                disabled={joining}
              >
                <Text style={styles.joinBtnText}>הצטרף</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.joinInput}
                value={classCode}
                onChangeText={(t) => setClassCode(t.toUpperCase())}
                placeholder="ABC123"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="characters"
                maxLength={6}
                textAlign="center"
              />
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>יציאה מהחשבון</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { padding: spacing.md, paddingTop: spacing.xxl },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.gold.primary, textAlign: 'center', marginBottom: spacing.lg },
  profileCard: {
    backgroundColor: colors.bg.card, borderRadius: radius.lg, padding: spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)', marginBottom: spacing.md,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.gold.dark, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: fontSize.xxl, fontWeight: '800', color: '#1a0a2e' },
  profileInfo: { flex: 1, gap: spacing.xs },
  name: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text.primary, textAlign: 'right' },
  email: { fontSize: fontSize.sm, color: colors.text.muted, textAlign: 'right' },
  levelBadge: { alignSelf: 'flex-end', backgroundColor: 'rgba(255,215,0,0.1)', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  levelText: { fontSize: fontSize.xs, fontWeight: '700' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.bg.card, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.xs, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  rowLabel: { fontSize: fontSize.md, color: colors.text.secondary },
  rowValue: { fontSize: fontSize.md, color: colors.text.primary, fontWeight: '600' },
  joinSection: {
    marginTop: spacing.md, backgroundColor: colors.bg.card, borderRadius: radius.lg,
    padding: spacing.md, gap: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)',
  },
  joinTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text.primary, textAlign: 'right' },
  joinHint: { fontSize: fontSize.xs, color: colors.text.muted, textAlign: 'right' },
  joinRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  joinInput: {
    flex: 1, backgroundColor: '#1a0a2e', borderRadius: radius.md, padding: spacing.md,
    color: colors.gold.primary, fontSize: fontSize.lg, fontWeight: '900', letterSpacing: 4,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
  },
  joinBtn: {
    backgroundColor: colors.gold.primary, borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  joinBtnText: { color: '#1a0a2e', fontWeight: '800', fontSize: fontSize.sm },
  logoutBtn: {
    marginTop: spacing.lg, backgroundColor: 'rgba(244,67,54,0.15)',
    borderRadius: radius.lg, padding: spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(244,67,54,0.4)',
  },
  logoutText: { fontSize: fontSize.md, color: '#F44336', fontWeight: '700' },
});
