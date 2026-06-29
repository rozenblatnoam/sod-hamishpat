// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { casesApi } from '../../src/lib/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Case, VerdictOption } from '../../src/shared';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { colors, fontSize, spacing, radius } from '../../src/theme';

const VERDICT_OPTIONS: Array<{ value: VerdictOption; label: string; icon: string; color: string }> = [
  { value: 'liable', label: 'חייב', icon: '⚖️', color: '#F44336' },
  { value: 'exempt', label: 'פטור', icon: '✅', color: '#4CAF50' },
  { value: 'partially_liable', label: 'חייב חלקית', icon: '🔄', color: '#FF9800' },
];

type Step = 'scenario' | 'investigate' | 'verdict' | 'result';

function CertificateModal({ visible, achievement, userName, onClose }) {
  if (!achievement) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={cert.overlay}>
        <LinearGradient colors={['#1a0a2e', '#2d1b4e', '#1a0a2e']} style={cert.bg}>
          {/* Decorative corners */}
          <Text style={cert.corner1}>✦</Text>
          <Text style={cert.corner2}>✦</Text>
          <Text style={cert.corner3}>✦</Text>
          <Text style={cert.corner4}>✦</Text>

          {/* Top border */}
          <View style={cert.topBorder}>
            <View style={cert.borderLine} />
            <Text style={cert.borderDiamond}>◆</Text>
            <View style={cert.borderLine} />
          </View>

          <Text style={cert.header}>בית הדין של דיינים צעירים</Text>
          <Text style={cert.subtitle}>מעניק בזאת</Text>

          <View style={cert.iconWrap}>
            <Text style={cert.icon}>{achievement.icon}</Text>
          </View>

          <Text style={cert.achievementTitle}>{achievement.titleHe}</Text>

          <View style={cert.divider}>
            <View style={cert.dividerLine} />
            <Text style={cert.dividerStar}>★</Text>
            <View style={cert.dividerLine} />
          </View>

          <Text style={cert.toLabel}>מוענק לכבוד</Text>
          <Text style={cert.userName}>{userName}</Text>

          <Text style={cert.forLabel}>על השלמת</Text>
          <Text style={cert.roomTitle}>{achievement.roomTitleHe}</Text>
          <Text style={cert.desc}>{achievement.description}</Text>

          {/* Bottom border */}
          <View style={cert.topBorder}>
            <View style={cert.borderLine} />
            <Text style={cert.borderDiamond}>◆</Text>
            <View style={cert.borderLine} />
          </View>

          <Text style={cert.seal}>חותמת בית הדין ⚖️</Text>

          <TouchableOpacity style={cert.closeBtn} onPress={onClose}>
            <Text style={cert.closeBtnText}>🎉 המשך</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

export default function CaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [step, setStep] = useState<Step>('scenario');
  const [verdict, setVerdict] = useState<VerdictOption | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showCert, setShowCert] = useState(false);

  useEffect(() => {
    if (!id) return;
    casesApi.getById(id).then((res) => setCaseData(res.data)).catch(() => {});
  }, [id]);

  async function handleSubmitVerdict() {
    if (!verdict || !reasoning.trim()) {
      Alert.alert('שגיאה', 'יש לבחור פסיקה ולנמק');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await casesApi.submitVerdict(id!, verdict, reasoning);
      setResult(res.data);
      setStep('result');
      if (res.data.roomCompleted && res.data.achievement) {
        setTimeout(() => setShowCert(true), 600);
      }
    } catch {
      Alert.alert('שגיאה', 'לא ניתן לשלוח את הפסיקה');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!caseData) return null;

  return (
    <LinearGradient colors={['#1a0a2e', '#2d1b4e']} style={styles.bg}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-forward" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{caseData.title}</Text>
      </View>

      <View style={styles.stepRow}>
        {(['scenario', 'investigate', 'verdict', 'result'] as Step[]).map((s, i) => (
          <View
            key={s}
            style={[styles.stepDot, step === s && styles.activeDot,
              (['scenario', 'investigate', 'verdict', 'result'] as Step[]).indexOf(step) > i && styles.doneDot]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 'scenario' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>📋 תיאור המקרה</Text>
            <Card>
              <Text style={styles.scenarioText}>{caseData.scenario}</Text>
            </Card>
            <Button title="חקור את המקרה" onPress={() => setStep('investigate')} style={styles.btn} />
          </View>
        )}

        {step === 'investigate' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>🔍 חקירה</Text>
            <Card>
              <Text style={styles.scenarioText}>{caseData.scenario}</Text>
            </Card>
            <TouchableOpacity
              style={styles.hintBtn}
              onPress={() => {
                setHintsUsed((h) => h + 1);
                Alert.alert('רמז', 'שים לב לסוג השומר ולנסיבות האחסנה');
              }}
            >
              <Ionicons name="bulb-outline" size={18} color={colors.gold.primary} />
              <Text style={styles.hintText}>רמז ({hintsUsed} בשימוש)</Text>
            </TouchableOpacity>
            <Button title="לפסיקה" onPress={() => setStep('verdict')} style={styles.btn} />
          </View>
        )}

        {step === 'verdict' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>⚖️ פסיקה</Text>
            <Text style={styles.verdictTitle}>מה פסיקתך?</Text>
            <View style={styles.verdictOptions}>
              {VERDICT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.verdictBtn, verdict === opt.value && { borderColor: opt.color, backgroundColor: `${opt.color}22` }]}
                  onPress={() => setVerdict(opt.value)}
                >
                  <Text style={styles.verdictIcon}>{opt.icon}</Text>
                  <Text style={[styles.verdictLabel, verdict === opt.value && { color: opt.color }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.reasoningLabel}>נמק את פסיקתך:</Text>
            <TextInput
              style={styles.reasoningInput}
              multiline
              numberOfLines={4}
              value={reasoning}
              onChangeText={setReasoning}
              placeholder="לדוגמה: הנתבע חייב כי..."
              placeholderTextColor={colors.text.muted}
              textAlignVertical="top"
            />
            <Button
              title="הגש פסיקה"
              onPress={handleSubmitVerdict}
              isLoading={isSubmitting}
              disabled={!verdict || !reasoning.trim()}
              style={styles.btn}
              size="lg"
            />
          </View>
        )}

        {step === 'result' && result && (
          <View style={styles.section}>
            <View style={[styles.resultBanner, result.correct ? styles.correct : styles.wrong]}>
              <Text style={styles.resultIcon}>{result.correct ? '🏆' : '❌'}</Text>
              <Text style={styles.resultTitle}>
                {result.correct ? 'פסיקה נכונה!' : 'פסיקה שגויה'}
              </Text>
              {result.correct && hintsUsed === 0 && (
                <Text style={styles.bonusText}>+ בונוס ללא רמז!</Text>
              )}
            </View>

            {result.roomCompleted && !result.achievement && (
              <View style={styles.escapeBanner}>
                <Text style={styles.escapeEmoji}>🎉</Text>
                <Text style={styles.escapeTitle}>בריחה מוצלחת!</Text>
                <Text style={styles.escapeSubtitle}>השלמת את כל התיקים בחדר הזה</Text>
              </View>
            )}

            {result.roomCompleted && result.achievement && (
              <TouchableOpacity style={styles.certPreview} onPress={() => setShowCert(true)}>
                <Text style={styles.certPreviewIcon}>{result.achievement.icon}</Text>
                <View style={styles.certPreviewText}>
                  <Text style={styles.certPreviewTitle}>הישג חדש! {result.achievement.titleHe}</Text>
                  <Text style={styles.certPreviewSub}>לחץ לצפייה בתעודה</Text>
                </View>
                <Ionicons name="chevron-back" size={20} color={colors.gold.primary} />
              </TouchableOpacity>
            )}

            <Card>
              <Text style={styles.explanationLabel}>הסבר:</Text>
              <Text style={styles.explanationText}>{result.explanation}</Text>
            </Card>

            <Button
              title={result.roomCompleted ? 'חזרה לחדרים' : 'חזור לשלבים'}
              onPress={() => (result.roomCompleted ? router.push('/(tabs)') : router.back())}
              variant="secondary"
              style={styles.btn}
            />
          </View>
        )}
      </ScrollView>

      <CertificateModal
        visible={showCert}
        achievement={result?.achievement}
        userName={user?.name ?? ''}
        onClose={() => {
          setShowCert(false);
          router.push('/(tabs)');
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, paddingTop: spacing.xxl, gap: spacing.md },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: fontSize.xl, fontWeight: '700', color: colors.text.primary, textAlign: 'right' },
  stepRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.md },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.bg.card, borderWidth: 1, borderColor: colors.text.muted },
  activeDot: { backgroundColor: colors.gold.primary, borderColor: colors.gold.primary },
  doneDot: { backgroundColor: colors.accent.green, borderColor: colors.accent.green },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  section: { gap: spacing.md },
  sectionLabel: { fontSize: fontSize.lg, fontWeight: '700', color: colors.gold.primary, textAlign: 'right' },
  scenarioText: { fontSize: fontSize.md, color: colors.text.primary, lineHeight: 26, textAlign: 'right' },
  btn: { marginTop: spacing.sm },
  hintBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-end', backgroundColor: 'rgba(255,215,0,0.1)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  hintText: { fontSize: fontSize.sm, color: colors.gold.primary },
  verdictTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text.primary, textAlign: 'right' },
  verdictOptions: { flexDirection: 'row', gap: spacing.sm },
  verdictBtn: { flex: 1, backgroundColor: colors.bg.card, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', gap: spacing.xs, borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' },
  verdictIcon: { fontSize: 28 },
  verdictLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text.secondary },
  reasoningLabel: { fontSize: fontSize.md, fontWeight: '600', color: colors.text.secondary, textAlign: 'right' },
  reasoningInput: { backgroundColor: colors.bg.card, borderRadius: radius.md, padding: spacing.md, color: colors.text.primary, fontSize: fontSize.md, borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)', minHeight: 120, textAlign: 'right' },
  resultBanner: { borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', gap: spacing.sm },
  correct: { backgroundColor: 'rgba(76,175,80,0.2)', borderWidth: 1, borderColor: '#4CAF50' },
  wrong: { backgroundColor: 'rgba(244,67,54,0.2)', borderWidth: 1, borderColor: '#F44336' },
  resultIcon: { fontSize: 48 },
  resultTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text.primary },
  bonusText: { fontSize: fontSize.sm, color: colors.gold.primary, fontWeight: '700' },
  escapeBanner: { alignItems: 'center', padding: spacing.md, borderRadius: radius.lg, backgroundColor: 'rgba(76,175,80,0.15)', borderWidth: 1, borderColor: '#4CAF50', gap: 4 },
  escapeEmoji: { fontSize: 40 },
  escapeTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text.primary },
  escapeSubtitle: { fontSize: fontSize.sm, color: colors.text.secondary },
  certPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,215,0,0.1)', borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)', gap: spacing.md },
  certPreviewIcon: { fontSize: 36 },
  certPreviewText: { flex: 1 },
  certPreviewTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.gold.primary, textAlign: 'right' },
  certPreviewSub: { fontSize: fontSize.xs, color: colors.text.muted, textAlign: 'right' },
  explanationLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gold.primary, textAlign: 'right', marginBottom: spacing.xs },
  explanationText: { fontSize: fontSize.md, color: colors.text.primary, lineHeight: 24, textAlign: 'right' },
});

