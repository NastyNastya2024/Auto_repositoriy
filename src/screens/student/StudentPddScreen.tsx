import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PDD_QUESTIONS } from '../../data/pdd';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeColors } from '../../theme';

export function StudentPddScreen() {
  const { savePddResult, state, sessionUser } = useApp();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = PDD_QUESTIONS[index];
  const total = PDD_QUESTIONS.length;

  const progress = useMemo(() => {
    if (!sessionUser) return null;
    return state.pddProgress.find((p) => p.userId === sessionUser.id);
  }, [sessionUser, state.pddProgress]);

  const pick = (optionIndex: number) => {
    if (!q || finished) return;
    const ok = optionIndex === q.correctIndex;
    const nextCorrect = correctCount + (ok ? 1 : 0);
    if (index + 1 >= total) {
      setFinished(true);
      setCorrectCount(nextCorrect);
      savePddResult(nextCorrect, total);
      return;
    }
    setCorrectCount(nextCorrect);
    setIndex(index + 1);
  };

  if (finished) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Результат</Text>
        <Text style={styles.score}>
          Верно {correctCount} из {total}
        </Text>
        <Pressable
          style={styles.btn}
          onPress={() => {
            setIndex(0);
            setCorrectCount(0);
            setFinished(false);
          }}
        >
          <Text style={styles.btnText}>Пройти снова</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {progress && (
        <Text style={styles.last}>
          Последний результат: {progress.lastScore}/{progress.lastTotal}
        </Text>
      )}
      <Text style={styles.meta}>
        Вопрос {index + 1} / {total} · {q.category}
      </Text>
      <Text style={styles.question}>{q.text}</Text>
      {q.options.map((opt, i) => (
        <Pressable key={opt} style={styles.option} onPress={() => pick(i)}>
          <Text style={styles.optionText}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { flex: 1, padding: 16, backgroundColor: colors.bg },
    last: { marginBottom: 8, color: colors.textSecondary },
    meta: { color: colors.textMuted, marginBottom: 8 },
    question: { fontSize: 18, fontWeight: '600', marginBottom: 16, lineHeight: 24, color: colors.text },
    option: {
      backgroundColor: colors.surface,
      padding: 14,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    optionText: { fontSize: 16, color: colors.text },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 8, color: colors.text },
    score: { fontSize: 18, marginBottom: 20, color: colors.text },
    btn: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    btnText: { color: colors.onPrimary, fontWeight: '600' },
  });
}
