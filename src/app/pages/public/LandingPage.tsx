import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Heart, ArrowRight, Building2, Activity, Users, Watch,
  Smartphone, MapPin, BookOpen, Briefcase, GraduationCap,
  Home as HomeIcon, CheckCircle, Play, Shield, Database,
  Wallet, Accessibility, Droplets, AlertTriangle, Bug,
  Lightbulb, MessageCircle, Stethoscope,
} from "lucide-react";

export const IMGS = {
  hero:       "https://images.unsplash.com/photo-1678695972687-033fa0bdbac9?w=1400&h=1600&fit=crop&auto=format",
  heroAlt:    "https://images.unsplash.com/photo-1622253694242-abeb37a33e97?w=900&h=1100&fit=crop&auto=format",
  clinic:     "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=900&h=700&fit=crop&auto=format",
  docLaptop:  "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=900&h=700&fit=crop&auto=format",
  equipment:  "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=700&h=480&fit=crop&auto=format",
  community:  "https://images.unsplash.com/photo-1565090568947-7293970ba471?w=1200&h=800&fit=crop&auto=format",
  pharmacy:   "https://images.unsplash.com/photo-1569830904560-2afd7062213c?w=700&h=480&fit=crop&auto=format",
  doc1:       "https://images.unsplash.com/photo-1678695972687-033fa0bdbac9?w=200&h=200&fit=crop&auto=format",
  doc2:       "https://images.unsplash.com/photo-1622253694242-abeb37a33e97?w=200&h=200&fit=crop&auto=format",
  doc3:       "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=200&h=200&fit=crop&auto=format",
  family:     "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&auto=format",
  school:     "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&auto=format",
  workplace:  "https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=400&h=400&fit=crop&auto=format",
  band:       "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800&h=800&fit=crop&auto=format",
  sunset:     "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=1600&h=900&fit=crop&auto=format&q=80",
  nurse:      "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=1200&h=700&fit=crop&auto=format",
  individual: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=400&h=400&fit=crop&auto=format",
  clinicStaff:"https://images.unsplash.com/photo-1622253694242-abeb37a33e97?w=400&h=400&fit=crop&auto=format",
  community2: "https://images.unsplash.com/photo-1565090568947-7293970ba471?w=400&h=400&fit=crop&auto=format",
};

function useScrolled(threshold = 40) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

/* ── Shared chrome for other marketing pages ── */

export function MarketingNav() {
  const navigate = useNavigate();
  const scrolled = useScrolled();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{ background: scrolled ? "rgba(255,255,255,0.95)" : "#0B1220", backdropFilter: scrolled ? "blur(12px)" : "none", borderBottom: scrolled ? "1px solid rgba(0,0,0,0.07)" : "1px solid rgba(255,255,255,0.06)" }}>
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
    <footer className="py-14 px-6" style={{ background: "#0B1220" }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4 cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
                <Heart size={16} color="#fff" />
              </div>
              <span className="text-lg font-bold text-white">MicroHealth</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)", maxWidth: 280 }}>
              Connected preventive healthcare — MicroBand, App, and Point of Care.
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
    <section className="pt-32 pb-16 px-6" style={{ background: "#0B1220" }}>
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

/* ── Visual components ── */

