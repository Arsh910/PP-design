/* Pretty Petals: shared behaviour for every page (design prototype).
   Each block checks its elements exist, so one file serves all templates.
   In the Shopify build: cart -> /cart/add.js + cart drawer section, search -> /search/suggest.json. */

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const canMove = !matchMedia('(prefers-reduced-motion: reduce)').matches;
const inr = n => '₹' + n.toLocaleString('en-IN');

/* ---------- injected global UI: toast, cart drawer, search panel, floating buttons ---------- */
document.body.insertAdjacentHTML('beforeend', `
<div class="toast" id="toast" role="status"><i></i><span id="toastMsg"></span></div>
<div class="scrim" id="scrim"></div>
<aside class="drawer" id="cartDrawer" aria-label="Your cart" aria-hidden="true">
  <div class="dr-head"><h3>Cart <span id="drCount"></span></h3><button class="dr-x" data-close aria-label="Close cart"><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5 5 19"/></svg></button></div>
  <div class="dr-ship"><p id="drShipMsg"></p><div class="bar"><i id="drShipBar"></i></div></div>
  <div class="dr-body">
    <ul class="dr-items" id="drItems"></ul>
    <div class="dr-empty" id="drEmpty"><p>Your cart is empty.</p><a class="btn btn-solid" href="collection.html">Start shopping</a></div>
    <section class="dr-gift" id="drGift">
      <p class="dr-label">Make it a gift</p>
      <div class="dr-gift-row"><img src="assets/gifting/wooden.jpg" alt="" loading="lazy">
        <div><b>Gift wrap &amp; note</b><span>Free</span></div>
        <button type="button" class="dr-add" id="drGiftBtn" aria-pressed="false">Add</button></div>
      <ul class="dr-gift-list"><li>Wrapped by hand in the store</li><li>A handwritten note with your message</li></ul>
      <div class="dr-gift-note" id="drGiftNote"><div><label for="drNote">Your note</label><textarea id="drNote" rows="3" maxlength="200" placeholder="Happy housewarming, love from…"></textarea></div></div>
    </section>
    <section class="dr-recs"><p class="dr-label">Recommended for you</p><ul id="drRecs"></ul></section>
  </div>
  <div class="dr-foot">
    <a class="btn btn-solid dr-checkout" href="cart.html">Checkout<span id="drSub"></span></a>
    <div class="dr-fine"><span>Taxes included. Shipping at checkout.</span><a class="dr-view" href="cart.html">View cart</a></div>
  </div>
</aside>
<div class="sx" id="searchPanel" aria-hidden="true">
  <form class="sx-in" action="search.html">
    <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    <input name="q" id="sxInput" type="search" placeholder="Search plates, resin, hampers…" autocomplete="off" aria-label="Search">
    <button type="button" class="dr-x" data-close aria-label="Close search"><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5 5 19"/></svg></button>
  </form>
  <div class="sx-body">
    <div><p class="kick">Popular searches</p><div class="sx-tags"><a href="search.html?q=plates">Plates</a><a href="search.html?q=resin">Resin keepsakes</a><a href="search.html?q=hamper">Hampers</a><a href="search.html?q=cushion">Cushions</a><a href="search.html?q=clock">Wall clocks</a></div></div>
    <div><p class="kick">Products</p><ul class="sx-res" id="sxRes"></ul></div>
  </div>
</div>
<a class="wa" href="https://wa.me/910000000000" target="_blank" rel="noopener" aria-label="Chat on WhatsApp"><svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z"/><path d="M8.6 8.2c.2-.5.5-.5.8-.5h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.6l-.5.6c-.1.1-.2.3 0 .5.4.7 1 1.4 1.7 1.9.6.4 1 .6 1.3.7.2.1.4 0 .5-.1l.7-.8c.2-.2.4-.2.6-.1l1.6.8c.2.1.4.2.4.4 0 .4-.1 1-.5 1.4-.5.5-1.2.8-1.9.7-1.1-.1-2.6-.7-4-2-1.5-1.4-2.4-3-2.6-4.1-.1-.7.1-1.3.3-1.6Z" fill="currentColor" stroke="none"/></svg><span>Chat with us</span></a>
<button class="totop" id="toTop" aria-label="Back to top"><svg viewBox="0 0 24 24"><path d="M12 19V5m-7 7 7-7 7 7"/></svg></button>`);

/* ---------- smooth scroll (Lenis); off for reduced motion, native on touch ---------- */
let lenis = null;
if (window.Lenis && canMove) {
  lenis = new Lenis({ lerp: .12, wheelMultiplier: 1.1 });
  const raf = t => { lenis.raf(t); requestAnimationFrame(raf) };
  requestAnimationFrame(raf);
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'), id = a && a.getAttribute('href');
    const t = id && id !== '#' && document.querySelector(id);
    if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -64, duration: 1.1 }) }
  });
}

/* ---------- toast ---------- */
let tT;
function toast(msg) { $('#toastMsg').textContent = msg; $('#toast').classList.add('show'); clearTimeout(tT); tT = setTimeout(() => $('#toast').classList.remove('show'), 2600) }

