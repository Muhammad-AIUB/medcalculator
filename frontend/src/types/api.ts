export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  message?: string
}

export interface ApiError {
  status: number
  message: string
  code?: string
  details?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CalculatorApiResponse {
  calculatorId: string
  result: {
    score?: number
    value?: number | string
    unit?: string
    severity: string
    label: string
    interpretation: string
    details?: Array<{ label: string; value: string | number; unit?: string }>
    formula?: string
    references?: string[]
  }
  timestamp: string
}

export interface ConversionApiResponse {
  fromValue: number
  fromUnit: string
  toValue: number
  toUnit: string
  substance?: string
}

export interface AllConversionsApiResponse {
  originalValue: number
  originalUnit: string
  conversions: Record<string, number>
  substance?: string
}

export interface RequestOptions {
  timeout?: number
  retries?: number
  signal?: AbortSignal
}
