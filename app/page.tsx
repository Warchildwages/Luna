import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-7xl font-light tracking-tight">🌙 Luna</h1>
      <p className="mt-4 max-w-md text-lg text-slate-400">
        Your personal event agent. Tell Luna what you want tonight — tickets, merch, drinks, plans — and she handles everything.
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Powered by AllFans · Settled on Casper via x402
      </p>

      <div className="mt-10 flex gap-4">
        <Link
          href="/agent"
          className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Agent Dashboard
        </Link>
        <a
          href="https://github.com/Warchildwages/Luna"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-white/20 px-6 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5"
        >
          GitHub
        </a>
      </div>

      <div className="mt-16 grid max-w-2xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-medium text-indigo-300">Discover</h3>
          <p className="mt-2 text-xs text-slate-400">Find any event. Tell Luna what you're into.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-medium text-indigo-300">Buy</h3>
          <p className="mt-2 text-xs text-slate-400">Tickets purchased via x402 micropayments on Casper.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-sm font-medium text-indigo-300">Go</h3>
          <p className="mt-2 text-xs text-slate-400">Check in, transfer, resell. Luna handles the logistics.</p>
        </div>
      </div>
    </div>
  );
}
