import { SearchBand } from "@/components/search/SearchBand";
import { ModuleSearchBar } from "@/components/search/ModuleSearchBar";
import { TrustStrip } from "@/components/home/TrustStrip";
import { PopularRoutes } from "@/components/home/PopularRoutes";
import { HowItWorks } from "@/components/home/HowItWorks";
import { BusinessCTA } from "@/components/home/BusinessCTA";

export default function Home() {
  return (
    <>
      <SearchBand>
        <ModuleSearchBar module="bus" />
      </SearchBand>
      <PopularRoutes />
      <TrustStrip />
      <HowItWorks />
      <BusinessCTA />
    </>
  );
}
