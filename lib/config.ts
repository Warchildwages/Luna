// 🏴 Pireph (June 30, 2026) — Configuration Validation
//
// Validates required environment variables at startup.
// Warns about missing config so we catch issues before demo time.

interface ConfigCheck {
  key: string;
  value: string | undefined;
  required: boolean;
  purpose: string;
}

const CHECKS: ConfigCheck[] = [
  // Casper x402 (required for payment)
  { key: 'LUNA_CASPER_WALLET_ADDRESS', value: process.env.LUNA_CASPER_WALLET_ADDRESS, required: true, purpose: 'Receives x402 payments on Casper' },
  { key: 'CSPR_CLOUD_API_KEY', value: process.env.CSPR_CLOUD_API_KEY, required: true, purpose: 'Authenticates with Casper x402 Facilitator' },
  { key: 'CASPER_NETWORK', value: process.env.CASPER_NETWORK, required: false, purpose: 'Casper network (default: casper:casper-test)' },

  // AllFans API (required for ticket operations)
  { key: 'ALLFANS_API_URL', value: process.env.ALLFANS_API_URL, required: false, purpose: 'AllFans backend URL (default: localhost:3000)' },

  // EVM / ERC-8004 (optional — Base agent discovery)
  { key: 'LUNA_EVM_WALLET', value: process.env.LUNA_EVM_WALLET, required: false, purpose: 'EVM wallet for ERC-8004 registration on Base' },
  { key: 'ERC8004_IDENTITY_REGISTRY', value: process.env.ERC8004_IDENTITY_REGISTRY, required: false, purpose: 'ERC-8004 registry contract on Base' },

  // Casper MCP (optional — agent discovery on Casper)
  { key: 'CASPER_MCP_SERVER_URL', value: process.env.CASPER_MCP_SERVER_URL, required: false, purpose: 'Casper MCP server for agent discovery' },
];

export interface ConfigReport {
  status: 'ok' | 'warnings' | 'errors';
  checks: Array<{
    key: string;
    status: 'ok' | 'missing' | 'optional';
    purpose: string;
  }>;
}

/**
 * Validate Luna's configuration.
 * Call during startup — non-fatal, but logs warnings for missing optional vars
 * and errors for missing required vars.
 */
export function validateConfig(): ConfigReport {
  const results: ConfigReport['checks'] = [];
  let hasErrors = false;
  let hasWarnings = false;

  for (const check of CHECKS) {
    if (check.required && !check.value) {
      results.push({ key: check.key, status: 'missing', purpose: check.purpose });
      hasErrors = true;
      console.error(`[config] ❌ MISSING: ${check.key} — ${check.purpose}`);
    } else if (!check.required && !check.value) {
      results.push({ key: check.key, status: 'optional', purpose: check.purpose });
      hasWarnings = true;
      console.log(`[config] ⚪ OPTIONAL: ${check.key} — ${check.purpose} (not set, using default)`);
    } else {
      results.push({ key: check.key, status: 'ok', purpose: check.purpose });
      console.log(`[config] ✅ ${check.key}=${maskValue(check.key, check.value || '')}`);
    }
  }

  const status = hasErrors ? 'errors' : hasWarnings ? 'warnings' : 'ok';

  if (hasErrors) {
    console.error('[config] ❌ Configuration has errors — Luna may not work correctly');
  } else if (hasWarnings) {
    console.log('[config] ⚪ Configuration has warnings — optional features disabled');
  } else {
    console.log('[config] ✅ All checks passed');
  }

  return { status, checks: results };
}

function maskValue(key: string, value: string): string {
  // Mask sensitive values for logging
  if (key.includes('KEY') || key.includes('SECRET') || key.includes('PRIVATE')) {
    return value.slice(0, 8) + '...' + value.slice(-4);
  }
  return value;
}
