import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import type { AdminChatStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AdminChatStackParamList, 'ChatList'>;

export function AdminChatListScreen() {
  const { state } = useApp();
  const navigation = useNavigation<Nav>();

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

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f6f7f9' },
  empty: { textAlign: 'center', marginTop: 24, color: '#6b7280' },
  row: {
    backgroundColor: '#fff',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  name: { fontSize: 16, fontWeight: '700' },
  preview: { marginTop: 4, color: '#6b7280' },
});
