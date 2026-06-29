// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/lib/api';
import { colors, fontSize, spacing, radius } from '../../src/theme';

const ROOM_ICONS = { 1: '🔍', 2: '🛡️', 3: '⚖️', 4: '🏘️', 5: '📜', 6: '🏛️' };

export default function AdminRoomsScreen() {
  const [rooms, setRooms] = useState([]);

  const load = useCallback(async () => {
    try {
      const r = await api.get('/admin/rooms');
      setRooms(r.data);
    } catch {}
  }, []);

  useEffect(() => { load(); }, []);

  async function toggleLock(room) {
    const next = !room.isLocked;
    Alert.alert(
      next ? 'נעילת חדר' : 'פתיחת חדר',
      `${next ? 'לנעול' : 'לפתוח'} את "${room.titleHe}"?`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: next ? 'נעל' : 'פתח', onPress: async () => {
            try {
              await api.patch(`/admin/rooms/${room.id}/lock`, { isLocked: next });
              load();
            } catch {
              Alert.alert('שגיאה', 'לא ניתן לשנות סטטוס');
            }
          }
        },
      ]
    );
  }

  return (
    <LinearGradient colors={['#0d0d0d', '#1a0000']} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🚪 ניהול חדרי בריחה</Text>
        <Text style={styles.hint}>לחץ על מנעול לפתיחה / נעילת חדר עבור כל המשתמשים</Text>

        {rooms.map((room) => (
          <View key={room.id} style={[styles.card, room.isLocked && styles.cardLocked]}>
            <TouchableOpacity style={styles.lockBtn} onPress={() => toggleLock(room)}>
              <Ionicons
                name={room.isLocked ? 'lock-closed' : 'lock-open'}
                size={24}
                color={room.isLocked ? '#FF5252' : '#4CAF50'}
              />
            </TouchableOpacity>

            <View style={styles.info}>
              <Text style={styles.roomTitle}>{ROOM_ICONS[room.order] ?? '🏠'} {room.titleHe}</Text>
              <Text style={styles.roomTopic}>{room.topic}</Text>
              <View style={[styles.badge, room.isLocked ? styles.badgeLocked : styles.badgeOpen]}>
                <Text style={styles.badgeText}>{room.isLocked ? 'נעול' : 'פתוח'}</Text>
              </View>
            </View>

            <Text style={styles.order}>#{room.order}</Text>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { padding: spacing.md, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: '#FF5252', textAlign: 'right', marginBottom: spacing.xs },
  hint: { fontSize: fontSize.xs, color: colors.text.muted, textAlign: 'right', marginBottom: spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: 'rgba(76,175,80,0.3)', gap: spacing.md },
  cardLocked: { borderColor: 'rgba(255,82,82,0.3)' },
  lockBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 4 },
  roomTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text.primary, textAlign: 'right' },
  roomTopic: { fontSize: fontSize.xs, color: colors.text.muted, textAlign: 'right' },
  badge: { alignSelf: 'flex-end', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  badgeOpen: { backgroundColor: 'rgba(76,175,80,0.2)' },
  badgeLocked: { backgroundColor: 'rgba(255,82,82,0.2)' },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.text.primary },
  order: { fontSize: 24, fontWeight: '900', color: '#333' },
});
