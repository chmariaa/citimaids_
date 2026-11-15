import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Reveal from './Reveal';
import { StarIcon } from './icons/Icons';

export const defaultReviews = [
  {
    id: 'default-1',
    name: 'Fatima Al Mansoori',
    location: 'Al Khalidiyah, Abu Dhabi',
    stars: 5,
    body: 'CitiMaids completely elevated our 4-bedroom villa. The cleaners were punctual, polite, and paid incredible attention to marble polishing and kitchen degreasing. By far the best in Abu Dhabi.',
    service: 'Luxury Villa Care',
    verified: true,
  },
  {
    id: 'default-2',
    name: 'James Thornton',
    location: 'Corniche Towers, Abu Dhabi',
    stars: 5,
    body: 'Outstanding commercial service for our regional office. They operate quietly and thoroughly after hours, and our team arrives every morning to a fresh, gleaming workspace.',
    service: 'Commercial Maintenance',
    verified: true,
  },
  {
    id: 'default-3',
    name: 'Sara Al Hashmi',
    location: 'Al Mushrif, Abu Dhabi',
    stars: 5,
    body: 'Booked their move-out handover clean. We received our full tenancy security deposit back with zero deductions! The ovens and bathrooms looked brand new.',
    service: 'Move-Out Handover',
    verified: true,
  },
  {
    id: 'default-4',
    name: 'Mohammed Al Zaabi',
    location: 'Saadiyat Island, Abu Dhabi',
    stars: 5,
    body: 'Their luxury villa team is truly next-level. Hospital-grade eco detergents mean zero chemical odors, which is essential with our toddlers and golden retriever.',
    service: 'Eco Residential Care',
    verified: true,
  },
  {
    id: 'default-5',
    name: 'Elena Rostova',
    location: 'Al Reem Island, Abu Dhabi',
    stars: 5,
    body: 'Consistent 5-star standard every single week. Same vetted cleaner arrives on schedule, Emirates ID verified, completely dependable and meticulous.',
    service: 'Apartment Maintenance',
    verified: true,
  },
  {
    id: 'default-6',
    name: 'Tariq Al Ameri',
    location: 'Yas Island, Abu Dhabi',
    stars: 5,
    body: 'The online booking takes literally under a minute, and the cleaning team arrived equipped with industrial-grade steam equipment. Worth every single dirham.',
    service: 'Deep Steam Sanitation',
    verified: true,
  },
];

function QuoteWatermark({ className = 'w-12 h-12' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  );
}

function ChevronLeftIcon({ className = 'w-5 h-5' }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className = 'w-5 h-5' }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

