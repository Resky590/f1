(() => {
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const lerp = (a, b, t) => a + (b - a) * t;

    class TiltCard {
        constructor(element) {
            this.element = element;
            this.rotationX = 0;
            this.rotationY = 0;
            this.targetRotationX = 0;
            this.targetRotationY = 0;
            
            this.element.addEventListener('mousemove', (e) => this.onMouseMove(e));
            this.element.addEventListener('mouseleave', () => this.reset());
            this.animate();
        }

        onMouseMove(e) {
            const rect = this.element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.element.style.setProperty('--x', `${x}px`);
            this.element.style.setProperty('--y', `${y}px`);
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            this.targetRotationX = clamp(((y - centerY) / centerY) * -8, -8, 8);
            this.targetRotationY = clamp(((x - centerX) / centerX) * 8, -8, 8);
        }

        reset() {
            this.targetRotationX = 0;
            this.targetRotationY = 0;
        }

        animate() {
            this.rotationX = lerp(this.rotationX, this.targetRotationX, 0.1);
            this.rotationY = lerp(this.rotationY, this.targetRotationY, 0.1);
            
            if (Math.abs(this.rotationX - this.targetRotationX) > 0.01 || 
                Math.abs(this.rotationY - this.targetRotationY) > 0.01) {
                this.element.style.transform = 
                    `perspective(1000px) rotateX(${this.rotationX}deg) rotateY(${this.rotationY}deg) translate3d(0,0,0)`;
                requestAnimationFrame(() => this.animate());
            }
        }
    }

    class CanvasParticles {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) return;
            
            this.ctx = this.canvas.getContext('2d', { alpha: true });
            this.particles = [];
            this.particleCount = 16;
            
            this.resize();
            this.createParticles();
            this.animate();
            
            window.addEventListener('resize', () => this.resize());
        }

        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        createParticles() {
            this.particles = [];
            for (let i = 0; i < this.particleCount; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    radius: Math.random() * 1.5 + 0.5,
                    opacity: Math.random() * 0.5 + 0.1
                });
            }
        }

        update() {
            for (let p of this.particles) {
                p.x += p.vx;
                p.y += p.vy;
                
                if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
                
                p.x = clamp(p.x, 0, this.canvas.width);
                p.y = clamp(p.y, 0, this.canvas.height);
            }
        }

        draw() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = `rgba(0, 194, 255, 0.6)`;
            this.ctx.globalCompositeOperation = 'lighter';
            
            for (let p of this.particles) {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.globalAlpha = p.opacity;
                this.ctx.fill();
            }
            
            this.ctx.globalAlpha = 1;
            this.ctx.globalCompositeOperation = 'source-over';
        }

        animate = () => {
            this.update();
            this.draw();
            requestAnimationFrame(this.animate);
        }
    }

    class MouseTracker {
        constructor() {
            this.x = 0;
            this.y = 0;
            document.addEventListener('mousemove', (e) => {
                this.x = e.clientX;
                this.y = e.clientY;
            });
        }
    }

    window.addEventListener('load', () => {
        const cards = document.querySelectorAll('.tilt-element');
        cards.forEach(card => new TiltCard(card));
        
        new CanvasParticles('webgl-canvas');
        new MouseTracker();

        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    });
})();
