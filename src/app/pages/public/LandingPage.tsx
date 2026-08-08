import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Heart, ArrowRight, Building2, Star, Activity, BarChart3,
  ClipboardList, Users, LayoutDashboard, Calendar, Pill,
  FlaskConical, Bell, FileText, MessageSquare, User, Home,
  CheckCircle, MapPin,
} from "lucide-react";

export const IMGS = {
  hero:       "https://images.unsplash.com/photo-1622253694238-3b22139576c6?w=1400&h=900&fit=crop&auto=format",
  heroAlt:    "https://images.unsplash.com/photo-1678695972687-033fa0bdbac9?w=900&h=1100&fit=crop&auto=format",
  clinic:     "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=700&h=480&fit=crop&auto=format",
  docLaptop:  "https://images.unsplash.com/photo-1642929426263-caf1617ced29?w=700&h=480&fit=crop&auto=format",
  equipment:  "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=700&h=480&fit=crop&auto=format",
  community:  "https://images.unsplash.com/photo-1565090568947-7293970ba471?w=900&h=600&fit=crop&auto=format",
  pharmacy:   "https://images.unsplash.com/photo-1569830904560-2afd7062213c?w=700&h=480&fit=crop&auto=format",
  doc1:       "https://images.unsplash.com/photo-1536064479547-7ee40b74b807?w=200&h=200&fit=crop&auto=format",
  doc2:       "https://images.unsplash.com/photo-1678695972687-033fa0bdbac9?w=200&h=200&fit=crop&auto=format",
  doc3:       "https://images.unsplash.com/photo-1622253694242-abeb37a33e97?w=200&h=200&fit=crop&auto=format",
};

const BTN_SHADOW = "0 4px 6px -1px rgba(15,125,122,0.3)";

export function MarketingNav() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  if (typeof window !== "undefined") {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
  }
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{ background: scrolled ? "rgba(255,255,255,0.95)" : "#0D1520", backdropFilter: scrolled ? "blur(12px)" : "none", borderBottom: scrolled ? "1px solid rgba(0,0,0,0.07)" : "1px solid rgba(255,255,255,0.07)" }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
            <Heart size={16} color="#fff" />
          </div>
          <span className="text-lg font-bold" style={{ color: scrolled ? "#0D1B2A" : "#fff" }}>MicroHealth</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Why MicroHealth", path: "/about" },
            { label: "Our Solution", path: "/solution" },
            { label: "Pricing", path: "/pricing" },
            { label: "Partner With Us", path: "/partners" },
          ].map(({ label, path }) => (
            <button key={label} onClick={() => navigate(path)}
              className="text-sm font-medium transition-colors"
              style={{ color: scrolled ? "#4B5563" : "rgba(255,255,255,0.85)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#0F7D7A")}
              onMouseLeave={e => (e.currentTarget.style.color = scrolled ? "#4B5563" : "rgba(255,255,255,0.85)")}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button className="text-sm font-medium px-4 py-2 rounded-lg transition-all"
            style={{ color: scrolled ? "#0F7D7A" : "#fff", background: scrolled ? "#E6F7F6" : "rgba(255,255,255,0.12)" }}
            onClick={() => navigate("/login")}>
            Staff Login
          </button>
          <button className="text-sm font-semibold px-4 py-2 rounded-lg transition-all text-white"
            style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 4px 6px -1px rgba(15,125,122,0.35)" }}
            onClick={() => navigate("/patient/login")}>
            Patient Portal
          </button>
        </div>
      </div>
    </nav>
  );
}

