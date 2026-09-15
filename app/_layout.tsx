import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/auth/AuthProvider";
import { I18nProvider } from "@/i18n/I18nProvider";
import { AnalyticsLifecycle } from "@/analytics/AnalyticsLifecycle";

export default function RootLayout() {
  return (
    <I18nProvider>
      <AuthProvider>
        <AnalyticsLifecycle />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </I18nProvider>
  );
}
