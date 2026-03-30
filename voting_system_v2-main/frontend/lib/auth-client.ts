import {
  getAccountSession,
  loginAccount,
  logoutAccount,
  recoverAccount,
  signupAccount
} from "@/lib/api";

export type AuthAccount = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
  lastLoginAt: string;
};

export type AuthSession = {
  token: string;
  expiresAt: string;
  account: AuthAccount;
};

export const AUTH_SESSION_KEY = "civicproof-auth-session";
const LAST_USED_EMAIL_KEY = "civicproof-auth-last-email";

export function loadStoredAuthSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

export function saveStoredAuthSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  window.localStorage.setItem(LAST_USED_EMAIL_KEY, session.account.email);
}

export function clearStoredAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_KEY);
}

export function loadLastUsedEmail() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(LAST_USED_EMAIL_KEY) || "";
}

export async function signupAndStore(payload: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const session = (await signupAccount(payload)) as AuthSession;
  saveStoredAuthSession(session);
  return session;
}

export async function loginAndStore(payload: { email: string; password: string }) {
  const session = (await loginAccount(payload)) as AuthSession;
  saveStoredAuthSession(session);
  return session;
}

export async function recoverAndStore(payload: {
  fullName?: string;
  email: string;
  phone: string;
  password: string;
}) {
  const session = (await recoverAccount(payload)) as AuthSession;
  saveStoredAuthSession(session);
  return session;
}

export async function hydrateStoredAuthSession() {
  const stored = loadStoredAuthSession();

  if (!stored?.token) {
    return null;
  }

  try {
    const session = (await getAccountSession(stored.token)) as AuthSession;
    saveStoredAuthSession(session);
    return session;
  } catch {
    clearStoredAuthSession();
    return null;
  }
}

export async function logoutAndClear() {
  const stored = loadStoredAuthSession();

  try {
    if (stored?.token) {
      await logoutAccount(stored.token);
    }
  } catch {
    // Ignore logout failures and clear the local session anyway.
  }

  clearStoredAuthSession();
}
