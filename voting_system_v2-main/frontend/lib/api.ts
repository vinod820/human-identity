import axios from "axios";

function resolveApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:4000/api`;
  }

  return "http://127.0.0.1:4000/api";
}

const api = axios.create();

api.interceptors.request.use((config) => {
  config.baseURL = resolveApiBaseUrl();
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Request failed";

    return Promise.reject(new Error(message));
  }
);

export async function sendOtp(phone: string) {
  const { data } = await api.post("/auth/send-otp", { phone });
  return data;
}

export async function signupAccount(payload: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const { data } = await api.post("/auth/signup", payload);
  return data;
}

export async function loginAccount(payload: { email: string; password: string }) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function recoverAccount(payload: {
  fullName?: string;
  email: string;
  phone: string;
  password: string;
}) {
  const { data } = await api.post("/auth/recover", payload);
  return data;
}

export async function getAccountSession(token: string) {
  const { data } = await api.get("/auth/session", {
    params: { token }
  });
  return data;
}

export async function logoutAccount(token: string) {
  const { data } = await api.post("/auth/logout", { token });
  return data;
}

export async function verifyOtp(phone: string, otp: string) {
  const { data } = await api.post("/auth/verify-otp", { phone, otp });
  return data;
}

export async function verifyFace(
  faceDescriptor: number[],
  livenessData: {
    blinkPassed: boolean;
    turnPassed: boolean;
    leftTurnPassed?: boolean;
    rightTurnPassed?: boolean;
    yaw?: number;
    eyeAspectRatio?: number;
    blinkScore?: number;
  }
) {
  const { data } = await api.post("/identity/verify-face", { faceDescriptor, livenessData });
  return data;
}

export async function checkDuplicate(payload: { faceHash: string; phoneHash: string; faceDescriptor?: number[] }) {
  const { data } = await api.post("/identity/check-duplicate", payload);
  return data;
}

export async function createDid(faceHash: string, phoneHash: string) {
  const { data } = await api.post("/did/create", { faceHash, phoneHash });
  return data;
}

export async function registerIdentity(payload: Record<string, unknown>) {
  const { data } = await api.post("/identity/register", payload);
  return data;
}

export async function getElection(id: string) {
  const { data } = await api.get(`/vote/election/${id}`);
  return data;
}

export async function generateProof(did: string, electionId: string) {
  const { data } = await api.post("/vote/generate-proof", { did, electionId });
  return data;
}

export async function submitVote(payload: Record<string, unknown>) {
  const { data } = await api.post("/vote/submit", payload);
  return data;
}

export async function getFraudStats() {
  const { data } = await api.get("/fraud/stats");
  return data;
}

export async function getFraudLogs() {
  const { data } = await api.get("/fraud/logs");
  return data;
}
