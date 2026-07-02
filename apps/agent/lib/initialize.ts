// 🏴 Pireph (June 30, 2026) — Luna Startup Initializer
//
// Called once during server startup:
//   1. Validate configuration
//   2. Register on Casper MCP for agent discovery
//   3. Register on Base ERC-8004 for EVM agent discovery
//
// Imported via instrumentation.ts (Next.js 14+).

export async function initializeLuna(): Promise<void> {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║     🌙  Luna v0.1.0                  ║');
  console.log('║     Your Personal Event Agent        ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');

  // Step 1: Validate configuration
  const { validateConfig } = await import('./config');
  const config = validateConfig();

  // Step 2: Register on Casper MCP
  const { registerLunaOnCasperMCP } = await import('./casper-mcp');
  try {
    const mcpResult = await registerLunaOnCasperMCP();
    if (mcpResult) {
      console.log('[luna] ✅ Registered on Casper MCP');
    } else {
      console.log('[luna] ⚪ Casper MCP registration skipped');
    }
  } catch (err) {
    console.warn('[luna] ⚠️  Casper MCP registration failed:', err);
  }

  // Step 3: Register on Base ERC-8004
  const { registerLunaOnErc8004 } = await import('./erc-8004');
  try {
    const erc8004Result = await registerLunaOnErc8004();
    if (erc8004Result.registered) {
      console.log(`[luna] ✅ Registered on Base ERC-8004 — agent ID: ${erc8004Result.agentId}`);
    } else {
      console.log('[luna] ⚪ ERC-8004 registration skipped');
    }
  } catch (err) {
    console.warn('[luna] ⚠️  ERC-8004 registration failed:', err);
  }

  // Summary
  console.log('');
  if (config.status === 'errors') {
    console.log('[luna] ⚠️  Started with configuration errors');
  } else {
    console.log('[luna] ✅ Luna is ready');
  }
  console.log('[luna] 🌙 Your fans, your Luna.');
  console.log('');
}
