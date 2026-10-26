// Servidor de Cazador de Tendencias para Render (Web Service).
// - Sirve la página (index.html).
// - /api/ia: le pasa el pedido de la página a Google Gemini (plan gratis) con la clave guardada en la
//   variable de entorno GEMINI_API_KEY. La clave nunca llega al navegador.
// - /api/mes: la Prenda del mes. El servidor la elige una vez por mes y todos ven la misma.
// - Limita las búsquedas por persona y por día para no pasarse del plan gratis.
// No necesita dependencias: usa solo módulos de Node (versión 18 o más nueva).

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 10000;
const GEMINI_KEY = (process.env.GEMINI_API_KEY || "").trim();
// Modelos del plan gratis, en orden: si uno no existe o está saturado, prueba el siguiente.
const MODELOS = [
  process.env.MODELO,
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.6-flash",
  "gemini-flash-latest",
].filter((m, i, a) => m && a.indexOf(m) === i);
const LIMITE_POR_PERSONA = Number(process.env.LIMITE_POR_PERSONA || 15); // búsquedas por persona por día
const LIMITE_DIARIO = Number(process.env.LIMITE_DIARIO || 300); // búsquedas totales por día
const MAX_PEDIDO = 40000; // caracteres máximos del pedido
const GEMINI_URL = process.env.GEMINI_URL || "https://generativelanguage.googleapis.com/v1beta/models"; // solo se cambia para pruebas
const ZONA = "America/Montevideo";

const ROOT = __dirname;
const ARCHIVO_MES = path.join(ROOT, "prenda-del-mes.json"); // se pierde si Render reinicia; entonces la elige de nuevo

// ---------- límites ----------
let dia = hoy();
let total = 0;
const porIp = new Map();

function hoy() {
  return new Date().toLocaleDateString("en-CA", { timeZone: ZONA }); // AAAA-MM-DD en Uruguay
}
function reiniciarSiCambioElDia() {
  const d = hoy();
  if (d !== dia) {
    dia = d;
    total = 0;
    porIp.clear();
  }
}
function ipDe(req) {
  const fwd = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return fwd || req.socket.remoteAddress || "desconocida";
}

function json(res, status, data) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(data));
}

function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    let tam = 0;
    const partes = [];
    req.on("data", (c) => {
      tam += c.length;
      if (tam > MAX_PEDIDO * 4) {
        reject(new Error("demasiado_grande"));
        req.destroy();
        return;
      }
      partes.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(partes).toString("utf8")));
    req.on("error", reject);
  });
}

// ---------- Gemini ----------
const NO_EXISTE = new Set();

