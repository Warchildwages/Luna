export interface Erc8004Result {
  registered: boolean;
  agentId?: string;
}

/**
 * Register Luna on Base ERC-8004 Identity Registry.
 */
export async function registerLunaOnErc8004(): Promise<Erc8004Result> {
  return { registered: false };
}
