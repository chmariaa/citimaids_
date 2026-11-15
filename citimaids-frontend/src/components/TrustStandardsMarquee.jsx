import { useState, useMemo } from 'react';
import {
  UserCheckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ClockIcon,
  BadgeCheckIcon,
} from './icons/Icons';

export const whyCitiMaidsList = [
  {
    id: 'why-1',
    category: 'why',
    categoryLabel: 'Why CitiMaids',
    categoryStyle: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dotColor: 'bg-blue-500',
    badge: 'Hotel-Grade Protocol',
    title: 'Vetted & Trained Specialists',
    desc: 'Every team member undergoes police background checks, Emirates ID verification, and 40+ hours of hotel-grade cleaning training.',
    icon: <UserCheckIcon className="w-5 h-5 text-sky-300" />,
    metric: '40+ Hrs Training',
  },
  {
    id: 'why-2',
    category: 'why',
    categoryLabel: 'Why CitiMaids',
    categoryStyle: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dotColor: 'bg-blue-500',
    badge: 'UAE Financial Shield',
    title: 'AED 1M Liability Insurance',
    desc: 'Comprehensive public liability insurance guarantees absolute peace of mind for your luxury furniture, fixtures, and property.',
    icon: <ShieldCheckIcon className="w-5 h-5 text-sky-300" />,
    metric: 'AED 1,000,000 Coverage',
  },
  {
    id: 'why-3',
    category: 'why',
    categoryLabel: 'Why CitiMaids',
    categoryStyle: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dotColor: 'bg-blue-500',
    badge: 'Child & Pet Friendly',
    title: 'Hospital-Grade Eco Products',
    desc: 'UAE-approved non-toxic solutions safe for young children, pets, and delicate marble flooring. Zero harsh chemical residue.',
    icon: <SparklesIcon className="w-5 h-5 text-sky-300" />,
    metric: '100% Non-Toxic',
  },
  {
    id: 'why-4',
    category: 'why',
    categoryLabel: 'Why CitiMaids',
    categoryStyle: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dotColor: 'bg-blue-500',
    badge: 'Instant Scheduling',
    title: 'Fast Same-Day Scheduling',
    desc: 'Convenient online booking in under 60 seconds with flexible 7-day appointment slots and instant WhatsApp dispatch confirmation.',
    icon: <ClockIcon className="w-5 h-5 text-sky-300" />,
    metric: 'Under 60s Booking',
  },
];

export const citiMaidsPromiseList = [
  {
    id: 'promise-1',
    category: 'promise',
    categoryLabel: 'Guaranteed Promise',
    categoryStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotColor: 'bg-emerald-500',
    badge: 'Government Verified',
    title: 'Emirates ID Verified',
    desc: 'Legal identity validated and matched against official Ministry records before every household assignment.',
    icon: <UserCheckIcon className="w-5 h-5 text-emerald-300" />,
    metric: '100% Documented',
  },
  {
    id: 'promise-2',
    category: 'promise',
    categoryLabel: 'Guaranteed Promise',
    categoryStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotColor: 'bg-emerald-500',
    badge: 'Security Checked',
    title: 'Police Security Cleared',
    desc: 'Strict criminal background check on file for all personnel to ensure absolute household safety.',
    icon: <BadgeCheckIcon className="w-5 h-5 text-emerald-300" />,
    metric: 'Clean Police Record',
  },
  {
    id: 'promise-3',
    category: 'promise',
    categoryLabel: 'Guaranteed Promise',
    categoryStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotColor: 'bg-emerald-500',
    badge: '5-Star Hospitality',
    title: 'Hotel-Trained Crews',
    desc: 'Trained to 5-star hospitality hygiene, microfiber segregation, and spotless surface finishing standards.',
    icon: <SparklesIcon className="w-5 h-5 text-emerald-300" />,
    metric: '5-Star Standard',
  },
  {
    id: 'promise-4',
    category: 'promise',
    categoryLabel: 'Guaranteed Promise',
    categoryStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotColor: 'bg-emerald-500',
    badge: 'Total Peace of Mind',
    title: 'AED 1M Property Insurance',
    desc: 'Full coverage protecting your home, fine art, luxury marble, and delicate interior furnishings.',
    icon: <ShieldCheckIcon className="w-5 h-5 text-emerald-300" />,
    metric: 'Full Restitution',
  },
];

