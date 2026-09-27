import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setScrollProgress(progress);
      }
      setIsVisible(window.scrollY > 280);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      title="Return to top of Ground Control Deck"
      className="fixed bottom-6 right-6 z-40 p-2.5 rounded-full bg-[#081122]/90 border border-cyan-400/50 text-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-110 hover:border-cyan-300 hover:text-white transition-all duration-300 cursor-pointer group"
    >
      {/* Mini Circular Progress Ring */}
      <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="2.5"
        />
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke="#00F0FF"
          strokeWidth="2.5"
          strokeDasharray={`${scrollProgress * 0.94}, 94`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
      </div>
    </button>
  );
};
