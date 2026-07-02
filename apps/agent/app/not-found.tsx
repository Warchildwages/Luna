import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-7xl font-light tracking-tight text-slate-600">404</h1>
      <p className="mt-4 text-lg text-slate-400">
        Luna couldn&apos;t find what you&apos;re looking for.
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Maybe try a different endpoint?
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg border border-white/20 px-6 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5"
      >
        Go Home
      </Link>
    </div>
  );
}