function PhoneMockup({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ width: 200 }}>
      <div className="rounded-[2rem] overflow-hidden"
        style={{ background: "#0B1220", border: "3px solid #1a2332", boxShadow: "0 32px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.08)" }}>
        <div className="h-6 flex items-center justify-center" style={{ background: "#0B1220" }}>
          <div className="w-16 h-1.5 rounded-full" style={{ background: "#1a2332" }} />
        </div>
        <div className="px-3 pb-4 pt-1 space-y-2.5" style={{ background: "linear-gradient(180deg, #0F1A2A 0%, #0B1220 100%)" }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[8px]" style={{ color: "rgba(255,255,255,0.4)" }}>Good morning</p>
              <p className="text-[11px] font-semibold text-white">Adaeze</p>
            </div>
            <div className="w-6 h-6 rounded-full" style={{ background: "#0F7D7A" }} />
          </div>
          <div className="rounded-2xl p-3" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
            <p className="text-[8px] text-white/70 mb-0.5">Heart rate</p>
            <p className="text-2xl font-bold text-white leading-none">72 <span className="text-[10px] font-medium opacity-70">bpm</span></p>
            <div className="mt-2 flex items-end gap-0.5 h-6">
              {[40,55,45,70,60,80,65,75,50,85,70,60].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: "rgba(255,255,255,0.45)" }} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { l: "SpO₂", v: "98%" },
              { l: "Temp", v: "36.6°" },
              { l: "Sleep", v: "7.2h" },
              { l: "Steps", v: "6.4k" },
            ].map(({ l, v }) => (
              <div key={l} className="rounded-xl p-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                <p className="text-[7px]" style={{ color: "rgba(255,255,255,0.4)" }}>{l}</p>
                <p className="text-[12px] font-bold text-white">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MicroBandVisual({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="rounded-3xl overflow-hidden relative"
        style={{ width: 220, height: 220, boxShadow: "0 24px 48px rgba(0,0,0,0.4)", background: "#111" }}>
        <img src={IMGS.band} alt="MicroBand wearable" className="w-full h-full object-cover opacity-90" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,18,32,0.7) 0%, transparent 50%)" }} />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-xs font-bold text-white">MicroBand</p>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.65)" }}>Continuous vital monitoring</p>
        </div>
      </div>
    </div>
  );
}

function AfricaDemandMap() {
  const nodes = [
    { x: 42, y: 48, label: "Lagos", sub: "High demand", size: 14 },
    { x: 45, y: 38, label: "Kano", sub: "Growing", size: 10 },
    { x: 38, y: 52, label: "Accra", sub: "Moderate", size: 9 },
    { x: 52, y: 58, label: "Abuja", sub: "Rising", size: 8 },
    { x: 48, y: 72, label: "Lagos belt", sub: "Active", size: 7 },
  ];
  return (
    <div className="relative w-full h-full min-h-[320px] rounded-3xl overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 45% 50%, #132033 0%, #0B1220 70%)" }}>
      {/* Simplified Africa silhouette via CSS blobs */}
      <svg viewBox="0 0 200 220" className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="xMidYMid meet">
        <path
          d="M95 18 C110 20 125 28 130 42 C138 55 145 70 142 88 C148 105 155 120 150 140 C148 160 140 175 125 185 C110 198 95 205 80 200 C65 195 55 180 50 160 C42 140 40 120 48 100 C45 80 50 60 60 45 C70 30 80 20 95 18Z"
          fill="#0F7D7A"
          opacity="0.35"
        />
      </svg>
      {nodes.map((n) => (
        <div key={n.label} className="absolute" style={{ left: `${n.x}%`, top: `${n.y}%`, transform: "translate(-50%, -50%)" }}>
          <div className="relative flex items-center justify-center">
            <span className="absolute rounded-full animate-ping" style={{ width: n.size * 2.2, height: n.size * 2.2, background: "rgba(54,160,157,0.25)" }} />
            <span className="relative rounded-full" style={{ width: n.size, height: n.size, background: "#36A09D", boxShadow: "0 0 16px rgba(54,160,157,0.8)" }} />
          </div>
          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap hidden sm:block">
            <p className="text-[11px] font-semibold text-white">{n.label}</p>
            <p className="text-[9px]" style={{ color: "#36A09D" }}>{n.sub}</p>
          </div>
        </div>
      ))}
      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
        <MapPin size={12} style={{ color: "#36A09D" }} />
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Communities with rising health demand</p>
      </div>
    </div>
  );
}

