import { loadState } from "@/lib/storage";
import { AUTH_SESSION_KEY } from "@/lib/auth-client";

export type CredentialKind = "voter" | "aadhaar" | "driving" | "health";
export type CredentialStatus = "verified" | "review" | "syncing";

export type WalletCredential = {
  kind: CredentialKind;
  label: string;
  shortLabel: string;
  issuer: string;
  number: string;
  issuedOn: string;
  expiresOn: string;
  linked: boolean;
  status: CredentialStatus;
  scope: string[];
  accent: string;
};

export type WalletVault = {
  holderName: string;
  region: string;
  walletId: string;
  did: string;
  phone: string;
  phoneHash: string;
  faceHash: string;
  identityCommitment: string;
  updatedAt: string;
  credentials: WalletCredential[];
};

type WalletProfileSeed = {
  fullName?: string;
  email?: string;
  phone?: string;
};

type WalletShareCredential = {
  a: string;
  e: string;
  i: string;
  k: CredentialKind;
  l: string;
  n: string;
  p: string[];
  s: CredentialStatus;
};

export type WalletSharePayload = {
  c: WalletShareCredential[];
  d: string;
  e: number;
  g: number;
  h: string;
  p: string;
  v: 1;
  w: string;
};

const LEGACY_WALLET_KEY = "civicproof-wallet-vault";
const WALLET_KEY_PREFIX = "civicproof-wallet-vault";
const DEFAULT_PHONE = "+91 98765 43210";

const templates: Record<
  CredentialKind,
  Omit<WalletCredential, "number" | "issuedOn" | "expiresOn"> & {
    number: string;
    issuedOn: string;
    expiresOn: string;
  }
> = {
  voter: {
    kind: "voter",
    label: "Voter ID",
    shortLabel: "VID",
    issuer: "Election Commission of India",
    number: "KA/2026/067214",
    issuedOn: "2025-09-22",
    expiresOn: "2030-09-21",
    linked: true,
    status: "verified",
    scope: ["Eligibility", "Constituency", "Fraud Shield"],
    accent: "#00ff88"
  },
  aadhaar: {
    kind: "aadhaar",
    label: "Aadhaar",
    shortLabel: "UID",
    issuer: "UIDAI",
    number: "XXXX XXXX 9206",
    issuedOn: "2024-08-04",
    expiresOn: "2034-08-03",
    linked: true,
    status: "verified",
    scope: ["KYC", "Address", "Identity Anchor"],
    accent: "#00ccff"
  },
  driving: {
    kind: "driving",
    label: "Driving License",
    shortLabel: "DL",
    issuer: "Transport Department",
    number: "DL-XXXXXXXX49646",
    issuedOn: "2025-03-17",
    expiresOn: "2035-03-16",
    linked: true,
    status: "verified",
    scope: ["Mobility", "Age Proof", "Vehicle Check"],
    accent: "#ffaa00"
  },
  health: {
    kind: "health",
    label: "Health ID",
    shortLabel: "ABHA",
    issuer: "National Health Authority",
    number: "XX-XX-XX-XX-64",
    issuedOn: "2025-01-05",
    expiresOn: "2030-01-04",
    linked: true,
    status: "verified",
    scope: ["Emergency Profile", "Coverage", "Consent Share"],
    accent: "#ff6b7d"
  }
};

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";

  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 ? "=".repeat(4 - (normalized.length % 4)) : "";
  const binary = atob(`${normalized}${padding}`);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function buildWalletId(source: string) {
  const cleaned = source.replace(/[^a-zA-Z0-9]/g, "").slice(-10).toUpperCase();
  return `CPX-${cleaned || "WALLET01"}`;
}

function normalizeKeyPart(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 36);
}

function readSessionEmail() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_KEY);

    if (!raw) {
      return "";
    }

    const parsed = JSON.parse(raw) as { account?: { email?: string } };
    return parsed.account?.email || "";
  } catch {
    return "";
  }
}

function resolveWalletStorageKey(profile?: WalletProfileSeed) {
  const registration = loadState();
  const identityKey =
    normalizeKeyPart(profile?.email) ||
    normalizeKeyPart(readSessionEmail()) ||
    normalizeKeyPart(registration.did) ||
    normalizeKeyPart(registration.identityCommitment) ||
    "guest";

  return `${WALLET_KEY_PREFIX}:${identityKey}`;
}

function resolveGuestWalletStorageKey() {
  const registration = loadState();
  const guestKey =
    normalizeKeyPart(registration.did) ||
    normalizeKeyPart(registration.identityCommitment) ||
    "guest";

  return `${WALLET_KEY_PREFIX}:${guestKey}`;
}

function deriveDid() {
  const registration = loadState();

  if (registration.did) {
    return registration.did;
  }

  if (registration.identityCommitment) {
    return `did:civic:${registration.identityCommitment.slice(0, 18)}`;
  }

  return "did:civic:preview-holder";
}

function defaultVault(profile?: WalletProfileSeed): WalletVault {
  const registration = loadState();
  const did = deriveDid();

  return {
    holderName: profile?.fullName || "Civic Holder",
    region: "India Secure Credential Network",
    walletId: buildWalletId(did || registration.faceHash || registration.identityCommitment),
    did,
    phone: profile?.phone || DEFAULT_PHONE,
    phoneHash: registration.phoneHash,
    faceHash: registration.faceHash,
    identityCommitment: registration.identityCommitment,
    updatedAt: new Date().toISOString(),
    credentials: (Object.keys(templates) as CredentialKind[]).map((kind) => ({ ...templates[kind] }))
  };
}

