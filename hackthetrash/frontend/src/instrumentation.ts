import { assertStartupSecurity } from "../../backend/src/config/envSecurity";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    assertStartupSecurity();
  }
}
