import React from "react";
import { Building2, SmartphoneNfc, Users, Info } from "lucide-react";
import { MarketingNav, MarketingFooter, PageHero } from "./LandingPage";

function SolutionPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <MarketingNav />
      <PageHero title="Our Solution" subtitle="A hybrid model of physical Point-of-Care units powered by the MicroHealth operating system." />
      <section className="py-20 px-6" style={{ background: "#F8F9FA" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {[
              { icon: Building2, title: "Physical Point-of-Care Units", body: "Small, standardised care units placed close to where people live, work, worship, study, and trade — including residential communities, markets, schools, estates, transport hubs, SME clusters, and worker communities." },
              { icon: SmartphoneNfc, title: "MicroHealth Operating System", body: "Software that manages patient registration, visits, vitals, consultation records, prescriptions, inventory, referrals, follow-ups, and daily reporting across every unit in the network." },
              { icon: Users, title: "Community-Led Partnerships", body: "We acquire patients through trusted local partnerships with churches, schools, market associations, estates, employers, cooperatives, pharmacies, labs, and NGOs." },
              { icon: Info, title: "Public Health Education", body: "We educate the public and sensitise communities on preventive care, early detection, and healthy living — turning patients into healthier people." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.10)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "#E6F7F6" }}>
                  <Icon size={18} style={{ color: "#0F7D7A" }} />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center" style={{ letterSpacing: "-0.02em" }}>How a MicroHealth unit works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Locate", body: "Patient finds the nearest MicroHealth unit in their estate, market, or workplace." },
              { step: "2", title: "Register", body: "Quick digital registration on the MicroHealth OS creates a lasting health profile." },
              { step: "3", title: "Consult", body: "A licensed provider checks vitals, diagnoses, prescribes, or refers." },
              { step: "4", title: "Follow up", body: "The patient app sends reminders, refill alerts, and next-visit prompts." },
            ].map(({ step, title, body }) => (
              <div key={step} className="bg-white rounded-2xl p-5 text-center" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white mx-auto mb-3"
                  style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
                  {step}
                </div>
                <h4 className="text-base font-bold text-foreground mb-1">{title}</h4>
                <p className="text-xs text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}

export default SolutionPage;
