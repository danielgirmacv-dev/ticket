import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface AuthBackgroundProps {
  active?: boolean;
}

export function AuthBackground({ active = true }: AuthBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const animateCanvas = active && !prefersReducedMotion;

  useEffect(() => {
    if (!animateCanvas) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      type: 'circle' | 'cross';
      angle: number;
      spinSpeed: number;
      baseOpacity: number;
      pulseSpeed: number;
      pulseTime: number;
      color: string;
      update: (mouseX: number, mouseY: number) => void;
      draw: (context: CanvasRenderingContext2D) => void;
    }

    const particleColors = [
      'rgba(17, 173, 196, 0.85)',
      'rgba(15, 87, 102, 0.85)',
      'rgba(44, 212, 236, 0.85)',
      'rgba(14, 146, 166, 0.85)',
      'rgba(6, 182, 212, 0.85)',
    ];

    const particles: Particle[] = [];
    const particleCount = Math.min(150, Math.floor((width * height) / 9000));
    const maxDepth = height * 0.35;

    const createParticle = (): Particle => {
      const baseOpacity = Math.random() * 0.5 + 0.35;
      const chosenColor = particleColors[Math.floor(Math.random() * particleColors.length)];

      return {
        x: Math.random() * width,
        y: Math.pow(Math.random(), 2.4) * maxDepth,
        size: Math.random() * 3 + 2,
        speedX: (Math.random() - 0.5) * 0.5 - 0.15,
        speedY: (Math.random() - 0.5) * 0.2,
        baseOpacity,
        opacity: baseOpacity,
        type: Math.random() > 0.4 ? 'cross' : 'circle',
        angle: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.03,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        pulseTime: Math.random() * 100,
        color: chosenColor,
        update(mouseX: number, mouseY: number) {
          this.x += this.speedX;
          this.y += this.speedY;
          this.angle += this.spinSpeed;
          this.pulseTime += this.pulseSpeed;

          if (this.x < -10) this.x = width + 10;
          if (this.x > width + 10) this.x = -10;

          if (this.y > maxDepth || this.y < -10) {
            this.y = 0;
            this.x = Math.random() * width;
            this.speedX = (Math.random() - 0.5) * 0.5 - 0.15;
            this.speedY = Math.random() * 0.15;
          }

          const depthFade = Math.max(0, 1 - this.y / maxDepth);
          this.opacity = (this.baseOpacity + Math.sin(this.pulseTime) * 0.15) * depthFade;

          if (mouseX > 0 && mouseY > 0) {
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = 140;

            if (dist < maxDistance && dist > 0) {
              const force = (maxDistance - dist) / maxDistance;
              this.x += (dx / dist) * force * 1.5;
              this.y += (dy / dist) * force * 1.5;
            }
          }
        },
        draw(context: CanvasRenderingContext2D) {
          if (this.opacity <= 0.01) return;
          context.save();
          context.globalAlpha = Math.min(1, Math.max(0.1, this.opacity));

          if (this.type === 'circle') {
            context.fillStyle = this.color;
            context.beginPath();
            context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            context.fill();
          } else {
            context.translate(this.x, this.y);
            context.rotate(this.angle);
            context.strokeStyle = this.color;
            context.lineWidth = 1.8;
            context.beginPath();
            context.moveTo(-this.size, 0);
            context.lineTo(this.size, 0);
            context.moveTo(0, -this.size);
            context.lineTo(0, this.size);
            context.stroke();
          }
          context.restore();
        },
      };
    };

    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle());
    }

    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      if (mouseX > 0 && mouseY > 0) {
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];
          const distToMouse = Math.hypot(mouseX - p1.x, mouseY - p1.y);
          if (distToMouse < 150) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouseX, mouseY);
            ctx.strokeStyle = `rgba(45, 212, 191, ${0.35 * (1 - distToMouse / 150)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();

            for (let j = i + 1; j < particles.length; j++) {
              const p2 = particles[j];
              const distBetween = Math.hypot(p1.x - p2.x, p1.y - p2.y);
              if (distBetween < 100) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = `rgba(26, 177, 199, ${0.25 * (1 - distBetween / 100)})`;
                ctx.lineWidth = 0.6;
                ctx.stroke();
              }
            }
          }
        }
      }

      particles.forEach((p) => {
        p.update(mouseX, mouseY);
        p.draw(ctx);
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, [animateCanvas]);

  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-[#061e24] via-[#0f5766] to-[#0a3f4d]" />
      <div className="absolute top-[-15%] left-[-12%] w-[65%] h-[65%] rounded-full bg-[#11adc4]/25 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-12%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#0f5766]/30 blur-[130px] pointer-events-none" />
      <div className="absolute top-[25%] right-[10%] w-[45%] h-[45%] rounded-full bg-[#11adc4]/20 blur-[110px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[5%] w-[50%] h-[45%] rounded-full bg-teal-400/15 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[#0f5766]/20 backdrop-blur-[6px] pointer-events-none" />
      {animateCanvas ? (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-90" />
      ) : null}
    </>
  );
}
