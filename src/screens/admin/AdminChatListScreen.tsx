import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import type { AdminChatStackParamList } from '../../navigation/types';
import type { ThemeColors } from '../../theme';

type Nav = NativeStackNavigationProp<AdminChatStackParamList, 'ChatList'>;

export function AdminChatListScreen() {
  const { state } = useApp();
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const students = state.users.filter((u) => u.role === 'student');

  return (
    <FlatList
      style={styles.list}
      data={students}
      keyExtractor={(u) => u.id}
      ListEmptyComponent={<Text style={styles.empty}>Нет учеников</Text>}
      renderItem={({ item }) => {
        const last = [...state.messages]
          .filter((m) => m.studentId === item.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
        return (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
            onPress={() =>
              navigation.navigate('ChatThread', { studentId: item.id, studentName: item.name })
            }
          >
            <Text style={styles.name}>{item.name}</Text>
            {last && <Text style={styles.preview} numberOfLines={1}>{last.text}</Text>}
          </Pressable>
        );
      }}
    />
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    list: { flex: 1, backgroundColor: colors.bg },
    empty: { textAlign: 'center', marginTop: 24, color: colors.textMuted },
    row: {
      backgroundColor: colors.surface,
      padding: 14,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    name: { fontSize: 16, fontWeight: '700', color: colors.text },
    preview: { marginTop: 4, color: colors.textMuted },
  });
}
