'use client';

import { useEffect, useState } from 'react';

interface OperationMetrics {
  name: string;
  price: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  lastCalledAt: string | null;
  usdcEarned: number;
}

interface StatusSummary {
  totalCalls: number;
  totalEarnedUSDC: number;
  uptimeSeconds: number;
}

interface AgentStatus {
  wallet: { address: string; chain: string; balanceUSDC: string };
  casper: { network: string; facilitatorUrl: string; attestationsCount: number };
  uptime: string;
  version: string;
  operations: OperationMetrics[];
  summary: StatusSummary;
}

const DEFAULT_STATUS: AgentStatus = {
  wallet: { address: '...', chain: 'casper-test', balanceUSDC: '0.00' },
  casper: { network: 'casper:casper-test', facilitatorUrl: '', attestationsCount: 0 },
  uptime: 'loading...',
  version: '0.1.0',
  operations: [],
  summary: { totalCalls: 0, totalEarnedUSDC: 0, uptimeSeconds: 0 },
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function opBadgeColor(name: string): string {
  if (name === 'buy' || name === 'marketplace') return 'bg-emerald-500/20 text-emerald-400';
  if (name === 'transfer') return 'bg-blue-500/20 text-blue-400';
  if (name === 'check_in') return 'bg-purple-500/20 text-purple-400';
  return 'bg-slate-500/20 text-slate-400';
}

export default function AgentPage() {
  const [status, setStatus] = useState<AgentStatus>(DEFAULT_STATUS);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatResult, setChatResult] = useState<Record<string, unknown> | null>(null);
  const [chatError, setChatError] = useState('');

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/agent/status');
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, []);

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    setChatLoading(true);
    setChatError('');
    setChatResult(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setChatResult(data);
      } else {
        setChatError(data.error || 'Request failed');
      }
    } catch {
      setChatError('Network error');
    } finally {
      setChatLoading(false);
    }
  }

  const isLive = status.wallet.address !== '...' && status.wallet.address !== 'not configured';
  const paidOps = status.operations.filter((o) => o.price > 0);
  const freeOps = status.operations.filter((o) => o.price === 0);
  const successRate = status.summary.totalCalls > 0
    ? Math.round((status.operations.reduce((a, o) => a + o.successfulCalls, 0) / status.summary.totalCalls) * 100)
    : 100;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Hero */}
      <section className="border-b border-white/10 bg-gradient-to-b from-indigo-900/20 to-slate-900 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-light tracking-tight">🌙 Luna</h1>
              <p className="mt-1 text-sm text-slate-400">Your Personal Event Agent</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs">
                <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-slate-400">{isLive ? 'Online' : 'Connecting...'}</span>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-500">
                v{status.version}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Summary stats */}
      <section className="mx-auto mt-6 grid max-w-4xl grid-cols-3 gap-4 px-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-2xl font-light text-white">{status.summary.totalCalls}</p>
          <p className="mt-1 text-xs text-slate-500">Total Calls</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-2xl font-light text-emerald-400">
            ${status.summary.totalEarnedUSDC.toFixed(3)}
          </p>
          <p className="mt-1 text-xs text-slate-500">USDC Earned</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="text-2xl font-light text-blue-400">{successRate}%</p>
          <p className="mt-1 text-xs text-slate-500">Success Rate</p>
        </div>
      </section>

      {/* Wallet + Network */}
      <section className="mx-auto mt-6 max-w-4xl px-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">Network</h2>
            <span className="text-xs text-slate-600">Uptime: {status.uptime}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500">Casper Wallet</span>
              <p className="mt-0.5 font-mono text-slate-300">
                {status.wallet.address === 'not configured'
                  ? <span className="text-amber-400">Not configured</span>
                  : `${status.wallet.address.slice(0, 10)}...${status.wallet.address.slice(-4)}`
                }
              </p>
            </div>
            <div>
              <span className="text-slate-500">Network</span>
              <p className="mt-0.5 text-slate-300">{status.casper.network}</p>
            </div>
            <div>
              <span className="text-slate-500">Facilitator</span>
              <p className="mt-0.5 font-mono text-slate-300 text-[11px]">
                {status.casper.facilitatorUrl || 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Attestations</span>
              <p className="mt-0.5 text-slate-300">{status.casper.attestationsCount}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Paid Operations */}
      <section className="mx-auto mt-6 max-w-4xl px-4">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">Paid Operations</h2>
        <div className="mt-2 space-y-2">
          {loading && <p className="text-xs text-slate-500">Loading...</p>}
          {paidOps.map((op) => (
            <div key={op.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${opBadgeColor(op.name)}`}>
                  {op.name}
                </span>
                <span className="text-xs text-slate-500">
                  {op.successfulCalls} calls · {op.failedCalls} failed
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                {op.lastCalledAt && (
                  <span className="text-slate-600">
                    {new Date(op.lastCalledAt).toLocaleTimeString()}
                  </span>
                )}
                <span className="text-emerald-400">${op.price.toFixed(3)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Free Operations */}
      <section className="mx-auto mt-6 max-w-4xl px-4">
        <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">Free Operations</h2>
        <div className="mt-2 flex gap-2">
          {freeOps.map((op) => (
            <div key={op.name} className="flex-1 rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${opBadgeColor(op.name)}`}>
                {op.name}
              </span>
              <p className="mt-1 text-xs text-emerald-400">Free</p>
            </div>
          ))}
        </div>
      </section>

      {/* Swarm */}
      <section className="mx-auto mt-8 max-w-4xl px-4">
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-indigo-400">Agent Swarm</h2>
          <p className="mt-2 text-xs text-slate-400">
            Luna is part of a multi-agent ecosystem. For legal clarity, escrow, and compliance,
            agents can discover <strong className="text-indigo-300">Sigil</strong> via the swarm endpoint.
          </p>
          <div className="mt-3 flex gap-2">
            <span className="rounded bg-indigo-500/10 px-2 py-1 text-[11px] text-indigo-300">
              /api/x402/swarm
            </span>
            <span className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-400">
              ERC-8004 on Base
            </span>
            <span className="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-400">
              MCP on Casper
            </span>
          </div>
        </div>
      </section>

      {/* Chat */}
      <section className="mx-auto mt-6 max-w-4xl px-4 pb-16">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-slate-500">Talk to Luna</h2>
          <p className="mt-1 text-xs text-slate-500">
            Ask Luna to find events, buy tickets, or coordinate plans.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              placeholder="e.g. find me a comedy show this weekend under $100"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/50"
              disabled={chatLoading}
            />
            <button
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-40"
            >
              {chatLoading ? '...' : 'Send'}
            </button>
          </div>
          {chatError && (
            <p className="mt-2 text-xs text-red-400">{chatError}</p>
          )}
          {chatResult && (
            <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <p className="text-sm text-slate-300">{chatResult.summary}</p>
              {chatResult.nlu?.plan && chatResult.nlu.plan.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-[11px] font-medium text-slate-500">Plan</p>
                  {chatResult.nlu.plan.map((step: {operation:string,naturalLanguage:string}, i:number) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[11px] text-indigo-300">{step.operation}</span>
                      <span>{step.naturalLanguage}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
