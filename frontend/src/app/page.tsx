import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Lenses } from "@/components/landing/lenses";
import { Models } from "@/components/landing/models";
import { SampleReport } from "@/components/landing/sample-report";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import {
  finalCta,
  footer,
  hero,
  heroEditor,
  lenses,
  models,
  navLinks,
  providers,
  REPO_URL,
  steps,
} from "@/content/landing";
import { sampleReview } from "@/content/sample-review";

const providerNames = providers
  .filter((provider) => provider.name !== "Any compatible API")
  .map((provider) => provider.name);

export default function LandingPage() {
  return (
    <>
      <SiteHeader links={navLinks} />
      {/* The container's side borders are the page's visible column guides. */}
      <main
        id="main"
        className="mx-auto w-full max-w-[1200px] border-x border-line"
      >
        <Hero {...hero} providerNames={providerNames} editor={heroEditor} />
        <HowItWorks steps={steps} />
        <Lenses lenses={lenses} />
        <Models {...models} providers={providers} />
        <SampleReport review={sampleReview} />
        <FinalCta {...finalCta} />
      </main>
      <SiteFooter {...footer} links={navLinks} repoUrl={REPO_URL} />
    </>
  );
}
