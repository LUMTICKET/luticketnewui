import Link from "next/link";
import { LegalArticle, LegalSection } from "@/components/legal/LegalArticle";

export const metadata = {
  title: "Trust & safety — Lumiticket",
};

export default function TrustSafetyPage() {
  return (
    <LegalArticle title="Trust &amp; safety" updated="12 September 2026">
      <LegalSection title="Verified operators, couriers, agents, and organizers">
        <p>
          Every bus operator, courier operator, retail/POS agent, and event
          organizer completes identity and business verification before
          their account is activated — see our{" "}
          <Link href="/legal/kyc" className="font-medium text-navy-950 underline">
            Verification &amp; KYC policy
          </Link>{" "}
          for exactly what&apos;s required for each role.
        </p>
      </LegalSection>

      <LegalSection title="Secure, forgery-resistant tickets">
        <p>
          Every bus and event ticket is a uniquely coded QR ticket that can
          only be validated once. Validation works even without a signal —
          offline scans are queued and reconciled once connectivity returns,
          and a ticket scanned twice (for example on two different devices)
          is flagged for manual review rather than silently accepted.
        </p>
      </LegalSection>

      <LegalSection title="Payment security">
        <p>
          Payments are processed by licensed third-party payment gateways
          and mobile money partners. Lumiticket does not store raw payment
          card data, and does not hold customer funds directly.
        </p>
      </LegalSection>

      <LegalSection title="Account security">
        <p>
          Every staff account operating under an operator, courier, agent,
          or organizer is individually attributable — shared logins
          aren&apos;t permitted for any role. Keep your own login details
          private, and use a strong, unique password.
        </p>
      </LegalSection>

      <LegalSection title="Accessibility">
        <p>
          Customer-facing and retail-agent interfaces meet WCAG 2.1 AA as a
          baseline, with particular attention to color contrast and
          tap-target sizing. The retail-agent and driver apps are further
          optimized for low-end Android devices and bright outdoor lighting
          conditions.
        </p>
      </LegalSection>

      <LegalSection title="Report a concern">
        <p>
          If something doesn&apos;t look right — a suspicious listing, a
          ticket you believe is fraudulent, or a safety issue with an
          operator, courier, or organizer —{" "}
          <Link href="/contact" className="font-medium text-navy-950 underline">
            contact us
          </Link>{" "}
          and we&apos;ll look into it.
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
