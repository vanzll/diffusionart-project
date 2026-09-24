'use strict';
(() => {
  const data = window.PROJECT_MEDIA;
  const before = document.getElementById('video-before');
  const after = document.getElementById('video-after');
  const videos = [before, after];
  const playButton = document.getElementById('play-pair');
  const status = document.getElementById('video-status');
  let generation = 0;
  let pairedPlayback = false;
  let correcting = false;

  function setPlayControl(playing) {
    const label = playing ? 'Pause both videos' : 'Play both videos';
    playButton.setAttribute('aria-label', label);
    playButton.title = label;
    playButton.querySelector('img').src = `assets/${playing ? 'pause' : 'play'}.svg`;
  }

  function pausePair() {
    pairedPlayback = false;
    videos.forEach(video => video.pause());
    setPlayControl(false);
  }

  async function playPair(restart = false) {
    const token = generation;
    pausePair();
    const position = restart ? 0 : before.currentTime;
    videos.forEach(video => { video.currentTime = position; });
    status.textContent = 'Loading videos...';
    try {
      await Promise.all(videos.map(video => video.play()));
      if (token !== generation) return;
      pairedPlayback = true;
      setPlayControl(true);
      status.textContent = '';
    } catch (error) {
      if (token !== generation) return;
      pausePair();
      status.textContent = 'Playback did not start. Try the controls on each video or select another example.';
    }
  }

  function buttons(containerId, entries, select) {
    const container = document.getElementById(containerId);
    entries.forEach((entry, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      const thumbnail = document.createElement('img');
      thumbnail.src = entry.sides[1].poster || entry.sides[1].image;
      thumbnail.alt = '';
      thumbnail.loading = 'lazy';
      const label = document.createElement('span');
      label.textContent = entry.label;
      button.append(thumbnail, label);
      button.setAttribute('aria-pressed', String(index === 0));
      button.addEventListener('click', () => {
        [...container.children].forEach(child => child.setAttribute('aria-pressed', String(child === button)));
        select(entry);
      });
      container.append(button);
    });
  }

  function selectVideo(entry) {
    generation++;
    pausePair();
    correcting = false;
    status.textContent = '';
    videos.forEach((video, index) => {
      video.poster = entry.sides[index].poster;
      video.src = entry.sides[index].video;
      video.load();
    });
    document.getElementById('video-prompt').textContent = entry.text;
    document.getElementById('video-details').textContent =
      `HunyuanVideo-13B | run ${entry.run} | prompt index ${entry.index} | seed ${entry.seed} | steps ${entry.sides[0].step} and ${entry.sides[1].step} | 53 frames, 640 x 640, 8 FPS.`;
  }

  function selectImage(entry) {
    document.getElementById('image-prompt').textContent = entry.text;
    document.getElementById('image-benchmark').textContent = entry.benchmark;
    ['before', 'after'].forEach((side, index) => {
      const image = document.getElementById(`image-${side}`);
      image.style.visibility = 'hidden';
      image.onload = () => { image.style.visibility = 'visible'; };
      image.onerror = () => {
        image.style.visibility = 'visible';
        image.alt = 'Image could not be loaded. Refresh the page or select another example.';
      };
      image.src = entry.sides[index].image;
      image.alt = `${index === 0 ? 'Pretrained' : 'DiffusionART'}: ${entry.text}`;
    });
    document.getElementById('image-details').textContent =
      `SD3.5-M | ${entry.benchmark} | run ${entry.run} | media index ${entry.index} | steps ${entry.sides[0].step} and ${entry.sides[1].step}. Matched prompt and media index; per-image seeds were not logged.`;
  }

  playButton.addEventListener('click', () => pairedPlayback ? pausePair() : playPair());
  document.getElementById('replay-pair').addEventListener('click', () => playPair(true));
  videos.forEach(video => {
    video.addEventListener('ended', pausePair);
    video.addEventListener('error', () => {
      pausePair();
      status.textContent = 'This video could not be loaded. Refresh the page or try another example.';
    });
    video.addEventListener('pause', () => { if (pairedPlayback) pausePair(); });
  });
  before.addEventListener('timeupdate', () => {
    if (!pairedPlayback || correcting || after.readyState < 2 || before.seeking || after.seeking) return;
    if (Math.abs(before.currentTime - after.currentTime) > 0.18) {
      correcting = true;
      after.currentTime = before.currentTime;
    }
  });
  after.addEventListener('seeked', () => { correcting = false; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pausePair(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) pausePair();
    }, { threshold: 0.05 }).observe(document.querySelector('.video-pair'));
  }
  buttons('video-choices', data.videos, selectVideo);
  buttons('image-choices', data.images, selectImage);
  selectVideo(data.videos[0]);
  selectImage(data.images[0]);

  const tabs = [...document.querySelectorAll('.result-tabs [role=tab]')];
  function selectResult(selected) {
    tabs.forEach(tab => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectResult(tab));
    tab.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowRight') target = tabs[(index + 1) % tabs.length];
      if (event.key === 'ArrowLeft') target = tabs[(index + tabs.length - 1) % tabs.length];
      if (event.key === 'Home') target = tabs[0];
      if (event.key === 'End') target = tabs[tabs.length - 1];
      if (target) { event.preventDefault(); selectResult(target); target.focus(); }
    });
  });
})();
