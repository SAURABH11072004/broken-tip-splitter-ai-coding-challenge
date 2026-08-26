import { ApiResponse, SplitCalculationResult } from '@broken-tip-splitter/shared';

const API_BASE = '/api/calculations';

export class ApiError extends Error {
  code: string;
  details?: unknown;

  constructor(message: string, code = 'API_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
    });

    const json: ApiResponse<T> = await response.json().catch(() => ({
      success: false,
      error: {
        code: 'PARSE_ERROR',
        message: 'Invalid response from server.',
      },
    }));

    if (!response.ok || !json.success) {
      throw new ApiError(
        json.error?.message || `HTTP error ${response.status}`,
        json.error?.code || 'HTTP_ERROR',
        json.error?.details
      );
    }

    return json.data as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please verify your connection.', 'TIMEOUT');
    }
    throw new ApiError(
      'Unable to connect to the calculation service. Please check your connection and try again.',
      'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchCalculations(): Promise<SplitCalculationResult[]> {
  return request<SplitCalculationResult[]>(API_BASE);
}

export async function fetchCalculationById(id: string): Promise<SplitCalculationResult> {
  return request<SplitCalculationResult>(`${API_BASE}/${id}`);
}

export async function saveCalculation(payload: {
  billAmount?: number | string;
  billCents?: number;
  tipPercentage: number | string;
  peopleCount: number | string;
}): Promise<SplitCalculationResult> {
  return request<SplitCalculationResult>(API_BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCalculation(
  id: string,
  payload: {
    billAmount?: number | string;
    billCents?: number;
    tipPercentage: number | string;
    peopleCount: number | string;
  }
): Promise<SplitCalculationResult> {
  return request<SplitCalculationResult>(`${API_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteCalculationRecord(
  id: string
): Promise<{ id: string; message: string }> {
  return request<{ id: string; message: string }>(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });
}
