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
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { authApi } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Button } from '../../src/components/ui/Button';
import { colors, fontSize, spacing, radius } from '../../src/theme';

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [school, setSchool] = useState('');
  const [className, setClassName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, setToken } = useAuthStore();

  async function handleRegister() {
    if (!name || !email || !password || !school || (role === 'student' && !className)) {
      Alert.alert('שגיאה', 'יש למלא את כל השדות');
      return;
    }
    if (!PASSWORD_RULE.test(password)) {
      Alert.alert('שגיאה', 'הסיסמה חייבת להכיל לפחות 6 תווים, עם אותיות ומספרים');
      return;
    }
    setIsLoading(true);
    try {
      const res = await authApi.register({
        name,
        email,
        password,
        school,
        class: role === 'student' ? className : undefined,
        role,
      });
      setToken(res.data.token);
      setUser(res.data.user);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('שגיאה', e.response?.data?.message ?? 'הרשמה נכשלה');
    } finally {
      setIsLoading(false);
    }
  }

  const fields: Array<{
    label: string;
    value: string;
    set: (v: string) => void;
    placeholder: string;
    keyboard?: 'default' | 'email-address';
  }> = [
    { label: 'שם מלא', value: name, set: setName, placeholder: 'ישראל ישראלי' },
    { label: 'אימייל', value: email, set: setEmail, placeholder: 'your@email.com', keyboard: 'email-address' },
    { label: 'בית ספר', value: school, set: setSchool, placeholder: 'שם בית הספר' },
    ...(role === 'student'
      ? [{ label: 'כיתה', value: className, set: setClassName, placeholder: "ז'1" }]
      : []),
  ];

  return (
    <LinearGradient colors={['#1a0a2e', '#2d1b4e']} style={styles.bg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>הרשמה</Text>
          <Text style={styles.subtitle}>הצטרף לדיינים הצעירים</Text>

          <View style={styles.form}>
            <Text style={styles.label}>נרשם בתור</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'student' && styles.roleBtnActive]}
                onPress={() => setRole('student')}
              >
                <Text style={[styles.roleText, role === 'student' && styles.roleTextActive]}>תלמיד</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, role === 'teacher' && styles.roleBtnActive]}
                onPress={() => setRole('teacher')}
              >
                <Text style={[styles.roleText, role === 'teacher' && styles.roleTextActive]}>מורה</Text>
              </TouchableOpacity>
            </View>

            {fields.map((f) => (
              <View key={f.label}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  style={styles.input}
                  value={f.value}
                  onChangeText={f.set}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.text.muted}
                  keyboardType={f.keyboard ?? 'default'}
                  autoCapitalize="none"
                />
              </View>
            ))}

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
            <Text style={styles.hint}>לפחות 6 תווים, כולל אותיות ומספרים</Text>

            <Button title="הרשמה" onPress={handleRegister} isLoading={isLoading} style={styles.btn} size="lg" />
            <Button title="כבר רשום? כניסה" onPress={() => router.back()} variant="ghost" size="md" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: spacing.xl, paddingTop: spacing.xxl },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.gold.primary, textAlign: 'center' },
  subtitle: { fontSize: fontSize.md, color: colors.text.secondary, marginBottom: spacing.xl, textAlign: 'center' },
  form: { gap: spacing.sm },
  label: { color: colors.text.secondary, fontSize: fontSize.sm, fontWeight: '600', textAlign: 'right' },
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
  roleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  roleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
    backgroundColor: colors.bg.card,
    alignItems: 'center',
  },
  roleBtnActive: {
    borderColor: colors.gold.primary,
    backgroundColor: 'rgba(255,215,0,0.15)',
  },
  roleText: { color: colors.text.secondary, fontWeight: '600', fontSize: fontSize.md },
  roleTextActive: { color: colors.gold.primary },
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
  hint: { color: colors.text.muted, fontSize: fontSize.xs, textAlign: 'right' },
  btn: { marginTop: spacing.sm },
});
