// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/lib/api';
import { colors, fontSize, spacing, radius } from '../../src/theme';

export default function ClassesScreen() {
  const [classes, setClasses] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selected, setSelected] = useState(null);
  const [students, setStudents] = useState([]);

  const loadClasses = useCallback(async () => {
    try {
      const r = await api.get('/teacher/classes');
      setClasses(r.data);
    } catch {}
  }, []);

  useEffect(() => { loadClasses(); }, []);

  async function createClass() {
    if (!newName.trim()) return;
    try {
      await api.post('/teacher/classes', { name: newName.trim() });
      setNewName('');
      setShowCreate(false);
      loadClasses();
    } catch {
      Alert.alert('שגיאה', 'לא ניתן ליצור כיתה');
    }
  }

  function confirmDelete(id) {
    Alert.alert('מחיקת כיתה', 'האם למחוק את הכיתה?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחק', style: 'destructive', onPress: async () => {
        await api.delete(`/teacher/classes/${id}`).catch(() => {});
        loadClasses();
      }},
    ]);
  }

  async function openClass(cls) {
    setSelected(cls);
    try {
      const r = await api.get(`/teacher/classes/${cls.id}/students`);
      setStudents(r.data);
    } catch { setStudents([]); }
  }

  if (selected) {
    return (
      <LinearGradient colors={['#1a0a2e', '#2d1b4e']} style={s.bg}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => setSelected(null)} style={s.iconBtn}>
            <Ionicons name="arrow-forward" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{selected.name}</Text>
        </View>
        <View style={s.codeBox}>
          <Text style={s.codeLabel}>קוד הצטרפות לתלמידים</Text>
          <Text style={s.codeText}>{selected.code}</Text>
          <Text style={s.codeHint}>תלמידים מזינים קוד זה בהגדרות</Text>
        </View>
        <ScrollView contentContainerStyle={s.content}>
          {students.length === 0
            ? <Text style={s.empty}>אין תלמידים בכיתה עדיין</Text>
            : students.map((st) => (
              <View key={st.id} style={s.studentRow}>
                <View style={s.studentInfo}>
                  <Text style={s.studentName}>{st.name}</Text>
                  <Text style={s.studentLevel}>{st.level}</Text>
                </View>
                <View style={s.studentStats}>
                  <Text style={s.studentScore}>{st.score} נק'</Text>
                  <Text style={s.studentPct}>{st.progressPercent}%</Text>
                </View>
              </View>
            ))}
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a0a2e', '#2d1b4e']} style={s.bg}>
      <View style={s.header}>
        <Text style={s.headerTitle}>הכיתות שלי</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)} style={s.iconBtn}>
          <Ionicons name="add-circle" size={30} color={colors.gold.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {classes.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>👨‍🏫</Text>
            <Text style={s.empty}>אין כיתות עדיין</Text>
            <Text style={s.emptyHint}>לחץ + כדי ליצור כיתה ראשונה</Text>
          </View>
        ) : classes.map((cls) => (
          <TouchableOpacity key={cls.id} style={s.classCard} onPress={() => openClass(cls)}>
            <View style={s.classInfo}>
              <Text style={s.className}>{cls.name}</Text>
              <View style={s.codeRow}>
                <Text style={s.codeBadge}>{cls.code}</Text>
                <Text style={s.studentCount}>{cls.studentCount} תלמידים</Text>
              </View>
            </View>
            <View style={s.classActions}>
              <TouchableOpacity onPress={() => confirmDelete(cls.id)} style={s.iconBtn}>
                <Ionicons name="trash-outline" size={18} color="#e57373" />
              </TouchableOpacity>
              <Ionicons name="chevron-back" size={20} color={colors.text.muted} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>כיתה חדשה</Text>
            <TextInput
              style={s.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="שם הכיתה (למשל כיתה ז'1)"
              placeholderTextColor={colors.text.muted}
              textAlign="right"
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowCreate(false); setNewName(''); }}>
                <Text style={s.cancelText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.createBtn} onPress={createClass}>
                <Text style={s.createText}>צור</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, paddingTop: spacing.xxl,
  },
  headerTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text.primary, flex: 1, textAlign: 'right' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  emptyState: { alignItems: 'center', marginTop: 60, gap: spacing.sm },
  emptyEmoji: { fontSize: 64 },
  empty: { color: colors.text.muted, fontSize: fontSize.md, textAlign: 'center' },
  emptyHint: { color: colors.text.muted, fontSize: fontSize.sm, textAlign: 'center' },
  classCard: {
    backgroundColor: colors.bg.card, borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)',
  },
  classInfo: { flex: 1, gap: 6 },
  className: { fontSize: fontSize.md, fontWeight: '700', color: colors.text.primary, textAlign: 'right' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'flex-end' },
  codeBadge: {
    backgroundColor: 'rgba(255,215,0,0.15)', borderRadius: radius.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    color: colors.gold.primary, fontSize: fontSize.sm, fontWeight: '700', letterSpacing: 2,
  },
  studentCount: { color: colors.text.muted, fontSize: fontSize.xs },
  classActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  codeBox: {
    marginHorizontal: spacing.md, marginBottom: spacing.md,
    backgroundColor: 'rgba(255,215,0,0.08)', borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)',
  },
  codeLabel: { color: colors.text.muted, fontSize: fontSize.xs, marginBottom: 4 },
  codeText: { color: colors.gold.primary, fontSize: 32, fontWeight: '900', letterSpacing: 8 },
  codeHint: { color: colors.text.muted, fontSize: fontSize.xs, marginTop: 4 },
  studentRow: {
    backgroundColor: colors.bg.card, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center',
  },
  studentInfo: { flex: 1 },
  studentName: { color: colors.text.primary, fontSize: fontSize.md, fontWeight: '600', textAlign: 'right' },
  studentLevel: { color: colors.text.muted, fontSize: fontSize.xs, textAlign: 'right' },
  studentStats: { alignItems: 'flex-end', gap: 4 },
  studentScore: { color: colors.gold.primary, fontSize: fontSize.sm, fontWeight: '700' },
  studentPct: { color: colors.text.secondary, fontSize: fontSize.xs },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.lg },
  modal: {
    backgroundColor: '#1a0a2e', borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  input: {
    backgroundColor: colors.bg.card, borderRadius: radius.md, padding: spacing.md,
    color: colors.text.primary, fontSize: fontSize.md,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)',
  },
  modalBtns: { flexDirection: 'row', gap: spacing.md },
  cancelBtn: { flex: 1, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.bg.card, alignItems: 'center' },
  cancelText: { color: colors.text.muted },
  createBtn: { flex: 1, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.gold.primary, alignItems: 'center' },
  createText: { color: '#1a0a2e', fontWeight: '700' },
});
