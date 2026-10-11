import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isLocale, translations } from "./translations";
import type { Locale, TranslationKey } from "./translations";

const STORAGE_KEY = "@weyra/locale";

type Params = Record<string, string | number>;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: TranslationKey, params?: Params) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>("tr");

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (active && isLocale(stored)) setLocaleState(stored);
    });
    return () => { active = false; };
  }, []);

  const setLocale = useCallback(async (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    await AsyncStorage.setItem(STORAGE_KEY, nextLocale);
  }, []);

  const t = useCallback((key: TranslationKey, params?: Params) => {
    const template = translations[locale][key];
    if (!params) return template;
    return template.replace(/{{(\w+)}}/g, (_, name: string) => String(params[name] ?? ""));
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}


