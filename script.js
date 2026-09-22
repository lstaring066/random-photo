"use strict";
// Existing project's public configuration. The database and Storage are unchanged.
const supabaseUrl = "https://nrpedfcezmvrrjhhfihy.supabase.co";
const supabaseKey = "sb_publishable_M9eL0D5OIW_NpOYkm8NaLw_d-o7bKHA";
function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => finish(new Error("Image timed out")), 15000);
    function finish(error) {
      clearTimeout(timer); img.onload = null; img.onerror = null;
      if (error) reject(error); else resolve(img);
    }
    img.onload = () => finish();
    img.onerror = () => finish(new Error("Image unavailable"));
    img.decoding = "async";
    img.src = url;
  });
}
async function readPhotos() {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const response = await fetch(`${supabaseUrl}/rest/v1/photos?select=id,url&order=id.asc&limit=1000&offset=${offset}`, {
      headers: { apikey: supabaseKey }, signal: AbortSignal.timeout(20000)
    });
    if (!response.ok) throw new Error(`Photo service: ${response.status}`);
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error("Invalid photo list");
    rows.push(...page);
    if (page.length < 1000) break;
  }
  // Duplicate database rows pointing at the same image count as one memory.
  return [...new Map(rows.filter(p => typeof p.url === "string" && /^https?:\/\//i.test(p.url)).map(p => [p.url, p])).values()];
}

const button = document.getElementById('btn');
const label = document.getElementById('button-label');
const status = document.getElementById('status');
const stack = document.getElementById('stack');
const previous = document.getElementById('previous');
const next = document.getElementById('next');
let cards = [], active = 0, busy = false, initialized = false;
let drag = null, suppressClick = false, wheelAmount = 0, wheelTime = 0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function offsetFor(index) {
  let offset = (index - active + cards.length) % cards.length;
  if (offset > cards.length / 2) offset -= cards.length;
  return offset;
}
function render(dragFraction = 0) {
  const css = getComputedStyle(stack);
  const step = parseFloat(css.getPropertyValue('--fan-step')) || 100;
  const rise = parseFloat(css.getPropertyValue('--fan-rise')) || 23;
  cards.forEach((card, index) => {
    const offset = offsetFor(index);
    const place = offset + dragFraction;
    const distance = Math.abs(place);
    card.el.style.transform = `translate(${place * step}px, ${distance * rise}px) rotate(${place * 10}deg) scale(${Math.max(.78, 1 - distance * .055)})`;
    card.el.style.zIndex = String(20 - Math.round(distance * 3));
    card.el.style.visibility = Math.abs(offset) <= 2 ? 'visible' : 'hidden';
    card.el.inert = Math.abs(offset) > 2;
    card.el.setAttribute('aria-hidden', String(Math.abs(offset) > 2));
    card.el.setAttribute('aria-current', String(index === active));
    card.el.tabIndex = Math.abs(offset) <= 2 ? 0 : -1;
    if (index === active) card.img.id = 'photo'; else card.img.removeAttribute('id');
  });
}
function updateProgress() {
  document.getElementById('current').textContent = String(active + 1).padStart(2, '0');
  document.getElementById('total').textContent = String(cards.length).padStart(2, '0');
  document.getElementById('progress-fill').style.width = `${(active + 1) / cards.length * 100}%`;
  status.textContent = cards.length > 1 ? `七七的 ${cards.length} 张明信片 · 左右滑动，慢慢看` : '七七的第一张明信片';
}
function setControls(loading = false) {
  button.disabled = loading || (initialized && cards.length < 2);
  previous.disabled = next.disabled = loading || !initialized || cards.length < 2;
  label.textContent = loading ? '正在打开七七的相册…' : '✦ Discover';
}
function move(amount) {
  if (!initialized || busy || cards.length < 2 || !amount) return;
  busy = true;
  active = (active + amount + cards.length) % cards.length;
  render(); updateProgress();
  // Card images are never replaced or removed while navigating.
  setTimeout(() => { busy = false; }, reducedMotion.matches ? 0 : 570);
}
async function initialize() {
  if (busy) return;
  busy = true; setControls(true); stack.setAttribute('aria-busy', 'true');
  status.textContent = '正在把七七的日常装进明信片';
  try {
    const photos = shuffle(await readPhotos());
    if (!photos.length) throw new Error('Empty collection');
    const loaded = new Array(photos.length);
    let cursor = 0;
    async function worker() {
      while (cursor < photos.length) {
        const i = cursor++;
        try {
          const img = await loadImage(photos[i].url);
          await img.decode();
          loaded[i] = {photo: photos[i], img};
        } catch { /* Unavailable images are skipped without changing the backend. */ }
      }
    }
    await Promise.all(Array.from({length: Math.min(4, photos.length)}, worker));
    cards = loaded.filter(Boolean);
    if (!cards.length) throw new Error('No available images');
    stack.replaceChildren();
    stack.classList.add('instant');
    cards.forEach((card, i) => {
      const el = document.createElement('figure');
      el.className = 'polaroid';
      el.dataset.photoId = String(card.photo.id);
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `查看七七明信片 ${i + 1}`);
      const mat = document.createElement('div'); mat.className = 'photo-mat';
      card.img.alt = `七七的日常 · 明信片 ${i + 1}`;
      card.img.draggable = false;
      mat.append(card.img);
      const caption = document.createElement('figcaption');
      const words = document.createElement('span'); words.textContent = '七七的小美好';
      const serial = document.createElement('small'); serial.textContent = `QIQI · ${String(i + 1).padStart(2, '0')}`;
      caption.append(words, serial); el.append(mat, caption);
      card.el = el;
      el.addEventListener('click', () => { if (!suppressClick) move(offsetFor(i)); });
      el.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); move(offsetFor(i));}
      });
      stack.append(el);
    });
    active = 0; initialized = true; render(); updateProgress();
    document.getElementById('placeholder').hidden = true;
    requestAnimationFrame(() => requestAnimationFrame(() => stack.classList.remove('instant')));
  } catch (error) {
    status.textContent = '七七的相册暂时没打开，请点击重试。';
    console.warn('Unable to open Qiqi postcards:', error.message);
  } finally {
    busy = false; setControls(); stack.setAttribute('aria-busy', 'false');
    if (!initialized) label.textContent = '↻ 再试一次';
  }
}
button.addEventListener('click', () => initialized ? move(1) : initialize());
previous.addEventListener('click', () => move(-1));
next.addEventListener('click', () => move(1));
stack.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
stack.addEventListener('pointerdown', event => {
  if (busy || !initialized || cards.length < 2 || event.button !== 0) return;
  drag = {id:event.pointerId, x:event.clientX, y:event.clientY, dx:0, horizontal:false};
  suppressClick = false;
});
stack.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.id) return;
  const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
  if (!drag.horizontal) {
    if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {drag = null; return;}
    if (Math.abs(dx) < 8) return;
    drag.horizontal = true; suppressClick = true;
    stack.setPointerCapture(event.pointerId); stack.classList.add('dragging');
  }
  drag.dx = dx;
  const step = parseFloat(getComputedStyle(stack).getPropertyValue('--fan-step'));
  render(Math.max(-.95, Math.min(.95, dx / (step * 1.6))));
});
function endDrag(event, cancelled = false) {
  if (!drag || event.pointerId !== drag.id) return;
  const {dx, horizontal} = drag; drag = null;
  stack.classList.remove('dragging');
  if (stack.hasPointerCapture(event.pointerId)) stack.releasePointerCapture(event.pointerId);
  if (horizontal) {
    if (!cancelled && Math.abs(dx) >= 35) move(dx < 0 ? 1 : -1); else render();
    setTimeout(() => {suppressClick = false;}, 100);
  }
}
stack.addEventListener('pointerup', event => endDrag(event));
stack.addEventListener('pointercancel', event => endDrag(event, true));
stack.addEventListener('lostpointercapture', event => endDrag(event, true));
stack.addEventListener('wheel', event => {
  if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || cards.length < 2) return;
  event.preventDefault();
  if (busy) return;
  if (Date.now() - wheelTime > 180) wheelAmount = 0;
  wheelTime = Date.now(); wheelAmount += event.deltaX;
  if (Math.abs(wheelAmount) > 45) {move(wheelAmount > 0 ? 1 : -1); wheelAmount = 0;}
}, {passive:false});
window.addEventListener('resize', () => {if (initialized) render();});
initialize();
