import React, { useEffect, useRef, useState } from 'react';

interface Point {
  x: number;
  y: number;
  age: number;
}

const MagicCursor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorShapeRef = useRef<HTMLDivElement>(null);
  const points = useRef<Point[]>([]);
  const mousePos = useRef({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  
  // إعدادات قابلة للتخصيص
  const config = {
    trailColorStart: '#00f2ff', // أزرق سيايان أكثر سطوعاً
    trailColorEnd: '#0066ff',   // أزرق كهربائي
    lineWidth: 4,               // زيادة سماكة الخط قليلاً
    maxAge: 50,                 // زيادة مدة بقاء الأثر
    glowAmount: 25,             // زيادة التوهج بشكل ملحوظ
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      
      // تحديث موقع شكل المؤشر المخصص
      if (cursorShapeRef.current) {
        cursorShapeRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // إضافة نقطة للأثر (تبدأ من نهاية المؤشر وليس رأسه)
      const offset = isPointer ? 16 : 13; // إزاحة طفيفة لتناسب حجم المؤشر عند التحويم
      points.current.push({
        x: e.clientX + offset,
        y: e.clientY + offset,
        age: 0
      });

      // التحقق من نوع المؤشر (Hover)
      const target = e.target as HTMLElement;
      const isClickable = 
        window.getComputedStyle(target).cursor === 'pointer' || 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.closest('a') !== null || 
        target.closest('button') !== null;
      setIsPointer(isClickable);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (points.current.length > 1) {
        for (let i = 0; i < points.current.length - 1; i++) {
          const p1 = points.current[i];
          const p2 = points.current[i + 1];
          
          p1.age++;
          const opacity = 1 - p1.age / config.maxAge;
          
          if (opacity > 0) {
            const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            gradient.addColorStop(0, `${config.trailColorStart}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`);
            gradient.addColorStop(1, `${config.trailColorEnd}00`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = config.lineWidth * opacity;
            ctx.shadowBlur = config.glowAmount * opacity;
            ctx.shadowColor = config.trailColorStart;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
        points.current = points.current.filter(p => p.age < config.maxAge);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    handleResize();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      {/* 1. الأثر السحري (Canvas Trail) */}
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 pointer-events-none z-[9998] mix-blend-screen"
      />

      {/* 2. شكل المؤشر الطبيعي (Simple Triangle) */}
      <div
        ref={cursorShapeRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] flex items-center justify-center mix-blend-difference"
        style={{ marginTop: '0px', marginLeft: '0px', imageRendering: 'crisp-edges' }}
      >
        <div className={`
          relative transition-all duration-300 ease-out
          ${isPointer ? 'scale-125' : 'scale-100'}
          ${isClicking ? 'scale-75' : ''}
        `}>
          {/* رأس المثلث (Cursor Tip) */}
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ transform: 'translate(-1px, -1px) rotate(6deg)', filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.5))' }}
          >
            <path 
              d="M2 2L8 18L11 11L18 8L2 2Z" 
              fill="white" 
              stroke="white" 
              strokeWidth="1.2" 
              strokeLinejoin="miter"
            />
          </svg>

          {/* تأثير توهج خفيف جداً خلف المثلث */}
          {isPointer && (
            <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full -z-10 animate-pulse"></div>
          )}
        </div>
      </div>
    </>
  );
};

export default MagicCursor;
