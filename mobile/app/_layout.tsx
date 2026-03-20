import { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { colors, fonts } from '../constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    [fonts.mono]: require('../assets/fonts/JetBrainsMono-Regular.ttf'),
    [fonts.monoBold]: require('../assets/fonts/JetBrainsMono-Bold.ttf'),
    [fonts.serif]: require('../assets/fonts/CormorantGaramond-Regular.ttf'),
    [fonts.serifItalic]: require('../assets/fonts/CormorantGaramond-Italic.ttf'),
    [fonts.serifBold]: require('../assets/fonts/CormorantGaramond-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="tier/[id]" />
        <Stack.Screen name="feed/[id]" />
        <Stack.Screen name="article/[id]" />
      </Stack>
    </>
  );
}
