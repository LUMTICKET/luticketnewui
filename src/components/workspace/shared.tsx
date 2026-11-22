"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { BusinessProfile } from "@/lib/auth";
import { workspaceHref } from "@/lib/workspace-nav";
import { Card } from "./ui";
import { useWorkspace } from "./WorkspaceContext";

/** Renders children once the account has a business profile; otherwise explains what to do next. */
export function ProfileGate({
  feature,
  children,
}: {
  feature: string;
  children: (profile: BusinessProfile) => React.ReactNode;
}) {
  const { profile, profileError, reloadProfile, role } = useWorkspace();

  if (profileError) {
    return (
      <Card>
        <h2 className="text-lg font-bold text-navy-950">Couldn&apos;t load your business profile</h2>
        <p className="mt-2 text-sm text-ink-muted">{profileError}</p>
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => void reloadProfile()}>
          Try again
        </Button>
      </Card>
    );
  }

  if (profile === undefined) return <p className="text-sm text-ink-muted">Loading…</p>;

  if (profile === null) {
    return (
      <Card>
        <h2 className="text-lg font-bold text-navy-950">Complete your business profile first</h2>
        <p className="mt-2 text-sm text-ink-muted">
          {feature} belongs to a verified business profile. It only takes a few minutes to set up.
        </p>
        <Link
          href={workspaceHref(role, "profile")}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-gold-500 px-5 text-sm font-semibold text-navy-950 hover:bg-gold-400"
        >
          Set up business profile
        </Link>
      </Card>
    );
  }

  return <>{children(profile)}</>;
}