// Devuelve { text, stop_reason } o { status } si falló.
async function pedirGemini(input) {
  let ultimo = 502;
  for (const modelo of MODELOS) {
    if (NO_EXISTE.has(modelo)) continue;
    let r;
    try {
      r = await fetch(`${GEMINI_URL}/${encodeURIComponent(modelo)}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": GEMINI_KEY },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: input }] }],
          generationConfig: { responseMimeType: "application/json", maxOutputTokens: 12000, temperature: 0.7 },
        }),
        signal: AbortSignal.timeout(90000),
      });
    } catch (e) {
      console.error("No se pudo llamar a Gemini", modelo, e.message);
      ultimo = 502;
      continue;
    }
    if (r.ok) {
      const data = await r.json().catch(() => ({}));
      const cand = (data.candidates || [])[0] || {};
      const text = ((cand.content && cand.content.parts) || []).map((p) => (p.thought ? "" : p.text || "")).join("");
      if (!text.trim()) {
        console.error("Gemini respondió vacío", modelo, cand.finishReason);
        ultimo = 502;
        continue;
      }
      return { text, stop_reason: cand.finishReason === "MAX_TOKENS" ? "max_tokens" : "end_turn" };
    }
    const detalle = await r.text().catch(() => "");
    console.error("Error de Gemini", modelo, r.status, detalle.slice(0, 300));
    if (r.status === 400 && /API key|API_KEY/i.test(detalle)) return { status: 401 };
    if (r.status === 401 || r.status === 403) return { status: 401 };
    if (r.status === 404) NO_EXISTE.add(modelo); // no se vuelve a probar hasta reiniciar
    ultimo = r.status === 429 ? 429 : 502;
  }
  return { status: ultimo };
}

async function apiIa(req, res) {
  if (!GEMINI_KEY) return json(res, 503, { error: "sin_clave", mensaje: "El servidor no tiene la clave de Gemini." });
  reiniciarSiCambioElDia();
  const ip = ipDe(req);
  const usadas = porIp.get(ip) || 0;
  if (usadas >= LIMITE_POR_PERSONA) return json(res, 429, { error: "limite_persona", mensaje: "Llegaste al límite de búsquedas de hoy." });
  if (total >= LIMITE_DIARIO) return json(res, 429, { error: "limite_diario", mensaje: "Se alcanzó el límite de búsquedas de hoy." });

  let input;
  try {
    const cuerpo = JSON.parse(await leerCuerpo(req));
    input = String(cuerpo.input || "");
  } catch (e) {
    return json(res, 400, { error: "pedido_invalido" });
  }
  if (!input.trim() || input.length > MAX_PEDIDO) return json(res, 400, { error: "pedido_invalido" });

  porIp.set(ip, usadas + 1);
  total += 1;
  const r = await pedirGemini(input);
  if (r.text) return json(res, 200, { text: r.text, stop_reason: r.stop_reason });
  // si falló, la búsqueda no cuenta para los límites
  porIp.set(ip, Math.max(0, (porIp.get(ip) || 1) - 1));
  total = Math.max(0, total - 1);
  if (r.status === 429) return json(res, 429, { error: "saturado", mensaje: "La IA está saturada. Probá en un minuto." });
  if (r.status === 401) return json(res, 502, { error: "clave_invalida" });
  return json(res, 502, { error: "conexion" });
}

// ---------- Prenda del mes ----------
function mesActual() {
  const d = new Date();
  const anio = d.toLocaleDateString("en-CA", { timeZone: ZONA, year: "numeric" });
  const mes = d.toLocaleDateString("en-CA", { timeZone: ZONA, month: "2-digit" });
  let label = d.toLocaleDateString("es-UY", { timeZone: ZONA, month: "long", year: "numeric" }).replace(" de ", " ");
  label = label.charAt(0).toUpperCase() + label.slice(1);
  return { clave: `${anio}-${mes}`, label };
}

function leerMeses() {
  try {
    const v = JSON.parse(fs.readFileSync(ARCHIVO_MES, "utf8"));
    return v && typeof v === "object" ? v : {};
  } catch (e) {
    return {};
  }
}
let MESES = leerMeses(); // { "2026-10": {...}, ... }
let generando = null;
let ultimoIntento = 0;

function promptMes(label, prev) {
  return [
    "Sos analista de tendencias de moda para un emprendedor que importa ropa para revender en Uruguay.",
    `Mes actual: ${label}. En Uruguay las estaciones son las del hemisferio sur.`,
    'Elegí UNA prenda concreta, con su estilo (por ejemplo "camisa de lino oversize", no solo "camisa"), que sea la que más conviene destacar este mes por su tracción en TikTok, Instagram, Pinterest y Amazon y por la temporada en Uruguay.',
    prev.length ? `No repitas estas prendas: ${prev.join(", ")}.` : "",
    "Son estimaciones: no inventes porcentajes. Español rioplatense, frases cortas.",
    'Respondé SOLO con JSON: {"prenda":string,"busqueda":string (2 o 3 palabras para buscarla),"porque":string (1-2 frases),"puntaje":number 0-100,"estado":"fuerte"|"subida","plataforma_top":"TikTok"|"Instagram"|"Pinterest"|"Amazon","precio_uy_uyu":number|null (precio típico de venta en Uruguay; null si no llegó),"accion":string (1 frase: qué hacer este mes)}',
  ]
    .filter(Boolean)
    .join("\n");
}

function leerJSON(t) {
  t = String(t || "").replace(/```(?:json)?/gi, "");
  const a = t.search(/[{[]/);
  const b = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
  if (a < 0 || b < a) return null;
  try {
    return JSON.parse(t.slice(a, b + 1));
  } catch (e) {
    return null;
  }
}

async function elegirPrendaDelMes() {
  const { clave, label } = mesActual();
  if (MESES[clave]) return MESES[clave];
  if (!GEMINI_KEY) return null;
  if (generando) return generando;
  if (Date.now() - ultimoIntento < 60000) return null; // si falló, espera un minuto antes de reintentar
  ultimoIntento = Date.now();
  generando = (async () => {
    const prev = Object.keys(MESES)
      .filter((k) => k !== clave)
      .sort()
      .reverse()
      .slice(0, 6)
      .map((k) => MESES[k].prenda);
    const r = await pedirGemini(promptMes(label, prev));
    let v = r.text ? leerJSON(r.text) : null;
    if (Array.isArray(v)) v = v[0];
    if (!v || !v.prenda) return null;
    const num = (x) => (isFinite(Number(x)) ? Number(x) : 0);
    const doc = {
      mes: clave,
      mes_label: label,
      prenda: String(v.prenda).slice(0, 80),
      busqueda: String(v.busqueda || v.prenda).slice(0, 60),
      porque: String(v.porque || "").slice(0, 320),
      puntaje: num(v.puntaje),
      estado: String(v.estado || "subida").slice(0, 12),
      plataforma_top: String(v.plataforma_top || "").slice(0, 20),
      precio_uy_uyu: v.precio_uy_uyu == null ? null : num(v.precio_uy_uyu),
      accion: String(v.accion || "").slice(0, 240),
    };
    MESES[clave] = doc;
    try {
      fs.writeFileSync(ARCHIVO_MES, JSON.stringify(MESES, null, 1));
    } catch (e) {
      /* si no se puede escribir, queda en memoria */
    }
    console.log("Prenda del mes", clave, doc.prenda);
    return doc;
  })().finally(() => {
    generando = null;
  });
  return generando;
}

async function apiMes(req, res) {
  const doc = await elegirPrendaDelMes().catch(() => null);
  const { clave } = mesActual();
  const hist = Object.keys(MESES)
    .filter((k) => k !== clave)
    .sort()
    .reverse()
    .slice(0, 6)
    .map((k) => MESES[k]);
  json(res, 200, { doc, hist });
}

// ---------- archivos ----------
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};
const PUBLICOS = new Set(["index.html", "favicon.ico"]);

function servirArchivo(req, res) {
  let ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (ruta === "/") ruta = "/index.html";
  const relativo = ruta.replace(/^\/+/, "");
  if (!PUBLICOS.has(relativo)) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    return res.end("No encontrado");
  }
  const archivo = path.join(ROOT, relativo);
  fs.readFile(archivo, (err, buf) => {
    if (err) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      return res.end("No encontrado");
    }
    res.writeHead(200, { "content-type": TIPOS[path.extname(archivo)] || "application/octet-stream", "cache-control": "no-cache" });
    res.end(req.method === "HEAD" ? undefined : buf);
  });
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    if (url.pathname === "/api/estado" && req.method === "GET") {
      reiniciarSiCambioElDia();
      return json(res, 200, { ia: Boolean(GEMINI_KEY), quedanHoy: Math.max(0, LIMITE_DIARIO - total) });
    }
    if (url.pathname === "/api/mes" && req.method === "GET") return apiMes(req, res);
    if (url.pathname === "/api/ia") {
      if (req.method !== "POST") return json(res, 405, { error: "metodo" });
      return apiIa(req, res);
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      return res.end();
    }
    servirArchivo(req, res);
  })
  .listen(PORT, () => {
    console.log(`Cazador de Tendencias en el puerto ${PORT} · IA: ${GEMINI_KEY ? "Gemini (" + MODELOS.join(", ") + ")" : "sin GEMINI_API_KEY"}`);
    elegirPrendaDelMes().catch(() => {}); // la deja lista apenas arranca
  });
