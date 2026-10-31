import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { useServices } from '../hooks/useServices';

const defaultMaintenanceServices = [
  {
    id: 'landscape',
    title: 'Landscape Contractor',
    description:
      'Turnkey landscaping solutions for residential villas and commercial facilities. We design, install, and care for lush outdoor environments that endure the UAE climate.',
    features: [
      'Custom garden architecture & design',
      'Artificial & natural turf installation',
      'Smart automated irrigation systems',
      'Desert-tolerant flora & date palms',
      'Outdoor paving, pergolas & lighting',
      'Seasonal plant health rejuvenation',
    ],
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop&auto=format',
    startingPrice: 'Contact for pricing',
  },
  {
    id: 'garden',
    title: 'Garden Maintenance',
    description:
      'Keep your villa garden thriving and pristine throughout the year. Our skilled horticulturists handle precision trimming, edging, organic fertilization, and weed suppression.',
    features: [
      'Weekly or bi-weekly scheduled care',
      'Lawn aeration, mowing & precision edging',
      'Hedge shaping & palm frond pruning',
      'Eco-friendly pest & fungal defense',
      'Soil nutrient enrichment & mulching',
      'Irrigation system flow monitoring',
    ],
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&h=600&fit=crop&auto=format',
    startingPrice: 'Contact for pricing',
  },
  {
    id: 'pool',
    title: 'Swimming Pool Maintenance',
    description:
      'Ensure your private pool is crystal-clear, sanitized, and perfectly balanced for your family. We conduct thorough chemical water testing, backwashing, and pump inspections.',
    features: [
      'Digital pH & chlorine balance checks',
      'Surface skim & underwater vacuuming',
      'Filter backwash & sand inspection',
      'Skimmer basket & lint trap cleaning',
      'Algae eradication & water clarifying',
      'Pump, timer & light safety inspection',
    ],
    image: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800&h=600&fit=crop&auto=format',
    startingPrice: 'Contact for pricing',
  },
];

