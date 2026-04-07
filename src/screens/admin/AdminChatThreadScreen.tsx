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
import { useTheme } from '../../context/ThemeContext';
import type { AdminChatStackParamList } from '../../navigation/types';
import type { ThemeColors } from '../../theme';

export function AdminChatThreadScreen() {
  const route = useRoute<RouteProp<AdminChatStackParamList, 'ChatThread'>>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
              <Text style={[styles.time, mine && styles.timeMine]}>
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
          placeholderTextColor={colors.placeholder}
          multiline
        />
        <Pressable
          style={({ pressed }) => [
            styles.send,
            !text.trim() && styles.sendDisabled,
            pressed && text.trim() && styles.sendPressed,
          ]}
          onPress={onSend}
          disabled={!text.trim()}
        >
          <Text style={styles.sendText}>Отпр.</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.bg },
    list: { flex: 1, padding: 12 },
    empty: { color: colors.textMuted, textAlign: 'center', marginTop: 24 },
    bubble: { maxWidth: '85%', padding: 10, borderRadius: 12, marginBottom: 8 },
    bubbleMine: {
      alignSelf: 'flex-end',
      backgroundColor: colors.chipOn,
      borderWidth: 1,
      borderColor: colors.primaryMuted,
    },
    bubbleOther: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textMine: { color: colors.text },
    textOther: { color: colors.text },
    time: { marginTop: 4, fontSize: 11, color: colors.textMuted },
    timeMine: { color: colors.link },
    row: {
      flexDirection: 'row',
      padding: 12,
      alignItems: 'flex-end',
      gap: 8,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      backgroundColor: colors.inputBg,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
    },
    send: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 10,
      justifyContent: 'center',
    },
    sendDisabled: { opacity: 0.45 },
    sendPressed: { opacity: 0.9 },
    sendText: { color: colors.onPrimary, fontWeight: '700', fontSize: 15 },
  });
}