const cert = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  bg: { width: '100%', borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.sm, borderWidth: 2, borderColor: 'rgba(255,215,0,0.5)', position: 'relative' },
  corner1: { position: 'absolute', top: 10, right: 12, color: colors.gold.primary, fontSize: 20 },
  corner2: { position: 'absolute', top: 10, left: 12, color: colors.gold.primary, fontSize: 20 },
  corner3: { position: 'absolute', bottom: 10, right: 12, color: colors.gold.primary, fontSize: 20 },
  corner4: { position: 'absolute', bottom: 10, left: 12, color: colors.gold.primary, fontSize: 20 },
  topBorder: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: spacing.sm },
  borderLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,215,0,0.4)' },
  borderDiamond: { color: colors.gold.primary, fontSize: 12 },
  header: { fontSize: fontSize.sm, fontWeight: '700', color: colors.gold.primary, textAlign: 'center', letterSpacing: 1 },
  subtitle: { fontSize: fontSize.xs, color: colors.text.secondary, textAlign: 'center' },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,215,0,0.1)', borderWidth: 2, borderColor: 'rgba(255,215,0,0.5)', alignItems: 'center', justifyContent: 'center', marginVertical: spacing.xs },
  icon: { fontSize: 44 },
  achievementTitle: { fontSize: fontSize.xl, fontWeight: '900', color: colors.gold.primary, textAlign: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', width: '80%', gap: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,215,0,0.3)' },
  dividerStar: { color: colors.gold.primary, fontSize: 14 },
  toLabel: { fontSize: fontSize.xs, color: colors.text.muted, textAlign: 'center' },
  userName: { fontSize: fontSize.xxl, fontWeight: '900', color: colors.text.primary, textAlign: 'center' },
  forLabel: { fontSize: fontSize.xs, color: colors.text.muted, textAlign: 'center', marginTop: spacing.xs },
  roomTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  desc: { fontSize: fontSize.xs, color: colors.text.secondary, textAlign: 'center', paddingHorizontal: spacing.md },
  seal: { fontSize: fontSize.xs, color: 'rgba(255,215,0,0.5)', textAlign: 'center', fontStyle: 'italic' },
  closeBtn: { marginTop: spacing.sm, backgroundColor: colors.gold.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.full },
  closeBtnText: { color: '#1a0a2e', fontWeight: '900', fontSize: fontSize.md },
});