/* ---------- overlays: cart drawer + search panel ---------- */
const scrim = $('#scrim');
function openLayer(el) { closeLayers(); el.classList.add('open'); el.setAttribute('aria-hidden', 'false'); scrim.classList.add('show'); lenis?.stop() }
function closeLayers() { $$('.drawer.open,.sx.open,.side.open').forEach(x => { x.classList.remove('open'); x.setAttribute('aria-hidden', 'true') }); scrim.classList.remove('show'); lenis?.start() }
scrim.addEventListener('click', closeLayers);
$$('[data-close]').forEach(b => b.addEventListener('click', closeLayers));
addEventListener('keydown', e => { if (e.key === 'Escape') closeLayers() });

/* ---------- cart (sample state) ---------- */
const FREE_SHIP = 2499;
const cart = [
  { name: 'Ma Chérie Plate', meta: 'Everyday Plate', price: 695, qty: 2, img: 'assets/products/plate-cherie.jpg' },
  { name: 'Pineapple Salt & Pepper', meta: 'Set of two', price: 595, qty: 1, img: 'assets/products/sp-pineapple.jpg' }
];
const RECS = [
  { name: 'Blossom Plate', meta: 'Everyday Plate', price: 695, img: 'assets/products/plate-blossom.jpg' },
  { name: 'Character Tumblers', meta: 'Drinkware', price: 899, img: 'assets/products/tumbler-set.jpg' },
  { name: 'Dice Salt & Pepper', meta: 'Set of two', price: 645, img: 'assets/products/sp-dice.jpg' },
  { name: 'Floral Resin Trays', meta: 'Resin Art', price: 1995, img: 'assets/products/resin-trays.jpg' },
  { name: 'Sunflower Tufted Cushion', meta: 'Soft Furnishing', price: 1295, img: 'assets/products/cushion-sunflower.jpg' }
];
let giftWrap = false;
const minus = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg>', plus = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12M12 6v12"/></svg>';
function renderCart() {
  const count = cart.reduce((a, x) => a + x.qty, 0), sub = cart.reduce((a, x) => a + x.qty * x.price, 0);
  $$('#cartN').forEach(n => n.textContent = count);
  $('#drCount').textContent = `(${count})`;
  $('#drSub').textContent = count ? inr(sub) : '';
  $('#drItems').innerHTML = cart.map((x, i) => `<li>
    <img src="${x.img}" alt="">
    <div class="dr-it">
      <b class="dr-name">${x.name}</b>${x.meta ? `<span class="dr-meta">${x.meta}</span>` : ''}
      <span class="dr-price">${inr(x.price * x.qty)}${x.qty > 1 ? `<small>${inr(x.price)} each</small>` : ''}</span>
      <div class="dr-row"><div class="dr-qty"><button data-q="${i}" data-d="-1" aria-label="One fewer ${x.name}"${x.qty < 2 ? ' disabled' : ''}>${minus}</button><span aria-live="polite">${x.qty}</span><button data-q="${i}" data-d="1" aria-label="One more ${x.name}">${plus}</button></div>
        <button class="dr-rm" data-rm="${i}">Remove</button></div>
    </div></li>`).join('');
  $('#cartDrawer').classList.toggle('empty', !count);
  const left = FREE_SHIP - sub;
  $('#drShipMsg').innerHTML = left > 0 ? `Add <b>${inr(left)}</b> more for free delivery` : 'You have unlocked <b>free delivery</b>';
  $('#drShipBar').style.width = Math.min(sub / FREE_SHIP, 1) * 100 + '%';
  const gb = $('#drGiftBtn');
  gb.setAttribute('aria-pressed', giftWrap); gb.textContent = giftWrap ? 'Added' : 'Add';
  $('#drGift').classList.toggle('on', giftWrap);
  $('#drRecs').innerHTML = RECS.filter(r => !cart.some(x => x.name === r.name)).slice(0, 3).map(r => `<li>
    <img src="${r.img}" alt="" loading="lazy">
    <div><b class="dr-name">${r.name}</b><span class="dr-price">${inr(r.price)}</span></div>
    <button type="button" class="dr-add" data-rec="${r.name}" aria-label="Add ${r.name} to cart">Add</button></li>`).join('');
}
$('#drItems').addEventListener('click', e => {
  const q = e.target.closest('[data-q]'), rm = e.target.closest('[data-rm]');
  if (q) { const it = cart[q.dataset.q]; it.qty = Math.max(1, it.qty + +q.dataset.d) }
  if (rm) cart.splice(rm.dataset.rm, 1);
  if (q || rm) renderCart();
});
$('#drGiftBtn').addEventListener('click', () => { giftWrap = !giftWrap; renderCart(); if (giftWrap) setTimeout(() => $('#drNote').focus({ preventScroll: true }), 350) });
$('#drRecs').addEventListener('click', e => {
  const b = e.target.closest('[data-rec]'); if (!b) return;
  cart.push({ qty: 1, ...RECS.find(r => r.name === b.dataset.rec) });
  renderCart(); toast(b.dataset.rec + ' added to your cart.');
});
function addToCart(item) {
  const hit = cart.find(x => x.name === item.name);
  hit ? hit.qty += item.qty || 1 : cart.unshift({ qty: 1, meta: '', ...item });
  renderCart(); $('#cartN')?.classList.add('bump'); setTimeout(() => $('#cartN')?.classList.remove('bump'), 260);
  openLayer($('#cartDrawer'));
}
renderCart();
$('#cartBtn')?.addEventListener('click', () => openLayer($('#cartDrawer')));
/* any add button: data-name / data-price / data-img */
document.addEventListener('click', e => {
  const b = e.target.closest('.qadd:not(.qenq),.js-add:not(.js-pdp)');
  if (!b) return;
  e.preventDefault();
  const card = b.closest('.card');
  addToCart({ name: b.dataset.name, price: +(b.dataset.price || card?.dataset.price || 0), img: b.dataset.img || card?.querySelector('img')?.getAttribute('src') || '', meta: b.dataset.meta || card?.querySelector('.cat')?.textContent || '' });
});

