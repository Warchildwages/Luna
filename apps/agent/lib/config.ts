export interface LunaConfig {
  casperWalletAddress: string;
  allfansApiUrl: string;
  casperNetwork: string;
  casperFacilitatorUrl: string;
  status: 'ok' | 'errors';
}

export function validateConfig(): LunaConfig {
  return {
    casperWalletAddress: process.env.LUNA_CASPER_WALLET_ADDRESS ?? 'dev-mock',
    allfansApiUrl: process.env.ALLFANS_API_URL ?? 'http://localhost:3000',
    casperNetwork: process.env.CASPER_NETWORK ?? 'casper:casper-test',
    casperFacilitatorUrl: process.env.CASPER_FACILITATOR_URL ?? '',
    status: 'ok',
  };
}
