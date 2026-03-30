const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
const { createPasswordRecord, randomHex, verifyPassword } = require("../utils/crypto");

const authStorePath = path.join(__dirname, "../../data/auth-store.json");
const sessionDurationMs = 1000 * 60 * 60 * 24 * 30;

function ensureAuthStore() {
  const directory = path.dirname(authStorePath);

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  if (!fs.existsSync(authStorePath)) {
    fs.writeFileSync(authStorePath, JSON.stringify({ accounts: [], sessions: [] }, null, 2));
  }
}

function readAuthStore() {
  ensureAuthStore();
  return JSON.parse(fs.readFileSync(authStorePath, "utf8"));
}

function writeAuthStore(payload) {
  ensureAuthStore();
  fs.writeFileSync(authStorePath, JSON.stringify(payload, null, 2));
}

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function sanitizeAccount(account) {
  return {
    id: account.id,
    fullName: account.fullName,
    email: account.email,
    phone: account.phone,
    createdAt: account.createdAt,
    lastLoginAt: account.lastLoginAt
  };
}

function createSession(store, accountId) {
  const token = randomHex(32);
  const session = {
    id: uuid(),
    token,
    accountId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + sessionDurationMs).toISOString()
  };

  store.sessions = store.sessions.filter((item) => item.accountId !== accountId && new Date(item.expiresAt).getTime() > Date.now());
  store.sessions.push(session);

  return session;
}

function buildAuthResponse(store, account) {
  const session = createSession(store, account.id);
  return {
    token: session.token,
    expiresAt: session.expiresAt,
    account: sanitizeAccount(account)
  };
}

function validatePassword(password) {
  if (String(password).length < 8) {
    const error = new Error("Password must be at least 8 characters.");
    error.status = 400;
    throw error;
  }
}

function validatePhone(phone) {
  if (normalizePhone(phone).length !== 10) {
    const error = new Error("Enter a valid phone number.");
    error.status = 400;
    throw error;
  }
}

function signupAccount(payload) {
  const store = readAuthStore();
  const email = normalizeEmail(payload.email);
  validatePassword(payload.password);
  validatePhone(payload.phone);

  if (store.accounts.some((account) => account.email === email)) {
    const error = new Error("Account already exists.");
    error.status = 409;
    throw error;
  }

  const password = createPasswordRecord(payload.password);
  const now = new Date().toISOString();
  const account = {
    id: uuid(),
    fullName: String(payload.fullName).trim(),
    email,
    phone: String(payload.phone || "").trim(),
    passwordHash: password.hash,
    passwordSalt: password.salt,
    createdAt: now,
    lastLoginAt: now
  };

  store.accounts.push(account);
  const response = buildAuthResponse(store, account);
  writeAuthStore(store);
  return response;
}

function recoverAccount(payload) {
  const store = readAuthStore();
  const email = normalizeEmail(payload.email);
  const phone = normalizePhone(payload.phone);
  validatePassword(payload.password);
  validatePhone(payload.phone);

  const account = store.accounts.find((item) => item.email === email);

  if (!account) {
    const error = new Error("No account found for this email.");
    error.status = 404;
    throw error;
  }

  if (!phone || normalizePhone(account.phone) !== phone) {
    const error = new Error("Phone does not match this account.");
    error.status = 401;
    throw error;
  }

  const password = createPasswordRecord(payload.password);
  account.passwordHash = password.hash;
  account.passwordSalt = password.salt;
  account.lastLoginAt = new Date().toISOString();
  account.fullName = String(payload.fullName || account.fullName || "").trim() || account.fullName;
  account.phone = String(payload.phone || account.phone || "").trim();

  const response = buildAuthResponse(store, account);
  writeAuthStore(store);
  return response;
}

function loginAccount(payload) {
  const store = readAuthStore();
  const email = normalizeEmail(payload.email);
  const account = store.accounts.find((item) => item.email === email);

  if (!account || !verifyPassword(payload.password, account.passwordSalt, account.passwordHash)) {
    const error = new Error("Invalid email or password.");
    error.status = 401;
    throw error;
  }

  account.lastLoginAt = new Date().toISOString();
  const response = buildAuthResponse(store, account);
  writeAuthStore(store);
  return response;
}

function getAccountSession(token) {
  const store = readAuthStore();
  const session = store.sessions.find((item) => item.token === token);

  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
    store.sessions = store.sessions.filter((item) => item.token !== token && new Date(item.expiresAt).getTime() > Date.now());
    writeAuthStore(store);
    const error = new Error("Session expired.");
    error.status = 401;
    throw error;
  }

  const account = store.accounts.find((item) => item.id === session.accountId);

  if (!account) {
    const error = new Error("Account not found.");
    error.status = 404;
    throw error;
  }

  return {
    token: session.token,
    expiresAt: session.expiresAt,
    account: sanitizeAccount(account)
  };
}

function logoutAccountSession(token) {
  const store = readAuthStore();
  store.sessions = store.sessions.filter((item) => item.token !== token);
  writeAuthStore(store);
  return { success: true };
}

module.exports = {
  signupAccount,
  recoverAccount,
  loginAccount,
  getAccountSession,
  logoutAccountSession
};
