// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/lib/api';
import { colors, fontSize, spacing, radius } from '../../src/theme';

export default function ProgressScreen() {
  const [classes, setClasses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    api.get('/teacher/classes').then((r) => {
      setClasses(r.data);
      if (r.data.length > 0) setSelectedId(r.data[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    api.get(`/teacher/classes/${selectedId}/students`)
      .then((r) => setStudents(r.data))
      .catch(() => setStudents([]));
  }, [selectedId]);

  return (
    <LinearGradient colors={['#1a0a2e', '#2d1b4e']} style={s.bg}>
      <View style={s.header}>
        <Text style={s.headerTitle}>מעקב התקדמות</Text>
      </View>

      {classes.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={s.tabs} contentContainerStyle={s.tabsContent}>
          {classes.map((cls) => (
            <TouchableOpacity
              key={cls.id}
              style={[s.tab, selectedId === cls.id && s.tabActive]}
              onPress={() => setSelectedId(cls.id)}
            >
              <Text style={[s.tabText, selectedId === cls.id && s.tabTextActive]}>
                {cls.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView contentContainerStyle={s.content}>
        {classes.length === 0 && (
          <Text style={s.empty}>צור כיתה תחילה בלשונית "כיתות"</Text>
        )}
        {students.map((st) => (
          <View key={st.id} style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.level}>{st.level}</Text>
              <Text style={s.name}>{st.name}</Text>
            </View>
            <View style={s.barBg}>
              <View style={[s.barFill, { width: `${st.progressPercent}%` }]} />
            </View>
            <View style={s.cardFooter}>
              <Text style={s.rooms}>{st.completedRooms} חדרים הושלמו</Text>
              <Text style={s.pct}>{st.progressPercent}% הושלם</Text>
            </View>
          </View>
        ))}
        {selectedId && students.length === 0 && (
          <Text style={s.empty}>אין תלמידים בכיתה זו</Text>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  header: { padding: spacing.md, paddingTop: spacing.xxl },
  headerTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text.primary, textAlign: 'right' },
  tabs: { maxHeight: 48 },
  tabsContent: { paddingHorizontal: spacing.md, gap: spacing.sm, alignItems: 'center' },
  tab: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.lg, backgroundColor: colors.bg.card },
  tabActive: { backgroundColor: colors.gold.dark },
  tabText: { color: colors.text.muted, fontSize: fontSize.sm },
  tabTextActive: { color: '#1a0a2e', fontWeight: '700' },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  empty: { color: colors.text.muted, textAlign: 'center', marginTop: 60, fontSize: fontSize.md },
  card: {
    backgroundColor: colors.bg.card, borderRadius: radius.lg, padding: spacing.md,
    marginBottom: spacing.sm, gap: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.1)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.text.primary },
  level: { fontSize: fontSize.xs, color: colors.text.muted },
  barBg: { height: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, backgroundColor: colors.gold.primary, borderRadius: 5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  pct: { fontSize: fontSize.xs, color: colors.gold.primary, fontWeight: '700' },
  rooms: { fontSize: fontSize.xs, color: colors.text.muted },
});
