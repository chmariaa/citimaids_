import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * ActionMenu — Modern unified 3-dot action dropdown with smooth spring pop-in animation.
 * Uses createPortal(..., document.body) to guarantee it floats above all table boundaries,
 * overflow:hidden containers, and sticky headers without being clipped.
 */
export default function ActionMenu({
  items = [],
  disabled = false,
  title = 'More options',
  size = 32,
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, bottom: 0, right: 0, openUpward: false });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const estHeight = items.length * 40 + 20;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < estHeight + 20 && rect.top > estHeight;

    setCoords({
      top: rect.bottom + 6,
      bottom: window.innerHeight - rect.top + 6,
      right: Math.max(12, window.innerWidth - rect.right),
      openUpward,
    });
  }, [items.length]);

  const toggleOpen = (e) => {
    e.stopPropagation();
    if (disabled) return;
    if (!open) {
      updatePosition();
    }
    setOpen((prev) => !prev);
  };

  // Close when clicking outside, scrolling, or pressing Escape
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }

    function handleScrollOrResize() {
      setOpen(false);
    }

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open]);

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
        @keyframes actionMenuPopDown {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(-6px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes actionMenuPopUp {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(6px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>

      {/* ── 3-Dot Trigger Button ── */}
      <button
        ref={buttonRef}
        type="button"
        title={title}
        disabled={disabled}
        onClick={toggleOpen}
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          border: open ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
          background: open ? '#eff6ff' : '#ffffff',
          color: open ? '#1d4ed8' : '#64748b',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.45 : 1,
          transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: open ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
          outline: 'none',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (!disabled && !open) {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.color = '#0f172a';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.06)';
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)';
          }
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.6" />
          <circle cx="8" cy="8" r="1.6" />
          <circle cx="8" cy="13" r="1.6" />
        </svg>
      </button>

      {/* ── Floating Portal Menu ── */}
      {open &&
        createPortal(
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              right: `${coords.right}px`,
              ...(coords.openUpward
                ? { bottom: `${coords.bottom}px`, transformOrigin: 'bottom right' }
                : { top: `${coords.top}px`, transformOrigin: 'top right' }),
              minWidth: 195,
              maxWidth: 260,
              background: '#ffffff',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              boxShadow:
                '0 16px 38px -6px rgba(15, 23, 42, 0.18), 0 4px 12px -2px rgba(15, 23, 42, 0.08)',
              padding: '6px',
              zIndex: 999999,
              animation: `${
                coords.openUpward ? 'actionMenuPopUp' : 'actionMenuPopDown'
              } 0.16s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            }}
          >
            {items
              .filter((item) => !item.hidden)
              .map((item, idx) => {
                const isDanger = item.danger;
                const defaultColor = isDanger ? '#dc2626' : item.color || '#334155';

                return (
                  <div key={idx}>
                    {item.dividerBefore && (
                      <div
                        style={{
                          height: 1,
                          background: '#f1f5f9',
                          margin: '5px 4px',
                        }}
                      />
                    )}
                    <button
                      type="button"
                      disabled={item.disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.disabled) return;
                        setOpen(false);
                        if (item.onClick) item.onClick(e);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        color: defaultColor,
                        background: 'transparent',
                        border: 'none',
                        cursor: item.disabled ? 'not-allowed' : 'pointer',
                        opacity: item.disabled ? 0.45 : 1,
                        textAlign: 'left',
                        transition: 'all 0.12s ease',
                        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
                      }}
                      onMouseEnter={(e) => {
                        if (!item.disabled) {
                          e.currentTarget.style.background = isDanger
                            ? '#fef2f2'
                            : item.hoverBg || '#f8fafc';
                          if (item.hoverColor) {
                            e.currentTarget.style.color = item.hoverColor;
                          } else if (isDanger) {
                            e.currentTarget.style.color = '#b91c1c';
                          }
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!item.disabled) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = defaultColor;
                        }
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          minWidth: 0,
                        }}
                      >
                        {item.icon && (
                          <span
                            style={{
                              width: 16,
                              height: 16,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {item.icon}
                          </span>
                        )}
                        <span
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.label}
                        </span>
                      </div>

                      {item.badge && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 6,
                            background: item.badgeBg || '#f1f5f9',
                            color: item.badgeColor || '#64748b',
                            flexShrink: 0,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
          </div>,
          document.body
        )}
    </div>
  );
}
