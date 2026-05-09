export const colors = {
  primary: "#16A34A",
  danger: "#DC2626",
  warning: "#F59E0B",
  success: "#10B981",
  blue: "#3B82F6",
  bg: "#F9FAFB",
  card: "#FFFFFF",
  text: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB"
};

export const STATUS_COLORS: Record<string, string> = {
  reported: colors.danger,
  verified: colors.warning,
  cleaning: colors.blue,
  cleaned: colors.success,
  rejected: colors.muted
};
