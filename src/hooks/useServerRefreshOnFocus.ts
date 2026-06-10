import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useApp } from '../context/AppContext';

/** Подтягивает актуальные данные с сервера при открытии экрана. */
export function useServerRefreshOnFocus() {
  const { refreshFromServer } = useApp();
  useFocusEffect(
    useCallback(() => {
      void refreshFromServer();
    }, [refreshFromServer]),
  );
}
