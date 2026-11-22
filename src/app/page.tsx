import { LinkButton } from "@/components/ui/Button";

export const metadata = {
  title: "Lumticket Business — Event ticketing platform",
  description:
    "Create events, sell tickets, and manage your ticketing business with Lumticket.",
};

export default function Home() {
  return (
    <section className="flex min-h-[calc(100svh-4rem)] items-center bg-navy-950 text-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-gold-400">
            Lumticket for event businesses
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-6xl">
            Your home for creating and selling tickets.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-200">
            Bring your events, ticket sales, and team together in one business workspace.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/signup" variant="accent" size="lg">
              Create a business account
            </LinkButton>
            <LinkButton
              href="/login"
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-navy-950"
            >
              Log in
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
