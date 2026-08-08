import React from "react";
import { useNavigate } from "react-router";
import { Building2, Users, Shield, FlaskConical, ArrowRight } from "lucide-react";
import { MarketingNav, MarketingFooter, PageHero } from "./LandingPage";

function PartnersPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <MarketingNav />
      <PageHero title="Partner With Us" subtitle="Join us in building a front door to healthcare for every community." />
      <section className="py-20 px-6" style={{ background: "#F8F9FA" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: Building2, title: "Estate / Market Associations", body: "Host a MicroHealth unit in your estate, market, or high-traffic location. Give residents and traders affordable care within walking distance." },
            { icon: Users, title: "Employers & Cooperatives", body: "Provide primary-care access for staff and members. Reduce sick days, improve productivity, and lower healthcare costs." },
            { icon: Shield, title: "HMOs / Insurance & NGOs", body: "Plug MicroHealth into your network as a low-cost, high-access primary-care entry point and run targeted health programmes." },
            { icon: FlaskConical, title: "Labs, Pharmacies & Diagnostics", body: "Become a referral partner. We route tests, imaging, and specialist follow-ups to trusted local providers." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "#E6F7F6" }}>
                <Icon size={18} style={{ color: "#0F7D7A" }} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4" style={{ letterSpacing: "-0.02em" }}>Interested in partnering?</h2>
          <p className="text-base text-muted-foreground mb-8">Tell us a little about your community, organisation, or facility and we will get back to you within 24 hours.</p>
          <button className="px-8 py-4 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 8px 20px rgba(15,125,122,0.4)" }}
            onClick={() => navigate("/contact")}>
            Contact Our Partnerships Team <ArrowRight size={16} className="inline ml-1" />
          </button>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}

export default PartnersPage;
