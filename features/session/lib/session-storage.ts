import type { SessionUser } from "@/features/session/model/user";
import { readRaw, removeKey, writeJson } from "@/shared/lib/safe-storage";

export const USER_KEY = "av_user";

/** Parses a raw av_user value; anything malformed counts as no session. */
export function parseUser(raw: string | null): SessionUser | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (value && typeof value === "object" && typeof (value as SessionUser).name === "string") {
      return { name: (value as SessionUser).name };
    }
  } catch {}
  return null;
}

export const readUserRaw = () => readRaw(USER_KEY);
export const readUser = () => parseUser(readUserRaw());
export const writeUser = (user: SessionUser) => writeJson(USER_KEY, user);
export const clearUser = () => removeKey(USER_KEY);