function mergeCredentials(current: WalletCredential[]) {
  const incoming = new Map(current.map((credential) => [credential.kind, credential]));

  return (Object.keys(templates) as CredentialKind[]).map((kind) => {
    const existing = incoming.get(kind);
    return {
      ...templates[kind],
      ...existing,
      number: sanitizeCredentialNumber(kind, existing?.number || templates[kind].number),
      kind
    };
  });
}

export function maskCredentialNumber(value: string) {
  const trimmed = value.replace(/\s+/g, " ").trim();

  if (/[xX*]/.test(trimmed)) {
    return trimmed;
  }

  const compact = trimmed.replace(/\s+/g, "");

  if (compact.length <= 4) {
    return trimmed;
  }

  const visibleEnd = compact.slice(-4);
  const masked = `${"*".repeat(Math.max(0, compact.length - 4))}${visibleEnd}`;

  if (trimmed.includes(" ")) {
    return masked.replace(/(.{4})/g, "$1 ").trim();
  }

  return masked;
}

export function loadWalletVault(profile?: WalletProfileSeed) {
  const base = defaultVault(profile);
  const storageKey = resolveWalletStorageKey(profile);

  if (typeof window === "undefined") {
    return base;
  }

  let raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    const guestKey = resolveGuestWalletStorageKey();

    if (profile?.email && guestKey !== storageKey) {
      const guestRaw = window.localStorage.getItem(guestKey);

      if (guestRaw) {
        window.localStorage.setItem(storageKey, guestRaw);
        raw = guestRaw;
      }
    }
  }

  if (!raw) {
    const legacy = window.localStorage.getItem(LEGACY_WALLET_KEY);

    if (legacy) {
      window.localStorage.setItem(storageKey, legacy);
      raw = legacy;
    }
  }

  if (!raw) {
    return base;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WalletVault>;
    return {
      ...base,
      ...parsed,
      did: parsed.did || base.did,
      phoneHash: parsed.phoneHash || base.phoneHash,
      faceHash: parsed.faceHash || base.faceHash,
      identityCommitment: parsed.identityCommitment || base.identityCommitment,
      walletId: parsed.walletId || base.walletId,
      credentials: mergeCredentials(parsed.credentials || base.credentials)
    };
  } catch {
    return base;
  }
}

export function saveWalletVault(vault: WalletVault) {
  if (typeof window === "undefined") {
    return;
  }

  const storageKey = resolveWalletStorageKey({
    fullName: vault.holderName,
    phone: vault.phone
  });

  window.localStorage.setItem(storageKey, JSON.stringify(vault));
}

export function getCredentialTemplate(kind: CredentialKind) {
  return { ...templates[kind] };
}

export function sanitizeCredentialNumber(kind: CredentialKind, value: string) {
  const trimmed = String(value || "").replace(/\s+/g, " ").trim();

  if (!trimmed || /[xX*]/.test(trimmed)) {
    return trimmed;
  }

  if (kind === "aadhaar") {
    const digits = trimmed.replace(/\D/g, "");
    return digits.length >= 4 ? `XXXX XXXX ${digits.slice(-4)}` : trimmed;
  }

  if (kind === "driving") {
    const compact = trimmed.replace(/\s+/g, "").toUpperCase();
    return compact.length >= 5 ? `DL-XXXXXXXX${compact.slice(-5)}` : trimmed;
  }

  if (kind === "health") {
    const digits = trimmed.replace(/\D/g, "");
    return digits.length >= 2 ? `XX-XX-XX-XX-${digits.slice(-2)}` : trimmed;
  }

  return trimmed;
}

export function upsertWalletCredential(vault: WalletVault, credential: WalletCredential) {
  return {
    ...vault,
    updatedAt: new Date().toISOString(),
    credentials: vault.credentials.map((item) =>
      item.kind === credential.kind
        ? {
            ...credential,
            number: sanitizeCredentialNumber(credential.kind, credential.number)
          }
        : item
    )
  };
}

function buildSharePayload(vault: WalletVault): WalletSharePayload {
  return {
    v: 1,
    w: vault.walletId,
    h: vault.holderName,
    d: vault.did,
    p: vault.phone,
    g: Date.now(),
    e: Date.now() + 1000 * 60 * 10,
    c: vault.credentials
      .filter((credential) => credential.linked)
      .map((credential) => ({
        a: credential.accent,
        e: credential.expiresOn,
        i: credential.issuer,
        k: credential.kind,
        l: credential.label,
        n: maskCredentialNumber(credential.number),
        p: credential.scope,
        s: credential.status
      }))
  };
}

export async function createSecureWalletPass(vault: WalletVault, origin: string) {
  const payload = buildSharePayload(vault);
  const keyBytes = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, plaintext));
  const packed = new Uint8Array(iv.length + encrypted.length);

  packed.set(iv, 0);
  packed.set(encrypted, iv.length);

  const payloadToken = base64UrlEncode(packed);
  const keyToken = base64UrlEncode(keyBytes);
  const url = `${origin}/wallet/pass?p=${payloadToken}#k=${keyToken}`;

  return {
    url,
    expiresAt: payload.e
  };
}

export async function decodeSecureWalletPass(payloadToken: string, keyToken: string) {
  const payloadBytes = base64UrlDecode(payloadToken);
  const keyBytes = base64UrlDecode(keyToken);
  const iv = payloadBytes.slice(0, 12);
  const ciphertext = payloadBytes.slice(12);
  const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, ciphertext);
  const raw = new TextDecoder().decode(decrypted);
  return JSON.parse(raw) as WalletSharePayload;
}
