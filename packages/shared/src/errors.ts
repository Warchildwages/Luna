// 🌙 Luna Error Constants
//
// Structured error codes for consistent machine-readable error responses.
// Backported from Sigil's error code pattern.
//
// Usage:
//   return NextResponse.json(
//     { error: ERRORS.PAYMENT_REQUIRED, code: ERROR_CODES.PAYMENT_REQUIRED },
//     { status: 402 },
//   );

// ---------------------------------------------------------------------------
// Error Messages
// ---------------------------------------------------------------------------

export const ERRORS = {
  // Payment
  PAYMENT_REQUIRED: 'Payment required. Send PAYMENT-SIGNATURE header with Ed25519-signed payload.',
  PAYMENT_HEADER_MISSING: 'Missing payment header. Send PAYMENT-SIGNATURE (crypto) or X-Payment-Id (legacy/dev).',
  PAYMENT_EXPIRED: 'Payment expired. The validBefore timestamp has passed.',
  PAYMENT_NOT_YET_VALID: 'Payment not yet valid. The validAfter timestamp is in the future.',
  PAYMENT_MISSING_FIELDS: 'Invalid payment payload. Must include signature, publicKey, and authorization fields.',
  INVALID_AUTHORIZATION: 'Invalid authorization. Must include from, to, value, validAfter, validBefore, nonce.',
  AMOUNT_MISMATCH: 'Amount mismatch. Payment value does not match expected operation price.',
  INVALID_SIGNATURE: 'Invalid signature. Payment signature does not match the provided public key.',
  INVALID_PAYER_ADDRESS: 'Invalid payer address. Must be a valid Casper address (66 hex chars, 00/01 prefix).',
  INVALID_PAYEE_ADDRESS: 'Invalid payee address. Must be a valid Casper address (66 hex chars, 00/01 prefix).',
  IDEMPOTENCY_KEY_MISSING: 'Idempotency key required for paid operations. Send X-Idempotency-Key header.',

  // Validation
  VALIDATION_ERROR: 'Validation failed. Check the request body and try again.',
  INVALID_JSON: 'Invalid JSON body. Send a valid JSON payload.',
  MISSING_REQUIRED_FIELDS: 'Missing required fields. Check the API documentation.',

  // Agent
  AGENT_NOT_CONFIGURED: 'Agent not fully configured. Set required environment variables.',
  LLM_NOT_CONFIGURED: 'LLM not configured. Set VENICE_API_KEY, GEMINI_API_KEY, or another LLM provider.',
  CASPER_NOT_CONFIGURED: 'Casper not configured. Set CASPER_WALLET_ADDRESS and SECRET_KEY.',

  // AllFans
  ALLFANS_UNREACHABLE: 'AllFans backend unreachable. Check ALLFANS_API_URL and network connectivity.',
  ALLFANS_ERROR: 'AllFans returned an error. Check the request and try again.',

  // General
  NOT_FOUND: 'Resource not found.',
  RATE_LIMITED: 'Too many requests. Please wait before retrying.',
  INTERNAL_ERROR: 'Internal server error. Please try again later.',
} as const;

// ---------------------------------------------------------------------------
// Error Codes
// ---------------------------------------------------------------------------

export const ERROR_CODES = {
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  PAYMENT_HEADER_MISSING: 'PAYMENT_HEADER_MISSING',
  PAYMENT_EXPIRED: 'PAYMENT_EXPIRED',
  PAYMENT_NOT_YET_VALID: 'PAYMENT_NOT_YET_VALID',
  PAYMENT_MISSING_FIELDS: 'PAYMENT_MISSING_FIELDS',
  INVALID_AUTHORIZATION: 'INVALID_AUTHORIZATION',
  AMOUNT_MISMATCH: 'AMOUNT_MISMATCH',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  INVALID_PAYER_ADDRESS: 'INVALID_PAYER_ADDRESS',
  INVALID_PAYEE_ADDRESS: 'INVALID_PAYEE_ADDRESS',
  IDEMPOTENCY_KEY_MISSING: 'IDEMPOTENCY_KEY_MISSING',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_JSON: 'INVALID_JSON',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  AGENT_NOT_CONFIGURED: 'AGENT_NOT_CONFIGURED',
  LLM_NOT_CONFIGURED: 'LLM_NOT_CONFIGURED',
  CASPER_NOT_CONFIGURED: 'CASPER_NOT_CONFIGURED',
  ALLFANS_UNREACHABLE: 'ALLFANS_UNREACHABLE',
  ALLFANS_ERROR: 'ALLFANS_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// ---------------------------------------------------------------------------
// HTTP Status Codes
// ---------------------------------------------------------------------------

export const HTTP = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
