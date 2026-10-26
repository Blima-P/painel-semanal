// Painel Semanal: widget para o app Scriptable (iPhone).
// Mostra a sequência de dias, o progresso de hoje e a semana.
// Tamanhos: pequeno, médio e tela bloqueada (circular, retangular e em linha).
// O painel preenche GIST, OWNER e APP quando você toca em "Copiar script" (Editar → Widget do iPhone).

const GIST = '__GIST__';
const OWNER = '__OWNER__';
const APP = '__APP__';
const FILE = 'painel-widget.json';
// Ao tocar no widget: true abre o painel instalado na tela de início (link webapp:// do iOS, não oficial).
// Se abrir o app errado, troque para false: aí o toque abre só o Scriptable.
const ABRIR_PAINEL = true;
const WEBAPP = 'webapp://' + APP.replace(/^https?:\/\//, '');

const COL = {
  bg1: '#13214a', bg2: '#05081a', glow: '#0a84ff',
  text: '#ffffff', sub: '#9fb0d9', sky: '#5ac8ff', amber: '#ffb340', ink: '#0a1430',
  areas: { trabalho: '#0a84ff', saude: '#ff375f', estudos: '#bf5af2', habitos: '#ff9f0a' }
};
const AREAS = ['trabalho', 'saude', 'estudos', 'habitos'];
const WD = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const col = (hex, a = 1) => new Color(hex, a);
const pctTxt = p => p == null ? 'livre' : Math.round(p * 100) + '%';

/* ---------- dados ---------- */
const Q = args.queryParameters || {}; // vem do botão "Atualizar widget" do painel
const newer = (a, b) => !a ? b : !b ? a : String(a.updated || '') >= String(b.updated || '') ? a : b;

async function loadData() {
  const fm = FileManager.local();
  const cache = fm.joinPath(fm.documentsDirectory(), 'painel-widget-cache.json');
  let best = null;
  try { best = fm.fileExists(cache) ? JSON.parse(fm.readString(cache)) : null; } catch (e) { best = null; }
  if (Q.dados) {
    try {
      let s = Q.dados; if (!s.trim().startsWith('{')) s = decodeURIComponent(s);
      const d = JSON.parse(s);
      if (d && d.app === 'painel-semanal') best = newer(d, best);
    } catch (e) { /* link quebrado: segue com o Gist */ }
  }
  let owner = OWNER, gist = GIST;
  const param = String(args.widgetParameter || '').trim(); // opcional: "usuario/idDoGist"
  if (param.includes('/')) [owner, gist] = param.split('/');
  if (gist.length > 10) {
    try {
      const r = new Request(`https://gist.githubusercontent.com/${owner}/${gist}/raw/${FILE}?t=${Date.now()}`);
      r.timeoutInterval = 12;
      const d = await r.loadJSON();
      if (d && d.app === 'painel-semanal') best = newer(d, best);
    } catch (e) { /* sem internet: usa o último dado salvo */ }
  }
  if (best) fm.writeString(cache, JSON.stringify(best));
  return best;
}

function model(d) {
  const today = iso(new Date()), min = d.minPct ?? 0.8, fresh = d.today === today;
  const alive = !!d.through && d.through >= addDays(today, -1);
  const streak = alive ? d.streak || 0 : 0;
  const doneToday = d.through === today;
  const pct = fresh ? d.todayPct : 0;
  const monday = addDays(today, -((parse(today).getDay() + 6) % 7));
  const byDate = {};
  (d.week || []).forEach(x => { byDate[x.d] = x; });
  const week = WD.map((_, i) => {
    const date = addDays(monday, i), x = byDate[date], future = date > today;
    let p = x ? x.pct : 0;
    if (x && date > d.today) p = 0;
    if (date === today) p = pct;
    return { date, today: date === today, future, rest: x ? !!x.rest : i === 6, pct: future ? null : p, done: !future && p != null && p >= min - 1e-9 };
  });
  const status = pct == null && !doneToday ? 'Dia livre hoje'
    : doneToday ? 'Sequência garantida hoje'
    : streak > 0 ? 'Mantém a sequência hoje' : 'Bora começar hoje?';
  return {
    streak, best: Math.max(d.best || 0, streak), doneToday, pct, status, week,
    areas: fresh ? d.areas || {} : {}, left: fresh ? d.left : null,
    risk: streak > 0 && !doneToday
  };
}

/* ---------- desenho ---------- */
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgbHex(c) { return '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join(''); }

function background(ctx, w, h) {
  const a = hexRgb(COL.bg1), b = hexRgb(COL.bg2);
  for (let y = 0; y < h; y++) {
    const t = y / Math.max(1, h - 1);
    ctx.setFillColor(col(rgbHex(a.map((v, i) => v + (b[i] - v) * t))));
    ctx.fillRect(new Rect(0, y, w, 1.5));
  }
  // brilho azul suave no canto
  for (let i = 0; i < 14; i++) {
    const r = h * 0.75 * (1 - i / 14);
    ctx.setFillColor(col(COL.glow, 0.022));
    ctx.fillEllipse(new Rect(w - h * 0.25 - r, -h * 0.2 - r, r * 2, r * 2));
  }
}

function track(ctx, cx, cy, r, lw, color, alpha) {
  ctx.setStrokeColor(col(color, alpha)); ctx.setLineWidth(lw);
  ctx.strokeEllipse(new Rect(cx - r, cy - r, r * 2, r * 2));
}

function arc(ctx, cx, cy, r, lw, p, color) {
  if (!(p > 0)) return;
  p = Math.min(p, 1);
  const n = Math.max(10, Math.ceil(140 * p)), path = new Path();
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + 2 * Math.PI * p * i / n, pt = new Point(cx + r * Math.cos(a), cy + r * Math.sin(a));
    if (i) path.addLine(pt); else path.move(pt);
  }
  ctx.addPath(path); ctx.setStrokeColor(col(color)); ctx.setLineWidth(lw); ctx.strokePath();
  ctx.setFillColor(col(color)); // pontas arredondadas
  for (const a of [-Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * p]) {
    ctx.fillEllipse(new Rect(cx + r * Math.cos(a) - lw / 2, cy + r * Math.sin(a) - lw / 2, lw, lw));
  }
}

function check(ctx, cx, cy, s, lw, color) {
  const pts = [new Point(cx - s * 0.42, cy + s * 0.02), new Point(cx - s * 0.12, cy + s * 0.31), new Point(cx + s * 0.44, cy - s * 0.28)];
  const path = new Path(); path.move(pts[0]); path.addLine(pts[1]); path.addLine(pts[2]);
  ctx.addPath(path); ctx.setStrokeColor(col(color)); ctx.setLineWidth(lw); ctx.strokePath();
  ctx.setFillColor(col(color));
  pts.forEach(p => ctx.fillEllipse(new Rect(p.x - lw / 2, p.y - lw / 2, lw, lw)));
}

// Emblema da sequência: a rodinha com check do ícone do app.
function emblem(ctx, x, y, s, m) {
  const color = m.doneToday ? COL.sky : m.risk ? COL.amber : COL.sub;
  const cx = x + s / 2, cy = y + s / 2, lw = s * 0.15, r = s / 2 - lw / 2;
  track(ctx, cx, cy, r, lw, color, 0.3);
  arc(ctx, cx, cy, r, lw, m.doneToday ? 1 : 0.78, color);
  check(ctx, cx, cy + s * 0.02, s * 0.5, lw * 0.95, color);
}

function text(ctx, s, x, y, w, h, font, color, align) {
  ctx.setFont(font); ctx.setTextColor(color);
  if (align === 'center') ctx.setTextAlignedCenter(); else if (align === 'right') ctx.setTextAlignedRight(); else ctx.setTextAlignedLeft();
  ctx.drawTextInRect(String(s), new Rect(x, y, w, h));
}

function weekRow(ctx, m, x, y, w, ring) {
  const slot = w / 7;
  m.week.forEach((d, i) => {
    const cx = x + slot * i + slot / 2, cy = y + 14 + ring / 2, lw = Math.max(2.5, ring * 0.17), r = ring / 2 - lw / 2;
    text(ctx, WD[i], cx - slot / 2, y, slot, 12, Font.semiboldRoundedSystemFont(9), col(d.today ? COL.text : COL.sub, d.today ? 1 : 0.75), 'center');
    if (d.done) {
      ctx.setFillColor(col(COL.sky)); ctx.fillEllipse(new Rect(cx - ring / 2, cy - ring / 2, ring, ring));
      check(ctx, cx, cy + 0.3, ring * 0.48, lw * 0.8, COL.ink);
    } else if (d.rest && !d.today && !(d.pct > 0)) {
      track(ctx, cx, cy, r, lw, COL.text, 0.1);
      ctx.setFillColor(col(COL.sub, 0.7)); ctx.fillEllipse(new Rect(cx - 2, cy - 2, 4, 4));
    } else {
      track(ctx, cx, cy, r, lw, COL.text, d.future ? 0.1 : 0.2);
      if (!d.future) arc(ctx, cx, cy, r, lw, d.pct, d.today && m.risk ? COL.amber : COL.sky);
    }
    if (d.today) { ctx.setFillColor(col(COL.text)); ctx.fillEllipse(new Rect(cx - 1.75, cy + ring / 2 + 3, 3.5, 3.5)); }
  });
}

function newCtx(w, h, opaque) {
  const ctx = new DrawContext();
  ctx.size = new Size(w, h); ctx.opaque = !!opaque; ctx.respectScreenScale = true;
  return ctx;
}

function widgetSize(fam) {
  const s = Device.screenSize(), w = Math.min(s.width, s.height), h = Math.max(s.width, s.height);
  const t = w >= 428 ? [170, 364] : w >= 414 ? [169, 360] : w >= 390 ? [158, 338] : w >= 375 && h > 700 ? [155, 329] : [148, 321];
  return fam === 'medium' ? new Size(t[1], t[0]) : new Size(t[0], t[0]);
}

function drawSmall(m, S) {
  const s = S.width, P = Math.round(s * 0.09), ctx = newCtx(s, s, true);
  background(ctx, s, s);
  emblem(ctx, P, P, 22, m);
  const D = s * 0.3, cx = s - P - D / 2, cy = P + D / 2 - 3, lw = 5;
  track(ctx, cx, cy, D / 2 - lw / 2, lw, COL.text, 0.16);
  arc(ctx, cx, cy, D / 2 - lw / 2, lw, m.pct, m.risk ? COL.amber : COL.sky);
  text(ctx, m.pct == null ? '—' : pctTxt(m.pct), cx - D / 2, cy - 7, D, 16, Font.boldRoundedSystemFont(11), col(COL.text), 'center');
  text(ctx, m.streak, P - 1, P + 24, s - 2 * P, 50, Font.heavyRoundedSystemFont(44), col(COL.text));
  text(ctx, m.streak === 1 ? 'dia seguido' : 'dias seguidos', P, P + 74, s - 2 * P, 16, Font.semiboldRoundedSystemFont(12), col(m.risk ? COL.amber : COL.sub));
  weekRow(ctx, m, P - 4, s - P - 30, s - 2 * P + 8, Math.round(s * 0.095));
  return ctx.getImage();
}

function drawMedium(m, S) {
  const W = S.width, H = S.height, P = Math.round(H * 0.09), ctx = newCtx(W, H, true);
  background(ctx, W, H);
  // anéis de hoje por área (como no app)
  const D = H - 2 * P, cx = P + D / 2, cy = H / 2, lw = D * 0.07, gap = D * 0.02;
  AREAS.forEach((a, i) => {
    const r = D / 2 - lw / 2 - i * (lw + gap), p = m.areas[a];
    track(ctx, cx, cy, r, lw, COL.areas[a], p == null ? 0.1 : 0.24);
    arc(ctx, cx, cy, r, lw, p, COL.areas[a]);
  });
  text(ctx, m.pct == null ? '—' : pctTxt(m.pct), cx - 30, cy - 9, 60, 20, Font.heavyRoundedSystemFont(15), col(COL.text), 'center');

  const x0 = P + D + 18, rw = W - x0 - P;
  emblem(ctx, x0, P, 18, m);
  text(ctx, 'SEQUÊNCIA', x0 + 24, P + 3, rw - 24, 14, Font.boldRoundedSystemFont(10), col(m.risk ? COL.amber : COL.sub));
  if (m.best > m.streak) text(ctx, `recorde ${m.best}`, x0, P + 3, rw, 14, Font.mediumRoundedSystemFont(10), col(COL.sub, 0.8), 'right');
  const n = String(m.streak);
  text(ctx, n, x0 - 1, P + 18, rw, 44, Font.heavyRoundedSystemFont(38), col(COL.text));
  text(ctx, m.streak === 1 ? 'dia' : 'dias', x0 + n.length * 24 + 6, P + 37, rw, 18, Font.semiboldRoundedSystemFont(14), col(COL.sub));
  text(ctx, m.status, x0, P + 62, rw, 16, Font.semiboldRoundedSystemFont(12), col(COL.text));
  const sub = m.pct == null ? 'Sem metas pra hoje' : `Hoje ${pctTxt(m.pct)}` + (m.left > 0 ? ` · faltam ${m.left}` : m.left === 0 ? ' · tudo feito' : '');
  text(ctx, sub, x0, P + 78, rw, 16, Font.mediumRoundedSystemFont(11), col(COL.sub));
  weekRow(ctx, m, x0 - 4, H - P - 32, rw + 8, Math.round(H * 0.11));
  return ctx.getImage();
}

function drawEmpty(S, fam) {
  const W = S.width, H = S.height, P = Math.round(H * 0.09), ctx = newCtx(W, H, true);
  background(ctx, W, H);
  emblem(ctx, P, P, 24, { doneToday: true });
  text(ctx, 'Conecte o painel', P, P + 34, W - 2 * P, 22, Font.boldRoundedSystemFont(fam === 'medium' ? 17 : 15), col(COL.text));
  text(ctx, 'No painel: Editar →', P, P + 58, W - 2 * P, 16, Font.mediumRoundedSystemFont(12), col(COL.sub));
  text(ctx, 'Widget do iPhone', P, P + 74, W - 2 * P, 16, Font.mediumRoundedSystemFont(12), col(COL.sub));
  return ctx.getImage();
}

function drawCircular(m) {
  const s = 76, ctx = newCtx(s, s, false), lw = 6, r = s / 2 - lw / 2 - 1;
  track(ctx, s / 2, s / 2, r, lw, '#ffffff', 0.25);
  arc(ctx, s / 2, s / 2, r, lw, m ? m.pct : 0, '#ffffff');
  text(ctx, m ? m.streak : '–', 0, s / 2 - 17, s, 28, Font.heavyRoundedSystemFont(24), col('#ffffff'), 'center');
  text(ctx, m && m.streak === 1 ? 'dia' : 'dias', 0, s / 2 + 9, s, 12, Font.semiboldRoundedSystemFont(9), col('#ffffff', 0.8), 'center');
  return ctx.getImage();
}

/* ---------- montagem ---------- */
function build(data) {
  const fam = config.widgetFamily || 'medium', m = data ? model(data) : null, w = new ListWidget();
  // pede ao iOS para redesenhar logo; quem decide a hora exata é o sistema
  w.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000);
  // https:// abriria o Safari, que tem dados separados do app; webapp:// abre o app da tela de início
  if (ABRIR_PAINEL && /^https?:\/\//.test(APP)) w.url = WEBAPP;
  if (fam === 'accessoryCircular') {
    w.addAccessoryWidgetBackground = true; w.setPadding(0, 0, 0, 0);
    const img = w.addImage(drawCircular(m)); img.applyFittingContentMode();
  } else if (fam === 'accessoryRectangular' || fam === 'accessoryInline') {
    const line = (s, f, a = 1) => { const t = w.addText(s); t.font = f; t.textColor = col('#ffffff', a); t.lineLimit = 1; t.minimumScaleFactor = 0.7; };
    if (!m) line('Painel: conecte o widget', Font.semiboldRoundedSystemFont(13));
    else if (fam === 'accessoryInline') line(`${m.streak} ${m.streak === 1 ? 'dia' : 'dias'} seguidos · hoje ${pctTxt(m.pct)}`, Font.semiboldRoundedSystemFont(13));
    else {
      line(`${m.streak} ${m.streak === 1 ? 'dia seguido' : 'dias seguidos'}`, Font.heavyRoundedSystemFont(16));
      line(`Hoje ${pctTxt(m.pct)}${m.left > 0 ? ` · faltam ${m.left}` : ''}`, Font.mediumRoundedSystemFont(12), 0.85);
      line(m.week.map(d => d.done ? '●' : d.future ? '·' : d.rest && !(d.pct > 0) ? '–' : d.pct > 0 ? '◐' : '○').join(' '), Font.mediumRoundedSystemFont(12), 0.85);
    }
  } else {
    const S = widgetSize(fam === 'medium' || fam === 'large' || fam === 'extraLarge' ? 'medium' : 'small');
    w.setPadding(0, 0, 0, 0);
    w.backgroundImage = !m ? drawEmpty(S, fam) : fam === 'small' ? drawSmall(m, S) : drawMedium(m, S);
  }
  return w;
}

const widget = build(await loadData());
if (config.runsInWidget) Script.setWidget(widget);
else if (Q.atualizar) {
  // chamado pelo painel: os dados já foram salvos acima, e abrir o Scriptable faz o iOS redesenhar o widget
  if (ABRIR_PAINEL && /^https?:\/\//.test(APP)) Safari.open(WEBAPP);
}
else await widget.presentMedium();
Script.complete();
