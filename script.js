"use strict";
// Existing project's public configuration. The database and Storage are unchanged.
const supabaseUrl = "https://nrpedfcezmvrrjhhfihy.supabase.co";
const supabaseKey = "sb_publishable_M9eL0D5OIW_NpOYkm8NaLw_d-o7bKHA";
const button = document.getElementById("btn");
const label = document.getElementById("button-label");
const status = document.getElementById("status");
const stack = document.getElementById("stack");
const poses = ["translate(0px, 0px) rotate(-5deg) scale(1)", "translate(27px, -14px) rotate(5deg) scale(.96)", "translate(-23px, -28px) rotate(-11deg) scale(.92)"];
let photos = [], bag = [], cards = [], failed = new Set(), lastDraw = null;
let busy = false, shown = 0, direction = 1, prepared = null, initialized = false;

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function draw() {
  if (!bag.length) {
    bag = shuffle(photos.filter(p => !failed.has(p.url)));
    if (bag.length > 1 && bag[0].url === lastDraw) [bag[0], bag[1]] = [bag[1], bag[0]];
  }
  const photo = bag.shift();
  if (photo) lastDraw = photo.url;
  return photo;
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
async function nextCard() {
  for (let tries = 0; tries < photos.length; tries++) {
    const photo = draw();
    if (!photo) return null;
    if (failed.has(photo.url)) continue;
    try {
      const img = await loadImage(photo.url);
      const el = document.createElement("figure");
      el.className = "polaroid"; el.dataset.photoId = String(photo.id);
      const mat = document.createElement("div"); mat.className = "photo-mat";
      img.alt = "随机回忆照片"; img.draggable = false; mat.append(img);
      const caption = document.createElement("figcaption");
      const words = document.createElement("span"); words.textContent = "a little moment of life";
      const serial = document.createElement("small"); serial.textContent = "MEMORIES ✦";
      caption.append(words, serial); el.append(mat, caption);
      return {el, photo};
    } catch { failed.add(photo.url); bag = bag.filter(p => p.url !== photo.url); }
  }
  return null;
}
function positionCards() {
  cards.forEach((card, i) => {
    card.el.style.transform = poses[i]; card.el.style.zIndex = String(10 - i);
    card.el.setAttribute("aria-hidden", String(i !== 0));
    card.el.querySelector("img").id = i === 0 ? "photo" : "";
  });
}
function updateProgress() {
  const total = Math.max(0, photos.length - failed.size);
  const current = total ? ((shown - 1) % total) + 1 : 0;
  document.getElementById("current").textContent = String(current).padStart(2, "0");
  document.getElementById("total").textContent = String(total).padStart(2, "0");
  document.getElementById("progress-fill").style.width = total ? `${current / total * 100}%` : "0%";
  status.textContent = total === 1 ? "目前只有一张可用照片，新的美好即将加入。" : `共 ${total} 张回忆 · 一轮内不重复${failed.size ? " · 已跳过暂不可用的图片" : ""}`;
}
function setBusy(value) {
  busy = value; button.disabled = value; stack.setAttribute("aria-busy", String(value));
  label.textContent = value ? "正在寻找回忆…" : "✦ Discover";
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
async function initialize() {
  setBusy(true); status.textContent = "正在打开你的照片收藏";
  try {
    photos = await readPhotos(); bag = []; failed.clear(); lastDraw = null; shown = 0;
    cards.forEach(c => c.el.remove()); cards = [];
    if (!photos.length) throw new Error("Empty collection");
    for (let i = 0; i < Math.min(3, photos.length); i++) {
      if (i >= photos.length - failed.size) break;
      const card = await nextCard();
      if (!card) break;
      cards.push(card); stack.append(card.el); positionCards();
      document.getElementById("placeholder").hidden = true;
    }
    if (!cards.length) throw new Error("No images available");
    initialized = true; shown = 1; updateProgress(); setBusy(false);
    if (photos.length - failed.size > 1) prepared = nextCard();
    else button.disabled = true;
  } catch (error) {
    console.warn("Unable to open memories:", error.message);
    initialized = false; setBusy(false); label.textContent = "↻ 再试一次";
    status.textContent = photos.length ? "照片暂时无法加载，请稍后重试。" : "暂时没有读到照片，请检查网络后重试。";
  }
}
function animate(el, frames, options) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();
  return el.animate(frames, options).finished.catch(() => {});
}
async function discover() {
  if (busy) return;
  if (!initialized) return initialize();
  setBusy(true);
  try {
    const incoming = await (prepared || nextCard()); prepared = null;
    if (!incoming && cards.length < 2) throw new Error("No next image");
    const outgoing = cards.shift();
    outgoing.el.querySelector("img").removeAttribute("id");
    const previous = cards.map(card => card.el.style.transform);
    if (incoming) { cards.push(incoming); stack.append(incoming.el); }
    positionCards(); outgoing.el.style.zIndex = "20"; outgoing.el.setAttribute("aria-hidden", "true");
    const opts = {duration: 900, easing: "cubic-bezier(.22,.7,.18,1)"};
    const moves = [animate(outgoing.el, [
      {transform: poses[0], opacity: 1},
      {transform: `translate(${direction * 95}px, -65px) rotate(${direction * 16}deg) scale(.94)`, opacity: 1, offset: .35},
      {transform: `translate(${direction * 620}px, -170px) rotate(${direction * 42}deg) scale(.55)`, opacity: 0}
    ], {duration: 820, easing: "cubic-bezier(.4,0,.7,.5)"})];
    cards.forEach((card, i) => {
      const isNew = card === incoming;
      moves.push(animate(card.el, [
        {transform: isNew ? `translate(${-direction * 330}px, -100px) rotate(${-direction * 25}deg) scale(.65)` : previous[i], opacity: isNew ? 0 : 1},
        {transform: poses[i], opacity: 1}
      ], {...opts, delay: isNew ? 160 : 80 + i * 60}));
    });
    await Promise.all(moves); outgoing.el.remove(); direction *= -1;
    shown++; updateProgress();
    if (photos.length - failed.size > 1) prepared = nextCard();
  } catch (error) {
    console.warn("Unable to change memory:", error.message);
    status.textContent = "下一张照片暂时无法加载，点击重试。";
  } finally { setBusy(false); if (photos.length - failed.size <= 1) button.disabled = true; }
}
button.addEventListener("click", discover);
initialize();
