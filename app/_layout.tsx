import "react-native-gesture-handler";
import {CatalogRefresh} from "@/catalog/CatalogRefresh";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts, Allura_400Regular } from "@expo-google-fonts/allura";
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold } from "@expo-google-fonts/manrope";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/auth/AuthProvider";
import { I18nProvider } from "@/i18n/I18nProvider";
import { AnalyticsLifecycle } from "@/analytics/AnalyticsLifecycle";

import {ThemeProvider,useTheme} from "@/studio/theme";
function ThemeStatus(){const {dark}=useTheme();return <StatusBar style={dark?"light":"dark"}/>;}
export default function RootLayout() {
  useFonts({ Allura_400Regular, Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold });
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <ThemeProvider><I18nProvider>
      <AuthProvider>
        <AnalyticsLifecycle /><CatalogRefresh />
        <ThemeStatus />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </I18nProvider></ThemeProvider>
    </GestureHandlerRootView>
  );
}

