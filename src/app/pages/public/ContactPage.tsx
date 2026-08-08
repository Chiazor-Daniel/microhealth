import React from "react";
import { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { MarketingNav, MarketingFooter, PageHero } from "./LandingPage";

function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <MarketingNav />
      <PageHero title="Contact Us" subtitle="Have a question, partnership idea, or investment enquiry? We are listening." />
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            {[
              { icon: Mail, label: "Email", value: "hello@microhealth.ng" },
              { icon: Phone, label: "Phone", value: "+234 801 000 0000" },
              { icon: MapPin, label: "Office", value: "Lagos, Nigeria" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#E6F7F6" }}>
                  <Icon size={18} style={{ color: "#0F7D7A" }} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <form className="bg-white rounded-2xl p-6 space-y-4" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
            onSubmit={e => { e.preventDefault(); setSent(true); }}>
            <div>
              <label className="text-sm font-medium text-foreground">Name</label>
              <input required className="w-full mt-1 px-4 py-2.5 text-sm rounded-lg outline-none"
                style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)" }} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Email</label>
              <input required type="email" className="w-full mt-1 px-4 py-2.5 text-sm rounded-lg outline-none"
                style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)" }} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">How can we help?</label>
              <select className="w-full mt-1 px-4 py-2.5 text-sm rounded-lg outline-none"
                style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)" }}>
                <option>I want care for myself / family</option>
                <option>I want to host a MicroHealth unit</option>
                <option>Employer / group health plan</option>
                <option>Investment enquiry</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Message</label>
              <textarea required rows={4} className="w-full mt-1 px-4 py-2.5 text-sm rounded-lg outline-none resize-none"
                style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)" }} />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 4px 6px -1px rgba(15,125,122,0.35)" }}>
              {sent ? "Message sent — we will be in touch!" : "Send Message"}
            </button>
          </form>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}

export default ContactPage;
