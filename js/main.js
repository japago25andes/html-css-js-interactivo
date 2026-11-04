/* =========================================================
   Web en 3 capas — interactividad
   ========================================================= */
'use strict';

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Tema claro / oscuro ---------- */
const themeBtn = $('#theme-btn');
function paintThemeIcon() {
  themeBtn.textContent = document.documentElement.dataset.theme === 'dark' ? '🌙' : '☀️';
}
themeBtn.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('tema', next); } catch (e) { /* almacenamiento no disponible */ }
  paintThemeIcon();
});
paintThemeIcon();

/* ---------- Resaltador de sintaxis ----------
   Cada lenguaje es una lista de [tipo, expresión]. Se combinan en una sola
   expresión regular y cada coincidencia se envuelve en <span class="tk-tipo">. */
const GRAMMARS = {
  html: [
    ['com', /<!--[\s\S]*?-->/],
    ['tag', /<\/?[a-zA-Z][\w-]*|\/?>/],
    ['attr', /[a-zA-Z-]+(?==)/],
    ['str', /"[^"]*"/],
  ],
  css: [
    ['com', /\/\*[\s\S]*?\*\//],
    ['at', /@[\w-]+/],
    ['prop', /[\w-]+(?=\s*:[^;{}]*;)/],
    ['sel', /[^{}\s;][^{};\n]*(?=\s*\{)/],
    ['str', /"[^"]*"|'[^']*'/],
    ['num', /#[0-9a-fA-F]{3,8}\b|-?\d*\.?\d+(?:px|rem|em|%|s|vh|vw|deg|fr)?/],
  ],
  js: [
    ['com', /\/\/[^\n]*/],
    ['str', /'[^'\n]*'|"[^"\n]*"|`[^`]*`/],
    ['kw', /\b(?:const|let|var|function|return|if|else|new|true|false|null)\b/],
    ['num', /\b\d+(?:\.\d+)?\b/],
    ['fn', /\b[a-zA-Z_$][\w$]*(?=\()/],
    ['op', /=>|\+\+/],
  ],
};

const escapeHTML = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function highlight(code, lang) {
  const rules = GRAMMARS[lang];
  const re = new RegExp(rules.map(([, r]) => `(${r.source})`).join('|'), 'g');
  let out = '';
  let last = 0;
  for (const m of code.matchAll(re)) {
    out += escapeHTML(code.slice(last, m.index));
    const i = m.slice(1).findIndex((g) => g !== undefined);
    out += `<span class="tk-${rules[i][0]}">${escapeHTML(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return out + escapeHTML(code.slice(last));
}

/* Escribe el código letra por letra, como si alguien lo estuviera tecleando */
function typeCode(el, code, lang) {
  clearInterval(el._typing);
  if (reduceMotion) { el.innerHTML = highlight(code, lang); return; }
  const step = Math.max(2, Math.ceil(code.length / 160));
  let i = 0;
  el._typing = setInterval(() => {
    i = Math.min(code.length, i + step);
    const done = i >= code.length;
    el.innerHTML = highlight(code.slice(0, i), lang) + (done ? '' : '<span class="caret"></span>');
    if (done) clearInterval(el._typing);
  }, 16);
}

/* Arma un documento HTML completo para un <iframe> */
function buildDoc({ html = '', css = '', js = '', capture = false }) {
  return `<!doctype html><html><head><meta charset="utf-8">${css ? `<style>${css}</style>` : ''}</head><body>${html}${
    js ? (capture ? CAPTURE_SCRIPT : '') + `<script>${js}<\/script>` : ''
  }</body></html>`;
}

/* =========================================================
   1. LA CASA
   ========================================================= */
const house = { html: false, css: false, js: false };
const houseCard = $('#house-card');
const houseStatus = $('#house-status');

const HOUSE_MESSAGES = {
  '000': '🏗️ El terreno está vacío. Empieza por <b class="c-html">construir con HTML</b>.',
  '100': '🧱 <b>Solo HTML:</b> la casa existe, pero es un plano. Tiene techo, puerta y ventanas… sin color ni vida.',
  '010': '🎨 <b>CSS sin HTML:</b> ¡el pintor llegó, pero no hay casa que pintar!',
  '001': '⚡ <b>JS sin HTML:</b> la electricidad no tiene cables ni bombillos a dónde llegar.',
  '011': '🎨⚡ <b>CSS + JS sin HTML:</b> el pintor y el electricista esperan… sin estructura no hay nada.',
  '110': '🧱🎨 <b>HTML + CSS:</b> la casa está construida y pintada. Se ve hermosa, pero está apagada.',
  '101': '🧱⚡ <b>HTML + JS:</b> la casa tiene luz, pero sigue siendo un plano sin pintar.',
  '111': '✨ <b>¡Las tres juntas!</b> Estructura + diseño + comportamiento = una página web completa.',
};

const stateKey = (s) => `${+s.html}${+s.css}${+s.js}`;

function renderHouse() {
  houseCard.classList.toggle('built', house.html);
  houseCard.classList.toggle('painted', house.css);
  houseCard.classList.toggle('powered', house.js);
  $$('#house-toggles .toggle').forEach((b) => b.setAttribute('aria-pressed', house[b.dataset.layer]));
  houseStatus.innerHTML = HOUSE_MESSAGES[stateKey(house)];
  houseStatus.style.animation = 'none';
  void houseStatus.offsetWidth; // reinicia la animación
  houseStatus.style.animation = '';
}

/* Si activan CSS o JS sin HTML, el botón de HTML "tiembla" para dar la pista */
function nudgeHTML(container) {
  const btn = $('.t-html', container);
  btn.classList.remove('nudge');
  void btn.offsetWidth;
  btn.classList.add('nudge');
}

$$('#house-toggles .toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    const layer = btn.dataset.layer;
    house[layer] = !house[layer];
    if (layer !== 'html' && house[layer] && !house.html) nudgeHTML($('#house-toggles'));
    renderHouse();
  });
});

/* "Las tres juntas" las enciende en orden: primero HTML, luego CSS y al final JS */
let houseTimers = [];
$('#house-all').addEventListener('click', () => {
  houseTimers.forEach(clearTimeout);
  Object.assign(house, { html: false, css: false, js: false });
  renderHouse();
  const delay = reduceMotion ? 0 : 1;
  houseTimers = [
    setTimeout(() => { house.html = true; renderHouse(); }, 150 * delay),
    setTimeout(() => { house.css = true; renderHouse(); }, 1700 * delay),
    setTimeout(() => { house.js = true; renderHouse(); }, 3000 * delay),
  ];
});
$('#house-reset').addEventListener('click', () => {
  houseTimers.forEach(clearTimeout);
  Object.assign(house, { html: false, css: false, js: false });
  renderHouse();
});
renderHouse();

/* =========================================================
   2. CADA UNO POR SEPARADO
   ========================================================= */
const SAMPLES = {
  html: `<h1>Mi primera página</h1>
<p>Hola, soy un párrafo.</p>
<button>Haz clic</button>`,

  css: `h1 {
  color: #6366f1;
  font-family: sans-serif;
}
p {
  color: #64748b;
  font-style: italic;
}
button {
  background: #ec4899;
  color: white;
  border: none;
  padding: 10px 22px;
  border-radius: 999px;
}`,

  js: `const boton = document.querySelector('button');
let clics = 0;

boton.addEventListener('click', () => {
  clics++;
  boton.textContent = 'Clics: ' + clics;
});`,
};

$$('[data-sample]').forEach((el) => {
  el.innerHTML = highlight(SAMPLES[el.dataset.sample], el.dataset.sample);
});
$('[data-frame="html"]').srcdoc = buildDoc({ html: SAMPLES.html });
$('[data-frame="css"]').srcdoc = buildDoc({ html: SAMPLES.html, css: SAMPLES.css });
$('[data-frame="js"]').srcdoc = buildDoc({ html: SAMPLES.html, js: SAMPLES.js });

$$('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach((t) => {
      const active = t === tab;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active);
    });
    $$('.panel').forEach((p) => {
      const active = p.dataset.panel === tab.dataset.tab;
      p.hidden = !active;
      p.classList.toggle('active', active);
    });
  });
});

/* =========================================================
   3. LABORATORIO
   ========================================================= */
const LAB_CODE = {
  html: `<article class="tarjeta">
  <div class="avatar">LG</div>
  <h2>Laura Gómez</h2>
  <p class="rol">Estudiante de Ingeniería</p>
  <p class="bio">Me encanta crear páginas web 🚀</p>

  <div class="acciones">
    <button id="btn-like">❤️ Me gusta <span id="contador">0</span></button>
    <button id="btn-seguir">+ Seguir</button>
  </div>
</article>`,

  css: `body {
  font-family: system-ui, sans-serif;
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #a5b4fc, #f0abfc);
}

.tarjeta {
  width: 270px;
  padding: 2rem;
  text-align: center;
  background: white;
  border-radius: 22px;
  box-shadow: 0 20px 45px rgba(0, 0, 0, .18);
  animation: aparecer .7s ease-out;
}

.avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: white;
  font-size: 1.6rem;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #ec4899);
}

h2 { margin: 0; color: #1e1b4b; }
.rol { margin: .25rem 0; color: #6366f1; font-weight: 600; }
.bio { color: #64748b; }

.acciones { display: flex; gap: .5rem; justify-content: center; }

button {
  border: none;
  padding: .6rem 1rem;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  transition: transform .2s;
}
button:hover { transform: translateY(-3px); }

#btn-like { background: #fee2e2; color: #be123c; }
#btn-seguir { background: #6366f1; color: white; }
#btn-seguir.activo { background: #22c55e; }

/* JS agrega esta clase; CSS la anima */
.latido { animation: latido .4s; }

@keyframes aparecer {
  from { opacity: 0; transform: translateY(30px) scale(.9); }
}
@keyframes latido {
  50% { transform: scale(1.3); }
}`,

  js: `console.log('✅ JavaScript cargado');

const like = document.querySelector('#btn-like');
const contador = document.querySelector('#contador');
const seguir = document.querySelector('#btn-seguir');
let likes = 0;

like.addEventListener('click', () => {
  likes++;
  contador.textContent = likes;
  like.classList.add('latido');
  setTimeout(() => like.classList.remove('latido'), 400);
  console.log('❤️ Me gusta #' + likes);
});

seguir.addEventListener('click', () => {
  const activo = seguir.classList.toggle('activo');
  seguir.textContent = activo ? '✓ Siguiendo' : '+ Seguir';
  console.log(activo ? 'Ahora sigues a Laura' : 'Dejaste de seguir a Laura');
});`,
};

/* Script oculto que reenvía console.log y los errores del iframe a nuestra consola */
const CAPTURE_SCRIPT = `<script>(function(){
  function send(type, msg){ parent.postMessage({ __lab: true, type: type, msg: String(msg) }, '*'); }
  var log = console.log;
  console.log = function(){ send('log', Array.prototype.join.call(arguments, ' ')); log.apply(console, arguments); };
  window.addEventListener('error', function(e){ send('error', e.message); });
})();<\/script>`;

const LAB_EXPLAIN = {
  '000': ['📄', 'Página en blanco', 'No hay HTML, así que no hay contenido. El navegador muestra una pantalla vacía.'],
  '100': ['🧱', 'Solo estructura', 'El contenido está ahí: nombre, textos y botones. El navegador usa sus estilos por defecto. Haz clic en “Me gusta”… no pasa nada, porque no hay JavaScript.'],
  '010': ['🎨', 'Estilos sin contenido', 'El CSS tiene reglas para .tarjeta y los botones, pero esos elementos no existen. Solo se ve el fondo degradado del <body>, que el navegador crea automáticamente.'],
  '001': ['⚡', 'Código sin elementos', 'JavaScript intenta buscar el botón #btn-like, pero no existe. Mira la consola: aparece un error.'],
  '011': ['🎨⚡', 'Estilo y lógica… sin nada que mostrar', 'Se ve el fondo del <body> (CSS) y en la consola aparece un error (JS): ninguno de los dos encuentra los elementos que necesita.'],
  '110': ['🧱🎨', 'Bonita pero inerte', 'La tarjeta se ve moderna y hasta tiene efecto al pasar el mouse (eso es CSS), pero el contador no sube: falta JavaScript.'],
  '101': ['🧱⚡', 'Funciona, pero sin diseño', 'Haz clic en “Me gusta”: el contador sube y la consola registra cada clic. JS agrega la clase .latido, pero sin CSS esa clase no hace nada visible.'],
  '111': ['✨', '¡Página completa!', 'HTML pone el contenido, CSS lo hace ver bien y JS lo hace reaccionar. Fíjate: JS agrega la clase .latido y CSS la anima. Así se complementan.'],
};

const lab = { html: true, css: false, js: false };
let labFile = 'html';
const labFrame = $('#lab-frame');
const labCode = $('#lab-code code');
const editor = $('#editor');
const consoleEl = $('#console');

function logConsole(type, msg) {
  const line = document.createElement('div');
  line.className = `log ${type}`;
  line.textContent = msg;
  consoleEl.appendChild(line);
  if (type === 'error' && /null/i.test(msg)) {
    logConsole('hint', 'Pista: JS buscó un elemento que no existe… porque no hay HTML.');
  }
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

window.addEventListener('message', (e) => {
  if (e.source !== labFrame.contentWindow || !e.data || !e.data.__lab) return;
  logConsole(e.data.type, e.data.msg);
});

function showFile(file, animate) {
  labFile = file;
  $$('.etab').forEach((t) => t.classList.toggle('active', t.dataset.file === file));
  editor.classList.toggle('off', !lab[file]);
  if (animate) typeCode(labCode, LAB_CODE[file], file);
  else { clearInterval(labCode._typing); labCode.innerHTML = highlight(LAB_CODE[file], file); }
  labCode.parentElement.scrollTop = 0;
}

function renderLab() {
  consoleEl.innerHTML = '';
  if (!lab.js) logConsole('muted', 'JavaScript apagado: no hay nada que ejecutar.');

  labFrame.srcdoc = buildDoc({
    html: lab.html ? LAB_CODE.html : '',
    css: lab.css ? LAB_CODE.css : '',
    js: lab.js ? LAB_CODE.js : '',
    capture: true,
  });

  $$('#lab-toggles .toggle').forEach((b) => b.setAttribute('aria-pressed', lab[b.dataset.layer]));
  $$('.etab').forEach((t) => t.classList.toggle('on', lab[t.dataset.file]));
  $('#lab-empty').classList.toggle('show', !lab.html);
  editor.classList.toggle('off', !lab[labFile]);

  $('#lab-badges').innerHTML = ['html', 'css', 'js']
    .filter((l) => lab[l])
    .map((l) => `<span class="badge b-${l}">${l.toUpperCase()}</span>`)
    .join('');

  const [icon, title, text] = LAB_EXPLAIN[stateKey(lab)];
  const box = $('#lab-explain');
  $('#le-badge').textContent = icon;
  $('#le-title').textContent = title;
  $('#le-text').textContent = text;
  box.classList.remove('flash');
  void box.offsetWidth;
  box.classList.add('flash');
}

$$('#lab-toggles .toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    const layer = btn.dataset.layer;
    lab[layer] = !lab[layer];
    if (layer !== 'html' && lab[layer] && !lab.html) nudgeHTML($('#lab-toggles'));
    renderLab();
    // Al encender una capa, mostramos su archivo "escribiéndose"
    if (lab[layer]) showFile(layer, true);
    else if (labFile === layer) showFile(layer, false);
  });
});

$$('.etab').forEach((t) => t.addEventListener('click', () => showFile(t.dataset.file, false)));

$$('[data-preset]').forEach((b) => {
  b.addEventListener('click', () => {
    const on = b.dataset.preset === 'all';
    Object.assign(lab, { html: on, css: on, js: on });
    renderLab();
    showFile(on ? 'js' : labFile, false);
  });
});

$('#console-clear').addEventListener('click', () => { consoleEl.innerHTML = ''; });

renderLab();
showFile('html', false);

/* =========================================================
   4. CÓMO SE COMPLEMENTAN (diagrama de Venn)
   ========================================================= */
const VENN = {
  'html': {
    title: 'Solo HTML',
    text: 'Un documento con contenido y estructura, pero con el aspecto por defecto del navegador. Así se veían las primeras páginas web de los años 90.',
    meter: [5, 1, 0],
  },
  'css': {
    title: 'Solo CSS',
    text: 'Reglas de estilo sin elementos que pintar. Por sí solo no muestra nada útil: necesita HTML al cual aplicarse.',
    meter: [0, 1, 0],
  },
  'js': {
    title: 'Solo JavaScript',
    text: 'Lógica sin interfaz: puede hacer cálculos, pero el usuario no tiene nada que ver ni tocar. (Fuera del navegador sí se usa solo, por ejemplo con Node.js en servidores).',
    meter: [0, 0, 2],
  },
  'html css': {
    title: 'Página estática y bonita',
    text: 'Ideal para un portafolio o una página informativa. Se ve muy bien, pero no reacciona a lo que haces, salvo enlaces y efectos como :hover.',
    meter: [5, 5, 1],
  },
  'html js': {
    title: 'Funciona, pero sin diseño',
    text: 'Los botones y formularios responden, pero todo parece un documento plano. Es difícil y poco agradable de usar.',
    meter: [5, 1, 5],
  },
  'css js': {
    title: 'Estilo + lógica, sin contenido',
    text: 'JS podría crear elementos desde el código y CSS pintarlos… pero en ese caso JS está generando HTML. Al final, siempre termina habiendo HTML.',
    meter: [1, 3, 3],
  },
  'html css js': {
    title: 'Aplicación web completa',
    text: 'Contenido + diseño + interacción. Así funcionan YouTube, Instagram o la plataforma virtual de tu universidad.',
    meter: [5, 5, 5],
  },
};

function renderVenn(region) {
  const info = VENN[region];
  $('#venn').dataset.active = region;
  $$('.vr').forEach((b) => b.classList.toggle('active', b.dataset.region === region));
  $('#vi-layers').innerHTML = region.split(' ').map((l) => `<span class="badge b-${l}">${l.toUpperCase()}</span>`).join('');
  $('#vi-title').textContent = info.title;
  $('#vi-text').textContent = info.text;
  $('#vi-meter').innerHTML = ['Contenido', 'Diseño', 'Interacción']
    .map((name, i) => `<div class="meter-row"><span>${name}</span><div class="meter-bar"><span data-w="${info.meter[i] * 20}"></span></div><b>${info.meter[i]}</b></div>`)
    .join('');
  // Esperamos un cuadro para que la barra crezca con transición
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $$('#vi-meter .meter-bar span').forEach((s) => { s.style.width = s.dataset.w + '%'; });
  }));
  const box = $('#venn-info');
  box.classList.remove('flash');
  void box.offsetWidth;
  box.classList.add('flash');
}

$$('.vr').forEach((b) => b.addEventListener('click', () => renderVenn(b.dataset.region)));
renderVenn('html css js');

/* =========================================================
   5. EL NAVEGADOR PASO A PASO
   ========================================================= */
const STEPS = [
  ['Todo empieza con una petición', 'Escribes una dirección (o abres un archivo) y el navegador pide la página. Por ahora, la pantalla está en blanco.'],
  ['📄 Llega el HTML', 'El navegador descarga index.html y lo lee de arriba hacia abajo, etiqueta por etiqueta.'],
  ['🌳 Se construye el DOM', 'Cada etiqueta se convierte en un nodo de un árbol llamado DOM (Document Object Model). Es la versión “viva” del HTML en la memoria del navegador.'],
  ['🎨 Se aplica el CSS', 'El navegador encuentra el <link> a styles.css, lo descarga y calcula qué estilos le corresponden a cada nodo del árbol.'],
  ['🖼️ Se pinta la pantalla', 'Con el DOM y los estilos, calcula tamaños y posiciones (layout) y dibuja los píxeles (paint). ¡Ya ves la página!'],
  ['⚡ JavaScript le da vida', 'script.js se ejecuta y queda escuchando eventos. Con cada clic modifica el DOM (el número del botón) y el navegador vuelve a pintar lo que cambió.'],
];

const pipeline = $('#pipeline');
const plDots = $('#pl-dots');
let plStep = 0;
let plClicks = 0;
let plClickTimer = null;
let plPlayTimer = null;

STEPS.forEach((_, i) => {
  const d = document.createElement('button');
  d.setAttribute('aria-label', `Ir al paso ${i}`);
  d.addEventListener('click', () => { stopPlay(); goStep(i); });
  plDots.appendChild(d);
});

function simulateClick() {
  const cursor = $('.cursor', pipeline);
  const btn = $('.mc-btn', pipeline);
  cursor.classList.add('click');
  btn.classList.add('click');
  plClicks++;
  $('#pl-count').textContent = plClicks;
  $('#pl-dom-count').textContent = plClicks;
  setTimeout(() => { cursor.classList.remove('click'); btn.classList.remove('click'); }, 180);
}

function goStep(n) {
  plStep = Math.max(0, Math.min(STEPS.length - 1, n));
  pipeline.dataset.step = plStep;
  for (let k = 1; k < STEPS.length; k++) pipeline.classList.toggle(`s${k}`, k <= plStep);

  $('#pl-num').textContent = `Paso ${plStep} de ${STEPS.length - 1}`;
  $('#pl-title').textContent = STEPS[plStep][0];
  $('#pl-text').textContent = STEPS[plStep][1];
  const cap = $('.pl-caption');
  cap.classList.remove('flash');
  void cap.offsetWidth;
  cap.classList.add('flash');

  $$('button', plDots).forEach((d, i) => d.classList.toggle('active', i === plStep));
  $('#pl-prev').disabled = plStep === 0;
  $('#pl-next').disabled = plStep === STEPS.length - 1;

  clearInterval(plClickTimer);
  if (plStep === STEPS.length - 1) {
    plClickTimer = setInterval(simulateClick, 2200);
    setTimeout(simulateClick, 1350);
  } else {
    plClicks = 0;
    $('#pl-count').textContent = 0;
    $('#pl-dom-count').textContent = 0;
  }
}

function stopPlay() {
  clearInterval(plPlayTimer);
  plPlayTimer = null;
  $('#pl-play').textContent = '▶ Automático';
}

$('#pl-prev').addEventListener('click', () => { stopPlay(); goStep(plStep - 1); });
$('#pl-next').addEventListener('click', () => { stopPlay(); goStep(plStep + 1); });
$('#pl-play').addEventListener('click', () => {
  if (plPlayTimer) { stopPlay(); return; }
  if (plStep === STEPS.length - 1) goStep(0);
  $('#pl-play').textContent = '⏸ Pausar';
  plPlayTimer = setInterval(() => {
    if (plStep >= STEPS.length - 1) { stopPlay(); return; }
    goStep(plStep + 1);
  }, 3200);
});
goStep(0);

/* =========================================================
   6. QUIZ
   ========================================================= */
const QUIZ = [
  {
    q: '¿Qué tecnología define el CONTENIDO y la estructura de una página?',
    options: ['HTML', 'CSS', 'JavaScript'],
    answer: 0,
    why: 'HTML organiza el contenido con etiquetas: títulos, párrafos, imágenes, botones…',
  },
  {
    q: 'Quieres que un botón sea azul y con bordes redondeados. ¿Qué usas?',
    options: ['HTML', 'CSS', 'JavaScript'],
    answer: 1,
    why: 'Colores, tamaños y formas son apariencia: eso es trabajo de CSS.',
  },
  {
    q: 'Al hacer clic en un botón debe aparecer un mensaje. ¿Quién lo hace posible?',
    options: ['HTML', 'CSS', 'JavaScript'],
    answer: 2,
    why: 'Reaccionar a eventos como un clic es comportamiento: eso lo hace JavaScript.',
  },
  {
    q: 'En el laboratorio, ¿qué pasó al activar solo JavaScript (sin HTML)?',
    options: ['La tarjeta funcionó pero no se veía', 'Apareció un error en la consola porque no encontró el botón', 'Se pintó la tarjeta de colores'],
    answer: 1,
    why: 'JS intentó buscar #btn-like, pero sin HTML ese elemento no existe, así que obtuvo null y falló.',
  },
  {
    q: '¿Cuál de estas afirmaciones es correcta?',
    options: ['CSS puede mostrar contenido sin HTML', 'HTML es la base: CSS y JS trabajan sobre él', 'JavaScript reemplaza al CSS'],
    answer: 1,
    why: 'CSS pinta elementos del HTML y JS los manipula. Sin HTML, ninguno tiene sobre qué trabajar.',
  },
  {
    q: 'En la analogía de la casa, ¿qué representa la electricidad?',
    options: ['HTML', 'CSS', 'JavaScript'],
    answer: 2,
    why: 'Así como la electricidad hace que la casa “funcione”, JavaScript le da comportamiento a la página.',
  },
  {
    q: 'Con la regla .latido { animation: latido .4s; }, ¿quién agrega la clase y quién la anima?',
    options: ['JS la agrega y CSS la anima', 'CSS la agrega y JS la anima', 'HTML la agrega y también la anima'],
    answer: 0,
    why: 'JS hace classList.add("latido") al hacer clic, y CSS define cómo se ve esa animación. ¡Trabajo en equipo!',
  },
];

const quizBody = $('#quiz-body');
const quizBar = $('#quiz-bar');
let qIndex = 0;
let qScore = 0;

function renderQuestion() {
  const item = QUIZ[qIndex];
  quizBar.style.width = `${(qIndex / QUIZ.length) * 100}%`;
  quizBody.innerHTML = `
    <span class="q-count">Pregunta ${qIndex + 1} de ${QUIZ.length}</span>
    <h3 class="q-text">${escapeHTML(item.q)}</h3>
    <div class="q-options">
      ${item.options.map((o, i) => `<button class="q-opt" data-i="${i}"><span class="q-letter">${'ABC'[i]}</span>${escapeHTML(o)}</button>`).join('')}
    </div>`;
  $$('.q-opt', quizBody).forEach((b) => b.addEventListener('click', () => answer(+b.dataset.i)));
}

function answer(i) {
  const item = QUIZ[qIndex];
  const ok = i === item.answer;
  if (ok) qScore++;
  $$('.q-opt', quizBody).forEach((b, j) => {
    b.disabled = true;
    if (j === item.answer) b.classList.add('correct');
    else if (j === i) b.classList.add('wrong');
  });
  const fb = document.createElement('div');
  fb.className = 'q-feedback';
  fb.innerHTML = `<b class="${ok ? 'ok' : 'bad'}">${ok ? '¡Correcto! 🎉' : 'Casi…'}</b> ${escapeHTML(item.why)}`;
  const next = document.createElement('button');
  next.className = 'btn btn-primary q-next';
  next.textContent = qIndex < QUIZ.length - 1 ? 'Siguiente pregunta →' : 'Ver resultado';
  next.addEventListener('click', () => {
    qIndex++;
    if (qIndex < QUIZ.length) renderQuestion();
    else renderResult();
  });
  quizBody.append(fb, next);
  next.focus({ preventScroll: true });
}

function renderResult() {
  quizBar.style.width = '100%';
  const msg =
    qScore === QUIZ.length ? '¡Perfecto! Dominas las tres capas de la web. 🏆'
    : qScore >= 5 ? '¡Muy bien! Ya entiendes cómo se complementan.'
    : qScore >= 3 ? 'Vas por buen camino. Repasa el laboratorio y vuelve a intentarlo.'
    : 'Vuelve a jugar con la casa y el laboratorio, ¡y lo intentas de nuevo!';
  quizBody.innerHTML = `
    <div class="q-result">
      <div class="q-score">${qScore}/${QUIZ.length}</div>
      <p>${msg}</p>
      <button class="btn btn-primary" id="quiz-retry">↺ Intentar de nuevo</button>
    </div>`;
  $('#quiz-retry').addEventListener('click', () => { qIndex = 0; qScore = 0; renderQuestion(); });
  if (qScore >= 5) confetti();
}

function confetti() {
  if (reduceMotion) return;
  const box = $('#confetti');
  const colors = ['#f97316', '#3b82f6', '#facc15', '#ec4899', '#22c55e'];
  for (let i = 0; i < 90; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + 'vw';
    p.style.background = colors[i % colors.length];
    p.style.setProperty('--x', (Math.random() * 200 - 100) + 'px');
    p.style.setProperty('--r', (Math.random() * 1080 - 540) + 'deg');
    p.style.setProperty('--t', (2 + Math.random() * 1.8) + 's');
    p.style.animationDelay = Math.random() * .5 + 's';
    box.appendChild(p);
  }
  setTimeout(() => { box.innerHTML = ''; }, 4500);
}

renderQuestion();

/* ---------- Aparecer al hacer scroll ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
$$('.reveal').forEach((el) => io.observe(el));