export default function MaintenancePage() {
  const { services, loading, error, refetch } = useServices();

  // Dynamic filter: active maintenance services from API or fallback to defaults
  const fromApi = services.filter((s) => s.category === 'maintenance');
  const maintenanceServices = fromApi.length > 0 ? fromApi : defaultMaintenanceServices;

  const getFeatures = (s) => {
    if (Array.isArray(s.included) && s.included.length > 0) return s.included;
    if (Array.isArray(s.features) && s.features.length > 0) return s.features;
    if (s.description && (s.description.includes('\n') || s.description.includes('•') || s.description.includes('- '))) {
      const lines = s.description
        .split('\n')
        .map((l) => l.replace(/^[\s•\-\*]+/, '').trim())
        .filter((l) => l.length > 3);
      if (lines.length >= 2) return lines;
    }
    return [
      'Scheduled visits tailored to your villa',
      'Trained, vetted maintenance specialists',
      'High-grade commercial tools & supplies',
      'Guaranteed satisfaction & quality check',
    ];
  };

  return (
    <div>
      {/* Header */}
      <div
        className="py-20 text-white text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0A2342 0%,#1E3A8A 100%)' }}
      >
        <div className="relative z-10 max-w-2xl mx-auto px-6">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/15 text-xs font-semibold uppercase tracking-widest mb-4 backdrop-blur-sm">
            Villa & Outdoor Solutions
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 tracking-tight">Maintenance Services</h1>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            Professional landscape contracting, weekly garden care, and swimming pool maintenance across Abu Dhabi.
          </p>
        </div>
      </div>

      {/* Services List */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          {loading ? (
            /* Loading Skeletons */
            <div className="space-y-8">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-2xl overflow-hidden grid md:grid-cols-2 border border-slate-100 animate-pulse h-96"
                >
                  <div className="bg-slate-200 h-64 md:h-full" />
                  <div className="p-8 md:p-12 space-y-4 flex flex-col justify-center">
                    <div className="w-28 h-4 bg-slate-200 rounded" />
                    <div className="w-3/4 h-8 bg-slate-200 rounded" />
                    <div className="w-full h-16 bg-slate-100 rounded" />
                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <div className="h-4 bg-slate-200 rounded" />
                      <div className="h-4 bg-slate-200 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error && maintenanceServices.length === 0 ? (
            /* Error State */
            <div className="bg-white rounded-2xl p-12 text-center max-w-md mx-auto border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                !
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-2">Unable to load services</h3>
              <p className="text-slate-500 text-sm mb-6">There was a problem reaching the server. Please try again.</p>
              <button
                onClick={refetch}
                className="px-6 py-2.5 rounded-xl bg-blue-950 text-white font-bold text-sm shadow hover:bg-blue-900 transition-all"
              >
                Try Again
              </button>
            </div>
          ) : (
            maintenanceServices.map((s, i) => {
              const features = getFeatures(s);
              const title = s.title || s.name;
              const imageUrl = s.image || 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&h=600&fit=crop&auto=format';
              const startingPrice = s.startingPrice || (s.basePrice > 0 ? `AED ${s.basePrice} / session` : null);

              return (
                <Reveal key={s.id || s.slug || i} delay={i * 80} direction={i % 2 === 0 ? 'left' : 'right'}>
                  <div
                    className={`bg-white rounded-2xl overflow-hidden grid md:grid-cols-2 border border-slate-100 ${
                      i % 2 === 1 ? 'md:grid-flow-dense' : ''
                    }`}
                    style={{ boxShadow: '0 4px 24px rgba(10,35,66,0.06)' }}
                  >
                    <div className={`h-64 md:h-auto bg-slate-100 overflow-hidden relative ${i % 2 === 1 ? 'md:col-start-2' : ''}`}>
                      <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&h=600&fit=crop&auto=format';
                        }}
                      />
                      {startingPrice && (
                        <div
                          className="absolute top-4 left-4 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl shadow-lg backdrop-blur-md"
                          style={{ background: 'rgba(10, 35, 66, 0.88)' }}
                        >
                          {startingPrice}
                        </div>
                      )}
                    </div>
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-blue-800 uppercase tracking-widest">Outdoor Excellence</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">{title}</h2>
                      <p className="text-slate-600 leading-relaxed mb-6 text-sm">{s.description}</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8">
                        {features.map((f, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
                            <span className="text-emerald-500 font-bold">✓</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          to="/book"
                          state={{ preselectedServiceId: s.id }}
                          className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-white hover:scale-105 transition-all shadow-md"
                          style={{ background: 'linear-gradient(135deg,#0A2342,#1E3A8A)' }}
                        >
                          Book a Visit
                        </Link>
                        <a
                          href={`https://wa.me/97150000000?text=Hi%20CitiMaids!%20I%20would%20like%20a%20quote%20for%20${encodeURIComponent(title)}.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-800 border border-slate-300 hover:bg-slate-50 transition-colors"
                        >
                          Request WhatsApp Quote
                        </a>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })
          )}
        </div>
      </section>

      {/* Contract Banner */}
      <section
        className="py-16 text-center text-white relative"
        style={{ background: 'linear-gradient(135deg,#0A2342 0%,#1E3A8A 100%)' }}
      >
        <div className="max-w-xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Looking for an Annual Villa Contract?</h2>
          <p className="text-blue-100 text-sm mb-7 leading-relaxed">
            We offer consolidated maintenance contracts combining home cleaning, landscape maintenance, and pool care with discounted rates.
          </p>
          <Link
            to="/contact"
            className="inline-flex px-8 py-3.5 rounded-xl bg-white text-slate-900 font-bold text-sm hover:scale-105 transition-all shadow-xl"
          >
            Inquire for Annual Contract
          </Link>
        </div>
      </section>
    </div>
  );
}