/* ---------- predictive search (sample catalogue) ---------- */
const CATALOG = [
  ['Ma Chérie Plate', 695, 'assets/products/plate-cherie.jpg'], ['Lemon Stripe Plate', 695, 'assets/products/plate-lemon.jpg'], ['Blossom Plate', 695, 'assets/products/plate-blossom.jpg'],
  ['Watermelon Plate', 795, 'assets/products/plate-watermelon.jpg'], ['Blue Vine Plate', 695, 'assets/products/plate-vine.jpg'], ['Pineapple Salt & Pepper', 595, 'assets/products/sp-pineapple.jpg'],
  ['Dice Salt & Pepper', 645, 'assets/products/sp-dice.jpg'], ['Wristwatch Coffee Table Set', 24999, 'assets/products/watch-table.jpg'], ['Faith Keepsake Stand', 2495, 'assets/products/resin-faith.jpg'],
  ['Floral Resin Trays', 1995, 'assets/products/resin-trays.jpg'], ['Racer Wall Clock', 3995, 'assets/products/clock-race.jpg'], ['Sunflower Tufted Cushion', 1295, 'assets/products/cushion-sunflower.jpg'],
  ['Sunflower Tufted Throw', 3495, 'assets/products/throw-sunflower.jpg'], ['Character Tumblers', 899, 'assets/products/tumbler-set.jpg'], ['Seashell Luggage Set', 7499, 'assets/products/shell-set.jpg'],
  ['The Floral Hamper', 0, 'assets/gifting/floral.jpg'], ['The Woven Gift Basket', 0, 'assets/gifting/woven.jpg'], ['Rattan Heart Baskets', 1895, 'assets/products/basket-heart.jpg']
];
function renderSuggest(q) {
  q = q.trim().toLowerCase();
  const hits = (q ? CATALOG.filter(p => p[0].toLowerCase().includes(q)) : CATALOG.slice(0, 4)).slice(0, 5);
  $('#sxRes').innerHTML = hits.length ? hits.map(p => `<li><a href="product.html"><img src="${p[2]}" alt=""><span>${p[0]}</span><b>${p[1] ? inr(p[1]) : 'On enquiry'}</b></a></li>`).join('') : `<li class="none">No products for “${q}”. Try “plate” or “resin”.</li>`;
}
renderSuggest('');
$('#sxInput').addEventListener('input', e => renderSuggest(e.target.value));
$$('.search').forEach(s => s.addEventListener('click', e => { e.preventDefault(); openLayer($('#searchPanel')); setTimeout(() => $('#sxInput').focus(), 250) }));