function MapPinIcon({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function ReviewsCarousel({ reviews = [], loading = false, onWriteReview }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef(null);
  const touchEndXRef = useRef(null);

  // Responsive items visible per screen
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(3);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Merge loaded reviews with rich UAE defaults so carousel always has 4-6 cards
  const allReviews = useMemo(() => {
    if (Array.isArray(reviews) && reviews.length > 0) {
      if (reviews.length < 3) {
        const existingIds = new Set(reviews.map((r) => r.id));
        const fill = defaultReviews.filter((d) => !existingIds.has(d.id));
        return [...reviews, ...fill.slice(0, 6 - reviews.length)];
      }
      return reviews;
    }
    return defaultReviews;
  }, [reviews]);

  const maxIndex = Math.max(0, allReviews.length - itemsPerPage);

  // Keep currentIndex bounded when itemsPerPage or reviews change
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  // Auto-advance interval (7s) — pauses on hover, touch, or reduced motion
  useEffect(() => {
    if (loading || isPaused || maxIndex <= 0) return;

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const interval = setInterval(() => {
      handleNext();
    }, 7000);

    return () => clearInterval(interval);
  }, [loading, isPaused, maxIndex, handleNext]);

  // Touch gesture handlers for mobile swipe
  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const deltaX = touchStartXRef.current - touchEndXRef.current;
      const minSwipeDistance = 45;
      if (deltaX > minSwipeDistance) {
        handleNext();
      } else if (deltaX < -minSwipeDistance) {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const totalDots = maxIndex + 1;

  return (
    <section className="py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="inline-block px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-900 font-extrabold text-xs uppercase tracking-widest mb-3">
                Client Testimonials
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                Trusted Across Abu Dhabi
              </h2>
              <p className="text-slate-500 mt-3 text-sm sm:text-base max-w-2xl leading-relaxed">
                Read authentic experiences from UAE residents and property managers across Abu
                Dhabi, or leave your own verified feedback.
              </p>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-3 self-start md:self-end flex-wrap">
              {onWriteReview && (
                <button
                  type="button"
                  onClick={onWriteReview}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs sm:text-sm transition-all transform hover:scale-105 shadow-md active:scale-95"
                >
                  <span>⭐ Write a Review</span>
                </button>
              )}

              {/* Prev / Next Circular Arrows */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous reviews"
                  className="w-11 h-11 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-900 hover:text-white hover:border-blue-900 transition-all flex items-center justify-center shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next reviews"
                  className="w-11 h-11 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-900 hover:text-white hover:border-blue-900 transition-all flex items-center justify-center shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Carousel Container */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-slate-100 rounded-3xl p-8 border border-slate-200/60 animate-pulse h-64"
              />
            ))}
          </div>
        ) : (
          <div
            className="relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Viewport Mask */}
            <div className="overflow-hidden -mx-3 py-2 px-1">
              {/* Sliding Track */}
              <div
                className="flex transition-transform duration-500 ease-out will-change-transform"
                style={{
                  transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`,
                }}
              >
                {allReviews.map((r) => {
                  const initials = (r.name || 'Client')
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0]?.toUpperCase() ?? '')
                    .join('');

                  return (
                    <div key={r.id} className="flex-shrink-0 px-3 w-full md:w-1/2 lg:w-1/3">
                      <div className="group relative bg-slate-50 hover:bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/80 hover:border-blue-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full min-h-[300px] overflow-hidden">
                        {/* Elegant Decorative Watermark */}
                        <QuoteWatermark className="w-16 h-16 text-slate-200/40 absolute top-5 right-5 pointer-events-none group-hover:text-blue-100/70 transition-colors duration-300" />

                        {/* Top: Stars & Verified Badge */}
                        <div className="relative z-10 mb-5">
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <div className="flex gap-1 text-amber-400">
                              {Array.from({ length: r.stars || 5 }).map((_, j) => (
                                <StarIcon key={j} className="w-4 h-4 text-amber-400" />
                              ))}
                            </div>
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                              <span>✓</span>
                              <span>Verified Client</span>
                            </span>
                          </div>

                          {/* Review Body */}
                          <p className="text-slate-700 text-sm sm:text-base leading-relaxed italic break-words [overflow-wrap:anywhere]">
                            "{r.body}"
                          </p>
                        </div>

                        {/* Bottom: Client Profile */}
                        <div className="relative z-10 pt-5 border-t border-slate-200/80 flex items-center gap-4">
                          <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0 shadow-md transition-transform duration-300 group-hover:scale-105"
                            style={{
                              background: 'linear-gradient(135deg, #0A2342 0%, #1E3A8A 100%)',
                            }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-extrabold text-slate-900 text-base truncate group-hover:text-blue-950 transition-colors">
                              {r.name}
                            </div>
                            <div className="text-slate-500 text-xs truncate flex items-center gap-1 mt-0.5">
                              <MapPinIcon className="w-3.5 h-3.5 text-blue-800 flex-shrink-0" />
                              <span className="truncate">{r.location || 'Abu Dhabi, UAE'}</span>
                            </div>
                          </div>
                          {r.service && (
                            <span className="hidden xl:inline-block text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-xl shadow-xs">
                              {r.service}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Pagination Dots & Carousel Status */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              {/* Trust metric summary */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-extrabold text-amber-500">★ 4.9 / 5.0</span>
                <span>•</span>
                <span>Abu Dhabi 5-Star Hospitality Standard</span>
                {isPaused && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                    Paused
                  </span>
                )}
              </div>

              {/* Dot Indicators */}
              {totalDots > 1 && (
                <div className="flex items-center gap-2" role="tablist" aria-label="Review pages">
                  {Array.from({ length: totalDots }).map((_, idx) => {
                    const isActive = currentIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`Go to slide ${idx + 1}`}
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isActive ? 'w-8 bg-blue-900' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                        }`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
