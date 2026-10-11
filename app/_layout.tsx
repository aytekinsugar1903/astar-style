import {CatalogRefresh} from "@/catalog/CatalogRefresh";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/auth/AuthProvider";
import { I18nProvider } from "@/i18n/I18nProvider";
import { AnalyticsLifecycle } from "@/analytics/AnalyticsLifecycle";

import {ThemeProvider,useTheme} from "@/studio/theme";
function ThemeStatus(){const {dark}=useTheme();return <StatusBar style={dark?"light":"dark"}/>;}
export default function RootLayout() {
  return (
    <ThemeProvider><I18nProvider>
      <AuthProvider>
        <AnalyticsLifecycle /><CatalogRefresh />
        <ThemeStatus />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </I18nProvider></ThemeProvider>
  );
}

