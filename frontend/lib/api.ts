import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
});

export async function sendOtp(phone: string) {
  const { data } = await api.post("/auth/send-otp", { phone });
  return data;
}

export async function verifyOtp(phone: string, otp: string) {
  const { data } = await api.post("/auth/verify-otp", { phone, otp });
  return data;
}

export async function verifyFace(faceDescriptor: number[], livenessData: { blinkPassed: boolean; turnPassed: boolean }) {
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