function StandardCard({ item, activeFilter }) {
  const isDimmed = activeFilter !== 'all' && item.category !== activeFilter;

  return (
    <div
      className={`group relative bg-white rounded-2xl p-5 sm:p-6 border transition-all duration-300 mb-4 select-none ${
        isDimmed
          ? 'opacity-40 grayscale-[25%] border-slate-200/60'
          : 'border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-400 hover:-translate-y-1'
      }`}
    >
      {/* Top Header: Category Tag & Metric */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${item.categoryStyle}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor}`} />
          <span>{item.categoryLabel}</span>
        </span>

        <span className="text-[11px] font-black text-slate-800 bg-slate-100/90 border border-slate-200/60 px-2.5 py-1 rounded-lg shadow-sm">
          {item.metric}
        </span>
      </div>

      {/* Title & Icon */}
      <div className="flex items-start gap-3.5 mb-2.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md transition-transform duration-300 group-hover:scale-105"
          style={{
            background:
              item.category === 'promise'
                ? 'linear-gradient(135deg, #062b1e 0%, #064e3b 100%)'
                : 'linear-gradient(135deg, #0A2342 0%, #1E3A8A 100%)',
          }}
        >
          {item.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-blue-900 transition-colors">
            {item.title}
          </h4>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
            {item.badge}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed pl-[54px]">{item.desc}</p>
    </div>
  );
}

export default function TrustStandardsMarquee() {
  const [filter, setFilter] = useState('all');

  // Infinite duplicate rows for seamless looping
  const loopWhyUs = useMemo(
    () => [...whyCitiMaidsList, ...whyCitiMaidsList, ...whyCitiMaidsList],
    []
  );
  const loopPromise = useMemo(
    () => [...citiMaidsPromiseList, ...citiMaidsPromiseList, ...citiMaidsPromiseList],
    []
  );
  const loopAllCombined = useMemo(
    () => [
      ...whyCitiMaidsList,
      ...citiMaidsPromiseList,
      ...whyCitiMaidsList,
      ...citiMaidsPromiseList,
    ],
    []
  );

  return (
    <section className="py-24 bg-white relative overflow-hidden border-b border-slate-200/80">
      {/* Background Architectural Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(226, 232, 240, 0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(226, 232, 240, 0.6) 1px, transparent 1px)',
          backgroundSize: '160px 140px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 mb-12 text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-900 font-extrabold text-xs uppercase tracking-widest mb-4 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>Why CitiMaids & The CitiMaids Promise</span>
        </div>

        {/* Main Headline */}
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Setting the Standard in UAE
        </h2>

        {/* Description */}
        <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-8">
          We combine vetted cleaners, 5-star hotel hygiene standards, and modern online booking with
          four non-negotiable security promises so you never have to worry about cleaning again.
        </p>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto px-2">
          {[
            { key: 'all', label: 'All Standards', count: 8 },
            { key: 'why', label: 'Why CitiMaids', count: 4 },
            { key: 'promise', label: 'The CitiMaids Promise', count: 4 },
          ].map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  active
                    ? 'text-white shadow-md scale-105'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-900 hover:bg-slate-50'
                }`}
                style={
                  active
                    ? {
                        background: 'linear-gradient(135deg, #0A2342 0%, #1E3A8A 100%)',
                      }
                    : {}
                }
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Vertical Moving Columns Container (ReflexAI Reference) ── */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Subtle Column Headers on Desktop */}
        <div className="hidden md:grid grid-cols-2 gap-8 mb-4 px-2">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <span className="text-xs font-extrabold text-blue-950 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Why CitiMaids • Excellence In Every Clean</span>
            </span>
            <span className="text-[11px] font-bold text-slate-400">4 Quality Pillars</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>The CitiMaids Promise • Guaranteed Security</span>
            </span>
            <span className="text-[11px] font-bold text-slate-400">4 Security Guarantees</span>
          </div>
        </div>

        {/* Vertical Marquee Window with Top & Bottom Fade Mask */}
        <div
          className="vertical-marquee-container vertical-marquee-mask relative h-[520px] sm:h-[560px] md:h-[600px] overflow-hidden select-none touch-pan-y"
          style={{ touchAction: 'pan-y' }}
        >
          {/* Desktop & Tablet: Dual Alternating Vertical Columns */}
          <div className="hidden md:grid grid-cols-2 gap-8 h-full">
            {/* Column 1: Gliding Upwards */}
            <div className="overflow-hidden">
              <div className="animate-marquee-up">
                {loopWhyUs.map((item, idx) => (
                  <StandardCard key={`why-${item.id}-${idx}`} item={item} activeFilter={filter} />
                ))}
              </div>
            </div>

            {/* Column 2: Gliding Downwards */}
            <div className="overflow-hidden">
              <div className="animate-marquee-down">
                {loopPromise.map((item, idx) => (
                  <StandardCard
                    key={`promise-${item.id}-${idx}`}
                    item={item}
                    activeFilter={filter}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Mobile: Single Full-Width Vertical Column */}
          <div className="md:hidden h-full overflow-hidden">
            <div className="animate-marquee-up max-w-md mx-auto">
              {(filter === 'why'
                ? loopWhyUs
                : filter === 'promise'
                  ? loopPromise
                  : loopAllCombined
              ).map((item, idx) => (
                <StandardCard key={`mobile-${item.id}-${idx}`} item={item} activeFilter={filter} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer Navigation Tip */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="hidden sm:inline">
              Hover over any card to pause animation and read specifications
            </span>
            <span className="sm:hidden">Tap any card to inspect quality & security standards</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-semibold">
            <span>Continuous Quality Telemetry</span>
            <span>•</span>
            <span>Abu Dhabi Verified</span>
          </div>
        </div>
      </div>
    </section>
  );
}
