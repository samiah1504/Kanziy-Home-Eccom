'use client';

import Image from 'next/image';
import { useFormState, useFormStatus } from 'react-dom';
import { login } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-gold w-full disabled:opacity-60">
      {pending ? 'Signing in…' : 'Sign In'}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(login, {});
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <Image src="/logo.png" alt="Kanziy" width={72} height={72} className="mx-auto mb-2" />
          <h1 className="text-xl font-extrabold text-navy">KANZIY</h1>
          <p className="text-xs uppercase tracking-widest text-gold">Staff Portal</p>
        </div>
        <form action={formAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input className="input" id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input className="input" id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          {state?.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}
          <SubmitButton />
        </form>
      </div>
    </main>
  );
}
