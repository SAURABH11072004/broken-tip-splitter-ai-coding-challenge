export interface SplitShare {
  id?: string;
  calculationId?: string;
  personNumber: number;
  baseShareCents: number;
  extraCents: number;
  finalShareCents: number;
}

export interface SplitCalculationInput {
  billCents: number;
  tipPercentage: number;
  peopleCount: number;
}

export interface SplitCalculationResult {
  id?: string;
  billCents: number;
  tipPercentage: number;
  tipCents: number;
  grandTotalCents: number;
  peopleCount: number;
  baseShareCents: number;
  remainderCents: number;
  shares: SplitShare[];
  verificationTotalCents: number;
  isVerified: boolean;
  remainderExplanation: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
