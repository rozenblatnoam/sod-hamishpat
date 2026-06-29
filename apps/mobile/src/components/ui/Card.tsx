// @ts-nocheck
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, shadow } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glow?: boolean;
}

export function Card({ children, style, glow = false }: CardProps) {
  return (
    <View style={[styles.card, glow && styles.glow, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.15)',
    ...shadow.card,
  },
  glow: {
    borderColor: colors.gold.primary,
    ...shadow.glow,
  },
});