/* ---------- header: mobile nav + mega menu ---------- */
/* ---------- menu sidebar (all screen sizes): burger opens a left drawer ---------- */
document.body.insertAdjacentHTML('beforeend', `
<aside class="side" id="sideNav" aria-label="Menu" aria-hidden="true">
  <button class="dr-x" data-close aria-label="Close menu"><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5 5 19"/></svg></button>
  <nav class="side-links">
    <a href="index.html">Home</a><a href="collection.html?c=crockery">Crockery &amp; Table</a><a href="collection.html?c=decor">Home Decor</a><a href="product-custom.html">Resin Studio</a>
    <a href="gifting.html">Gifting</a><a href="collections.html">Shop All</a>
  </nav>
  <nav class="side-sub"><!-- <a href="blog.html">Petal Notes</a> --><a href="about.html">Our Story</a><a href="contact.html">Visit Us</a><a href="faq.html">FAQs</a></nav>
  <a class="side-promo" href="gifting.html"><img src="assets/gifting/woven.jpg" alt=""><span class="new">New</span><b>Explore the Festive Edit</b></a>
  <div class="side-acct"><h4>My Account</h4><a class="btn btn-solid" href="login.html">Log in</a></div>
</aside>`);
const burger = $('#burger'), side = $('#sideNav');
$$('#sideNav [data-close]').forEach(b => b.addEventListener('click', closeLayers));
burger?.addEventListener('click', () => { openLayer(side); burger.setAttribute('aria-expanded', true) });
side.addEventListener('transitionend', () => { if (!side.classList.contains('open')) burger?.setAttribute('aria-expanded', false) });
const rail = $('#shopRail');
rail && $$('button[data-panel]', rail).forEach(b => {
  const on = () => { $$('button[data-panel]', rail).forEach(x => x.setAttribute('aria-current', x === b)); $$('.mpanel').forEach(p => p.classList.toggle('on', p.dataset.panel === b.dataset.panel)) };
  ['mouseenter', 'focus', 'click'].forEach(ev => b.addEventListener(ev, on));
});
/* current page in the nav */
const here = (location.pathname.split('/').pop() || 'index.html').replace(/^([^.]+)$/, '$1.html');
const hereQ = here + location.search;
// exact link (incl. ?c=) wins; a bare collection.html counts as Crockery; then the page itself or its data-match
const current = links => links.find(a => a.getAttribute('href') === hereQ) || (here === 'collection.html' && !location.search && links.find(a => a.getAttribute('href') === 'collection.html?c=crockery')) || links.find(a => a.getAttribute('href') === here || a.dataset.match?.split(' ').includes(here));
current($$('#nav>li>.nav-link'))?.setAttribute('aria-current', 'location');
current($$('.side-links a,.side-sub a', side))?.setAttribute('aria-current', 'page');
// prototype only: one collection template stands in for every collection, so swap its heading by ?c=
const colKey = new URLSearchParams(location.search).get('c');
const colCopy = { decor: ['Home Decor', 'Cushions, throws, baskets and statement pieces that make a room feel finished.', 'assets/store/soft-furnishings.jpg', 'Cushions and throws on display in the store'], festive: ['Festive Edit', 'Hampers, table pieces and gifts picked for the season.', 'assets/gifting/floral.jpg', 'Gold mesh festive hamper with ivory flowers'] }[colKey];
if (here === 'collection.html' && colKey !== 'festive') $$('.card[data-only="festive"]').forEach(c => c.remove());
if (colCopy && here === 'collection.html') {
  const h = $('.page-banner h1'), c = $('.crumbs span:last-child');
  if (h) { h.textContent = colCopy[0]; h.nextElementSibling && (h.nextElementSibling.textContent = colCopy[1]); }
  if (c) c.textContent = colCopy[0];
  const bi = $('.page-banner>img'); if (bi) { bi.src = colCopy[2]; bi.alt = colCopy[3] }
  document.title = colCopy[0] + ' | Pretty Petals';
}
$$('.ann-rot').forEach(r => {
  const ps = $$('p', r); let i = 0;
  if (ps.length > 1) setInterval(() => { if (document.hidden) return; ps[i].classList.remove('on'); i = (i + 1) % ps.length; ps[i].classList.add('on') }, 3800);
});
$('.icon-btn[aria-label="Account"]')?.addEventListener('click', () => location.href = 'login.html');

/* ---------- hero carousel ---------- */
const slides = $$('.slide'), dashes = $('#heroDashes');
if (slides.length && dashes) {
  let si = 0, timer;
  const go = i => { si = (i + slides.length) % slides.length; slides.forEach((s, n) => s.classList.toggle('on', n === si)); [...dashes.children].forEach((d, n) => d.setAttribute('aria-current', n === si)) };
  const auto = () => { clearInterval(timer); if (canMove) timer = setInterval(() => go(si + 1), 6000) };
  slides.forEach((_, i) => { const b = document.createElement('button'); b.setAttribute('aria-label', 'Go to slide ' + (i + 1)); b.innerHTML = '<i></i>'; b.onclick = () => { go(i); auto() }; dashes.appendChild(b) });
  $('#heroPrev').onclick = () => { go(si - 1); auto() }; $('#heroNext').onclick = () => { go(si + 1); auto() };
  go(0); auto();
}

/* ---------- tabs: sliding underline + filtering ---------- */
function swapFilter(grid, apply) {
  if (!canMove) { apply(); return }
  grid.classList.add('fading');
  setTimeout(() => {
    apply();
    [...grid.children].filter(c => !c.classList.contains('hide')).forEach((c, i) => { c.classList.remove('enter'); void c.offsetWidth; c.style.setProperty('--cd', i * .06 + 's'); c.classList.add('enter') });
    grid.classList.remove('fading');
  }, 250);
}
$$('.tabs').forEach(g => {
  const ink = document.createElement('i'); ink.className = 'tab-ink'; g.appendChild(ink);
  const move = () => { const t = $('.tab[aria-pressed="true"]', g); if (!t) return; ink.style.setProperty('--x', t.offsetLeft + 'px'); ink.style.setProperty('--w', t.offsetWidth + 'px') };
  g.addEventListener('click', e => {
    const t = e.target.closest('.tab'); if (!t) return;
    $$('.tab', g).forEach(x => x.setAttribute('aria-pressed', x === t)); requestAnimationFrame(move);
    const grid = $(g.dataset.grid); if (!grid) return;
    const c = t.dataset.cat;
    swapFilter(grid, () => { $$(':scope>[data-cat]', grid).forEach(card => card.classList.toggle('hide', c !== 'all' && !card.dataset.cat.split(' ').includes(c))); grid.scrollLeft = 0 });
    const lbl = $(g.dataset.label); if (lbl) lbl.textContent = 'Shop ' + t.textContent;
  });
  addEventListener('resize', move); document.fonts.ready.then(move); move();
});
$$('[data-open-tab]').forEach(a => a.addEventListener('click', () => $(`.tab[data-cat="${a.dataset.openTab}"]`)?.click()));

