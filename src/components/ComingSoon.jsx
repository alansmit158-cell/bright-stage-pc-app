import React, { useEffect, useRef } from 'react';

const ComingSoon = ({ featureName, icon, description }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.6 + 0.2,
    }));

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${p.alpha})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div style={styles.wrapper}>
      <canvas ref={canvasRef} style={styles.canvas} />
      <div style={styles.content}>
        {/* Animated rings */}
        <div style={styles.rings}>
          <div style={{ ...styles.ring, ...styles.ring1 }} />
          <div style={{ ...styles.ring, ...styles.ring2 }} />
          <div style={{ ...styles.ring, ...styles.ring3 }} />
          <div style={styles.iconBox}>
            <span style={styles.iconText}>{icon || '🚀'}</span>
          </div>
        </div>

        <div style={styles.badge}>
          <span style={styles.badgeDot} />
          En développement
        </div>

        <h1 style={styles.title}>Coming Soon</h1>
        <h2 style={styles.featureName}>{featureName}</h2>
        <p style={styles.description}>
          {description || 'Cette fonctionnalité est en cours de développement et sera disponible très prochainement.'}
        </p>

        <div style={styles.progressWrapper}>
          <div style={styles.progressBar}>
            <div style={styles.progressFill} />
          </div>
          <span style={styles.progressLabel}>Développement en cours...</span>
        </div>

        <div style={styles.features}>
          {['Design finalisé', 'Backend en cours', 'Tests à venir'].map((step, i) => (
            <div key={i} style={styles.featureItem}>
              <span style={{ ...styles.featureDot, opacity: i === 0 ? 1 : i === 1 ? 0.6 : 0.3 }} />
              <span style={{ opacity: i === 0 ? 1 : i === 1 ? 0.7 : 0.4 }}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 0.3; }
          100% { transform: scale(1); opacity: 0.6; }
        }
        @keyframes progress-anim {
          0% { width: 0%; }
          100% { width: 65%; }
        }
        @keyframes float-icon {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes badge-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(139,92,246,0); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  wrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f0c29 0%, #1a1040 40%, #0d1b2a 100%)',
    overflow: 'hidden',
  },
  canvas: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  content: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '40px 24px',
    maxWidth: '520px',
  },
  rings: {
    position: 'relative',
    width: '160px',
    height: '160px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '32px',
  },
  ring: {
    position: 'absolute',
    borderRadius: '50%',
    border: '2px solid rgba(139, 92, 246, 0.4)',
    animation: 'pulse-ring 3s ease-in-out infinite',
  },
  ring1: { width: '160px', height: '160px', animationDelay: '0s' },
  ring2: { width: '120px', height: '120px', animationDelay: '0.5s', borderColor: 'rgba(167, 139, 250, 0.3)' },
  ring3: { width: '80px', height: '80px', animationDelay: '1s', borderColor: 'rgba(196, 181, 253, 0.2)' },
  iconBox: {
    width: '60px',
    height: '60px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 30px rgba(124, 58, 237, 0.5)',
    animation: 'float-icon 3s ease-in-out infinite',
  },
  iconText: {
    fontSize: '26px',
    lineHeight: 1,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(139, 92, 246, 0.15)',
    border: '1px solid rgba(139, 92, 246, 0.4)',
    borderRadius: '999px',
    padding: '6px 16px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#a78bfa',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '20px',
    animation: 'badge-pulse 2s ease-in-out infinite',
  },
  badgeDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#a78bfa',
    display: 'inline-block',
  },
  title: {
    fontSize: 'clamp(36px, 6vw, 56px)',
    fontWeight: '900',
    background: 'linear-gradient(135deg, #fff 0%, #a78bfa 50%, #7c3aed 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '0 0 8px 0',
    lineHeight: 1.1,
    letterSpacing: '-1px',
  },
  featureName: {
    fontSize: 'clamp(16px, 3vw, 22px)',
    fontWeight: '600',
    color: '#e2e8f0',
    margin: '0 0 16px 0',
    opacity: 0.9,
  },
  description: {
    fontSize: '15px',
    color: '#94a3b8',
    lineHeight: 1.7,
    margin: '0 0 32px 0',
  },
  progressWrapper: {
    width: '100%',
    marginBottom: '28px',
  },
  progressBar: {
    height: '6px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '999px',
    overflow: 'hidden',
    marginBottom: '10px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
    borderRadius: '999px',
    width: '65%',
    animation: 'progress-anim 2s ease-out forwards',
    boxShadow: '0 0 10px rgba(124, 58, 237, 0.6)',
  },
  progressLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500',
  },
  features: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#cbd5e1',
    fontWeight: '500',
  },
  featureDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#7c3aed',
    flexShrink: 0,
  },
};

export default ComingSoon;
