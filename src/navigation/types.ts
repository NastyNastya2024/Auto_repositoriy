export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  RegisterRequest: undefined;
};

export type AdminChatStackParamList = {
  ChatList: undefined;
  ChatThread: { studentId: string; studentName: string };
};
