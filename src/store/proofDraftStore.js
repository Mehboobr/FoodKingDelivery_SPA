import { create } from 'zustand';

function uuid() {
  if (global.crypto?.randomUUID) return global.crypto.randomUUID();
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] % 16) + 64;
  bytes[8] = (bytes[8] % 64) + 128;
  const hex = bytes.map((value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const empty = () => ({
  signature: null,
  strokes: 0,
  consent: false,
  collected: false,
  front: null,
  back: null,
  submitting: false,
  idempotencyKey: uuid(),
  failKey: uuid(),
});

const useProofDraftStore = create((set, get) => ({
  orderId: null,
  ...empty(),
  begin(orderId) {
    if (!orderId || get().orderId === orderId) return;
    set({ orderId, ...empty() });
  },
  setSignature: (signature, strokes) => set({ signature, strokes }),
  setConsent: (consent) => set({ consent }),
  setCollected: (collected) => set({ collected }),
  setFront: (front) => set({ front }),
  setBack: (back) => set({ back }),
  setSubmitting: (submitting) => set({ submitting }),
  reset: () => set({ orderId: null, ...empty() }),
}));

export default useProofDraftStore;
