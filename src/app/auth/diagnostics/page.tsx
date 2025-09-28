"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import CapacitorGoogleAuth from '@/lib/capacitor-google-auth';

function useIsWebView() {
  const [isWV, set] = useState(false);
  useEffect(() => {
    const ua = (navigator.userAgent || '').toLowerCase();
    set(/\bwv\b|webview|; wv\)|gsa\//i.test(ua));
  }, []);
  return isWV;
}

export default function AuthDiagnosticsPage() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isWV = useIsWebView();
  const [log, setLog] = useState<string[]>([]);

  const push = (m: string) => setLog((l) => [new Date().toISOString()+" "+m, ...l].slice(0,200));

  const isAuthed = !!session?.user;

  const doGoogle = async () => {
    try {
      push('Starting Google sign-in...');
      // Prefer native idToken flow if available on WebView
      // If native plugin is injected in the page, you could call it here.
      // As a fallback use NextAuth Google provider (OAuth redirect).
      await signIn('google', { callbackUrl: '/home', wv: isWV ? '1' : undefined });
    } catch (e:any) {
      push('Google sign-in error: ' + (e?.message || 'unknown'));
    }
  };

  const doCreds = async () => {
    try {
      push('Starting credentials sign-in...');
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (res?.error) push('Credentials error: ' + res.error);
      else push('Credentials sign-in ok');
    } catch (e:any) {
      push('Credentials sign-in error: ' + (e?.message || 'unknown'));
    }
  };

  const doLogout = async () => {
    push('Signing out...');
    try {
      await CapacitorGoogleAuth.signOut();
      push('Native Google sign-out completed');
    } catch (error: any) {
      push('Native sign-out error: ' + (error?.message || 'unknown'));
    }

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      push('API logout endpoint called');
    } catch (error: any) {
      push('API logout error: ' + (error?.message || 'unknown'));
    }

    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Auth Diagnostics</h1>
      <div className="text-sm">Status: {status} | WebView: {String(isWV)}</div>

      <section className="space-y-2">
        <h2 className="font-semibold">OAuth (Google) Flow</h2>
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={doGoogle}>Sign in with Google</button>
        {session?.oauth && (
          <div className="text-xs mt-2">
            <div>Provider: {session.oauth.provider}</div>
            <div>Scope: {session.oauth.scope || '-'}</div>
            <div>AccessTokenExpires: {session.oauth.accessTokenExpires || '-'}</div>
            <div>HasRefreshToken: {String(session.oauth.hasRefreshToken)}</div>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Credentials Flow</h2>
        <div className="flex flex-col gap-2 max-w-sm">
          <input className="border p-2" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="border p-2" type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="px-3 py-2 bg-emerald-600 text-white rounded" onClick={doCreds}>Sign in</button>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Session</h2>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-64">{JSON.stringify(session, null, 2)}</pre>
        {isAuthed && (
          <button className="px-3 py-2 bg-red-600 text-white rounded" onClick={doLogout}>Logout</button>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Logs</h2>
        <ul className="text-xs space-y-1">
          {log.map((l, i)=> <li key={i}>{l}</li>)}
        </ul>
      </section>
    </div>
  );
}
