import {
  BusinessRolePage,
  type BusinessRoleContent,
} from "@/components/business/BusinessRolePage";

export const metadata = {
  title: "For event organizers — Lumiticket",
  description:
    "Create events, set ticket types, and validate entry at the gate — all from one Lumiticket dashboard.",
};

const content: BusinessRoleContent = {
  eyebrow: "For event organizers",
  title: "Sell tickets and manage entry from one dashboard",
  intro:
    "Create your event, set up ticket types and pricing tiers, and watch sales come in live. On the day, validate every ticket at the gate with an app that works even without signal.",
  benefits: [
    {
      title: "Flexible ticket types",
      body: "Set up general admission, VIP, or tiered pricing, with sales windows and quantity limits per type.",
    },
    {
      title: "Offline gate scanning",
      body: "Validate QR tickets at the door even without signal — scans sync automatically once reconnected.",
    },
    {
      title: "Live sales dashboard",
      body: "Track tickets sold, revenue, and remaining capacity in real time as your event approaches.",
    },
    {
      title: "Fast payouts",
      body: "Receive your event proceeds shortly after the event closes, with a full sales statement.",
    },
  ],
  steps: [
    {
      title: "Apply & verify",
      body: "Submit your national ID or business registration; verification typically completes within 1–3 days.",
    },
    {
      title: "Create your event",
      body: "Add your event details, venue, ticket types, pricing, and sales windows.",
    },
    {
      title: "Sell tickets",
      body: "Your event goes live for sale through the app and website, with real-time capacity tracking.",
    },
    {
      title: "Scan & get paid",
      body: "Validate tickets at the gate with the scanner app, then receive your payout after the event closes.",
    },
  ],
  requirements: [
    "National ID or business registration",
    "Venue or council approval for the specific event",
    "Refund & cancellation policy on file with Lumiticket",
    "Event details: date, venue, capacity, and ticket types",
    "A bank account or mobile money wallet for payouts",
  ],
  payout: "Payouts are released after your event closes, once any refund window has passed, to your linked bank account or mobile money wallet, net of the Lumiticket service fee.",
  faqs: [
    {
      question: "Can I offer multiple ticket types for one event?",
      answer:
        "Yes — set up general admission, VIP, or any tiered pricing you need, each with its own quantity limit and sales window.",
    },
    {
      question: "Does gate scanning need internet access?",
      answer:
        "No — the scanner app validates tickets offline and syncs scan records automatically once it reconnects.",
    },
    {
      question: "What if I need to cancel or postpone an event?",
      answer:
        "You can update or cancel an event from your dashboard; ticket holders are notified and refunded according to the policy you filed.",
    },
    {
      question: "When do I receive my payout?",
      answer:
        "Payouts release shortly after your event closes, once any applicable refund window has passed.",
    },
  ],
};

export default function EventOrganizersPage() {
  return <BusinessRolePage content={content} />;
}