export function MarketingFooter() {
  const navigate = useNavigate();
  return (
    <footer className="py-14 px-6" style={{ background: "#0D1520" }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4 cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
                <Heart size={16} color="#fff" />
              </div>
              <span className="text-lg font-bold text-white">MicroHealth</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)", maxWidth: 240 }}>
              A Point-of-Care network making primary healthcare close, affordable, and accessible to everyday Nigerians.
            </p>
          </div>
          {[
            { title: "Product", links: [{ l: "Why MicroHealth", p: "/about" }, { l: "Our Solution", p: "/solution" }, { l: "Pricing", p: "/pricing" }, { l: "For Patients", p: "/patient/login" }, { l: "For Providers", p: "/login" }] },
            { title: "Company", links: [{ l: "About Us", p: "/about" }, { l: "Pitch / Investors", p: "/pitch" }, { l: "Careers", p: "#" }, { l: "Press", p: "#" }, { l: "Contact", p: "/contact" }] },
            { title: "Support", links: [{ l: "Documentation", p: "#" }, { l: "Help Centre", p: "#" }, { l: "Status Page", p: "#" }, { l: "Partner With Us", p: "/partners" }] },
          ].map(({ title, links }) => (
            <div key={title}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>{title}</p>
              <div className="space-y-2.5">
                {links.map(({ l, p }) => (
                  <button key={l} onClick={() => navigate(p)}
                    className="block text-sm text-left transition-colors w-full"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#36A09D")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-8 flex-wrap gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>© 2026 MicroHealth Technologies Ltd. Built for Nigeria. Scaling across Africa.</p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(l => (
              <a key={l} href="#" className="text-xs transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PageHero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="pt-32 pb-16 px-6" style={{ background: "#131E33" }}>
      <div className="max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
          style={{ background: "rgba(15,125,122,0.2)", color: "#36A09D", border: "1px solid rgba(15,125,122,0.3)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#36A09D] animate-pulse" />
          MicroHealth
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4" style={{ letterSpacing: "-0.02em" }}>{title}</h1>
        <p className="text-base max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.65)" }}>{subtitle}</p>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  if (typeof window !== "undefined") {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Work Sans', sans-serif" }}>

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ background: scrolled ? "rgba(255,255,255,0.95)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none", borderBottom: scrolled ? "1px solid rgba(0,0,0,0.07)" : "none" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
              <Heart size={16} color="#fff" />
            </div>
            <span className="text-lg font-bold text-white" style={{ color: scrolled ? "#0D1B2A" : "#fff" }}>MicroHealth</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Why MicroHealth", path: "/about" },
              { label: "Our Solution", path: "/solution" },
              { label: "Pricing", path: "/pricing" },
              { label: "Partner With Us", path: "/partners" },
            ].map(({ label, path }) => (
              <button key={label} onClick={() => navigate(path)}
                className="text-sm font-medium transition-colors"
                style={{ color: scrolled ? "#4B5563" : "rgba(255,255,255,0.85)" }}
                onMouseEnter={e => (e.currentTarget.style.color = scrolled ? "#0F7D7A" : "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = scrolled ? "#4B5563" : "rgba(255,255,255,0.85)")}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden md:block text-sm font-medium px-4 py-2 rounded-lg transition-all"
              style={{ color: scrolled ? "#0F7D7A" : "#fff", background: scrolled ? "#E6F7F6" : "rgba(255,255,255,0.12)" }}
              onClick={() => navigate("/login")}>Staff Login</button>
            <button className="text-sm font-semibold px-4 py-2 rounded-lg transition-all text-white"
              style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 4px 6px -1px rgba(15,125,122,0.35)" }}
              onClick={() => navigate("/patient/login")}>Patient Portal</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "#0D1520" }}>
        <div className="absolute inset-0">
          <img src={IMGS.hero} alt="MicroHealth physician" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(105deg, rgba(13,21,32,0.97) 0%, rgba(13,21,32,0.8) 45%, rgba(13,21,32,0.3) 100%)" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 w-full pt-24 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
                style={{ background: "rgba(15,125,122,0.2)", color: "#36A09D", border: "1px solid rgba(15,125,122,0.3)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#36A09D] animate-pulse" />
                Affordable primary care, closer to you.
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
                style={{ letterSpacing: "-0.02em" }}>
                Healthcare that
                <br />meets you where
                <br />
                <span style={{ background: "linear-gradient(90deg, #36A09D, #4CAF50)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  you live & work.
                </span>
              </h1>
              <p className="text-lg leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.65)", maxWidth: 480 }}>
                MicroHealth is building a distributed network of small Point-of-Care units inside communities, workplaces, schools, and estates — combined with a digital operating system that makes primary care close, affordable, and preventive.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <button className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 8px 20px rgba(15,125,122,0.4)" }}
                  onClick={() => navigate("/patient/login")}>
                  Find a Care Unit
                  <ArrowRight size={16} />
                </button>
                <button className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ color: "#fff", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                  onClick={() => navigate("/solution")}>
                  See How It Works
                </button>
              </div>

              <div className="flex items-center gap-6 mt-12 flex-wrap">
                {[{ n: "30,000+", l: "PHCs in Nigeria" }, { n: "~20%", l: "Fully functional" }, { n: "71–75%", l: "Out-of-pocket spend" }, { n: "1:5,000", l: "Doctor-to-population" }].map(({ n, l }) => (
                  <div key={l}>
                    <div className="text-2xl font-bold text-white">{n}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:block relative h-[560px]">
              <div className="absolute right-0 top-0 w-72 h-96 rounded-3xl overflow-hidden"
                style={{ boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>
                <img src={IMGS.heroAlt} alt="MicroHealth clinician" className="w-full h-full object-cover" />
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl p-3"
                  style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#E6F7F6" }}>
                      <Activity size={12} style={{ color: "#0F7D7A" }} />
                    </div>
                    <span className="text-xs font-semibold text-foreground">Today's Overview</span>
                  </div>
                  <div className="flex gap-4">
                    {[{ v: "—", l: "Appointments" }, { v: "—", l: "Critical" }, { v: "—", l: "Recovery" }].map(({ v, l }) => (
                      <div key={l}><div className="text-sm font-bold text-foreground">{v}</div><div className="text-[10px] text-muted-foreground">{l}</div></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute left-0 bottom-8 w-60 h-52 rounded-3xl overflow-hidden"
                style={{ boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }}>
                <img src={IMGS.equipment} alt="Medical equipment" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,94,92,0.85) 0%, transparent 60%)" }} />
                <div className="absolute bottom-3 left-4">
                  <p className="text-xs font-semibold text-white">Lab & Diagnostics</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.7)" }}>Live lab tracking on the OS</p>
                </div>
              </div>
              <div className="absolute left-16 top-8 flex items-center gap-2 px-3 py-2 rounded-full"
                style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-foreground">All systems operational</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: "linear-gradient(to bottom, transparent, #fff)" }} />
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-8">Built for communities, workplaces, schools, estates, and markets across Nigeria</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {["Residential Estates", "Public Markets", "Workplaces", "Schools", "Religious Centres", "Transport Hubs"].map(name => (
              <div key={name} className="flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{ background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: "#E6F7F6" }}>
                  <Building2 size={10} style={{ color: "#0F7D7A" }} />
                </div>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6" style={{ background: "#F8F9FA" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{ background: "#E6F7F6", color: "#0F7D7A" }}>Platform Features</div>
            <h2 className="text-4xl font-bold text-foreground mb-4" style={{ letterSpacing: "-0.02em" }}>
              A front door to healthcare,<br /> where you need it.
            </h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              We combine small, standardised physical care units with a single technology layer so patients get reliable primary care early — and avoid unnecessary hospital visits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { img: IMGS.clinic, title: "Community Point-of-Care Units", body: "Small care units placed inside estates, markets, schools, workplaces, and high-traffic neighbourhoods — staffed, stocked, and close to home.", tag: "Physical Network", color: "#0F7D7A", alt: "Community care unit interior" },
              { img: IMGS.docLaptop, title: "MicroHealth Operating System", body: "One software layer for patient registration, vitals, consultations, prescriptions, inventory, referrals, and daily reporting across every unit.", tag: "Digital OS", color: "#36A09D", alt: "Healthcare worker using the MicroHealth OS" },
              { img: IMGS.community, title: "Preventive, Affordable Care", body: "Pay-per-visit, family subscriptions, and employer plans that reduce out-of-pocket costs while keeping communities healthy.", tag: "Access & Pricing", color: "#4CAF50", alt: "Community member receiving care" },
            ].map(({ img, title, body, tag, color, alt }) => (
              <div key={title} className="bg-white rounded-3xl overflow-hidden transition-all"
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.10)" }}>
                <div className="relative h-52 overflow-hidden bg-muted">
                  <img src={img} alt={alt} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.35))" }} />
                  <span className="absolute bottom-3 left-4 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.92)", color }}>
                    {tag}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                  <button className="flex items-center gap-1.5 text-sm font-semibold mt-4 transition-colors" style={{ color }}
                    onClick={() => navigate("/solution")}>
                    Learn more <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPLIT FEATURE: CLINICAL WORKFLOW ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative rounded-3xl overflow-hidden h-[520px] bg-muted"
            style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.10)" }}>
            <img src={IMGS.pharmacy} alt="MicroHealth care unit staff at work" className="w-full h-full object-cover" />
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">Unit Performance</span>
                <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: "#E6F7F6", color: "#0F7D7A" }}>Live</span>
              </div>
              <div className="space-y-2">
                {[{ ward: "Consultations", pct: 85, color: "#0F7D7A" }, { ward: "Vitals Captured", pct: 92, color: "#36A09D" }, { ward: "Prescriptions Filled", pct: 78, color: "#4CAF50" }].map(({ ward, pct, color }) => (
                  <div key={ward}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{ward}</span><span className="font-medium text-foreground">{pct}%</span></div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: "#E6F7F6", color: "#0F7D7A" }}>For Unit Staff & Administrators</div>
            <h2 className="text-4xl font-bold text-foreground mb-5" style={{ letterSpacing: "-0.02em" }}>
              One operating system,<br />every care unit.
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-8">
              Whether you run one community unit or a network of twenty, MicroHealth OS gives you a shared view of patients, stock, staff, and revenue — in real time.
            </p>
            <div className="space-y-4">
              {[
                { icon: Activity, title: "Vitals & alerts at the point of care", desc: "Capture and escalate critical readings instantly, from any unit." },
                { icon: BarChart3, title: "Revenue & billing analytics", desc: "Track pay-per-visit, subscriptions, and partner programme revenue in one place." },
                { icon: ClipboardList, title: "Inventory & medication control", desc: "Monitor stock across units, flag low items, and log dispensations digitally." },
                { icon: Users, title: "Staff scheduling & tracking", desc: "See who is on duty, how many patients they are managing, and coverage gaps." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#E6F7F6" }}>
                    <Icon size={16} style={{ color: "#0F7D7A" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="flex items-center gap-2 mt-10 px-6 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: BTN_SHADOW }}
              onClick={() => navigate("/admin/dashboard")}>
              Explore the Dashboard <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS BANNER ── */}
      <section className="py-20 px-6" style={{ background: "#131E33" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { n: "$109B", l: "Africa healthcare spend", sub: "Growing to $259B by 2030" },
              { n: "$32.9B", l: "Africa PHC opportunity", sub: "$3.3B in Nigeria alone" },
              { n: "70%", l: "Rely on primary care", sub: "But only ~20% of PHCs work fully" },
              { n: "1:5,000", l: "Doctor ratio", sub: "Care is too far for too many" },
            ].map(({ n, l, sub }) => (
              <div key={l} className="text-center">
                <div className="text-4xl font-bold mb-2" style={{ color: "#36A09D" }}>{n}</div>
                <div className="text-base font-semibold text-white">{l}</div>
                <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{ background: "#E6F7F6", color: "#0F7D7A" }}>How It Works</div>
            <h2 className="text-4xl font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>Care in three simple steps.</h2>
            <p className="text-base text-muted-foreground mt-3 max-w-lg mx-auto">No long queues. No expensive hospitals for every cough. Just fast, affordable primary care where you already are.</p>
          </div>
          <div className="relative">
            <div className="absolute left-6 top-6 bottom-6 w-px hidden lg:block" style={{ background: "rgba(0,0,0,0.07)" }} />
            <div className="space-y-10">
              {[
                { step: "01", title: "Find a MicroHealth unit near you", desc: "Our units live inside estates, markets, schools, workplaces, and transport hubs — so care is rarely more than a few minutes away.", img: IMGS.clinic, alt: "Community care unit" },
                { step: "02", title: "Walk in or book via the patient app", desc: "No appointment? No problem. Walk in, or use the mobile portal to book a visit, see wait times, and get reminders.", img: IMGS.docLaptop, alt: "Staff member using the MicroHealth OS" },
                { step: "03", title: "Get checked, treated, and followed up", desc: "Vitals, consultation, prescription, lab referral, and a digital care plan — all linked to your profile for your next visit.", img: IMGS.equipment, alt: "Medical equipment" },
              ].map(({ step, title, desc, img, alt }, i) => (
                <div key={step} className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
                  <div className="lg:col-span-3 flex gap-6">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white z-10"
                        style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>{step}</div>
                    </div>
                    <div className="pt-2">
                      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
                      <p className="text-base text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </div>
                  <div className="lg:col-span-2 h-44 rounded-2xl overflow-hidden bg-muted"
                    style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
                    <img src={img} alt={alt} className="w-full h-full object-cover" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-6" style={{ background: "#F8F9FA" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{ background: "#E6F7F6", color: "#0F7D7A" }}>From our users</div>
            <h2 className="text-4xl font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>
              Trusted by those who matter most.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { img: IMGS.doc1, name: "Dr. Taiwo Adeyemi", role: "Medical Director, EKO Estate Care Unit", quote: "MicroHealth lets us deliver consistent primary care inside the estate instead of sending every case to a general hospital. Our residents now treat small issues early, before they become expensive emergencies." },
              { img: IMGS.doc2, name: "Dr. Amaka Okafor", role: "Unit Lead, Ikeja Market POC", quote: "The operating system is simple enough for our nurses to use without stress, and the alert workflow has helped us catch two high-BP cases that needed referral the same day." },
              { img: IMGS.doc3, name: "Dr. Chinedu Nwosu", role: "Clinical Supervisor, MicroHealth Network", quote: "Patients love the app. Appointment reminders and prescription refills mean fewer no-shows, and our community partners see the value immediately when enrolment is this easy." },
            ].map(({ img, name, role, quote }) => (
              <div key={name} className="bg-white rounded-3xl p-6 flex flex-col"
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.08)" }}>
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="#0F7D7A" style={{ color: "#0F7D7A" }} />)}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-6">&ldquo;{quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <img src={img} alt={name} className="w-11 h-11 rounded-full object-cover bg-muted flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM PREVIEW ── */}
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>The platform, at a glance.</h2>
            <p className="text-base text-muted-foreground mt-3">Both the staff dashboard and patient portal, side by side.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-3xl overflow-hidden" style={{ background: "#131E33", boxShadow: "0 32px 64px rgba(0,0,0,0.15)", minHeight: 380 }}>
              <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /><span className="w-3 h-3 rounded-full bg-yellow-400" /><span className="w-3 h-3 rounded-full bg-green-500" /></div>
                <span className="text-xs text-center flex-1" style={{ color: "rgba(255,255,255,0.3)" }}>microhealth.ng/admin/dashboard</span>
              </div>
              <div className="flex h-[340px]">
                <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 gap-4" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                  {[LayoutDashboard, Users, Calendar, Activity, Pill].map((Icon, i) => (
                    <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: i === 0 ? "rgba(15,125,122,0.25)" : "transparent" }}>
                      <Icon size={14} style={{ color: i === 0 ? "#36A09D" : "rgba(255,255,255,0.3)" }} />
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-4 space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    {[{ l: "Patients", v: "—", c: "#0F7D7A" }, { l: "Appts", v: "—", c: "#36A09D" }, { l: "Critical", v: "—", c: "#EF4444" }, { l: "Recovery", v: "—", c: "#4CAF50" }].map(({ l, v, c }) => (
                      <div key={l} className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <div className="text-sm font-bold" style={{ color: c }}>{v}</div>
                        <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="text-[10px] mb-2 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Patient Flow — 2026</div>
                    <div className="flex items-end gap-1 h-16">
                      {[55,72,65,80,78,88,84].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 6 ? "#0F7D7A" : "rgba(15,125,122,0.3)" }} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {[{ name: "Eleanor Vance", dept: "Cardiology", s: "#10B981" }, { name: "Marcus Bell", dept: "ICU", s: "#EF4444" }, { name: "Yuki Tanaka", dept: "General", s: "#3B82F6" }].map(({ name, dept, s }) => (
                      <div key={name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: "#E6F7F6", color: "#0F7D7A" }}>{name[0]}</div>
                        <span className="text-[10px] font-medium flex-1" style={{ color: "rgba(255,255,255,0.75)" }}>{name}</span>
                        <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>{dept}</span>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: s }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Staff Dashboard · 1440px</span>
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: "#0F7D7A" }} onClick={() => navigate("/admin/dashboard")}>Open →</button>
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden bg-white flex flex-col"
              style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.10)", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400" /><span className="w-3 h-3 rounded-full bg-yellow-300" /><span className="w-3 h-3 rounded-full bg-green-400" /></div>
                <span className="text-xs text-center flex-1 text-muted-foreground">patient.microhealth.ng</span>
              </div>
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-[180px] rounded-[28px] overflow-hidden" style={{ background: "#F8F9FA", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "6px solid #131E33" }}>
                  <div className="px-3 py-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div><p className="text-[7px] text-muted-foreground">Good morning,</p><p className="text-[9px] font-semibold text-foreground">Yuki Tanaka</p></div>
                      <Bell size={10} className="text-gray-400" />
                    </div>
                  </div>
                  <div className="px-3 pb-3 space-y-2">
                    <div className="rounded-xl p-3" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
                      <p className="text-[7px] font-medium text-white opacity-70">Next appointment</p>
                      <p className="text-[9px] font-bold text-white">Dr. L. Ferreira</p>
                      <p className="text-[7px] text-white opacity-60">10 Jul · 10:00 AM</p>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[Calendar, FlaskConical, Pill, FileText].map((Icon, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 p-1.5 rounded-lg" style={{ background: "#F8F9FA" }}>
                          <Icon size={9} style={{ color: "#0F7D7A" }} />
                          <div className="w-6 h-1 rounded-full bg-muted" />
                        </div>
                      ))}
                    </div>
                    {[Pill, Activity].map((Icon, i) => (
                      <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg" style={{ background: "#F8F9FA" }}>
                        <Icon size={9} style={{ color: "#0F7D7A" }} />
                        <div className="flex-1"><div className="h-1.5 rounded-full bg-muted w-3/4 mb-1" /><div className="h-1 rounded-full bg-muted w-1/2 opacity-60" /></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                    {[Home, Calendar, Activity, MessageSquare, User].map((Icon, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center py-1.5">
                        <Icon size={9} style={{ color: i === 0 ? "#0F7D7A" : "#D1D5DB" }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <span className="text-xs text-muted-foreground">Patient Portal · 375px</span>
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: "#0F7D7A" }} onClick={() => navigate("/patient/home")}>Open →</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0A5E5C 0%, #0F7D7A 50%, #131E33 100%)" }}>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-5" style={{ letterSpacing: "-0.02em" }}>
            Ready to bring MicroHealth<br />to your community?
          </h2>
          <p className="text-base mb-10" style={{ color: "rgba(255,255,255,0.65)" }}>
            Become a patient, partner, or investor. Help us place primary care within reach of every Nigerian.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button className="flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(8px)" }}
              onClick={() => navigate("/patient/login")}>
              Patient Portal
            </button>
            <button className="flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "#fff", color: "#0F7D7A", boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }}
              onClick={() => navigate("/partners")}>
              Partner With Us <ArrowRight size={15} />
            </button>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10" style={{ background: "rgba(255,255,255,0.15)" }} />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full opacity-5" style={{ background: "#fff" }} />
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-14 px-6" style={{ background: "#0D1520" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
                  <Heart size={16} color="#fff" />
                </div>
                <span className="text-lg font-bold text-white">MicroHealth</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)", maxWidth: 240 }}>
                A Point-of-Care network making primary healthcare close, affordable, and accessible to everyday Nigerians.
              </p>
            </div>
            {[
              { title: "Product", links: ["Why MicroHealth", "Our Solution", "Pricing", "For Patients", "For Providers"] },
              { title: "Company", links: ["About Us", "Pitch / Investors", "Careers", "Press", "Contact"] },
              { title: "Support", links: ["Documentation", "Help Centre", "Status Page", "Partner With Us"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>{title}</p>
                <div className="space-y-2.5">
                  {links.map(l => {
                    const pathMap: Record<string, string> = {
                      "Why MicroHealth": "/about",
                      "Our Solution": "/solution",
                      "Pricing": "/pricing",
                      "For Patients": "/patient/login",
                      "For Providers": "/login",
                      "About Us": "/about",
                      "Pitch / Investors": "/pitch",
                      "Careers": "#",
                      "Press": "#",
                      "Contact": "/contact",
                      "Documentation": "#",
                      "Help Centre": "#",
                      "Status Page": "#",
                      "Partner With Us": "/partners",
                    };
                    return (
                      <button key={l} onClick={() => navigate(pathMap[l] || "#")}
                        className="block text-sm text-left transition-colors w-full"
                        style={{ color: "rgba(255,255,255,0.5)" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#36A09D")}
                        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-8 flex-wrap gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>© 2026 MicroHealth Technologies Ltd. Built for Nigeria. Scaling across Africa.</p>
            <div className="flex gap-6">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(l => (
                <a key={l} href="#" className="text-xs transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