function ChatPreview() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#0F1A2A", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#0F7D7A" }}>
          <Heart size={12} color="#fff" />
        </div>
        <div>
          <p className="text-xs font-semibold text-white">MicroHealth Assistant</p>
          <p className="text-[9px]" style={{ color: "#36A09D" }}>Online</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="rounded-2xl rounded-tl-sm px-3 py-2 max-w-[90%]" style={{ background: "rgba(255,255,255,0.06)" }}>
          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
            Your resting heart rate has trended up this week. Want a quick check-in plan?
          </p>
        </div>
        <div className="rounded-2xl rounded-tr-sm px-3 py-2 max-w-[75%] ml-auto" style={{ background: "#0F7D7A" }}>
          <p className="text-[11px] text-white">Yes — what should I do?</p>
        </div>
        <div className="rounded-2xl rounded-tl-sm px-3 py-2 max-w-[90%]" style={{ background: "rgba(255,255,255,0.06)" }}>
          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
            Hydrate, rest tonight, and book a Point-of-Care vitals check if it stays elevated.
          </p>
        </div>
      </div>
    </div>
  );
}

function InsightsPreview() {
  return (
    <div className="rounded-2xl p-4" style={{ background: "#0F1A2A", border: "1px solid rgba(255,255,255,0.08)" }}>
      <p className="text-xs font-semibold text-white mb-1">Health insights</p>
      <p className="text-[10px] mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>Not just data — meaning</p>
      {[
        { l: "Heart rate", bars: [45, 55, 50, 70, 60, 80, 65], color: "#0F7D7A" },
        { l: "Sleep", bars: [70, 65, 80, 75, 60, 85, 78], color: "#36A09D" },
        { l: "Activity", bars: [40, 60, 55, 75, 70, 65, 90], color: "#4CAF50" },
      ].map(({ l, bars, color }) => (
        <div key={l} className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>{l}</span>
          </div>
          <div className="flex items-end gap-1 h-8">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: color, opacity: i === bars.length - 1 ? 1 : 0.45 }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Landing page ── */

export default function LandingPage() {
  const navigate = useNavigate();
  const scrolled = useScrolled();

  return (
    <div className="min-h-screen bg-white overflow-x-hidden" style={{ fontFamily: "'Work Sans', sans-serif" }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "none",
        }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
              <Heart size={16} color="#fff" />
            </div>
            <span className="text-lg font-bold" style={{ color: scrolled ? "#0D1B2A" : "#5EEAD4" }}>MicroHealth</span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            {[
              { label: "Home", href: "#" },
              { label: "About", href: "#problem" },
              { label: "Products", href: "#system" },
              { label: "Impact", href: "#demand" },
              { label: "Contact", path: "/contact" },
            ].map(item => (
              <button key={item.label}
                onClick={() => item.path ? navigate(item.path) : item.href === "#" ? window.scrollTo({ top: 0, behavior: "smooth" }) : document.querySelector(item.href!)?.scrollIntoView({ behavior: "smooth" })}
                className="text-sm font-medium transition-opacity hover:opacity-80"
                style={{ color: scrolled ? "#4B5563" : "rgba(255,255,255,0.8)" }}>
                {item.label}
              </button>
            ))}
          </div>
          <button className="text-sm font-semibold px-4 py-2 rounded-full text-white transition-transform hover:scale-[1.02]"
            style={{ background: "#0F7D7A", boxShadow: "0 4px 14px rgba(15,125,122,0.4)" }}
            onClick={() => navigate("/patient/login")}>
            Get Early Access
          </button>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-[100svh] flex items-center" style={{ background: "#0B1220" }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #0F7D7A 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #36A09D 0%, transparent 70%)" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 w-full pt-28 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Copy */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-white leading-[1.1] mb-5"
                style={{ letterSpacing: "-0.03em" }}>
                Detect health risks early {" "}
                <span style={{ color: "#5EEAD4" }}>before they become emergencies.</span>
              </h1>
              <p className="text-base sm:text-lg leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.6)", maxWidth: 460 }}>
                A connected preventive healthcare system that monitors daily, detects early, and connects people to affordable care.
              </p>
              <div className="flex items-center gap-3 flex-wrap mb-12">
                <button className="flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                  style={{ background: "#0F7D7A", boxShadow: "0 8px 24px rgba(15,125,122,0.45)" }}
                  onClick={() => navigate("/patient/login")}>
                  Get Early Access
                  <ArrowRight size={16} />
                </button>
                <button className="flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold transition-all"
                  style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.04)" }}
                  onClick={() => document.getElementById("system")?.scrollIntoView({ behavior: "smooth" })}>
                  <Play size={14} fill="currentColor" />
                  See How It Works
                </button>
              </div>

              <div className="flex flex-wrap gap-6">
                {[
                  { icon: Shield, label: "Preventive" },
                  { icon: Database, label: "Data-driven" },
                  { icon: Wallet, label: "Affordable" },
                  { icon: Accessibility, label: "Accessible" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(15,125,122,0.2)" }}>
                      <Icon size={14} style={{ color: "#5EEAD4" }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual composition */}
            <div className="relative h-[420px] sm:h-[520px] lg:h-[560px]">
              {/* Doctor photo */}
              <div className="absolute right-0 top-0 w-[72%] h-[88%] rounded-[2rem] overflow-hidden"
                style={{ boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }}>
                <img src={IMGS.hero} alt="MicroHealth clinician" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,18,32,0.5) 0%, transparent 40%)" }} />
              </div>
              {/* Phone */}
              <div className="absolute left-0 sm:left-2 top-16 sm:top-20 z-20"
                style={{ animation: "floatY 6s ease-in-out infinite" }}>
                <PhoneMockup />
              </div>
              {/* Band */}
              <div className="absolute right-4 sm:right-8 bottom-0 z-10"
                style={{ animation: "floatY 7s ease-in-out infinite reverse" }}>
                <MicroBandVisual />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PROBLEM ═══════════ */}
      <section id="problem" className="py-24 px-6" style={{ background: "#F7F8FA" }}>
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#0F7D7A" }}>The late-detection problem</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight" style={{ letterSpacing: "-0.02em" }}>
              The biggest health threat isn't always a lack of healthcare.
              <span className="block mt-1" style={{ color: "#0F7D7A" }}>It's finding the problem too late.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Heart, n: "1.0M+", l: "Hypertension", body: "Deaths yearly from late-detected high blood pressure.", tint: "#FEE2E2", color: "#EF4444" },
              { icon: Droplets, n: "252M", l: "Diabetes", body: "People worldwide unaware they have diabetes.", tint: "#FEF3C7", color: "#D97706" },
              { icon: Bug, n: "30.9%", l: "Malaria", body: "Of global malaria deaths — Nigeria bears a heavy share.", tint: "#E0E7FF", color: "#4F46E5" },
              { icon: AlertTriangle, n: "11M", l: "Sepsis", body: "Deaths globally each year — hours can change outcomes.", tint: "#FCE7F3", color: "#DB2777" },
            ].map(({ icon: Icon, n, l, body, tint, color }) => (
              <div key={l} className="bg-white rounded-3xl p-6 transition-transform hover:-translate-y-1"
                style={{ boxShadow: "0 4px 24px rgba(13,27,42,0.06)" }}>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5" style={{ background: tint }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <p className="text-3xl font-bold text-foreground mb-1" style={{ letterSpacing: "-0.02em" }}>{n}</p>
                <p className="text-sm font-semibold text-foreground mb-2">{l}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SYSTEM ═══════════ */}
      <section id="system" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#0F7D7A" }}>The MicroHealth system</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>
              A connected system for preventive care.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                img: IMGS.band,
                title: "MicroBand",
                tag: "Wearable",
                body: "Continuous vital monitoring on your wrist — so risks surface before emergencies.",
              },
              {
                img: IMGS.docLaptop,
                title: "MicroHealth App",
                tag: "Digital HQ",
                body: "Your health command center — trends, records, guidance, and care connection.",
              },
              {
                img: IMGS.clinic,
                title: "Point of Care",
                tag: "Physical care",
                body: "Affordable community clinics when data shows care is needed nearby.",
              },
            ].map(({ img, title, tag, body }) => (
              <div key={title} className="group rounded-[1.75rem] overflow-hidden bg-[#F7F8FA] transition-transform hover:-translate-y-1"
                style={{ boxShadow: "0 4px 24px rgba(13,27,42,0.05)" }}>
                <div className="relative h-56 overflow-hidden">
                  <img src={img} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,18,32,0.55) 0%, transparent 50%)" }} />
                  <span className="absolute top-4 left-4 text-[11px] font-semibold px-3 py-1 rounded-full text-white"
                    style={{ background: "rgba(15,125,122,0.9)" }}>{tag}</span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Connection strip */}
          <div className="mt-10 hidden lg:flex items-center justify-center gap-3 text-sm font-medium" style={{ color: "#0F7D7A" }}>
            <Watch size={16} /> MicroBand
            <ArrowRight size={14} className="opacity-40" />
            <Smartphone size={16} /> App
            <ArrowRight size={14} className="opacity-40" />
            <Building2 size={16} /> Point of Care
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how" className="py-20 px-6" style={{ background: "#F7F8FA" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#0F7D7A" }}>How it works</p>
            <h2 className="text-3xl font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>
              From signal to care — earlier.
            </h2>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-10 left-[10%] right-[10%] h-px border-t border-dashed" style={{ borderColor: "rgba(15,125,122,0.35)" }} />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {[
                { icon: Watch, title: "Monitor", desc: "Vitals tracked daily" },
                { icon: Activity, title: "Detect", desc: "AI spots risk trends" },
                { icon: Lightbulb, title: "Understand", desc: "Clear personal insights" },
                { icon: MessageCircle, title: "Act", desc: "Guidance & early support" },
                { icon: Stethoscope, title: "Access care", desc: "Point-of-Care nearby" },
              ].map(({ icon: Icon, title, desc }, i) => (
                <div key={title} className="text-center relative">
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center relative z-10"
                    style={{ background: "#fff", boxShadow: "0 8px 24px rgba(15,125,122,0.12)", border: "2px solid #E6F7F6" }}>
                    <Icon size={24} style={{ color: "#0F7D7A" }} />
                    <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                      style={{ background: "#0F7D7A" }}>{i + 1}</span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1">{title}</h3>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ AI ═══════════ */}
      <section className="py-24 px-6" style={{ background: "#0B1220" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#5EEAD4" }}>AI health assistance</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5" style={{ letterSpacing: "-0.02em" }}>
              An AI health companion that actually cares.
            </h2>
            <p className="text-base mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              Intelligent support inside the system — helping people understand signals earlier, not replacing clinicians.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "Personalized insights",
                "Health education",
                "Care recommendations",
                "Multilingual support",
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(15,125,122,0.25)" }}>
                    <CheckCircle size={14} style={{ color: "#5EEAD4" }} />
                  </div>
                  <span className="text-sm font-medium text-white">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ChatPreview />
            <InsightsPreview />
          </div>
        </div>
      </section>

      {/* ═══════════ DEMAND / MAP ═══════════ */}
      <section id="demand" className="py-24 px-6" style={{ background: "#0F1A2A" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
          <AfricaDemandMap />
          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#5EEAD4" }}>Data-driven deployment</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5" style={{ letterSpacing: "-0.02em" }}>
              We don't guess where healthcare is needed.<br />
              <span style={{ color: "#5EEAD4" }}>We use real demand.</span>
            </h2>
            <p className="text-base mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              Monitoring data reveals where risks rise — then Point-of-Care units open where communities actually need them.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {["People monitor", "Demand surfaces", "Community identified", "Care deployed"].map((s, i) => (
                <div key={s} className="flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(15,125,122,0.2)", color: "#5EEAD4" }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white" style={{ background: "#0F7D7A" }}>{i + 1}</span>
                  {s}
                </div>
              ))}
            </div>
            <button className="self-start flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold text-white"
              style={{ background: "#0F7D7A" }}
              onClick={() => navigate("/partners")}>
              Explore Partnerships <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════ AUDIENCE ═══════════ */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#0F7D7A" }}>Who it's for</p>
            <h2 className="text-3xl font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>
              Built for everyone.
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-8 sm:gap-10">
            {[
              { img: IMGS.individual, label: "Individuals & Families", icon: HomeIcon },
              { img: IMGS.workplace, label: "Employers", icon: Briefcase },
              { img: IMGS.school, label: "Schools", icon: GraduationCap },
              { img: IMGS.clinicStaff, label: "Clinics", icon: Building2 },
              { img: IMGS.community2, label: "Community Groups", icon: Users },
            ].map(({ img, label }) => (
              <div key={label} className="flex flex-col items-center w-28 sm:w-32 text-center group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-3 transition-transform group-hover:scale-105"
                  style={{ boxShadow: "0 8px 24px rgba(15,125,122,0.15)", border: "3px solid #E6F7F6" }}>
                  <img src={img} alt={label} className="w-full h-full object-cover" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ EDUCATION ═══════════ */}
      <section className="px-6 pb-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-[2rem] overflow-hidden h-[380px] sm:h-[420px]"
            style={{ boxShadow: "0 24px 64px rgba(13,27,42,0.12)" }}>
            <img src={IMGS.nurse} alt="Community health education" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(11,18,32,0.88) 0%, rgba(11,18,32,0.45) 55%, rgba(11,18,32,0.2) 100%)" }} />
            <div className="absolute inset-0 flex items-center">
              <div className="px-8 sm:px-14 max-w-lg">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={16} style={{ color: "#5EEAD4" }} />
                  <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#5EEAD4" }}>Prevention & education</p>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ letterSpacing: "-0.02em" }}>
                  Healthier communities start with awareness.
                </h2>
                <p className="text-sm mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                  Campaigns, guides, and local sensitisation — so people recognise warning signs and seek care earlier.
                </p>
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
                  style={{ background: "#0F7D7A" }}
                  onClick={() => navigate("/about")}>
                  Learn more <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ OPPORTUNITY ═══════════ */}
      <section className="py-20 px-6" style={{ background: "#F7F8FA" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#0F7D7A" }}>The opportunity</p>
            <h2 className="text-3xl font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>
              A massive market. A healthier future.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { n: "$11.4B", l: "Nigeria healthcare opportunity" },
              { n: "$109.6B", l: "Sub-Saharan Africa healthcare spend" },
              { n: "~$1.5B", l: "Nigeria digital health & telemedicine" },
            ].map(({ n, l }) => (
              <div key={l} className="bg-white rounded-3xl p-8 text-center"
                style={{ boxShadow: "0 4px 24px rgba(13,27,42,0.05)" }}>
                <p className="text-4xl font-bold mb-2" style={{ color: "#0F7D7A", letterSpacing: "-0.02em" }}>{n}</p>
                <p className="text-sm text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="relative py-32 px-6 overflow-hidden">
        <img src={IMGS.sunset} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(11,18,32,0.85) 0%, rgba(11,18,32,0.45) 100%)" }} />
        <div className="relative max-w-3xl mx-auto text-center z-10">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-5" style={{ color: "#5EEAD4" }}>
            Healthier Communities · Stronger Africa
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-8" style={{ letterSpacing: "-0.03em" }}>
            Catch it earlier.<br />Care closer. Live healthier.
          </h2>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button className="px-8 py-4 rounded-full text-sm font-semibold text-white"
              style={{ background: "#0F7D7A", boxShadow: "0 8px 24px rgba(15,125,122,0.45)" }}
              onClick={() => navigate("/patient/login")}>
              Get Early Access
            </button>
            <button className="px-8 py-4 rounded-full text-sm font-semibold text-white"
              style={{ border: "1px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.08)" }}
              onClick={() => navigate("/partners")}>
              Partner With Us
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6" style={{ background: "#0B1220" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
                <Heart size={16} color="#fff" />
              </div>
              <span className="text-lg font-bold text-white">MicroHealth</span>
            </div>
            <div className="flex flex-wrap gap-6">
              {[
                { l: "About", p: "/about" },
                { l: "Solution", p: "/solution" },
                { l: "Pricing", p: "/pricing" },
                { l: "Partners", p: "/partners" },
                { l: "Contact", p: "/contact" },
                { l: "Investors", p: "/pitch" },
              ].map(({ l, p }) => (
                <button key={l} onClick={() => navigate(p)}
                  className="text-sm transition-colors"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#5EEAD4")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between pt-8 flex-wrap gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>© 2026 MicroHealth Technologies Ltd.</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Built for Nigeria. Scaling across Africa.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
