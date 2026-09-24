import {
  BusinessRolePage,
  type BusinessRoleContent,
} from "@/components/business/BusinessRolePage";

export const metadata = {
  title: "For bus operators — Lumiticket",
  description:
    "List your routes on Lumiticket, manage your fleet, and get paid out automatically across the SADC region.",
};

const content: BusinessRoleContent = {
  eyebrow: "For bus operators",
  title: "List your routes and fill every seat",
  intro:
    "Reach travellers searching for routes across the SADC region. Manage your fleet, schedules, and seat inventory from one dashboard, and get paid out automatically after every trip.",
  benefits: [
    {
      title: "Live seat inventory",
      body: "Seats update in real time across every sales channel — your counter, agents, and the app never oversell a trip.",
    },
    {
      title: "Automatic payouts",
      body: "Fares settle to your account on a schedule you choose, with a clear statement for every trip and route.",
    },
    {
      title: "Offline-ready apps",
      body: "Driver and conductor apps keep validating tickets without signal, syncing automatically once reconnected.",
    },
    {
      title: "Route analytics",
      body: "See occupancy, no-shows, and demand by route and time slot to plan schedules and pricing with confidence.",
    },
  ],
  steps: [
    {
      title: "Apply & verify",
      body: "Submit your transport licence, TPIN, and vehicle documents. Our team verifies your business within 1–3 days.",
    },
    {
      title: "Add your fleet",
      body: "Register your buses, routes, and departure schedules, and set fares per route and seat class.",
    },
    {
      title: "Go live",
      body: "Your routes appear in search across the app and website. Agents can also sell your seats in person.",
    },
    {
      title: "Get paid",
      body: "Receive automatic payouts on your chosen schedule, with a settlement statement for every departure.",
    },
  ],
  requirements: [
    "Transport operator licence & TPIN",
    "Vehicle registration & roadworthiness certificates",
    "Signed settlement agreement with Lumiticket",
    "Fleet and route details, including departure schedules",
    "A bank account or mobile money wallet for payouts",
  ],
  payout: "Payouts are settled per trip to your linked bank account or mobile money wallet, net of the Lumiticket service fee. You can track every settlement from your operator dashboard.",
  faqs: [
    {
      question: "How long does verification take?",
      answer:
        "Most operators are verified within 1–3 business days once all documents are submitted correctly.",
    },
    {
      question: "Can I still sell tickets at my own counter?",
      answer:
        "Yes — your counter, retail agents, and the Lumiticket app all draw from the same live seat inventory, so seats never oversell.",
    },
    {
      question: "What happens if a trip is cancelled?",
      answer:
        "You can cancel a departure from your dashboard; affected passengers are refunded automatically according to the refund policy on file.",
    },
    {
      question: "Is there a setup fee?",
      answer:
        "No setup fee — Lumiticket earns a service fee per ticket sold, deducted before payout.",
    },
  ],
};

export default function BusOperatorsPage() {
  return <BusinessRolePage content={content} />;
}
