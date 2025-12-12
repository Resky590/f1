(() => {
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const lerp = (a, b, t) => a + (b - a) * t;
    const easeOutQuad = (t) => t * (2 - t);
    const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    class ScrollManager {
        constructor() {
            this.scrollY = 0;
            this.smoothScrollY = 0;
            this.targetScrollY = 0;
            this.scrollVelocity = 0;
            this.isScrolling = false;
            this.scrollTimeout = null;
            this.easing = 0.12;
            this.maxParallaxOffset = 5;

            this.scrollElements = new Map();
            this.parallaxElements = new Map();
            this.glowElements = new Map();
            this.floatElements = new Map();
            this.textWarpElements = new Map();

            this.setupEventListeners();
            this.discoverElements();
            this.animate();
        }

        setupEventListeners() {
            window.addEventListener('scroll', () => this.onScroll(), { passive: true });
            window.addEventListener('resize', () => this.discoverElements());
        }

        onScroll() {
            this.targetScrollY = window.scrollY;
            this.isScrolling = true;

            clearTimeout(this.scrollTimeout);
            this.scrollTimeout = setTimeout(() => {
                this.isScrolling = false;
            }, 150);
        }

        discoverElements() {
            this.scrollElements.clear();
            this.parallaxElements.clear();
            this.glowElements.clear();
            this.floatElements.clear();
            this.textWarpElements.clear();

            document.querySelectorAll('.scroll-reveal').forEach((el, i) => {
                this.scrollElements.set(el, {
                    element: el,
                    revealed: false,
                    index: i
                });
            });

            document.querySelectorAll('.scroll-parallax').forEach((el) => {
                const rect = el.getBoundingClientRect();
                const depth = el.classList.contains('depth-1') ? 1 : 
                              el.classList.contains('depth-2') ? 2 : 3;
                this.parallaxElements.set(el, {
                    element: el,
                    offsetTop: el.offsetTop,
                    depth: depth,
                    currentOffset: 0,
                    targetOffset: 0
                });
            });

            document.querySelectorAll('.scroll-glow').forEach((el) => {
                this.glowElements.set(el, {
                    element: el,
                    offsetTop: el.offsetTop,
                    height: el.clientHeight,
                    glowIntensity: 0,
                    targetGlowIntensity: 0
                });
            });

            document.querySelectorAll('.float-on-scroll').forEach((el) => {
                this.floatElements.set(el, {
                    element: el,
                    offsetTop: el.offsetTop,
                    floatOffset: 0,
                    targetFloatOffset: 0
                });
            });

            document.querySelectorAll('.text-warp').forEach((el) => {
                this.textWarpElements.set(el, {
                    element: el,
                    offsetTop: el.offsetTop,
                    warpAmount: 0,
                    targetWarpAmount: 0
                });
            });
        }

        updateScrollReveal() {
            for (const [el, data] of this.scrollElements) {
                const rect = el.getBoundingClientRect();
                const isInViewport = rect.top < window.innerHeight * 0.8 && rect.bottom > 0;

                if (isInViewport && !data.revealed) {
                    data.revealed = true;
                    el.classList.add('visible');
                } else if (!isInViewport && data.revealed) {
                    data.revealed = false;
                    el.classList.remove('visible');
                }
            }
        }

        updateParallax() {
            for (const [el, data] of this.parallaxElements) {
                const windowHeight = window.innerHeight;
                const elementCenter = data.offsetTop + el.clientHeight / 2;
                const scrollCenter = this.smoothScrollY + windowHeight / 2;
                const distance = scrollCenter - elementCenter;
                const parallaxFactor = 0.05 * data.depth;

                data.targetOffset = clamp(distance * parallaxFactor, -this.maxParallaxOffset, this.maxParallaxOffset);
                data.currentOffset = lerp(data.currentOffset, data.targetOffset, 0.1);

                el.style.setProperty('--parallax-offset', `${data.currentOffset}px`);
                el.style.transform = `translate3d(0, ${data.currentOffset}px, 0)`;
            }
        }

        updateGlow() {
            for (const [el, data] of this.glowElements) {
                const elementCenter = data.offsetTop + data.height / 2;
                const windowCenter = this.smoothScrollY + window.innerHeight / 2;
                const distance = Math.abs(elementCenter - windowCenter);
                const maxDistance = window.innerHeight;

                data.targetGlowIntensity = clamp(1 - distance / maxDistance, 0, 1);
                data.glowIntensity = lerp(data.glowIntensity, data.targetGlowIntensity, 0.15);

                el.style.setProperty('--glow-intensity', data.glowIntensity);

                if (data.glowIntensity > 0.1) {
                    el.classList.add('in-view');
                } else {
                    el.classList.remove('in-view');
                }
            }
        }

        updateFloat() {
            for (const [el, data] of this.floatElements) {
                const elementTop = data.offsetTop;
                const elementCenter = elementTop + el.clientHeight / 2;
                const windowCenter = this.smoothScrollY + window.innerHeight / 2;
                const distance = (elementCenter - windowCenter) / window.innerHeight;

                data.targetFloatOffset = clamp(distance * 3, -2, 2);
                data.floatOffset = lerp(data.floatOffset, data.targetFloatOffset, 0.12);

                el.style.setProperty('--float-offset', `${data.floatOffset}px`);
                el.style.transform = `translate3d(0, ${data.floatOffset}px, 0)`;
            }
        }

        updateTextWarp() {
            for (const [el, data] of this.textWarpElements) {
                const elementTop = data.offsetTop;
                const scrollProgress = (this.smoothScrollY - (elementTop - window.innerHeight / 2)) / window.innerHeight;
                const clampedProgress = clamp(scrollProgress, -0.5, 0.5);

                data.targetWarpAmount = clampedProgress * 3;
                data.warpAmount = lerp(data.warpAmount, data.targetWarpAmount, 0.1);

                el.style.setProperty('--warp-amount', data.warpAmount);
                el.setAttribute('data-warp', Math.abs(data.warpAmount) > 0.01 ? 'true' : 'false');
            }
        }

        animate = () => {
            this.smoothScrollY = lerp(this.smoothScrollY, this.targetScrollY, this.easing);

            this.updateScrollReveal();
            this.updateParallax();
            this.updateGlow();
            this.updateFloat();
            this.updateTextWarp();

            requestAnimationFrame(this.animate);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new ScrollManager();
        });
    } else {
        new ScrollManager();
    }
})();
