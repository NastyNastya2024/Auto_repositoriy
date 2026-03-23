export type AuthStackParamList = {
  Login: undefined;
  RegisterRequest: undefined;
};

export type AdminChatStackParamList = {
  ChatList: undefined;
  ChatThread: { studentId: string; studentName: string };
};
