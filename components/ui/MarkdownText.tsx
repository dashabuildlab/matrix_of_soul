/**
 * MarkdownText — renders AI responses with proper formatting.
 * Handles **bold**, *italic*, ### headings, - bullets.
 * No raw markdown symbols are shown to the user.
 */
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing } from '../../constants/theme';

interface MarkdownTextProps {
  text: string;
  style?: object;
  color?: string;
  fontSize?: number;
  lineHeight?: number;
}

// ── Inline parser: **bold**, *italic*, `code` ─────────────────────────────
function parseInline(raw: string, base: object): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|`([^`\n]+)`)/g;
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) {
      nodes.push(<Text key={k++} style={base}>{raw.slice(last, m.index)}</Text>);
    }
    if (m[2] !== undefined) {
      nodes.push(<Text key={k++} style={[base, s.bold]}>{m[2]}</Text>);
    } else if (m[3] !== undefined) {
      nodes.push(<Text key={k++} style={[base, s.italic]}>{m[3]}</Text>);
    } else if (m[4] !== undefined) {
      nodes.push(<Text key={k++} style={[base, s.code]}>{m[4]}</Text>);
    }
    last = m.index + m[0].length;
  }
  if (last < raw.length) {
    nodes.push(<Text key={k++} style={base}>{raw.slice(last)}</Text>);
  }
  return nodes;
}

export function MarkdownText({
  text,
  style,
  color,
  fontSize,
  lineHeight,
}: MarkdownTextProps) {
  if (!text) return null;

  const textColor  = color      ?? Colors.textSecondary;
  const fSize      = fontSize   ?? FontSize.sm;
  const lHeight    = lineHeight ?? 21;
  const base       = { color: textColor, fontSize: fSize, lineHeight: lHeight };

  const lines = text.split('\n');

  return (
    <View style={style}>
      {lines.map((line, i) => {
        const t = line.trim();

        // Empty line → small spacer
        if (!t) return <View key={i} style={{ height: 6 }} />;

        // Heading: # / ## / ###
        const hMatch = t.match(/^#{1,3}\s+(.+)/);
        if (hMatch) {
          return (
            <Text key={i} style={[s.heading, { color: textColor, marginTop: i > 0 ? 8 : 0 }]}>
              {hMatch[1]}
            </Text>
          );
        }

        // Bullet: - or •
        const bMatch = t.match(/^[-•]\s+(.+)/);
        if (bMatch) {
          return (
            <View key={i} style={s.bulletRow}>
              <Text style={[base, s.bulletDot]}>•</Text>
              <Text style={[base, { flex: 1 }]}>
                {parseInline(bMatch[1], base)}
              </Text>
            </View>
          );
        }

        // Regular paragraph
        return (
          <Text key={i} style={base}>
            {parseInline(t, base)}
          </Text>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bold:      { fontWeight: '700' },
  italic:    { fontStyle: 'italic' },
  code: {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderRadius: 3,
  },
  heading: {
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
    alignItems: 'flex-start',
  },
  bulletDot: {
    fontWeight: '700',
    lineHeight: 21,
  },
});
