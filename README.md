# CivicProof X

CivicProof X is a hackathon-ready MVP for privacy-preserving proof-of-humanity and one-person-one-vote verification. This repository is structured as a simple monorepo with:

- `frontend/`: Next.js App Router UI for registration, verification, identity, voting, receipt, and dashboard flows
- `backend/`: Express API with OTP, identity, DID, fraud, and voting services
- `contracts/`: Hardhat workspace with identity registry and election manager contracts

## MVP Scope

- Face descriptor submission with basic liveness checks
- OTP verification and phone hashing
- DID and identity commitment creation
- Duplicate checks using phone hash, face hash, and descriptor similarity
- One-vote-per-election nullifier flow
- On-chain identity registration and vote receipt design
- Fraud analytics dashboard for judges

## Quick Start

Install dependencies inside each workspace:

```powershell
cd frontend; npm install
cd ../backend; npm install
cd ../contracts; npm install
```

Run the backend:

```powershell
cd backend
npm run dev
```

Run the frontend:

```powershell
cd frontend
npm run dev
```

Compile contracts:

```powershell
cd contracts
npm run compile
```

## Architecture Notes

- Sensitive biometric and phone details remain off-chain.
- The backend only stores hashes, commitments, and optional face descriptor references for duplicate detection.
- The smart contracts store audit-friendly commitments, nullifiers, and vote receipt events.
- The proof pipeline is ZK-ready, but the current MVP uses cryptographic commitments and verifiable nullifiers rather than a full Circom integration.
