import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HomeIcon,
  BuildingIcon,
  VillaIcon,
  SparklesIcon,
  SofaIcon,
  WindowIcon,
  MoveTruckIcon,
  LeafIcon,
} from './icons/Icons';

function getServiceIcon(iconName, className = 'w-5 h-5 text-sky-400') {
  switch (iconName) {
    case 'home':
      return <HomeIcon className={className} />;
    case 'building':
      return <BuildingIcon className={className} />;
    case 'villa':
      return <VillaIcon className={className} />;
    case 'sofa':
      return <SofaIcon className={className} />;
    case 'window':
      return <WindowIcon className={className} />;
    case 'truck':
      return <MoveTruckIcon className={className} />;
    case 'leaf':
      return <LeafIcon className={className} />;
    case 'sparkles':
    default:
      return <SparklesIcon className={className} />;
  }
}

const CATEGORY_STYLES = {
  residential: {
    label: 'Residential',
    bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dot: 'bg-blue-500',
  },
  commercial: {
    label: 'Commercial',
    bg: 'bg-purple-50 text-purple-700 border-purple-200/80',
    dot: 'bg-purple-500',
  },
  specialized: {
    label: 'Specialized',
    bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500',
  },
  maintenance: {
    label: 'Maintenance',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
  },
};

/**
 * Architectural Grid Separator Line with Coordinate Crosshair (+) Markers
 * Replicates the technical drafting aesthetic seen on high-end modern interfaces.
 */
