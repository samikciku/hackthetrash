import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "../../../locales/en.json";
import sq from "../../../locales/sq.json";
import it from "../../../locales/it.json";

export const SUPPORTED = ["en", "sq", "it"] as const;
export type Locale = typeof SUPPORTED[number];

const LOCALE_KEY = "@htt/locale";

export const i18n = new I18n({ en, sq, it });
i18n.enableFallback = true;
i18n.defaultLocale = "en";

function pickInitialLocale(): Locale {
  const candidates = Localization.getLocales().map((l) => (l.languageCode || "").toLowerCase());
  for (const c of candidates) {
    if ((SUPPORTED as readonly string[]).includes(c)) return c as Locale;
  }
  return "en";
}

export async function initI18n() {
  const stored = (await AsyncStorage.getItem(LOCALE_KEY)) as Locale | null;
  i18n.locale = stored && (SUPPORTED as readonly string[]).includes(stored) ? stored : pickInitialLocale();
}

export async function setLocale(loc: Locale) {
  i18n.locale = loc;
  await AsyncStorage.setItem(LOCALE_KEY, loc);
}

export const t = (key: string, opts?: object) => i18n.t(key, opts);
