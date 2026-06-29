// @ts-nocheck
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, fontSize, spacing } from '../../theme';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  onPress,
  title,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
  size = 'md',
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        style={[styles.base, styles[size], style, isDisabled && styles.disabled]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#FFD700', '#CC9900']}
          style={[styles.gradient, styles[size]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {isLoading ? (
            <ActivityIndicator color="#1a0a2e" />
          ) : (
            <Text style={[styles.text, styles.primaryText, sizeText[size]]}>
              {title}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[size],
        variantStyles[variant],
        style,
        isDisabled && styles.disabled,
      ]}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.gold.primary} />
      ) : (
        <Text style={[styles.text, variantText[variant], sizeText[size]]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: { height: 36, paddingHorizontal: spacing.md },
  md: { height: 48, paddingHorizontal: spacing.lg },
  lg: { height: 56, paddingHorizontal: spacing.xl },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryText: { color: '#1a0a2e' },
  disabled: { opacity: 0.5 },
});

const variantStyles = StyleSheet.create({
  secondary: {
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: colors.gold.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.gold.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  primary: {},
});

const variantText = StyleSheet.create({
  secondary: { color: colors.gold.primary },
  outline: { color: colors.gold.primary },
  ghost: { color: colors.text.secondary },
  primary: { color: '#1a0a2e' },
});

const sizeText = StyleSheet.create({
  sm: { fontSize: fontSize.sm },
  md: { fontSize: fontSize.md },
  lg: { fontSize: fontSize.lg },
});
