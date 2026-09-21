"use client";

import { useCallback, useEffect, useState } from "react";

type Session = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  device: { name: string | null } | null;
  expires: string;
  createdAt: string;
  isCurrent: boolean;
};

type Device = {
  id: string;
  name: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  isTrusted: boolean;
  lastUsedAt: string;
  _count: { sessions: number };
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export default function SecurityPage() {
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [twoFA, setTwoFA] = useState<{ enabled: boolean; hasBackupCodes: boolean } | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [u, fa, s, d] = await Promise.all([
        api<{ user: any }>("/api/auth"),
        api<{ enabled: boolean; hasBackupCodes: boolean }>("/api/auth/2fa"),
        api<{ sessions: Session[] }>("/api/auth/sessions"),
        api<{ devices: Device[] }>("/api/auth/devices"),
      ]);
      setUser(u.user);
      setTwoFA(fa);
      setSessions(s.sessions);
      setDevices(d.devices);
    } catch (e: any) {
      setError(e.message ?? "Failed to load account data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!user) return <p className="text-sm text-slate-500">Not signed in.</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account security</h1>
        <p className="mt-1 text-sm text-slate-500">
          Signed in as <span className="font-medium text-slate-700">{user.email}</span>
        </p>
      </div>

      <TwoFactorSection
        twoFA={twoFA}
        email={user.email}
        onChanged={() => load()}
      />

      <SessionsSection
        sessions={sessions}
        onChanged={() => load()}
      />

      <DevicesSection
        devices={devices}
        onChanged={() => load()}
      />
    </div>
  );
}

function TwoFactorSection({
  twoFA,
  email,
  onChanged,
}: {
  twoFA: { enabled: boolean; hasBackupCodes: boolean } | null;
  email: string;
  onChanged: () => void;
}) {
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function startSetup() {
    setErr(null);
    setBusy(true);
    try {
      const data = await api<{ secret: string; uri: string }>("/api/auth/2fa/setup");
      setSetup(data);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function enable() {
    setErr(null);
    setBusy(true);
    try {
      const data = await api<{ ok: boolean; backupCodes: string[] }>("/api/auth/2fa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      setBackupCodes(data.backupCodes);
      setSetup(null);
      setCode("");
      onChanged();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setErr(null);
    setBusy(true);
    try {
      await api("/api/auth/2fa", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      setCode("");
      onChanged();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Two-factor authentication</h2>
          <p className="mt-1 text-sm text-slate-500">
            {twoFA?.enabled ? "Enabled — your account is protected." : "Add a TOTP app for extra security."}
          </p>
        </div>
        <span className={`badge ${twoFA?.enabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
          {twoFA?.enabled ? "On" : "Off"}
        </span>
      </div>

      {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}

      {!twoFA?.enabled && !setup ? (
        <button onClick={startSetup} className="btn-primary mt-4" disabled={busy}>
          {busy ? "Preparing…" : "Set up 2FA"}
        </button>
      ) : null}

      {setup ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-600">
            Scan this QR code in your authenticator app, then enter the 6-digit code.
          </p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <div className="break-all">{setup.uri}</div>
            <div className="mt-2 font-mono">Secret: {setup.secret}</div>
          </div>
          <div className="flex gap-2">
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
            />
            <button onClick={enable} className="btn-primary" disabled={busy || code.length !== 6}>
              Enable
            </button>
          </div>
        </div>
      ) : null}

      {twoFA?.enabled ? (
        <div className="mt-4 flex items-end gap-2">
          <div className="flex-1">
            <label className="label">Confirm with code to disable</label>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
            />
          </div>
          <button onClick={disable} className="btn-secondary" disabled={busy || code.length !== 6}>
            Disable 2FA
          </button>
        </div>
      ) : null}

      {backupCodes ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-800">Save these backup codes</p>
          <p className="text-xs text-amber-700">Each works once if you lose your device.</p>
          <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-sm text-amber-900">
            {backupCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function SessionsSection({ sessions, onChanged }: { sessions: Session[]; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function revoke(id: string | null) {
    setErr(null);
    setBusy(id ?? "all");
    try {
      const url = id ? `/api/auth/sessions?sessionId=${id}` : "/api/auth/sessions";
      await api(url, { method: "DELETE" });
      onChanged();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Active sessions</h2>
        <button onClick={() => revoke(null)} className="btn-ghost text-sm" disabled={busy === "all"}>
          {busy === "all" ? "Signing out…" : "Log out all others"}
        </button>
      </div>
      {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
      <ul className="mt-4 divide-y divide-slate-100">
        {sessions.map((s) => (
          <li key={s.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">
                {s.device?.name ?? s.userAgent ?? "Unknown device"}
                {s.isCurrent ? <span className="ml-2 badge bg-brand-100 text-brand-700">This device</span> : null}
              </p>
              <p className="text-xs text-slate-500">
                {s.ipAddress ?? "Unknown IP"} · {new Date(s.createdAt).toLocaleString()}
              </p>
            </div>
            {!s.isCurrent ? (
              <button
                onClick={() => revoke(s.id)}
                className="btn-ghost text-sm text-red-600"
                disabled={busy === s.id}
              >
                {busy === s.id ? "Revoking…" : "Revoke"}
              </button>
            ) : null}
          </li>
        ))}
        {sessions.length === 0 ? <li className="py-3 text-sm text-slate-500">No sessions found.</li> : null}
      </ul>
    </section>
  );
}

function DevicesSection({ devices, onChanged }: { devices: Device[]; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function trust(id: string) {
    setErr(null);
    setBusy(id);
    try {
      await api(`/api/auth/devices`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deviceId: id }),
      });
      onChanged();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function revoke(id: string) {
    setErr(null);
    setBusy(id);
    try {
      await api(`/api/auth/devices?deviceId=${id}`, { method: "DELETE" });
      onChanged();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="card p-6">
      <h2 className="font-semibold text-slate-900">Trusted devices</h2>
      {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
      <ul className="mt-4 divide-y divide-slate-100">
        {devices.map((d) => (
          <li key={d.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-slate-800">
                {d.name ?? d.userAgent ?? "Unknown device"}
                {d.isTrusted ? (
                  <span className="ml-2 badge bg-green-100 text-green-700">Trusted</span>
                ) : null}
              </p>
              <p className="text-xs text-slate-500">
                {d.ipAddress ?? "Unknown IP"} · {d._count.sessions} session(s) ·{" "}
                last used {new Date(d.lastUsedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              {!d.isTrusted ? (
                <button onClick={() => trust(d.id)} className="btn-ghost text-sm" disabled={busy === d.id}>
                  {busy === d.id ? "…" : "Trust"}
                </button>
              ) : null}
              <button onClick={() => revoke(d.id)} className="btn-ghost text-sm text-red-600" disabled={busy === d.id}>
                {busy === d.id ? "…" : "Revoke"}
              </button>
            </div>
          </li>
        ))}
        {devices.length === 0 ? <li className="py-3 text-sm text-slate-500">No devices found.</li> : null}
      </ul>
    </section>
  );
}
