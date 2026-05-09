// Shared locale registry consumed by both the web and mobile clients.
import en from "./en.json";
import sq from "./sq.json";

export const SUPPORTED_LOCALES = ["en", "sq"] as const;
export type Locale = typeof SUPPORTED_LOCALES[number];

export const resources = { en, sq } as const;

export const fallbackLocale: Locale = "en";
