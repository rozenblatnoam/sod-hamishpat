// @ts-nocheck
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Room } from '../../shared';
import { colors, fontSize, spacing, radius, shadow } from '../../theme';

const ROOM_ICONS: Record<number, string> = {
  1: '🔍',
  2: '🛡️',
  3: '⚖️',
  4: '🏘️',
  5: '📜',
  6: '🏛️',
};

const ROOM_GRADIENTS: Record<number, [string, string]> = {
  1: ['#1a3a6e', '#0d2040'],
  2: ['#1a4a2e', '#0d2a18'],
  3: ['#4a1a1a', '#2a0d0d'],
  4: ['#2a3a1a', '#182210'],
  5: ['#3a2a1a', '#221810'],
  6: ['#3a1a4a', '#200d30'],
};

interface RoomCardProps {
  room: Room;
  completionPercent: number;
  onPress: () => void;
}

export function RoomCard({ room, completionPercent, onPress }: RoomCardProps) {
  const isLocked = room.isLocked;
  const gradient = ROOM_GRADIENTS[room.order] ?? ['#2d1b4e', '#1a0a2e'];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLocked}
      activeOpacity={0.85}
      style={[styles.container, isLocked && styles.locked]}
    >
      <LinearGradient colors={gradient} style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.emoji}>{ROOM_ICONS[room.order] ?? '🚪'}</Text>
          <Text style={styles.order}>חדר {room.order}</Text>
          {isLocked && (
            <Ionicons name="lock-closed" size={18} color={colors.text.muted} />
          )}
        </View>

        <Text style={styles.title}>{room.titleHe}</Text>
        <Text style={styles.topic}>{room.topic}</Text>

        {!isLocked && (
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${completionPercent}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{completionPercent}%</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    ...shadow.card,
  },
  locked: { opacity: 0.5 },
  gradient: { padding: spacing.md, gap: spacing.xs },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  emoji: { fontSize: 28 },
  order: { fontSize: fontSize.xs, color: colors.text.muted, flex: 1, marginLeft: spacing.xs },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'right',
  },
  topic: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'right',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.gold.primary,
    borderRadius: radius.full,
  },
  progressText: { fontSize: fontSize.xs, color: colors.gold.primary, minWidth: 32 },
});
