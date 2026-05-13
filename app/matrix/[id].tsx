import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { getEnergyById } from '../../constants/energies';
import { askClaude } from '../../lib/claude';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../stores/useAppStore';
import { MatrixDiagram } from '../../components/matrix/MatrixDiagram';
import { type MatrixData } from '../../lib/matrix-calc';
import { MarkdownText } from '../../components/ui/MarkdownText';

const { width } = Dimensions.get('window');

// Human-readable label for each node key
const NODE_LABELS: Record<string, string> = {
  center:   'Особистість',
  left_0:   'Початок шляху · 0 р.',
  left_1:   'Лівий вектор',
  left_2:   'Духовне',
  left_3:   'Духовне → Центр',
  right_0:  'Зрілість · 40 р.',
  right_1:  'Правий вектор',
  right_2:  'Матеріальне',
  right_3:  'Матеріальне → Центр',
  top_0:    'Молодість · 20 р.',
  top_1:    'Верхній вектор',
  top_2:    'Верхній вектор',
  top_3:    'Верхній → Центр',
  bot_0:    'Мудрість · 60 р.',
  bot_1:    'Нижній вектор',
  bot_2:    'Кармічний хвіст',
  bot_3:    'Нижній → Центр',
  topLeft:  'Талант від Бога · 10 р.',
  topRight: 'Талант від Роду · 30 р.',
  botRight: 'Призначення · 50 р.',
  botLeft:  'Батьківська карма · 70 р.',
};

// AI analysis sections config
const ANALYSIS_SECTIONS = [
  { key: 'Характер та особистість', icon: 'person-circle-outline' as const,       color: '#818CF8' },
  { key: 'Природні таланти',        icon: 'star-outline' as const,                 color: '#F5C542' },
  { key: 'Призначення та місія',    icon: 'compass-outline' as const,              color: '#10B981' },
  { key: 'Виклики та карма',        icon: 'alert-circle-outline' as const,         color: '#F97316' },
  { key: 'Кохання та стосунки',     icon: 'heart-outline' as const,                color: '#EC4899' },
  { key: 'Кар\'єра та реалізація',  icon: 'briefcase-outline' as const,            color: '#3B82F6' },
  { key: 'Духовний шлях',           icon: 'sparkles-outline' as const,             color: '#A78BFA' },
];

interface NodeModal { key: string; value: number }

function buildPrompt(matrix: MatrixData): string {
  const e = (n: number) => {
    const en = getEnergyById(n);
    return `${n} "${en?.name ?? n}"`;
  };
  return `Проведи детальний езотеричний аналіз матриці долі. Пиши теплою, натхненною, особистою мовою українською. Без markdown розмітки, без зірочок, без дефісів на початку речень.

Матриця долі людини:
Особистість (центр): ${e(matrix.personality)}
Душа: ${e(matrix.soul)}
Доля: ${e(matrix.destiny)}
Духовне начало: ${e(matrix.spiritual)}
Матеріальне начало: ${e(matrix.material)}
Талант від Бога (10 р.): ${e(matrix.talentFromGod)}
Талант від Роду (30 р.): ${e(matrix.talentFromFamily)}
Призначення (50 р.): ${e(matrix.purpose)}
Батьківська карма (70 р.): ${e(matrix.parentKarma)}
Кармічний хвіст: ${e(matrix.karmicTail)}

Напиши розгорнутий аналіз. Кожен розділ починай ТОЧНО з маркера §Назва§ (без пробілів навколо §), потім одразу текст (4-5 речень). Між розділами один порожній рядок.

Розділи строго в такому порядку:
§Характер та особистість§
§Природні таланти§
§Призначення та місія§
§Виклики та карма§
§Кохання та стосунки§
§Кар'єра та реалізація§
§Духовний шлях§`;
}

