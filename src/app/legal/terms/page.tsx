import Link from "next/link";
import { LegalArticle, LegalSection } from "@/components/legal/LegalArticle";

export const metadata = {
  title: "Terms of service — Lumiticket",
};

export default function TermsPage() {
  return (
    <LegalArticle title="Terms of service" updated="12 September 2026">
      <LegalSection title="1. Acceptance of these terms">
        <p>
          These terms govern your use of Lumiticket, a platform operated by
          Lumina Holdings Ltd for bus ticketing, parcel logistics, and event
          ticketing across the SADC region. By creating an account, booking a
          trip, sending a parcel, or buying a ticket through Lumiticket, you
          agree to these terms.
        </p>
      </LegalSection>

      <LegalSection title="2. What Lumiticket is — and isn&apos;t">
        <p>
          Lumiticket connects customers with independently operated bus
          operators, courier operators, event organizers, and retail agents.
          We provide the booking, ticketing, and validation platform;
          transport, delivery, and events themselves are provided by the
          operator or organizer you book with, who is responsible for the
          service delivered.
        </p>
      </LegalSection>

      <LegalSection title="3. Accounts and verification">
        <p>
          Customer accounts require a valid email or mobile number. Operator,
          courier, agent, and organizer accounts additionally require identity
          and business verification (KYC/KYB) before activation — see our{" "}
          <Link href="/legal/kyc" className="font-medium text-navy-950 underline">
            Verification &amp; KYC policy
          </Link>{" "}
          for details. Every staff account under an operator or agent must be
          individually attributable; shared logins are not permitted.
        </p>
      </LegalSection>

      <LegalSection title="4. Bookings, payments, and settlement">
        <ul className="list-disc space-y-1 pl-5">
          <li>Payments are processed by licensed third-party payment gateways and mobile money partners. Lumiticket does not hold customer funds.</li>
          <li>A selected bus seat is held for a limited time (typically 5 minutes) while payment is completed, then released if payment isn&apos;t confirmed.</li>
          <li>Every booking or ticket generates a unique, secure QR code as proof of purchase.</li>
          <li>Funds are split automatically between the operator, platform commission, agent commission, and gateway fees according to each operator&apos;s agreed settlement terms.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Cancellations and refunds">
        <p>
          Cancellation and refund terms are set by the operator or organizer
          for each route, trip, or event, and are shown before you pay.
          Where a payment is confirmed but a booking fails to complete on our
          end, we reconcile the mismatch and issue an automatic refund.
        </p>
      </LegalSection>

      <LegalSection title="6. Validation and use of tickets">
        <p>
          Each ticket or parcel QR code may only be validated once. Validation
          can happen without an internet connection; offline scans are
          queued and reconciled once connectivity resumes, and any conflict
          (such as the same ticket being scanned on two devices) is flagged
          for manual review rather than silently accepted.
        </p>
      </LegalSection>

      <LegalSection title="7. Acceptable use">
        <p>
          You agree not to resell tickets in a way that violates an
          operator&apos;s or organizer&apos;s stated policy, attempt to forge
          or duplicate a QR ticket, misuse another person&apos;s account, or
          interfere with the platform&apos;s normal operation.
        </p>
      </LegalSection>

      <LegalSection title="8. Liability">
        <p>
          Lumiticket is not liable for the acts or omissions of independent
          operators, couriers, or organizers using the platform, beyond our
          role in facilitating booking, payment, and validation. Nothing in
          these terms limits liability that cannot be limited under
          applicable law.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes to these terms">
        <p>
          We may update these terms as the platform evolves. Material changes
          will be communicated in-app or by email before they take effect.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          Questions about these terms can be sent through our{" "}
          <Link href="/contact" className="font-medium text-navy-950 underline">
            contact page
          </Link>
          .
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