/* ---------- carousel arrows ---------- */
$$('[data-scroll]').forEach(b => b.addEventListener('click', () => { const row = document.getElementById(b.dataset.scroll); row.scrollBy({ left: row.clientWidth * b.dataset.dir, behavior: 'smooth' }) }));

/* ---------- auto-advancing carousels (reviews): loops, pauses on hover, progress bar ---------- */
$$('[data-autoplay],[data-progress]').forEach(row => {
  const bar = $(row.dataset.progress || '#rprog');
  const sync = () => { const max = row.scrollWidth - row.clientWidth, vis = row.clientWidth / row.scrollWidth; bar?.style.setProperty('--w', vis * 100 + '%'); bar?.style.setProperty('--x', (max ? row.scrollLeft / max : 0) * (1 - vis) * 100 + '%') };
  row.addEventListener('scroll', sync, { passive: true }); addEventListener('resize', sync); sync();
  let paused = false;
  row.addEventListener('mouseenter', () => paused = true); row.addEventListener('mouseleave', () => paused = false);
  if (canMove && row.hasAttribute('data-autoplay')) setInterval(() => {
    if (paused || document.hidden) return;
    const card = row.firstElementChild.getBoundingClientRect().width + 14;
    row.scrollLeft + row.clientWidth >= row.scrollWidth - 4 ? row.scrollTo({ left: 0 }) : row.scrollBy({ left: card });
  }, 3000);
});

/* ---------- reviews: mark the card nearest the row's centre ---------- */
$$('.rrow').forEach(row => {
  let raf = 0;
  const mark = () => {
    raf = 0;
    const r = row.getBoundingClientRect(), mid = r.left + r.width / 2;
    let best = null, bd = Infinity;
    [...row.children].forEach(c => { const b = c.getBoundingClientRect(), d = Math.abs(b.left + b.width / 2 - mid); if (d < bd) { bd = d; best = c } });
    [...row.children].forEach(c => c.classList.toggle('mid', c === best));
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(mark) };
  row.addEventListener('scroll', queue, { passive: true }); addEventListener('resize', queue); mark();
});

/* ---------- shop the shelf: pins and list highlight each other ---------- */
$$('[data-pin]').forEach(el => {
  const on = v => $$(`[data-pin="${el.dataset.pin}"]`).forEach(x => x.classList.toggle('on', v));
  el.addEventListener('mouseenter', () => on(true)); el.addEventListener('mouseleave', () => on(false));
  if (el.classList.contains('pin')) el.addEventListener('click', () => $(`.look-list [data-pin="${el.dataset.pin}"]`).click());
});

/* ---------- newsletter popup: once per visit, after a short delay ---------- */
const nl = $('#nl');
if (nl) {
  let seen = false; try { seen = sessionStorage.getItem('ppNl') } catch (e) { }
  const close = () => { nl.classList.remove('open'); nl.setAttribute('aria-hidden', 'true'); try { sessionStorage.setItem('ppNl', 1) } catch (e) { } };
  if (!seen) setTimeout(() => { if (!$('.drawer.open,.sx.open')) { nl.classList.add('open'); nl.setAttribute('aria-hidden', 'false') } }, 9000);
  $$('[data-nl-close]').forEach(b => b.addEventListener('click', close));
  nl.addEventListener('click', e => { if (e.target === nl) close() });
  $('form', nl).addEventListener('submit', close);
  addEventListener('keydown', e => { if (e.key === 'Escape') close() });
}

/* ---------- before / after slider ---------- */
$$('.ba-view').forEach(v => $('input', v).addEventListener('input', e => v.style.setProperty('--pos', e.target.value + '%')));

/* ---------- phone: full-width "View all" under each section, collapsible footer ---------- */
$$('.sec-end .vall').forEach(v => {
  const sec = v.closest('.wrap'); if (!sec) return;
  const m = v.cloneNode(true); m.className = 'vall vall-m'; m.removeAttribute('id'); sec.appendChild(m);
});
$$('.fgrid>div:not(:first-child) h5').forEach(h => h.addEventListener('click', () => h.parentElement.classList.toggle('fopen')));
/* phone: Most Popular shows the first six visible cards */
const capGrid = () => { const g = $('#pgrid'); if (!g) return; [...g.children].filter(c => !c.classList.contains('hide')).forEach((c, i) => c.classList.toggle('show-m-hide', i >= 6)) };
capGrid(); $$('[data-grid="#pgrid"] .tab').forEach(t => t.addEventListener('click', () => setTimeout(capGrid, 300)));

