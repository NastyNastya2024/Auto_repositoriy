import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { useApp } from '../../context/AppContext';
import type { AdminChatStackParamList } from '../../navigation/types';

export function AdminChatThreadScreen() {
  const route = useRoute<RouteProp<AdminChatStackParamList, 'ChatThread'>>();
  const { studentId } = route.params;
  const { state, sessionUser, sendMessage } = useApp();
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const items = useMemo(
    () =>
      state.messages
        .filter((m) => m.studentId === studentId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [state.messages, studentId],
  );

  const onSend = () => {
    sendMessage(text, studentId);
    setText('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <FlatList
        ref={listRef}
        style={styles.list}
        data={items}
        keyExtractor={(m) => m.id}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const mine = item.senderId === sessionUser?.id;
          return (
            <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
              <Text style={mine ? styles.textMine : styles.textOther}>{item.text}</Text>
              <Text style={styles.time}>
                {new Date(item.createdAt).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>Нет сообщений — напишите первым.</Text>
        }
      />
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Ответ…"
          multiline
        />
        <Pressable style={styles.send} onPress={onSend} disabled={!text.trim()}>
          <Text style={styles.sendText}>Отпр.</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f6f7f9' },
  list: { flex: 1, padding: 12 },
  empty: { color: '#6b7280', textAlign: 'center', marginTop: 24 },
  bubble: { maxWidth: '85%', padding: 10, borderRadius: 12, marginBottom: 8 },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: '#059669' },
  bubbleOther: { alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  textMine: { color: '#fff' },
  textOther: { color: '#111827' },
  time: { marginTop: 4, fontSize: 11, color: '#9ca3af' },
  row: { flexDirection: 'row', padding: 12, alignItems: 'flex-end', gap: 8, borderTopWidth: 1, borderColor: '#e5e7eb' },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  send: { backgroundColor: '#111827', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10 },
  sendText: { color: '#fff', fontWeight: '600' },
});
