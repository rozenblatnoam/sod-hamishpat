// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/lib/api';
import { colors, fontSize, spacing, radius } from '../../src/theme';

const ROLE_LABEL = { student: 'תלמיד', teacher: 'מורה', admin: 'מנהל' };
const ROLE_COLOR = { student: '#4CAF50', teacher: '#2196F3', admin: '#FF5252' };
const ROLES = ['student', 'teacher', 'admin'];

export default function AdminUsersScreen() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await api.get('/admin/users');
      setUsers(r.data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, []);

  async function changeRole(user, role) {
    if (user.role === role) return;
    Alert.alert('שינוי תפקיד', `לשנות את ${user.name} ל-${ROLE_LABEL[role]}?`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'שנה', onPress: async () => {
          try {
            await api.patch(`/admin/users/${user.id}/role`, { role });
            load();
          } catch (e) {
            Alert.alert('שגיאה', e?.response?.data?.message ?? 'נכשל');
          }
        }
      },
    ]);
  }

  async function deleteUser(user) {
    Alert.alert('מחיקת משתמש', `למחוק את ${user.name} לצמיתות?`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/admin/users/${user.id}`);
            load();
          } catch (e) {
            Alert.alert('שגיאה', e?.response?.data?.message ?? 'נכשל');
          }
        }
      },
    ]);
  }

  async function resetProgress(user) {
    Alert.alert('איפוס התקדמות', `לאפס את כל ההתקדמות והניקוד של ${user.name}?`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'אפס', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/admin/users/${user.id}/progress`);
            Alert.alert('בוצע', 'ההתקדמות אופסה');
            load();
          } catch {
            Alert.alert('שגיאה', 'נכשל');
          }
        }
      },
    ]);
  }

  const filtered = users.filter(u =>
    u.name?.includes(search) || u.email?.includes(search)
  );

  return (
    <LinearGradient colors={['#0d0d0d', '#1a0000']} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>👥 ניהול משתמשים</Text>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="חיפוש לפי שם או אימייל..."
          placeholderTextColor={colors.text.muted}
          textAlign="right"
        />
        <Text style={styles.count}>{filtered.length} משתמשים</Text>

        {filtered.map((u) => (
          <View key={u.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => resetProgress(u)}>
                  <Ionicons name="refresh" size={18} color="#FF9800" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => deleteUser(u)}>
                  <Ionicons name="trash" size={18} color="#FF5252" />
                </TouchableOpacity>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{u.name}</Text>
                <Text style={styles.userEmail}>{u.email}</Text>
              </View>
            </View>

            <View style={styles.rolePicker}>
              {ROLES.map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleBtn, u.role === role && { backgroundColor: ROLE_COLOR[role] + '33', borderColor: ROLE_COLOR[role] }]}
                  onPress={() => changeRole(u, role)}
                >
                  <Text style={[styles.roleBtnText, u.role === role && { color: ROLE_COLOR[role] }]}>
                    {ROLE_LABEL[role]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.footerScore}>{u.score} נק'</Text>
              <Text style={styles.footerSchool}>{u.school || '—'}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { padding: spacing.md, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: '#FF5252', textAlign: 'right', marginBottom: spacing.md },
  search: { backgroundColor: '#1a1a1a', borderRadius: radius.md, padding: spacing.md, color: colors.text.primary, fontSize: fontSize.md, borderWidth: 1, borderColor: 'rgba(255,82,82,0.2)', marginBottom: spacing.xs },
  count: { fontSize: fontSize.xs, color: colors.text.muted, textAlign: 'right', marginBottom: spacing.md },
  card: { backgroundColor: '#1a1a1a', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: 'rgba(255,82,82,0.15)', gap: spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userInfo: { flex: 1, alignItems: 'flex-end' },
  userName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text.primary },
  userEmail: { fontSize: fontSize.xs, color: colors.text.muted },
  actions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  rolePicker: { flexDirection: 'row', gap: spacing.xs },
  roleBtn: { flex: 1, paddingVertical: spacing.xs, borderRadius: radius.sm, alignItems: 'center', backgroundColor: '#2a2a2a', borderWidth: 1, borderColor: 'transparent' },
  roleBtnText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.text.muted },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  footerScore: { fontSize: fontSize.sm, fontWeight: '700', color: '#FF5252' },
  footerSchool: { fontSize: fontSize.xs, color: colors.text.muted },
});
