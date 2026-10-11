'use strict';
(() => {
  const videos = [...document.querySelectorAll('.showcase-video')];
  const pause = () => videos.forEach(video => video.pause());
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('pagehide', pause);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (!entry.isIntersecting) entry.target.pause(); });
    }, { threshold: 0.05 });
    videos.forEach(video => observer.observe(video));
  }
})();
