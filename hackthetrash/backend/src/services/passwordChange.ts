import { Users } from "./users";

export async function changePasswordForUser(opts: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const { userId, currentPassword, newPassword } = opts;
  if (!currentPassword || !newPassword) {
    return { ok: false, status: 400, error: "currentPassword and newPassword are required" };
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return { ok: false, status: 400, error: "newPassword must be at least 8 characters" };
  }
  if (newPassword === currentPassword) {
    return { ok: false, status: 400, error: "newPassword must differ from currentPassword" };
  }
  const u = await Users.findById(userId);
  if (!u) return { ok: false, status: 404, error: "Account not found" };

  const ok = await Users.verify(String(currentPassword), u.password_hash);
  if (!ok) return { ok: false, status: 401, error: "Current password is incorrect" };

  const updated = await Users.updatePassword(u.id, String(newPassword));
  if (!updated) return { ok: false, status: 500, error: "Could not update password" };

  return { ok: true };
}