function parseAnalysis(raw: string): Array<{ title: string; text: string }> {
  const parts = raw.split(/§([^§]+)§/).filter(Boolean);
  const result: Array<{ title: string; text: string }> = [];
  for (let i = 0; i < parts.length - 1; i += 2) {
    result.push({ title: parts[i].trim(), text: parts[i + 1].trim() });
  }
  return result;
}

export default function MatrixDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useI18n();
  const destinyMatrix    = useAppStore((s) => s.destinyMatrix);
  const savedMatrices    = useAppStore((s) => s.savedMatrices);
  const matrixAnalyses   = useAppStore((s) => s.matrixAnalyses);
  const setMatrixAnalysis = useAppStore((s) => s.setMatrixAnalysis);

  const matrix =
    destinyMatrix?.id === id
      ? destinyMatrix
      : savedMatrices.find((m) => m.id === id);

  const [modal, setModal] = useState<NodeModal | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const analysisRaw = matrix ? (matrixAnalyses[matrix.id] ?? null) : null;
  const analysisSections = analysisRaw ? parseAnalysis(analysisRaw) : [];

  // ── Generate analysis on first open ──────────────────────────────────────
  useEffect(() => {
    if (!matrix || analysisRaw || analysisLoading) return;
    setAnalysisLoading(true);
    askClaude(
      'You are an esoteric analyst of the destiny matrix.',
      [],
      buildPrompt(matrix.data),
      1800,
      locale,
    )
      .then((text) => {
        setMatrixAnalysis(matrix.id, text);
      })
      .catch(() => {
        setMatrixAnalysis(matrix.id, ''); // mark as attempted so we don't retry forever
      })
      .finally(() => setAnalysisLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matrix?.id]);

  if (!matrix) {
    return (
      <View style={styles.root}>
        <Text style={styles.notFound}>Матрицю не знайдено</Text>
      </View>
    );
  }

  const diagramSize = width - Spacing.lg * 2;
  const energy   = modal ? getEnergyById(modal.value) : null;
  const nodeLabel = modal ? (NODE_LABELS[modal.key] ?? modal.key) : '';

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header — centered */}
        <Text style={styles.title}>{matrix.name}</Text>
        <Text style={styles.birthDate}>{matrix.birthDate}</Text>

        {/* Hint */}
        <View style={styles.hintRow}>
          <Ionicons name="hand-left-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.hintText}>Натисніть на кулю, щоб дізнатися її значення</Text>
        </View>

        {/* Matrix diagram */}
        <LinearGradient
          colors={['#1E1B4B', '#0A0A1A']}
          style={styles.diagramWrap}
        >
          <MatrixDiagram
            data={matrix.data}
            size={diagramSize}
            selectedNode={modal?.key}
            onNodePress={(key, value) =>
              setModal((prev) => prev?.key === key ? null : { key, value })
            }
          />
        </LinearGradient>

        {/* ── AI Analysis ── */}
        <View style={styles.analysisHeader}>
          <Ionicons name="sparkles" size={20} color={Colors.accent} />
          <Text style={styles.analysisTitle}>Детальний аналіз від ШІ</Text>
        </View>

        {analysisLoading && (
          <View style={styles.analysisLoading}>
            <ActivityIndicator color={Colors.primary} size="small" />
            <Text style={styles.analysisLoadingText}>Аналізуємо вашу матрицю долі...</Text>
          </View>
        )}

        {!analysisLoading && analysisSections.length === 0 && analysisRaw === '' && (
          <View style={styles.analysisError}>
            <Ionicons name="cloud-offline-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.analysisErrorText}>Не вдалося згенерувати аналіз. Перевірте з'єднання.</Text>
          </View>
        )}

        {analysisSections.map((section) => {
          const cfg = ANALYSIS_SECTIONS.find((s) => s.key === section.title)
            ?? { icon: 'ellipse-outline' as const, color: Colors.primary };
          return (
            <View key={section.title} style={styles.sectionCard}>
              <LinearGradient
                colors={[`${cfg.color}18`, `${cfg.color}08`]}
                style={styles.sectionCardInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.sectionCardHeader}>
                  <View style={[styles.sectionIconWrap, { backgroundColor: `${cfg.color}22`, borderColor: `${cfg.color}44` }]}>
                    <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                  </View>
                  <Text style={[styles.sectionCardTitle, { color: cfg.color }]}>{section.title}</Text>
                </View>
                <MarkdownText
                  text={section.text}
                  color={Colors.textSecondary}
                  fontSize={FontSize.sm}
                  lineHeight={21}
                />
              </LinearGradient>
            </View>
          );
        })}

        {/* Bottom padding */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Node explanation modal ── */}
      <Modal
        visible={modal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setModal(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setModal(null)}
        />

        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHandle} />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setModal(null)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {modal && energy && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalContent}
            >
              {/* Badge + title */}
              <LinearGradient
                colors={['#1E1B4B', '#312E81']}
                style={styles.modalBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.modalEnergyNum}>{modal.value}</Text>
              </LinearGradient>
              <Text style={styles.modalLabel}>{nodeLabel}</Text>
              <Text style={styles.modalEnergyName}>{energy.name}</Text>
              <View style={styles.modalKeywordsRow}>
                {energy.keywords.slice(0, 4).map((kw) => (
                  <View key={kw} style={styles.kw}>
                    <Text style={styles.kwText}>{kw}</Text>
                  </View>
                ))}
              </View>

              {/* Positive */}
              <View style={styles.modalSection}>
                <View style={styles.modalSectionHeader}>
                  <Ionicons name="arrow-up-circle" size={16} color={Colors.success} />
                  <Text style={[styles.modalSectionTitle, { color: Colors.success }]}>Сильні сторони</Text>
                </View>
                <Text style={styles.modalSectionText}>{energy.positive}</Text>
              </View>

              {/* Negative */}
              <View style={styles.modalSection}>
                <View style={styles.modalSectionHeader}>
                  <Ionicons name="arrow-down-circle" size={16} color={Colors.error} />
                  <Text style={[styles.modalSectionTitle, { color: Colors.error }]}>Виклики</Text>
                </View>
                <Text style={styles.modalSectionText}>{energy.negative}</Text>
              </View>

              {/* Advice */}
              <View style={[styles.modalSection, styles.modalAdvice]}>
                <View style={styles.modalSectionHeader}>
                  <Ionicons name="bulb-outline" size={16} color={Colors.accent} />
                  <Text style={[styles.modalSectionTitle, { color: Colors.accent }]}>Порада</Text>
                </View>
                <Text style={styles.modalSectionText}>{energy.advice}</Text>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 60 },

  notFound: {
    color: Colors.textMuted,
    fontSize: FontSize.lg,
    textAlign: 'center',
    marginTop: 80,
  },

  // Header — centered
  title: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 2,
  },
  birthDate: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },

  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
  },
  hintText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },

  diagramWrap: {
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },

  // ── AI Analysis ──
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  analysisTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  analysisLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    justifyContent: 'center',
  },
  analysisLoadingText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  analysisError: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  analysisErrorText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },

  sectionCard: {
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  sectionCardInner: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    flex: 1,
  },
  sectionCardText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 21,
  },

  // ── Modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: '#12083A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    maxHeight: '65%',
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    position: 'relative',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: Spacing.sm,
  },
  modalClose: {
    position: 'absolute',
    right: Spacing.lg,
    top: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(139,92,246,0.5)',
    marginBottom: 4,
  },
  modalEnergyNum: {
    color: Colors.accent,
    fontSize: 28,
    fontWeight: '900',
  },
  modalLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  modalEnergyName: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 2,
  },
  modalKeywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginVertical: Spacing.sm,
  },
  kw: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  kwText: { color: Colors.primaryLight, fontSize: FontSize.xs, fontWeight: '600' },

  modalSection: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    gap: 6,
  },
  modalAdvice: {
    borderColor: 'rgba(245,197,66,0.2)',
    backgroundColor: 'rgba(245,197,66,0.05)',
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  modalSectionText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
