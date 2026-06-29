// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/lib/api';
import { colors, fontSize, spacing, radius } from '../../src/theme';

export default function ManageScreen() {
  const [rooms, setRooms] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/teacher/rooms-overview').then((r) => setRooms(r.data)).catch(() => {});
  }, []);

  return (
    <LinearGradient colors={['#1a0a2e', '#2d1b4e']} style={s.bg}>
      <View style={s.header}>
        <Text style={s.headerTitle}>ניהול חדרים ותיקים</Text>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        {rooms.map((room) => (
          <View key={room.id} style={s.roomCard}>
            <TouchableOpacity
              style={s.roomRow}
              onPress={() => setExpanded(expanded === room.id ? null : room.id)}
            >
              <Ionicons
                name={expanded === room.id ? 'chevron-up' : 'chevron-down'}
                size={16} color={colors.text.muted}
              />
              <View style={s.roomInfo}>
                <Text style={s.roomTitle}>{room.titleHe}</Text>
                <Text style={s.roomMeta}>{room.lessonCount} שלבים · {room.caseCount} תיקים</Text>
              </View>
              <Text style={s.topic}>{room.topic}</Text>
            </TouchableOpacity>

            {expanded === room.id && (
              <View style={s.lessonsList}>
                {room.lessons.map((lesson, i) => (
                  <View key={lesson.id} style={s.lessonRow}>
                    <View style={s.lessonNum}>
                      <Text style={s.lessonNumText}>{i + 1}</Text>
                    </View>
                    <Text style={s.lessonTitle}>{lesson.title}</Text>
                  </View>
                ))}
              </View>
            )}
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
  roomCard: {
    backgroundColor: colors.bg.card, borderRadius: radius.lg, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.15)', overflow: 'hidden',
  },
  roomRow: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md,
  },
  roomInfo: { flex: 1 },
  roomTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text.primary, textAlign: 'right' },
  roomMeta: { fontSize: fontSize.xs, color: colors.text.muted, textAlign: 'right' },
  topic: { fontSize: fontSize.xs, color: colors.gold.primary },
  lessonsList: {
    borderTopWidth: 1, borderTopColor: 'rgba(255,215,0,0.1)',
    padding: spacing.md, gap: spacing.xs,
  },
  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 4 },
  lessonNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.gold.dark, alignItems: 'center', justifyContent: 'center',
  },
  lessonNumText: { fontSize: fontSize.xs, color: '#1a0a2e', fontWeight: '700' },
  lessonTitle: { flex: 1, color: colors.text.secondary, fontSize: fontSize.sm, textAlign: 'right' },
});
