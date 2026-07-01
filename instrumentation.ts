/**
 * Next.js 14+ instrumentation hook.
 * Runs once on server startup — initializes Luna's x402 scheme + MCP registration.
 */
export async function register() {
  const { initializeLuna } = await import('./lib/initialize');
  await initializeLuna();
}
