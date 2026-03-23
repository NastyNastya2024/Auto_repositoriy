import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './src/context/AppContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AppProvider>
      <RootNavigator />
      <StatusBar style="dark" />
    </AppProvider>
  );
}
