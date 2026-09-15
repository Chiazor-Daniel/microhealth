import React from "react";
import { Building2, Smartphone, Watch, BookOpen, ArrowRight } from "lucide-react";
import { MarketingNav, MarketingFooter, PageHero } from "./LandingPage";

function SolutionPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <MarketingNav />
      <PageHero
        title="Our Solution"
        subtitle="A connected preventive-healthcare system: MicroBand, MicroHealth App, and Point-of-Care units — so people act earlier and care follows real demand."
      />
      <section className="py-20 px-6" style={{ background: "#F8F9FA" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              { icon: Watch, title: "MicroBand", body: "Continuous and regular vital monitoring so health signals are captured before they become emergencies." },
              { icon: Smartphone, title: "MicroHealth App", body: "Health tracking, risk awareness, records, AI-guided insights, and connection to physical care when you need it." },
              { icon: Building2, title: "Point of Care", body: "Affordable community care units deployed where real monitoring and demand data show healthcare is needed." },
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

          <h2 className="text-3xl font-bold text-foreground mb-8 text-center" style={{ letterSpacing: "-0.02em" }}>From signal to care</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-16">
            {[
              { step: "1", title: "Monitor", body: "MicroBand captures vitals and trends." },
              { step: "2", title: "Detect", body: "Risk patterns surface early." },
              { step: "3", title: "Understand", body: "App + AI explain what matters." },
              { step: "4", title: "Act", body: "Guidance prompts earlier action." },
              { step: "5", title: "Access care", body: "Point-of-Care delivers physical care." },
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

          <div className="bg-white rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-start"
            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.08)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#E6F7F6" }}>
              <BookOpen size={18} style={{ color: "#0F7D7A" }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Prevention starts with awareness</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                We educate and sensitise communities on preventive care, early detection, and healthy living — turning monitoring into lasting behaviour change.
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Public health education is part of the system, not an add-on <ArrowRight size={12} />
              </p>
            </div>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}

export default SolutionPage;
