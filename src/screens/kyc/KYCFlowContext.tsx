import React, { createContext, useContext, useMemo, useState } from 'react';
import type { KYCRecord } from '@/types';
import type { DocumentType, OnboardingPath } from '@/services/kycService';

export type GenderOption = 'male' | 'female' | 'other' | string;

export interface KYCFlowDraft {
  onboardingPath: OnboardingPath;
  chamaId?: string | null;
  kycId?: string | null;

  legalName: string;
  dateOfBirth: string;
  gender: GenderOption;
  nationality: string;

  documentType: DocumentType;
  idNumber: string;

  idFrontUri?: string | null;
  idBackUri?: string | null;
  selfieUri?: string | null;

  shareLocation: boolean;
  location?: { latitude: number; longitude: number; label?: string } | null;

  lastRecord?: KYCRecord | null;
}

const defaultDraft: KYCFlowDraft = {
  onboardingPath: 'create_chama',
  chamaId: null,
  kycId: null,
  legalName: '',
  dateOfBirth: '',
  gender: '',
  nationality: 'Kenyan',
  documentType: 'national_id',
  idNumber: '',
  idFrontUri: null,
  idBackUri: null,
  selfieUri: null,
  shareLocation: false,
  location: null,
  lastRecord: null,
};

type KYCFlowContextValue = {
  draft: KYCFlowDraft;
  setDraft: React.Dispatch<React.SetStateAction<KYCFlowDraft>>;
  reset: () => void;
  setKycId: (kycId: string) => void;
  setLastRecord: (record: KYCRecord | null) => void;
};

const KYCFlowContext = createContext<KYCFlowContextValue | null>(null);

export function KYCFlowProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: Partial<Pick<KYCFlowDraft, 'onboardingPath' | 'chamaId' | 'legalName'>>;
}) {
  const [draft, setDraft] = useState<KYCFlowDraft>({ ...defaultDraft, ...(initial || {}) });

  const value = useMemo<KYCFlowContextValue>(
    () => ({
      draft,
      setDraft,
      reset: () => setDraft({ ...defaultDraft, ...(initial || {}) }),
      setKycId: (kycId: string) => setDraft((prev) => ({ ...prev, kycId })),
      setLastRecord: (record) => setDraft((prev) => ({ ...prev, lastRecord: record })),
    }),
    [draft, initial]
  );

  return <KYCFlowContext.Provider value={value}>{children}</KYCFlowContext.Provider>;
}

export function useKYCFlow() {
  const ctx = useContext(KYCFlowContext);
  if (!ctx) {
    throw new Error('useKYCFlow must be used within KYCFlowProvider');
  }
  return ctx;
}

