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
  <div class="dr-head"><h3>Your Cart <span id="drCount"></span></h3><button class="dr-x" data-close aria-label="Close cart"><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5 5 19"/></svg></button></div>
  <div class="dr-ship"><p id="drShipMsg"></p><div class="bar"><i id="drShipBar"></i></div></div>
  <ul class="dr-items" id="drItems"></ul>
  <div class="dr-empty" id="drEmpty"><p>Your cart is empty.</p><a class="btn btn-solid" href="collection.html">Start shopping</a></div>
  <div class="dr-foot">
    <label class="dr-note"><input type="checkbox"> Add gift wrapping &amp; a handwritten note</label>
    <div class="dr-total"><span>Subtotal</span><b id="drSub">₹0</b></div>
    <p class="dr-fine">Taxes included. Shipping calculated at checkout.</p>
    <a class="btn btn-solid" href="cart.html">Checkout</a>
    <a class="dr-view" href="cart.html">View cart</a>
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
function renderCart() {
  const count = cart.reduce((a, x) => a + x.qty, 0), sub = cart.reduce((a, x) => a + x.qty * x.price, 0);
  $$('#cartN').forEach(n => n.textContent = count);
  $('#drCount').textContent = count ? `(${count})` : '';
  $('#drSub').textContent = inr(sub);
  $('#drItems').innerHTML = cart.map((x, i) => `<li><img src="${x.img}" alt=""><div><b>${x.name}</b><span>${x.meta}</span><div class="qty sm"><button data-q="${i}" data-d="-1" aria-label="Fewer">−</button><span>${x.qty}</span><button data-q="${i}" data-d="1" aria-label="More">+</button></div></div><div class="dr-r"><b>${inr(x.price * x.qty)}</b><button class="dr-rm" data-rm="${i}">Remove</button></div></li>`).join('');
  $('#cartDrawer').classList.toggle('empty', !count);
  const left = FREE_SHIP - sub;
  $('#drShipMsg').innerHTML = left > 0 ? `You are <b>${inr(left)}</b> away from free delivery.` : 'You have unlocked <b>free delivery</b>.';
  $('#drShipBar').style.width = Math.min(sub / FREE_SHIP, 1) * 100 + '%';
}
$('#drItems').addEventListener('click', e => {
  const q = e.target.closest('[data-q]'), rm = e.target.closest('[data-rm]');
  if (q) { const it = cart[q.dataset.q]; it.qty = Math.max(1, it.qty + +q.dataset.d) }
  if (rm) cart.splice(rm.dataset.rm, 1);
  if (q || rm) renderCart();
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
    <a href="index.html">Home</a><a href="collection.html">Crockery &amp; Table</a><a href="collection.html">Home Decor</a><a href="product-custom.html">Resin Studio</a>
    <a href="gifting.html">Gifting</a><a href="collections.html">Shop All</a>
  </nav>
  <nav class="side-sub"><a href="blog.html">Petal Notes</a><a href="about.html">Our Story</a><a href="contact.html">Visit Us</a><a href="faq.html">FAQs</a></nav>
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
const here = location.pathname.split('/').pop() || 'index.html';
$$('a', side).find(a => a.getAttribute('href') === here)?.setAttribute('aria-current', 'page');
$$('#nav>li>.nav-link').forEach(a => { if (a.getAttribute('href') === here || a.dataset.match?.split(' ').includes(here)) a.setAttribute('aria-current', 'location') });
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

/* ---------- back to top ---------- */
const toTop = $('#toTop');
/* floating buttons wait until the hero is scrolled past, so they never cover it */
const floatBtns = () => { const past = scrollY > innerHeight * .7; toTop.classList.toggle('show', past); $('.wa').classList.toggle('show', past) };
addEventListener('scroll', floatBtns, { passive: true }); floatBtns();
toTop.addEventListener('click', () => lenis ? lenis.scrollTo(0, { duration: 1.4 }) : scrollTo({ top: 0, behavior: 'smooth' }));

/* ---------- scroll reveal ---------- */
document.documentElement.classList.add('anim');
$$('.clist,.pgrid,.jgrid,.gift-grid,.rgrid,.shorts,.rs-cards,.perks,.spot-media,.trust,.vals,.pgrid-static').forEach(g => [...g.children].forEach((el, i) => { el.dataset.reveal = ''; el.style.setProperty('--d', (i % 6) * .07 + 's') }));
$$('.sec-row,.sec-head,.bsum,.film-in,.spot-grid>div:first-child,.rs-grid>div:first-child,.reach,.faq,.page-head,.reveal').forEach(el => el.dataset.reveal = '');
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { threshold: .12, rootMargin: '0px 0px -30px' });
$$('[data-reveal]').forEach(el => io.observe(el));

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
$('#filterBtn')?.addEventListener('click', () => document.body.classList.toggle('filters-open'));
$$('[data-filters-close]').forEach(b => b.addEventListener('click', () => document.body.classList.remove('filters-open')));

/* ---------- forms and pages that arrive with the Shopify build ---------- */
$$('form[data-demo]').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); toast(f.dataset.demo); f.reset() }));
$$('a[href="#"]:not(.logo)').forEach(a => a.addEventListener('click', e => { e.preventDefault(); toast('This goes live with the full Shopify store.') }));
$$('[data-copy]').forEach(b => b.addEventListener('click', () => { navigator.clipboard?.writeText(b.dataset.copy); toast('Gift card code copied.') }));
const q = new URLSearchParams(location.search).get('q');
if (q) $$('[data-query]').forEach(el => el.tagName === 'INPUT' ? el.value = q : el.textContent = q);
