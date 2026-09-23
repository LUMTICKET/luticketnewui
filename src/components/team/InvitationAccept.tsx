"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest, getAuthSession, publicApiRequest } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

type InvitationPreview = { email?: string; name?: string; role?: { name?: string } | string; businessName?: string };

export function InvitationAccept({ token }: { token: string }) {
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    // Check auth status on mount (avoids hydration mismatches)
    setSignedIn(Boolean(getAuthSession()));

    publicApiRequest<InvitationPreview>(`/api/team/invitations/${encodeURIComponent(token)}`)
      .then((data) => {
        setPreview(data);
      })
      .catch((requestError) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "This invitation is no longer available."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  async function acceptInvitation() {
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/api/team/invitations/${encodeURIComponent(token)}`, {
        method: "POST",
      });
      setAccepted(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to accept invitation."
      );
    } finally {
      setBusy(false);
    }
  }

  const roleName =
    typeof preview?.role === "string" ? preview.role : preview?.role?.name;

  return (
    <div className="mx-auto flex min-h-[65vh] max-w-lg flex-col justify-center px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">
        Team invitation
      </p>
      <h1 className="mt-2 text-3xl font-bold text-navy-950">
        Join {preview?.businessName || "this business"}
      </h1>

      {loading && (
        <p className="mt-6 text-sm text-ink-muted">Loading invitation details...</p>
      )}

      {error && (
        <p role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {preview && !accepted && (
        <div className="mt-6 rounded-2xl border border-line p-6">
          <p className="text-sm text-ink-muted">This invitation is for</p>
          <p className="mt-1 font-semibold text-navy-950">
            {preview.name || preview.email}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {preview.email}
            {roleName ? ` · ${roleName}` : ""}
          </p>
        </div>
      )}

      {accepted && (
        <p role="status" className="mt-6 rounded-lg bg-success-surface px-4 py-3 text-sm text-success">
          Invitation accepted. You are now a team member.
        </p>
      )}

      {/* Render options once loading finishes */}
      {!loading && !accepted && (
        signedIn ? (
          <Button
            type="button"
            size="lg"
            className="mt-6 w-full"
            disabled={busy}
            onClick={acceptInvitation}
          >
            {busy ? "Accepting..." : "Accept invitation"}
          </Button>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(`/invitations/${token}`)}`}
            className="mt-6 inline-flex h-13 w-full items-center justify-center rounded-full bg-navy-950 px-6 text-base font-semibold text-white"
          >
            Log in to accept
          </Link>
        )
      )}

      {accepted && (
        <Link
          href="/team"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-navy-950 px-5 text-sm font-semibold text-navy-950"
        >
          Open team workspace
        </Link>
      )}
    </div>
  );
}