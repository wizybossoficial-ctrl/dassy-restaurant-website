document.documentElement.classList.add('js');

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* Header + mobile menu */
const header = $('#header');
const toggle = $('#menuToggle');
const links = $('#navLinks');

function setMenu(open) {
  links.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
}
toggle.addEventListener('click', () => setMenu(!links.classList.contains('open')));
$$('a, button', links).forEach(el => el.addEventListener('click', () => setMenu(false)));
document.addEventListener('click', e => {
  if (links.classList.contains('open') && !links.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
window.addEventListener('resize', () => { if (window.innerWidth > 860) setMenu(false); });

const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* Smooth scrolling (respects reduced motion) */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const target = id.length > 1 ? $(id) : null;
    if (!target) return;
    e.preventDefault();
    const top = id === '#home' ? 0 : target.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  });
});

/* Reveal on scroll */
const items = $$('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  items.forEach(el => io.observe(el));
} else {
  items.forEach(el => el.classList.add('visible'));
}

/* Menu category filter */
const filters = $$('.filter');
const cards = $$('#menuGrid .card');
filters.forEach(btn => btn.addEventListener('click', () => {
  const cat = btn.dataset.filter;
  filters.forEach(b => {
    const active = b === btn;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
  });
  cards.forEach(card => {
    const show = cat === 'all' || card.dataset.category === cat;
    card.hidden = !show;
    card.classList.remove('pop');
    if (show) {
      card.classList.add('visible');
      void card.offsetWidth;
      card.classList.add('pop');
    }
  });
}));

/* Order / reservation modal */
const modal = $('#orderModal');
const form = $('#orderForm');
const modeBtns = $$('.segmented button');
const errorBox = $('#formError');
let mode = 'takeaway';

function setMode(m) {
  mode = m;
  modeBtns.forEach(b => {
    const on = b.dataset.mode === m;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', String(on));
  });
  $$('[data-only]', form).forEach(el => { el.hidden = el.dataset.only !== m; });
  $('#modalTitle').textContent = m === 'takeaway' ? 'Encomendar Takeaway' : 'Reservar uma mesa';
  $('#submitBtn').textContent = m === 'takeaway' ? 'Enviar pedido' : 'Confirmar reserva';
}

function openModal(m) {
  form.reset();
  form.classList.remove('sent');
  $('#formSuccess').hidden = true;
  errorBox.hidden = true;
  $$('input', form).forEach(i => i.classList.remove('invalid'));
  const today = new Date().toISOString().split('T')[0];
  form.elements.date.min = today;
  form.elements.date.value = today;
  setMode(m);
  modal.showModal();
  document.body.classList.add('modal-open');
}

$$('[data-open-modal]').forEach(b => b.addEventListener('click', () => openModal(b.dataset.openModal)));
$$('[data-close-modal]').forEach(b => b.addEventListener('click', () => modal.close()));
modeBtns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
modal.addEventListener('close', () => document.body.classList.remove('modal-open'));
modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });

form.addEventListener('submit', e => {
  e.preventDefault();
  let firstBad = null;
  $$('input[required]', form).forEach(i => {
    const bad = !i.value.trim();
    i.classList.toggle('invalid', bad);
    if (bad && !firstBad) firstBad = i;
  });
  const phone = form.elements.phone;
  if (phone.value.trim() && !/^[+\d][\d\s-]{6,}$/.test(phone.value.trim())) {
    phone.classList.add('invalid');
    firstBad = firstBad || phone;
  }
  if (firstBad) {
    errorBox.textContent = 'Por favor, preencha corretamente os campos assinalados.';
    errorBox.hidden = false;
    firstBad.focus();
    return;
  }
  errorBox.hidden = true;
  const name = form.elements.name.value.trim();
  const when = `${form.elements.date.value} às ${form.elements.time.value}`;
  $('#successMsg').textContent = mode === 'takeaway'
    ? `${name}, recebemos o seu pedido para levantar em ${when}. Entraremos em contacto para confirmar.`
    : `${name}, reserva para ${form.elements.guests.value} pessoa(s) em ${when}. Entraremos em contacto para confirmar.`;
  form.classList.add('sent');
  $('#formSuccess').hidden = false;
});

$('#year').textContent = new Date().getFullYear();