/* ---------- reels coverflow: centre reel plays (muted, sound toggle), its product shows below ---------- */
const reelsEl = $('#reels');
if (reelsEl) {
  const reels = $$('.reel', reelsEl), prods = $$('.reel-prod');
  let cur = +getComputedStyle(reelsEl).getPropertyValue('--i') || 0, sound = false;
  const show = i => {
    cur = (i + reels.length) % reels.length; reelsEl.style.setProperty('--i', cur);
    reels.forEach((r, n) => { const on = n === cur, v = $('video', r); r.classList.toggle('on', on); r.classList.toggle('sound', on && sound); v.muted = !(on && sound); on && canMove ? v.play().catch(() => { }) : v.pause() });
    prods.forEach((p, n) => p.classList.toggle('on', n === cur));
  };
  reels.forEach((r, n) => r.addEventListener('click', e => { if (e.target.closest('.reel-snd')) return; if (n !== cur) show(n) }));
  $$('.reel-snd', reelsEl).forEach(b => b.addEventListener('click', () => { sound = !sound; show(cur) }));
  $$('[data-reel]').forEach(b => b.addEventListener('click', () => show(cur + +b.dataset.reel)));
  let sx = 0; reelsEl.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
  reelsEl.addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 40) show(cur + (d < 0 ? 1 : -1)) });
  show(cur);
}

/* ---------- back to top ---------- */
const toTop = $('#toTop');
/* floating buttons wait until the hero is scrolled past, so they never cover it */
const floatBtns = () => { const past = scrollY > innerHeight * .7; toTop.classList.toggle('show', past); $('.wa').classList.toggle('show', past) };
addEventListener('scroll', floatBtns, { passive: true }); floatBtns();
toTop.addEventListener('click', () => lenis ? lenis.scrollTo(0, { duration: 1.4 }) : scrollTo({ top: 0, behavior: 'smooth' }));

/* ---------- scroll reveal ---------- */
document.documentElement.classList.add('anim');
/* every block animates on its own (heading, text, button, each card), siblings 75ms apart, like the Wonder theme */
const groupSel = '.clist,.pgrid,.jgrid,.gift-grid,.rgrid,.shorts,.rs-cards,.perks,.spot-media,.trust,.vals,.pgrid-static,.crow,.promo2,.look-list,.iotd,.mosaic,.steps,.addr-grid';
const atomSel = '.sec-row>div>*,.sec-head>*,.sec-end,.tabs,.look-copy>p,.look-copy>h2,.ba-copy>*,.iotd-info>*,.rs-grid>div:first-child>:not(ol),.film-in>*,.promo>div>*,.newc>img,.page-head>*,.page-banner .wrap>*,.split>div>*,.split>img,.feat-post,.ba-view,.look-img,.bsum,.reach,.faq,.form-card,.cinfo>*,.pdp-gal,.pdp-info>*,.summary,.cart-table,.reveal';
$$(groupSel).forEach(g => [...g.children].forEach((el, i) => { el.dataset.reveal = ''; el.style.setProperty('--d', (i % 8) * .075 + 's') }));
$$(atomSel).forEach(el => {
  if (el.closest('[data-reveal]') || el.closest('.mega,.side,.drawer,.sx,.nl,.hero')) return;
  el.dataset.reveal = '';
  const sibs = [...el.parentElement.children].filter(x => x.matches(atomSel));
  el.style.setProperty('--d', Math.min(sibs.indexOf(el), 6) * .075 + 's');
});
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { threshold: .1, rootMargin: '0px 0px -40px' });
$$('[data-reveal]').forEach(el => io.observe(el));

/* ---------- parallax on large images (moves slower than the page) ---------- */
const plx = $$('.film>img,.promo>img,.newc>img,.page-banner>img,.gift-hero img,.look-img img');
if (canMove && plx.length) {
  plx.forEach(i => i.classList.add('plx'));
  let tick = false;
  const run = () => { const h = innerHeight; plx.forEach(i => { const r = i.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > h) return; const p = (r.top + r.height / 2 - h / 2) / h; i.style.setProperty('--py', (p * -60).toFixed(1) + 'px') }); tick = false };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(run) } }, { passive: true }); run();
}

/* ---------- petal swash under section headings ---------- */
const swashIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('drawn'); swashIO.unobserve(e.target) } }), { threshold: 1 });
$$('.h-section').forEach(h => {
  h.insertAdjacentHTML('beforeend', '<svg class="swash" viewBox="0 0 160 24" aria-hidden="true"><path pathLength="1" d="M2 16C28 4 56 24 88 13S124 6 132 11"/><path pathLength="1" d="M132 11C137 3 148 1 157 5C151 13 141 15 132 11ZM132 11C140 8 148 6 157 5"/></svg>');
  swashIO.observe(h.lastElementChild);
});

