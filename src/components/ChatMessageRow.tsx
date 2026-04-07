import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ThemeColors } from '../theme';

export type ChatMessageRowProps = {
  colors: ThemeColors;
  text: string;
  timeLabel: string;
  /** Сообщение текущего пользователя (справа, акцентный фон) */
  isMine: boolean;
  /** Кто написал: «Вы», «Администратор», имя ученика и т.д. */
  senderLabel: string;
};

export function ChatMessageRow({ colors, text, timeLabel, isMine, senderLabel }: ChatMessageRowProps) {
  const s = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={s.outer}>
      <View style={[s.inner, isMine ? s.innerMine : s.innerOther]}>
        <Text style={[s.caption, isMine ? s.captionMine : s.captionOther]}>{senderLabel}</Text>
        <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleOther]}>
          <Text style={isMine ? s.textMine : s.textOther}>{text}</Text>
          <Text style={[s.time, isMine ? s.timeMine : s.timeOther]}>{timeLabel}</Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    outer: {
      width: '100%',
      marginBottom: 12,
      paddingHorizontal: 2,
    },
    inner: {
      maxWidth: '88%',
    },
    innerMine: {
      alignSelf: 'flex-end',
    },
    innerOther: {
      alignSelf: 'flex-start',
    },
    caption: {
      fontSize: 11,
      fontWeight: '700',
      marginBottom: 5,
      letterSpacing: 0.35,
    },
    captionMine: {
      color: colors.link,
      textAlign: 'right',
    },
    captionOther: {
      color: colors.textMuted,
      textAlign: 'left',
    },
    bubble: {
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 16,
    },
    bubbleMine: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 5,
    },
    bubbleOther: {
      backgroundColor: colors.chip,
      borderWidth: 1,
      borderColor: colors.border,
      borderBottomLeftRadius: 5,
    },
    textMine: {
      color: colors.onPrimary,
      fontSize: 16,
      lineHeight: 22,
    },
    textOther: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 22,
    },
    time: {
      marginTop: 6,
      fontSize: 11,
    },
    timeMine: {
      color: 'rgba(255,255,255,0.88)',
    },
    timeOther: {
      color: colors.textMuted,
    },
  });
}
