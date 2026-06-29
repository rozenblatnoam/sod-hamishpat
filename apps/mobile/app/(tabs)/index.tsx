// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useGameStore } from '../../src/store/useGameStore';
import { roomsApi, progressApi } from '../../src/lib/api';
import { ScoreBar } from '../../src/components/ui/ScoreBar';
import { RoomCard } from '../../src/components/game/RoomCard';
import { colors, fontSize, spacing } from '../../src/theme';
import { LEVEL_LABELS } from '../../src/shared';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { rooms, progress, setRooms, setProgress, getRoomProgress } = useGameStore();
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const [roomsRes, progressRes] = await Promise.all([
        roomsApi.getAll(),
        progressApi.getAll(),
      ]);
      setRooms(roomsRes.data);
      setProgress(progressRes.data);
    } catch {}
  }

  useEffect(() => { load(); }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function getRoomCompletion(room: (typeof rooms)[number]) {
    if (!room.totalCases) return 0;
    return Math.round((room.completedCount / room.totalCases) * 100);
  }

  if (!user) return null;

  return (
    <LinearGradient colors={['#1a0a2e', '#2d1b4e']} style={styles.bg}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold.primary}
          />
        }
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>שלום, {user.name} 👋</Text>
            <Text style={styles.schoolInfo}>
              {user.school} • כיתה {user.class}
            </Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Score */}
        <View style={styles.scoreCard}>
          <ScoreBar score={user.score} level={user.level} />
        </View>

        {/* Quick Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              const firstIncomplete = rooms.find((r) => !r.isLocked && getRoomCompletion(r) < 100);
              if (firstIncomplete) router.push(`/room/${firstIncomplete.id}`);
            }}
          >
            <LinearGradient colors={['#FFD700', '#CC9900']} style={styles.actionGrad}>
              <Ionicons name="play" size={20} color="#1a0a2e" />
              <Text style={styles.actionText}>המשך משחק</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionOutline]}
            onPress={() => router.push('/ai-judge')}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.gold.primary} />
            <Text style={[styles.actionText, { color: colors.gold.primary }]}>
              שאל את הדיין
            </Text>
          </TouchableOpacity>
        </View>

        {/* Rooms */}
        <Text style={styles.sectionTitle}>חדרי הארמון</Text>
        <View style={styles.roomsGrid}>
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              completionPercent={getRoomCompletion(room)}
              onPress={() => router.push(`/room/${room.id}`)}
            />
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  logoContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  logo: {
    width: 140,
    height: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  welcome: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'right',
  },
  schoolInfo: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
    textAlign: 'right',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gold.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: fontSize.lg, fontWeight: '700', color: '#1a0a2e' },
  scoreCard: {
    backgroundColor: colors.bg.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    height: 48,
  },
  actionGrad: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  actionOutline: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.gold.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  actionText: { fontSize: fontSize.sm, fontWeight: '700', color: '#1a0a2e' },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'right',
    marginBottom: spacing.sm,
  },
  roomsGrid: { gap: spacing.sm },
});