function GridCrosshairLine({ showCrosshairs = true }) {
  return (
    <div className="relative w-full h-[1px] bg-slate-200/90 select-none">
      {showCrosshairs && (
        <div className="absolute inset-0 flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-8 pointer-events-none">
          {[...Array(9)].map((_, i) => (
            <span
              key={i}
              className="text-slate-400/80 font-mono text-[13px] leading-none select-none -translate-y-[0.5px]"
            >
              +
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Single Service Tile inside the Architectural Marquee
 */
function ServiceMarqueeCard({ service, activeCategory }) {
  const cat = CATEGORY_STYLES[service.category] || CATEGORY_STYLES.residential;
  const isHighlighted = activeCategory === 'all' || service.category === activeCategory;

  return (
    <div
      className={`group relative flex-shrink-0 w-[280px] sm:w-[330px] md:w-[350px] bg-white rounded-2xl p-4.5 sm:p-5 border transition-all duration-300 mx-2 sm:mx-2.5 flex flex-col justify-between ${
        isHighlighted
          ? 'border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-400 hover:-translate-y-1.5'
          : 'border-slate-200/50 opacity-40 grayscale-[30%] hover:opacity-90 hover:grayscale-0'
      }`}
    >
      <div>
        {/* Card Header: Category Tag & Rate */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${cat.bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
            <span>{cat.label}</span>
          </span>

          <span className="text-xs font-black text-slate-900 bg-slate-100/90 px-2.5 py-1 rounded-lg">
            {service.startingPrice}
          </span>
        </div>

        {/* Service Title & Icon */}
        <div className="flex items-start gap-3 mb-2.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #0A2342 0%, #1E3A8A 100%)',
            }}
          >
            {getServiceIcon(service.iconName, 'w-5 h-5 text-sky-300')}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-blue-900 transition-colors line-clamp-1">
              {service.title}
            </h4>
            <p className="text-slate-500 text-xs line-clamp-2 mt-1 leading-relaxed">
              {service.description}
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        {service.included && service.included.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
            {service.included.slice(0, 2).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-[11.5px] text-slate-600 line-clamp-1"
              >
                <span className="text-emerald-500 font-bold text-xs flex-shrink-0">✓</span>
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <Link
          to={`/services/${service.id}`}
          className="text-xs font-bold text-slate-500 hover:text-blue-900 transition-colors flex items-center gap-1"
        >
          <span>Details</span>
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>

        <Link
          to="/book"
          className="inline-flex items-center gap-1 text-xs font-extrabold text-white px-3.5 py-1.5 rounded-lg shadow-sm transition-all duration-200 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #0A2342 0%, #1E3A8A 100%)',
          }}
        >
          <span>Book Now</span>
        </Link>
      </div>
    </div>
  );
}

/**
 * AnimatedServicesMarquee Component
 *
 * Implements the dual-track "To and Fro" animated horizontal marquee on an
 * architectural coordinate grid with crosshairs (+) inspired by top-tier modern web apps.
 */
export default function ServicesMarquee({ services = [] }) {
  const [activeCategory, setActiveCategory] = useState('all');

  // Partition services into two balanced rows for alternating tracks
  const { row1, row2 } = useMemo(() => {
    if (!services || services.length === 0) {
      return { row1: [], row2: [] };
    }
    const r1 = [];
    const r2 = [];
    services.forEach((s, idx) => {
      if (idx % 2 === 0) {
        r1.push(s);
      } else {
        r2.push(s);
      }
    });
    return { row1: r1, row2: r2 };
  }, [services]);

  // Seamless duplication so translateX(-50%) loops with zero jump
  const loopRow1 = useMemo(() => [...row1, ...row1, ...row1], [row1]);
  const loopRow2 = useMemo(() => [...row2, ...row2, ...row2], [row2]);

  const categories = [
    { id: 'all', label: 'All Services', count: services.length },
    {
      id: 'residential',
      label: 'Residential',
      count: services.filter((s) => s.category === 'residential').length,
    },
    {
      id: 'commercial',
      label: 'Commercial',
      count: services.filter((s) => s.category === 'commercial').length,
    },
    {
      id: 'specialized',
      label: 'Specialized Care',
      count: services.filter((s) => s.category === 'specialized').length,
    },
    {
      id: 'maintenance',
      label: 'Outdoor & Facility',
      count: services.filter((s) => s.category === 'maintenance').length,
    },
  ];

  return (
    <section className="py-24 bg-[#fafcff] relative overflow-hidden border-y border-slate-200/80">
      {/* Background Architectural Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(226, 232, 240, 0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(226, 232, 240, 0.6) 1px, transparent 1px)',
          backgroundSize: '180px 140px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 mb-12 text-center">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-900 font-extrabold text-xs uppercase tracking-widest mb-4 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>Comprehensive Fleet Coverage</span>
        </div>

        {/* Main Headline */}
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Services Tailored for Every Space
        </h2>

        {/* Description */}
        <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-8">
          From luxury villa sanitization and routine apartment housekeeping to commercial corporate
          care across Abu Dhabi, Dubai, and Sharjah.
        </p>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto px-2">
          {categories.map((c) => {
            const active = activeCategory === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategory(c.id)}
                className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 min-h-[38px] sm:min-h-[40px] rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
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
                <span>{c.label}</span>
                {c.count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {c.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Marquee Section Container with Pause on Hover ── */}
      <div
        className="marquee-container relative w-full overflow-hidden select-none touch-pan-y"
        style={{ touchAction: 'pan-y' }}
      >
        {/* Top Architectural Coordinate Line */}
        <GridCrosshairLine />

        {/* Track 1: Gliding Left (◄◄◄) */}
        <div className="marquee-mask py-3.5 overflow-hidden">
          <div className="animate-marquee-left flex items-center">
            {loopRow1.map((service, index) => (
              <ServiceMarqueeCard
                key={`row1-${service.id}-${index}`}
                service={service}
                activeCategory={activeCategory}
              />
            ))}
          </div>
        </div>

        {/* Middle Architectural Coordinate Line with Crosshairs */}
        <GridCrosshairLine />

        {/* Track 2: Gliding Right (►►►) */}
        <div className="marquee-mask py-3.5 overflow-hidden">
          <div className="animate-marquee-right flex items-center">
            {loopRow2.map((service, index) => (
              <ServiceMarqueeCard
                key={`row2-${service.id}-${index}`}
                service={service}
                activeCategory={activeCategory}
              />
            ))}
          </div>
        </div>

        {/* Bottom Architectural Coordinate Line */}
        <GridCrosshairLine />
      </div>

      {/* Footer Navigation Bar */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Hover over any service card to pause animation and inspect rates</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-xs font-extrabold text-blue-900 hover:text-blue-700 transition-colors px-4 py-2 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:shadow"
          >
            <span>View All {services.length} Services</span>
            <span>→</span>
          </Link>

          <Link
            to="/book"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white px-5 py-2.5 rounded-xl shadow-md transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #0A2342 0%, #1E3A8A 100%)',
            }}
          >
            <span>Book a Cleaning</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
