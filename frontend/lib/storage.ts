export type RegistrationState = {
  faceDescriptor: number[];
  faceHash: string;
  biometricCommitment: string;
  phoneHash: string;
  did: string;
  identityCommitment: string;
  txHash: string;
  receiptHash: string;
  nullifierHash: string;
  timestamp: string;
};

const KEY = "civicproof-demo-state";

export function loadState(): RegistrationState {
  if (typeof window === "undefined") {
    return emptyState();
  }

  const raw = window.localStorage.getItem(KEY);
  return raw ? { ...emptyState(), ...JSON.parse(raw) } : emptyState();
}

export function saveState(update: Partial<RegistrationState>) {
  if (typeof window === "undefined") {
    return;
  }

  const next = { ...loadState(), ...update };
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

function emptyState(): RegistrationState {
  return {
    faceDescriptor: [],
    faceHash: "",
    biometricCommitment: "",
    phoneHash: "",
    did: "",
    identityCommitment: "",
    txHash: "",
    receiptHash: "",
    nullifierHash: "",
    timestamp: ""
  };
}
