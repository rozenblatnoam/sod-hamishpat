// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { authApi } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Button } from '../../src/components/ui/Button';
import { colors, fontSize, spacing, radius } from '../../src/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setToken } = useAuthStore();

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('שגיאה', 'יש למלא אימייל וסיסמה');
      return;
    }
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      setToken(res.data.token);
      setUser(res.data.user);
      if (res.data.user?.role === 'admin') {
        router.replace('/(admin)/stats');
      } else if (res.data.user?.role === 'teacher') {
        router.replace('/(teacher)/classes');
      } else {
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (!status) {
        Alert.alert('שגיאת רשת', `לא ניתן להתחבר לשרת\n${e?.message ?? ''}`);
      } else {
        Alert.alert('שגיאה', `פרטי כניסה שגויים (${status})`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <LinearGradient colors={['#1a0a2e', '#2d1b4e']} style={styles.bg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.escapeEn}>ESCAPE ROOM</Text>
          <Text style={styles.escapeHe}>חדר בריחה</Text>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerIcon}>⚖️</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>אימייל</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={colors.text.muted}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>סיסמה</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.text.muted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword((s) => !s)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.text.muted}
                />
              </TouchableOpacity>
            </View>

            <Button
              title="כניסה"
              onPress={handleLogin}
              isLoading={isLoading}
              style={styles.btn}
              size="lg"
            />

            <Button
              title="הרשמה"
              onPress={() => router.push('/(auth)/register')}
              variant="outline"
              style={styles.btn}
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logo: { width: 110, height: 110, marginBottom: spacing.sm, alignSelf: 'center' },
  escapeEn: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.gold.primary,
    letterSpacing: 6,
    textAlign: 'center',
    opacity: 0.85,
  },
  escapeHe: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,215,0,0.3)',
  },
  dividerIcon: { fontSize: 18 },
  form: { width: '100%', gap: spacing.sm },
  label: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'right',
  },
  input: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    textAlign: 'right',
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  passwordInput: {
    flex: 1,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: fontSize.md,
    textAlign: 'right',
  },
  eyeBtn: { paddingHorizontal: spacing.md },
  btn: { marginTop: spacing.sm },
});
