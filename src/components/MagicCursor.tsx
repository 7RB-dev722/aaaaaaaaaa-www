import React, { useEffect, useRef, useState } from 'react';

const MagicCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  
  const [isPointer, setIsPointer] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  // Use refs for position to avoid re-renders on every mousemove
  const mousePos = useRef({ x: 0, y: 0 });
  const followerPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      
      // Update main cursor immediately - Instant response
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Check for pointer cursor
      const target = e.target as HTMLElement;
      // Check if hovering over clickable elements
      const isClickable = 
        window.getComputedStyle(target).cursor === 'pointer' || 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.closest('a') !== null || 
        target.closest('button') !== null ||
        target.closest('[role="button"]') !== null;
        
      setIsPointer(isClickable);
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    // Animation loop for smooth follower
    let animationFrameId: number;
    
    const animate = () => {
      // Linear interpolation (Lerp) for smooth trailing
      const lerp = (start: number, end: number, factor: number) => {
        return start + (end - start) * factor;
      };

      // Smooth follow speed
      followerPos.current.x = lerp(followerPos.current.x, mousePos.current.x, 0.15);
      followerPos.current.y = lerp(followerPos.current.y, mousePos.current.y, 0.15);

      if (followerRef.current) {
        followerRef.current.style.transform = `translate3d(${followerPos.current.x}px, ${followerPos.current.y}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      {/* Main Cursor Point */}
      <div 
        ref={cursorRef}
        className={`fixed top-0 left-0 pointer-events-none z-[9999] transition-transform duration-75 ease-out mix-blend-difference`}
        style={{ marginTop: '-4px', marginLeft: '-4px' }}
      >
        <div className={`
          w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,1)]
          transition-all duration-200
          ${isClicking ? 'scale-50' : 'scale-100'}
          ${isPointer ? 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)]' : ''}
        `}></div>
      </div>

      {/* Smooth Follower Ring */}
      <div 
        ref={followerRef}
        className={`fixed top-0 left-0 pointer-events-none z-[9998] flex items-center justify-center transition-all duration-300 ease-out`}
        style={{ 
          marginTop: isPointer ? '-24px' : '-12px', 
          marginLeft: isPointer ? '-24px' : '-12px',
          width: isPointer ? '48px' : '24px',
          height: isPointer ? '48px' : '24px',
        }}
      >
        <div className={`
          absolute inset-0 rounded-full border transition-all duration-300
          ${isPointer 
            ? 'border-cyan-400/50 bg-cyan-400/10 scale-100' 
            : 'border-white/30 scale-100'
          }
          ${isClicking ? 'scale-75 border-cyan-400' : ''}
        `}></div>
      </div>
    </>
  );
};

export default MagicCursor;
