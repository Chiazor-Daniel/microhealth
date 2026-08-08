import React from "react";
import { useNavigate } from "react-router";
import { MarketingNav, MarketingFooter, PageHero } from "./LandingPage";

function PitchPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <MarketingNav />
      <PageHero title="Investor Pitch" subtitle="The pitch deck summary: problem, solution, market, model, and ask." />
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="bg-[#F8F9FA] rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-foreground mb-3">The Ask</h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Edustart Tech is asking for <span className="font-bold text-foreground">$100,000 for 5% equity</span> to build and validate the first working MicroHealth Point-of-Care unit, powered by the first version of the MicroHealth operating system, and prove that people will use it regularly and pay for it.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Product & Technology", body: "Infrastructure, cloud services, and development of the software platform. Platform optimization and feature expansion. POC setup in strategic location." },
              { title: "Team Acquisition", body: "Hiring software engineers (frontend & backend), nurses and doctors, subject-matter experts and curriculum consultants." },
              { title: "Growth & Operations", body: "Marketing, sales, and organisation onboarding campaigns. Strategic partnerships with organisations, schools and health stakeholders. Legal, administrative, and operational expenses." },
            ].map(({ title, body }) => (
              <div key={title} className="rounded-2xl p-6" style={{ background: "#F8F9FA" }}>
                <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-foreground">Milestones</h3>
            <div className="space-y-3">
              {[
                { label: "Product Milestone", body: "MicroHealth OS MVP built to manage patient registration, visits, vitals, consultation records, prescriptions, inventory, referrals, follow-ups, and daily reporting." },
                { label: "Operational Milestone", body: "First MicroHealth Point-of-Care pilot unit launched with licensed staff, standardized care protocols, referral partners, and a repeatable unit playbook." },
                { label: "Growth Milestone", body: "First 500–1,000 patients served, 100–300 recurring care members acquired, and 5–10 community/employer partnerships signed." },
              ].map(({ label, body }, i) => (
                <div key={label} className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{label}</p>
                    <p className="text-sm text-muted-foreground">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#131E33] rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Want the full deck?</h3>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.65)" }}>Reach out to our team for the complete MicroHealth pitch deck and financial projections.</p>
            <button className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 4px 6px -1px rgba(15,125,122,0.35)" }}
              onClick={() => navigate("/contact")}>
              Request the Deck
            </button>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}

export default PitchPage;
