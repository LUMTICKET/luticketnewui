// Sends the welcome email that carries the new account's Business ID.
//
// This runs server-side because the Resend key must never reach the browser.
// The Lumticket API has no email endpoint of its own, so the Business ID is
// delivered from here instead.
//
// Requires RESEND_API_KEY. Without it the route reports `configured: false`
// and the caller continues — a mail failure must never block onboarding.
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface WelcomeBody {
  businessId?: string;
  businessType?: string;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  let body: WelcomeBody;
  try {
    body = (await request.json()) as WelcomeBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Welcome email is not configured.", configured: false },
      { status: 503 },
    );
  }

  // The email address is resolved server-side from the caller's own bearer
  // token rather than trusted from the request body, so this route cannot be
  // used to send mail to an arbitrary address.
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Missing access token." }, { status: 401 });
  }

  const businessId = body.businessId?.trim();
  if (!businessId) {
    return NextResponse.json({ error: "A businessId is required." }, { status: 400 });
  }

  const me = await fetch(
    `${(process.env.NEXT_PUBLIC_API_URL || "https://api-gamma-mocha-qn31xem8po.vercel.app").replace(/\/$/, "")}/api/auth/me`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  ).catch(() => null);

  const account = me?.ok ? ((await me.json()) as { email?: string; name?: string | null }) : null;
  const to = account?.email;
  if (!to) {
    return NextResponse.json({ error: "Could not resolve your account email." }, { status: 502 });
  }

  const from = process.env.RESEND_FROM_EMAIL || "Lumticket <onboarding@resend.dev>";
  const typeLabel = body.businessType ? escapeHtml(body.businessType) : "your business";

  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Your Lumticket Business ID: ${businessId}`,
      html: `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f7f5f0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #e5e7eb">
    <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#936e10;font-weight:600">Welcome to Lumticket</p>
    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3">${account.name ? escapeHtml(account.name.split(" ")[0]) : "Your"} account is ready</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#475569">Keep your Business ID safe — you can sign in with it as well as your email address.</p>
    <div style="margin:0 0 24px;padding:20px;background:#f7f5f0;border-radius:12px;text-align:center">
      <p style="margin:0 0 6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;font-weight:600">Business ID</p>
      <p style="margin:0;font-size:26px;font-weight:700;letter-spacing:.06em;color:#0f172a">${escapeHtml(businessId)}</p>
    </div>
    <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b">Business type: ${typeLabel}</p>
  </div>
</body></html>`,
    }),
  }).catch(() => null);

  if (!sent?.ok) {
    // Surfaced as a non-fatal result so the UI can continue onboarding.
    return NextResponse.json({ error: "Could not send the welcome email." }, { status: 502 });
  }

  return NextResponse.json({ sent: true });
}