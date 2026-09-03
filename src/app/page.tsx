import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/home/TrustStrip";
import { PopularRoutes } from "@/components/home/PopularRoutes";
import { TrendingEvents } from "@/components/home/TrendingEvents";
import { HowItWorks } from "@/components/home/HowItWorks";
import { BusinessCTA } from "@/components/home/BusinessCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <PopularRoutes />
      <TrendingEvents />
      <HowItWorks />
      <BusinessCTA />
    </>
  );
}
