import React from "react";
import { useNavigate } from "react-router";
import { CheckCircle } from "lucide-react";
import { MarketingNav, MarketingFooter, PageHero } from "./LandingPage";

function PricingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <MarketingNav />
      <PageHero title="Simple, Affordable Pricing" subtitle="Multiple ways to pay — because healthcare should not break the bank." />
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Pay Per Visit", price: "From ₦1,500", period: "per visit", features: ["Walk-in or booked consultations", "Vitals check & basic medication", "Digital visit summary", "Referral note when needed"], cta: "Find a Unit", ctaPath: "/patient/login", popular: false },
            { name: "Family Care Plan", price: "₦5,000", period: "per month", features: ["Unlimited primary-care visits", "Vitals tracking", "Prescription refill support", "2 enrolled family members", "Priority appointment slots"], cta: "Enrol Now", ctaPath: "/patient/login", popular: true },
            { name: "Employer / Group Plan", price: "Custom", period: "per group", features: ["On-site or nearby MicroHealth unit", "Employee + dependants coverage", "Monthly health reports", "HMO/insurance integration", "Occupational health screening"], cta: "Talk to Sales", ctaPath: "/contact", popular: false },
          ].map(({ name, price, period, features, cta, ctaPath, popular }) => (
              <div key={name} className="relative rounded-3xl p-6 flex flex-col"
                style={{ background: popular ? "#0F7D7A" : "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: popular ? "none" : "1px solid rgba(0,0,0,0.07)" }}>
                {popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: "#131E33" }}>Most Popular</div>}
                <h3 className="text-lg font-bold mb-1" style={{ color: popular ? "#fff" : "#0D1B2A" }}>{name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold" style={{ color: popular ? "#fff" : "#0D1B2A" }}>{price}</span>
                  <span className="text-sm" style={{ color: popular ? "rgba(255,255,255,0.7)" : "#6B7280" }}>/{period}</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm" style={{ color: popular ? "rgba(255,255,255,0.85)" : "#4B5563" }}>
                      <CheckCircle size={14} className="flex-shrink-0 mt-0.5" style={{ color: popular ? "#A7F3D0" : "#0F7D7A" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: popular ? "#fff" : "linear-gradient(135deg, #0F7D7A, #0A5E5C)", color: popular ? "#0F7D7A" : "#fff" }}
                  onClick={() => navigate(ctaPath)}>
                  {cta}
                </button>
              </div>
            ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-10 max-w-2xl mx-auto">
          We also partner with HMOs, NGOs, and government health programmes to extend access to underserved communities.
          <button className="ml-1 font-semibold" style={{ color: "#0F7D7A" }} onClick={() => navigate("/partners")}>
            Learn about partnerships →
          </button>
        </p>
      </section>
      <MarketingFooter />
    </div>
  );
}

export default PricingPage;
