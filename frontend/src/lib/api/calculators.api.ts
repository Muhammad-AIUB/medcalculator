import { apiClient } from './client';
import type { Calculator, CalculationResult } from '@/types/calculator';

export interface CalculateRequest {
  inputs: Record<string, unknown>;
  units?: Record<string, string>;
}

export interface BatchCalculateRequest {
  calculations: Array<{
    calculatorId: string;
    inputs: Record<string, unknown>;
    units?: Record<string, string>;
  }>;
}

export interface BatchCalculateResponse {
  results: Array<{
    calculatorId: string;
    result?: CalculationResult;
    error?: string;
  }>;
}

export interface ApiCalculator {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  inputSchema: Record<string, unknown>;
}

/**
 * Fetch all available calculators from the API.
 */
export async function getAllCalculators(): Promise<ApiCalculator[]> {
  return apiClient.get<ApiCalculator[]>('/api/calculators');
}

/**
 * Fetch a single calculator definition by ID.
 */
export async function getCalculatorById(id: string): Promise<ApiCalculator> {
  return apiClient.get<ApiCalculator>(`/api/calculators/${id}`);
}

/**
 * Submit inputs to the API and get a calculation result.
 */
export async function calculate(
  id: string,
  inputs: Record<string, unknown>,
  units?: Record<string, string>
): Promise<CalculationResult> {
  return apiClient.post<CalculationResult>(`/api/calculators/${id}/calculate`, {
    inputs,
    units,
  } satisfies CalculateRequest);
}

/**
 * Run multiple calculations in a single API call.
 */
export async function batchCalculate(
  batch: BatchCalculateRequest['calculations']
): Promise<BatchCalculateResponse> {
  return apiClient.post<BatchCalculateResponse>('/api/calculators/batch', {
    calculations: batch,
  } satisfies BatchCalculateRequest);
}
