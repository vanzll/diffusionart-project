'use strict';
(() => {
  const data = window.PROJECT_MEDIA;
  const before = document.getElementById('video-before');
  const after = document.getElementById('video-after');
  const videos = [before, after];
  const playButton = document.getElementById('play-pair');
  const replayButton = document.getElementById('replay-pair');
  const status = document.getElementById('video-status');
  const videoPanel = document.getElementById('panel-video');
  const tabs = [...document.querySelectorAll('.demo-tabs [role=tab]')];
  let generation = 0;
  let playRequested = false;
  let pairedPlayback = false;
  let correcting = false;
  let loadingTimeout;
  let readinessController;

  if (!data?.videos?.length || !data?.images?.length) {
    status.textContent = 'Media catalog unavailable.';
    return;
  }

  function setPlayControl(playing) {
    const label = playing ? 'Pause both videos' : 'Play both videos';
    playButton.setAttribute('aria-label', label);
    playButton.title = label;
    playButton.querySelector('img').src = `assets/${playing ? 'pause' : 'play'}.svg`;
  }

  function pausePair() {
    // Fence every pending play request, including pauses and tab switches.
    generation++;
    playRequested = false;
    pairedPlayback = false;
    clearTimeout(loadingTimeout);
    readinessController?.abort();
    videos.forEach(video => video.pause());
    setPlayControl(false);
    status.textContent = '';
  }

  async function playPair(restart = false) {
    if (videoPanel.hidden || document.hidden) return;
    pausePair();
    const token = generation;
    playRequested = true;
    readinessController = new AbortController();
    const signal = readinessController.signal;
    setPlayControl(true);
    status.textContent = 'Loading videos...';
    loadingTimeout = setTimeout(() => {
      if (token !== generation) return;
      pausePair();
      status.textContent = 'Video loading timed out.';
    }, 15000);
    try {
      const position = restart || videos.some(video => video.ended) ? 0 : before.currentTime;
      videos.forEach(video => {
        video.preload = 'auto';
        if (video.readyState === 0) video.load();
      });
      await Promise.all(videos.map(video => waitForReady(video, signal)));
      if (token !== generation) return;
      videos.forEach(video => { if (video.currentTime !== position) video.currentTime = position; });
      await Promise.all(videos.map(video => waitForReady(video, signal)));
      if (token !== generation) return;
      await Promise.all(videos.map(video => video.play()));
      if (token !== generation) return;
      clearTimeout(loadingTimeout);
      pairedPlayback = true;
      status.textContent = '';
    } catch (error) {
      if (token !== generation) return;
      pausePair();
      status.textContent = 'Playback unavailable.';
    }
  }

  function waitForReady(video, signal) {
    if (signal.aborted) return Promise.reject(new Error('Playback cancelled'));
    if (video.readyState >= 3 && !video.seeking) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        video.removeEventListener('canplay', ready);
        video.removeEventListener('seeked', ready);
        video.removeEventListener('error', failed);
        signal.removeEventListener('abort', cancelled);
      };
      const ready = () => {
        if (video.readyState >= 3 && !video.seeking) { cleanup(); resolve(); }
      };
      const failed = () => { cleanup(); reject(new Error('Video unavailable')); };
      const cancelled = () => { cleanup(); reject(new Error('Playback cancelled')); };
      video.addEventListener('canplay', ready);
      video.addEventListener('seeked', ready);
      video.addEventListener('error', failed);
      signal.addEventListener('abort', cancelled, { once:true });
      ready();
    });
  }

  function buttons(containerId, entries, select) {
    const container = document.getElementById(containerId);
    entries.forEach((entry, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-pressed', String(index === 0));
      button.setAttribute('aria-label', entry.label);
      button.title = entry.text;
      const thumbnail = document.createElement('img');
      thumbnail.src = entry.sides[1].poster || entry.sides[1].image;
      thumbnail.alt = '';
      thumbnail.loading = 'lazy';
      const label = document.createElement('span');
      label.textContent = entry.label;
      button.append(thumbnail, label);
      button.addEventListener('click', () => {
        [...container.children].forEach(child => child.setAttribute('aria-pressed', String(child === button)));
        select(entry);
      });
      container.append(button);
    });
  }

  function selectVideo(entry) {
    pausePair();
    correcting = false;
    videos.forEach((video, index) => {
      video.poster = entry.sides[index].poster;
      video.src = entry.sides[index].video;
      video.setAttribute('aria-label', `${index === 0 ? 'Pretrained' : 'DiffusionART'}: ${entry.text}`);
      video.load();
    });
    document.getElementById('video-prompt').textContent = entry.text;
    document.getElementById('video-details').textContent =
      `HunyuanVideo-13B | prompt index ${entry.index} | 53 frames, 640 x 640, 8 FPS | HF revision ${entry.model_revision}.`;
  }

  function selectImage(entry) {
    document.getElementById('image-prompt').textContent = entry.text;
    document.getElementById('image-benchmark').textContent = entry.benchmark;
    const imageStatus = document.getElementById('image-status');
    imageStatus.textContent = '';
    ['before', 'after'].forEach((side, index) => {
      const image = document.getElementById(`image-${side}`);
      const name = index === 0 ? 'Pretrained' : 'DiffusionART';
      image.style.visibility = 'hidden';
      image.onload = () => { image.style.visibility = 'visible'; };
      image.onerror = () => {
        image.style.visibility = 'visible';
        image.alt = `${name} image unavailable.`;
        imageStatus.textContent = 'An image could not be loaded.';
      };
      image.alt = `${name}: ${entry.text}`;
      image.src = entry.sides[index].image;
    });
    document.getElementById('image-details').textContent =
      `SD3.5-M | ${entry.benchmark} | run ${entry.run} | media index ${entry.index} | steps ${entry.sides[0].step} and ${entry.sides[1].step}. Matched prompt and logged media index.`;
  }

  function selectTab(selected) {
    if (selected.id !== 'tab-video') pausePair();
    tabs.forEach(tab => {
      const active = tab === selected;
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panel.hidden = !active;
      panel.inert = !active;
      panel.tabIndex = active ? 0 : -1;
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowRight') target = tabs[(index + 1) % tabs.length];
      if (event.key === 'ArrowLeft') target = tabs[(index + tabs.length - 1) % tabs.length];
      if (event.key === 'Home') target = tabs[0];
      if (event.key === 'End') target = tabs[tabs.length - 1];
      if (target) {
        event.preventDefault();
        selectTab(target);
        target.focus();
      }
    });
  });

  playButton.addEventListener('click', () => playRequested ? pausePair() : playPair());
  replayButton.addEventListener('click', () => playPair(true));
  videos.forEach(video => {
    video.addEventListener('waiting', () => {
      if (!pairedPlayback) return;
      const position = Math.min(before.currentTime, after.currentTime);
      pausePair();
      videos.forEach(item => { item.currentTime = position; });
      playPair();
    });
    video.addEventListener('ended', pausePair);
    video.addEventListener('error', () => {
      pausePair();
      status.textContent = 'This video could not be loaded.';
    });
    video.addEventListener('play', () => {
      if (!playRequested || videoPanel.hidden || document.hidden) video.pause();
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
  window.addEventListener('pagehide', pausePair);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) pausePair();
    }, { threshold: 0.05 }).observe(document.querySelector('.video-pair'));
  }

  buttons('video-choices', data.videos, selectVideo);
  buttons('image-choices', data.images, selectImage);
  selectVideo(data.videos[0]);
  selectImage(data.images[0]);
  selectTab(tabs[0]);
  playButton.disabled = false;
  replayButton.disabled = false;
})();
