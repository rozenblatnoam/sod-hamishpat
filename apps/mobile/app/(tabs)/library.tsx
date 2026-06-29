// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { roomsApi } from '../../src/lib/api';
import { Room } from '../../src/shared';
import { colors, fontSize, spacing, radius } from '../../src/theme';

export default function LibraryScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    roomsApi.getAll().then((res) => setRooms(res.data)).catch(() => {});
  }, []);

  return (
    <LinearGradient colors={['#1a0a2e', '#2d1b4e']} style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>📚 ספריית לימוד</Text>
        <Text style={styles.subtitle}>כל הסוגיות במקום אחד</Text>

        {rooms.map((room) => (
          <TouchableOpacity
            key={room.id}
            style={styles.card}
            onPress={() => router.push(`/room/${room.id}`)}
          >
            <Text style={styles.roomTitle}>{room.titleHe}</Text>
            <Text style={styles.topic}>{room.topic}</Text>
            <Text style={styles.arrow}>←</Text>
          </TouchableOpacity>
        ))}
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
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomTitle: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'right',
  },
  topic: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginHorizontal: spacing.sm,
  },
  arrow: { fontSize: fontSize.lg, color: colors.gold.primary },
});