/* ---------- video lightbox + reels + spotlight ---------- */
const lb = $('#lb'), lbVid = $('#lbVid');
function openVideo(src) { lbVid.src = src; lb.showModal(); lenis?.stop(); lbVid.play().catch(() => { }) }
if (lb) {
  lb.addEventListener('close', () => { lenis?.start(); lbVid.pause(); lbVid.removeAttribute('src'); lbVid.load() });
  $('#lbX').onclick = () => lb.close();
  lb.addEventListener('click', e => { if (e.target === lb) lb.close() });
  $$('.play-link[data-video]').forEach(b => b.addEventListener('click', () => openVideo(b.dataset.video)));
  $$('.short').forEach(s => {
    const v = $('video', s);
    $('.sp', s).addEventListener('click', () => { v.pause(); s.classList.remove('playing'); openVideo(s.dataset.video) });
    if (!canMove || !matchMedia('(hover:hover)').matches) return;
    s.addEventListener('mouseenter', () => v.play().then(() => s.classList.add('playing')).catch(() => { }));
    s.addEventListener('mouseleave', () => { v.pause(); s.classList.remove('playing') });
  });
}
$$('video[data-inview]').forEach(v => { if (canMove) new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? v.play().catch(() => { }) : v.pause()), { threshold: .35 }).observe(v) });
const spotVid = $('#spotVid');
if (spotVid && canMove) new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? spotVid.play().catch(() => { }) : spotVid.pause()), { threshold: .35 }).observe(spotVid);

/* ---------- product page: gallery, options, quantity ---------- */
$$('.pdp-thumbs button').forEach(b => b.addEventListener('click', () => {
  $$('.pdp-thumbs button').forEach(x => x.setAttribute('aria-current', x === b));
  const main = $('#pdpMain'); main.classList.add('swap');
  setTimeout(() => { main.src = b.dataset.src; main.onload = () => main.classList.remove('swap') }, 180);
}));
$$('.opts').forEach(g => g.addEventListener('click', e => { const o = e.target.closest('button'); if (!o) return; $$('button', g).forEach(x => x.setAttribute('aria-pressed', x === o)); const out = $(g.dataset.out); if (out) out.textContent = o.dataset.v || o.textContent; if (o.dataset.price) $('#pdpPrice').textContent = inr(+o.dataset.price) }));
$$('.qty:not(.sm)').forEach(q => q.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const n = $('span', q); n.textContent = Math.max(1, +n.textContent + +b.dataset.d) }));
$('.js-pdp')?.addEventListener('click', e => { e.stopPropagation(); const b = e.currentTarget; addToCart({ name: b.dataset.name, price: +$('#pdpPrice').textContent.replace(/\D/g, ''), img: $('#pdpMain').getAttribute('src'), meta: $('[data-opt-label]')?.textContent || '', qty: +$('#pdpQty').textContent }) });

