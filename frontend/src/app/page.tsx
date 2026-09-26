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
  headerCta,
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
import { getOptionalUser } from "@/lib/api/auth";

const providerNames = providers
  .filter((provider) => provider.name !== "Any compatible API")
  .map((provider) => provider.name);

export default async function LandingPage() {
  const user = await getOptionalUser();
  return (
    <>
      <SiteHeader links={navLinks} cta={headerCta} user={user} />
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
