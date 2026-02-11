import React from 'react';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#020205]">
      {/* Deep Digital Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1a0b2e_0%,_#000000_80%)] opacity-80"></div>
      
      {/* Moving Cyber Grid */}
      <div 
        className="absolute inset-0 opacity-20 animate-grid-flow"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 243, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 243, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          perspective: '1000px',
          transform: 'rotateX(60deg) scale(2)',
          transformOrigin: 'top center'
        }}
      ></div>

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute border border-cyan-500/20 bg-cyan-500/5 backdrop-blur-sm animate-float"
            style={{
              width: Math.random() * 100 + 50 + 'px',
              height: Math.random() * 100 + 50 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.3,
              animationDuration: Math.random() * 10 + 10 + 's',
              animationDelay: Math.random() * 5 + 's',
              transform: `rotate(${Math.random() * 360}deg)`,
              clipPath: 'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)' // Cyber shard shape
            }}
          ></div>
        ))}
      </div>

      {/* Ambient Glow Orbs */}
      <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse-glow"></div>
      <div className="absolute bottom-[-20%] right-[20%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

      {/* Noise Overlay for Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}>
      </div>
    </div>
  );
};