/* ---------- collection page: filter drawer on small screens, view toggle ---------- */
$$('[data-filters-close]').forEach(b => b.addEventListener('click', () => document.body.classList.remove('filters-open')));
(() => {
  const panel = $('aside.filters'), grid = $('#colGrid');
  if (!panel || !grid) return;
  const cards = $$('.card[data-f]', grid), chips = $$('.fchip', panel), bar = $('.chips'), count = $('#colCount'), empty = $('.fempty');
  const tbar = $('.col-bar'), promo = $('.col-promo', grid), wide = matchMedia('(min-width:1081px)');
  cards.forEach((c, i) => c.dataset.i = i);
  const facetOf = c => c.closest('[data-facet]').dataset.facet;
  const label = c => [...c.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
  const isOn = c => c.getAttribute('aria-pressed') === 'true';
  const chipFor = (f, v) => $(`[data-facet="${f}"] .fchip[data-v="${v}"]`, panel);
  // price options carry "min-max" and read data-price; the rest match "facet:value" tags in data-f
  const hit = (card, f, v) => {
    if (f === 'price' && !card.dataset.price) return false;
    if (f !== 'price') return card.dataset.f.split(' ').includes(f + ':' + v);
    const [lo, hi] = v.split('-'), p = +card.dataset.price;
    return p >= +lo && (hi === '' || p <= +hi);
  };
  const picked = () => chips.filter(isOn).reduce((m, c) => ((m[facetOf(c)] ||= []).push(c.dataset.v), m), {});
  // options in one facet widen (OR); different facets narrow (AND)
  const passes = (card, sel, skip) => Object.entries(sel).every(([f, vs]) => f === skip || vs.some(v => hit(card, f, v)));
  const items = n => n + (n === 1 ? ' item' : ' items');
  const render = animate => {
    const sel = picked(), shown = cards.filter(c => passes(c, sel)), n = chips.filter(isOn).length;
    cards.forEach(c => c.classList.toggle('f-out', !shown.includes(c)));
    if (animate) shown.forEach((c, i) => { c.classList.remove('enter'); void c.offsetWidth; c.style.setProperty('--cd', Math.min(i, 8) * .05 + 's'); c.classList.add('enter') });
    // each option shows how many pieces it would give, given the picks in the other facets
    chips.forEach(c => {
      const f = facetOf(c), k = cards.filter(x => passes(x, sel, f) && hit(x, f, c.dataset.v)).length;
      $('small', c).textContent = k;
      c.disabled = !k && !isOn(c);
    });
    count.textContent = items(shown.length);
    if (promo) promo.hidden = n > 0;  // the custom-piece card only sits in the full, unfiltered grid
    empty.hidden = shown.length > 0;
    $$('.fclear', panel).forEach(b => b.disabled = !n);
    $('.fapply', panel).textContent = n ? 'Show ' + items(shown.length) : 'Apply';
    bar.innerHTML = chips.filter(isOn).map(c => `<button type="button" data-facet="${facetOf(c)}" data-v="${c.dataset.v}" aria-label="Remove filter: ${label(c)}">${label(c)}</button>`).join('')
      + (n ? '<button type="button" class="chips-clear">Clear all</button>' : '');
    // toolbar mirrors the panel: count, quick menus, switches
    $('#fCount').textContent = n;
    $$('[data-dd]', tbar).forEach(d => {
      const opts = $(`[data-facet="${d.dataset.dd}"]`, panel);
      $('.cb-pop', d).innerHTML = opts.innerHTML;
      $('.cb-btn', d).classList.toggle('has-sel', $$('.fchip', opts).some(isOn));
    });
    $$('[data-tog]', tbar).forEach(t => t.checked = isOn(chipFor('tag', t.dataset.tog)));
  };
  const toggle = (c, on = !isOn(c)) => { c.setAttribute('aria-pressed', on); render(true) };
  const clear = () => { chips.forEach(c => c.setAttribute('aria-pressed', 'false')); render(true) };
  panel.addEventListener('click', e => {
    const h = e.target.closest('.fsec-h');
    if (h) { h.setAttribute('aria-expanded', h.closest('.fsec').classList.toggle('open')); return }
    const c = e.target.closest('.fchip');
    if (c && !c.disabled) return toggle(c);
    if (e.target.closest('.fclear')) clear();
  });
  bar.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('chips-clear')) return clear();
    toggle(chipFor(b.dataset.facet, b.dataset.v), false);
  });
  empty.addEventListener('click', e => { if (e.target.closest('.fclear')) clear() });

  /* toolbar */
  const fbtn = $('#filterBtn');
  const syncFbtn = () => fbtn.setAttribute('aria-expanded', wide.matches ? !document.body.classList.contains('filters-hidden') : document.body.classList.contains('filters-open'));
  fbtn.addEventListener('click', () => { document.body.classList.toggle(wide.matches ? 'filters-hidden' : 'filters-open'); syncFbtn() });
  wide.addEventListener('change', syncFbtn); syncFbtn();
  const closeAll = except => $$('.cb-dd.open', tbar).forEach(d => { if (d !== except) { d.classList.remove('open'); $('.cb-btn', d).setAttribute('aria-expanded', 'false') } });
  $$('.cb-dd', tbar).forEach(d => {
    const b = $('.cb-btn', d);
    b.addEventListener('click', () => { closeAll(d); b.setAttribute('aria-expanded', d.classList.toggle('open')) });
  });
  $$('[data-dd] .cb-pop', tbar).forEach(p => p.addEventListener('click', e => {
    const c = e.target.closest('.fchip'); if (!c || c.disabled) return;
    toggle(chipFor(p.parentElement.dataset.dd, c.dataset.v));
  }));
  $$('[data-tog]', tbar).forEach(t => t.addEventListener('change', () => toggle(chipFor('tag', t.dataset.tog), t.checked)));
  document.addEventListener('click', e => { if (!e.composedPath().some(n => n.classList?.contains('cb-dd'))) closeAll() });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll() });

  /* sort: reorder the cards, keep the custom-piece promo in its slot */
  const pr = (c, none) => c.dataset.price ? +c.dataset.price : none;
  const sorters = { best: (a, b) => a.dataset.i - b.dataset.i, new: (a, b) => hit(b, 'tag', 'new') - hit(a, 'tag', 'new') || a.dataset.i - b.dataset.i, asc: (a, b) => pr(a, 1e9) - pr(b, 1e9), desc: (a, b) => pr(b, -1) - pr(a, -1) };
  const slot = promo ? [...grid.children].indexOf(promo) : -1;
  const sortBy = li => {
    $$('[role="option"]', tbar).forEach(o => o.setAttribute('aria-selected', o === li));
    $('#sortLabel').textContent = li.textContent;
    const order = [...cards].sort(sorters[li.dataset.sort]);
    if (promo) order.splice(slot, 0, promo);
    order.forEach(el => grid.append(el));
    closeAll(); render(true);
  };
  $$('[role="option"]', tbar).forEach(li => {
    li.addEventListener('click', () => sortBy(li));
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sortBy(li) } });
  });
  if (colKey === 'festive') chipFor('occ', 'festive')?.setAttribute('aria-pressed', 'true');
  render(false);
})();

/* ---------- forms and pages that arrive with the Shopify build ---------- */
$$('form[data-demo]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); toast(f.dataset.demo); f.reset() }));
$$('a[href="#"]:not(.logo)').forEach(a => a.addEventListener('click', e => { e.preventDefault(); toast('This goes live with the full Shopify store.') }));
$$('[data-copy]').forEach(b => b.addEventListener('click', () => { navigator.clipboard?.writeText(b.dataset.copy); toast('Gift card code copied.') }));
const q = new URLSearchParams(location.search).get('q');
if (q) $$('[data-query]').forEach(el => el.tagName === 'INPUT' ? el.value = q : el.textContent = q);

/* ---------- Lenis swallows wheel events (even while stopped), so panels that scroll on their own opt out ---------- */
$$('.drawer,.sx,.side,aside.filters,.nl').forEach(el => el.setAttribute('data-lenis-prevent', ''));
