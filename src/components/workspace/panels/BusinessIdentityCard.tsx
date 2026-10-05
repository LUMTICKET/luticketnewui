"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getAuthSession } from "@/lib/auth";
import { useWorkspace } from "../WorkspaceContext";

/**
 * The account's permanent identifiers, shown at the top of every workspace.
 *
 * The Business ID is issued by the API at signup and works as a login
 * identifier alongside the email address, so it is displayed prominently and
 * can be copied without hunting through settings.
 */
export function BusinessIdentityCard() {
  const { user } = useWorkspace();
  const [copied, setCopied] = useState(false);
  const [resent, setResent] = useState("");

  if (!user) return null;

  const businessId = user.businessId ?? null;
  const type =
    typeof user.businessType === "object" && user.businessType !== null
      ? user.businessType.name
      : typeof user.businessType === "string"
        ? user.businessType
        : null;

  async function copyId() {
    if (!businessId) return;
    try {
      await navigator.clipboard.writeText(businessId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  /** Re-sends the welcome email carrying the Business ID. */
  async function resend() {
    const session = getAuthSession();
    if (!session?.token || !businessId) return;
    setResent("Sending…");
    try {
      const response = await fetch("/api/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ businessId }),
      });
      setResent(response.ok ? "Sent — check your inbox." : "Could not send it right now.");
    } catch {
      setResent("Could not send it right now.");
    }
    setTimeout(() => setResent(""), 6000);
  }

  return (
    <div className="rounded-2xl border border-line bg-surface-alt p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Business ID</p>
          {businessId ? (
            <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-navy-950">
              {businessId}
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-muted">Not issued yet</p>
          )}
          <p className="mt-1.5 text-xs text-ink-muted">
            Sign in with this ID, your email, or your phone number.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {type ? <Badge tone="success">{type}</Badge> : <Badge tone="warning">No business type</Badge>}
          {businessId && (
            <Button type="button" variant="outline" size="sm" onClick={copyId}>
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        {businessId && (
          <Button type="button" variant="ghost" size="sm" onClick={resend} disabled={Boolean(resent)}>
            Email my Business ID
          </Button>
        )}
        {resent && <span className="text-xs text-ink-muted">{resent}</span>}
      </div>
    </div>
  );
}