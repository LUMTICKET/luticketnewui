import { LegalArticle, LegalSection } from "@/components/legal/LegalArticle";

export const metadata = {
  title: "Verification & KYC policy — Lumiticket",
};

export default function KycPolicyPage() {
  return (
    <LegalArticle title="Verification &amp; KYC policy" updated="12 September 2026">
      <LegalSection title="Why we verify operators and agents">
        <p>
          Every bus operator, courier operator, retail/POS agent, and event
          organizer completes identity verification (KYC) and, where
          applicable, business verification (KYB) before their account is
          activated. This keeps payouts and tickets trustworthy for everyone
          who books through Lumiticket, and it&apos;s enforced automatically —
          no operator, courier, agent, or organizer account goes live without
          it.
        </p>
      </LegalSection>

      <LegalSection title="Bus operators">
        <ul className="list-disc space-y-1 pl-5">
          <li>Business registration certificate, transport operator license, TPIN, and proof of business address.</li>
          <li>Vehicle registration and roadworthiness certificate per vehicle, plus public service vehicle insurance.</li>
          <li>Individual ID and address verification for the authorized signatory.</li>
          <li>A bank or mobile money account matching the legal/business name, and a signed settlement agreement.</li>
          <li>Individually attributable staff accounts per role — operations manager, booking officer, finance officer, dispatcher, and ticket inspector.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Courier operators">
        <ul className="list-disc space-y-1 pl-5">
          <li>Account type: sole driver/courier, or fleet/logistics company.</li>
          <li>National ID or driver&apos;s license, a courier operating license (domestic, inter-city, or international as applicable), and TPIN if registered.</li>
          <li>Vehicle or motorcycle registration, a valid license per operator, and declared operating zones.</li>
          <li>A payout account in the operator&apos;s or company&apos;s legal name, and Goods-in-Transit insurance above a defined declared parcel value.</li>
          <li>Signed liability terms for lost, damaged, or stolen parcels, and acknowledgement of the prohibited-items policy.</li>
          <li>Automated tracking of license and registration expiry, with automatic account suspension on lapse.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Retail / POS agents">
        <ul className="list-disc space-y-1 pl-5">
          <li>Business or trading registration (or sole-trader registration), TPIN, and proof of premises address.</li>
          <li>Individual ID and address verification, with photograph or biometric capture at onboarding.</li>
          <li>A bank or mobile money account for daily settlement, an agreed cash-handling/float limit, and a signed agent agreement covering commission and cash-discrepancy liability.</li>
          <li>POS device registration bound to the agent&apos;s account, daily transaction limits, and individually attributable staff accounts where the agent has employees.</li>
          <li>Retail/POS agents are assigned the highest risk tier by default, given direct cash handling, and undergo periodic re-verification rather than a one-time check.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Event organizers">
        <ul className="list-disc space-y-1 pl-5">
          <li>Account type: individual or registered company, with the legal/company name matching official ID.</li>
          <li>National ID or passport; business registration certificate and TPIN for corporate organizers.</li>
          <li>OTP-verified phone, and a bank or mobile money account matching the legal/business name.</li>
          <li>A social media or track-record check, a venue/council approval letter per listed event, and local permits where required.</li>
          <li>A signed settlement agreement including refund/cancellation policy, and a defined advance-settlement limit for presale revenue.</li>
          <li>Individually attributable staff accounts for entry/scanning staff, distinct from listing-management permissions.</li>
          <li>First-time organizers receive enhanced verification; recurring, previously verified organizers receive lighter-touch re-verification.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Review, approval, and ongoing checks">
        <p>
          A KYC reviewer checks submitted documents and approves, rejects, or
          requests re-verification. Settlement payouts are only enabled once
          the bank or mobile money account name matches the verified legal or
          business registration name. License, vehicle registration, and
          insurance expiry dates are tracked automatically, with accounts
          flagged or suspended on expiry. Every verification decision —
          status, reviewer, and timestamp — is kept in an audit trail.
        </p>
      </LegalSection>

      <LegalSection title="Individually attributable accounts">
        <p>
          Every staff account operating under an operator, courier, agent, or
          organizer is individually attributable. Shared logins are not
          permitted, for any role, under any account.
        </p>
      </LegalSection>
    </LegalArticle>
  );
}
