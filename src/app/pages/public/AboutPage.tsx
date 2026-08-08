import React from "react";
import { useNavigate } from "react-router";
import { CheckCircle } from "lucide-react";
import { MarketingNav, MarketingFooter, PageHero, IMGS } from "./LandingPage";

function AboutPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <MarketingNav />
      <PageHero title="Why MicroHealth?" subtitle="Nigeria's primary healthcare system is under pressure. We are building a distributed network that brings care closer to the people who need it most." />
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-3xl overflow-hidden h-80 bg-muted" style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.10)" }}>
              <img src={IMGS.clinic} alt="Community care unit" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4" style={{ letterSpacing: "-0.02em" }}>The problem is distance and cost.</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                About 70% of Nigerians rely on primary healthcare, yet only about 20% of over 30,000 Primary Health Centres are fully functional. Most people still pay directly for care, with out-of-pocket spending making up 71% to over 75% of health expenditure.
              </p>
              <ul className="space-y-3">
                {["Access to health services is only 41% of what is feasible", "Nigeria's UHC Social Coverage Index is 38.4%", "Only about 1 doctor for every 5,000 people", "423 million Africans affected by healthcare costs in 2022"].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#E6F7F6" }}>
                      <CheckCircle size={12} style={{ color: "#0F7D7A" }} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl font-bold text-foreground mb-4" style={{ letterSpacing: "-0.02em" }}>Our solution: care where you are.</h2>
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                MicroHealth is building a distributed Point-of-Care (POC) network that makes primary healthcare close, affordable, preventive, and reliable. Instead of depending only on large hospitals or underperforming PHCs, we place small healthcare units directly inside communities, workplaces, schools, estates, markets, and high-traffic neighbourhoods.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                By combining physical care units with a technology operating system, we create a scalable front door to healthcare — helping people receive care early, reduce avoidable hospital visits, prevent complications, and access affordable health support close to where they live and work.
              </p>
            </div>
            <div className="order-1 lg:order-2 rounded-3xl overflow-hidden h-80 bg-muted" style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.10)" }}>
              <img src={IMGS.community} alt="Community member at care unit" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}

export default AboutPage;
