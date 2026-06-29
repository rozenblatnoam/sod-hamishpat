// @ts-nocheck
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { aiApi } from '../src/lib/api';
import { colors, fontSize, spacing, radius } from '../src/theme';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const SUGGESTED = [
  'מה זה שומר חינם?',
  'מהו סימן באבדה?',
  'מה ההבדל בין שואל לשוכר?',
  'מה הכלל באונאה?',
];

export default function AiJudgeScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'שלום! אני הדיין המסייע. אני כאן לעזור לך להבין סוגיות במשפט העברי. שאל אותי כל שאלה!' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  async function sendMessage(text?: string) {
    const q = text ?? input.trim();
    if (!q || isLoading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setIsLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const res = await aiApi.ask(q, 'משפט עברי - דיינים צעירים');
      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'מצטער, לא הצלחתי לענות כעת. נסה שוב.' },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  return (
    <LinearGradient colors={['#1a0a2e', '#2d1b4e']} style={styles.bg}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-forward" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>הדיין המסייע</Text>
          <Text style={styles.subtitle}>מופעל על ידי AI</Text>
        </View>
        <Text style={styles.avatar}>👨‍⚖️</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg, i) => (
            <View
              key={i}
              style={[
                styles.bubble,
                msg.role === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              {msg.role === 'assistant' && (
                <Text style={styles.aiLabel}>⚖️</Text>
              )}
              <Text
                style={[
                  styles.bubbleText,
                  msg.role === 'user' ? styles.userText : styles.aiText,
                ]}
              >
                {msg.text}
              </Text>
            </View>
          ))}
          {isLoading && (
            <View style={styles.aiBubble}>
              <ActivityIndicator size="small" color={colors.gold.primary} />
            </View>
          )}
        </ScrollView>

        {/* Suggestions */}
        {messages.length <= 2 && (
          <ScrollView
            horizontal
            contentContainerStyle={styles.suggestions}
            showsHorizontalScrollIndicator={false}
          >
            {SUGGESTED.map((s) => (
              <TouchableOpacity
                key={s}
                style={styles.suggestion}
                onPress={() => sendMessage(s)}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => sendMessage()}
            disabled={!input.trim() || isLoading}
          >
            <Ionicons
              name="send"
              size={20}
              color={input.trim() ? '#1a0a2e' : colors.text.muted}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="שאל את הדיין..."
            placeholderTextColor={colors.text.muted}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
          />
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'right',
  },
  subtitle: { fontSize: fontSize.xs, color: colors.text.muted, textAlign: 'right' },
  avatar: { fontSize: 36 },
  messages: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.lg },
  bubble: {
    maxWidth: '85%',
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  userBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.gold.dark,
  },
  aiBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.bg.card,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
  aiLabel: { fontSize: 16 },
  bubbleText: { fontSize: fontSize.md, lineHeight: 22, flex: 1 },
  userText: { color: '#1a0a2e', textAlign: 'left' },
  aiText: { color: colors.text.primary, textAlign: 'right' },
  suggestions: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  suggestion: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  suggestionText: { fontSize: fontSize.sm, color: colors.gold.primary },
  inputRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,215,0,0.1)',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gold.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg.card,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    fontSize: fontSize.md,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.2)',
  },
});
