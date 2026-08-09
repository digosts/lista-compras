/**
 * Verifica se o app atende aos requisitos de instalação em Android e iOS.
 * Uso: npm run verify:pwa            (assume http://localhost:3000)
 *      npm run verify:pwa -- https://meu-app.com
 */
import sharp from "sharp";
import { SPLASH_SCREENS, splashFileName, splashMedia } from "../lib/splash.ts";

const BASE = (process.argv[2] || process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const results = [];
const record = (ok, label, detail) => results.push({ ok, label, detail });

async function get(pathname, init) {
  return fetch(`${BASE}${pathname}`, { redirect: "follow", ...init });
}

async function checkManifest() {
  const res = await get("/manifest.webmanifest");
  if (!res.ok) {
    record(false, "manifest.webmanifest", `HTTP ${res.status}`);
    return null;
  }

  const type = res.headers.get("content-type") ?? "";
  record(
    type.includes("manifest+json") || type.includes("json"),
    "Content-Type do manifest",
    type || "ausente",
  );

  const manifest = await res.json();

  // Critérios de instalabilidade do Chromium.
  const rules = [
    ["name", Boolean(manifest.name), manifest.name],
    ["short_name", Boolean(manifest.short_name), manifest.short_name],
    ["start_url", Boolean(manifest.start_url), manifest.start_url],
    [
      "display",
      ["standalone", "fullscreen", "minimal-ui"].includes(manifest.display),
      manifest.display,
    ],
    ["theme_color", Boolean(manifest.theme_color), manifest.theme_color],
    ["background_color", Boolean(manifest.background_color), manifest.background_color],
    ["id", Boolean(manifest.id), manifest.id],
  ];
  for (const [field, ok, value] of rules) {
    record(ok, `manifest.${field}`, String(value ?? "ausente"));
  }

  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  const has = (size, purpose) =>
    icons.some(
      (icon) =>
        String(icon.sizes ?? "").includes(size) &&
        String(icon.purpose ?? "any").includes(purpose),
    );
  record(has("192x192", "any"), "Ícone 192×192 (any)", "requisito do Android");
  record(has("512x512", "any"), "Ícone 512×512 (any)", "requisito do Android");
  record(has("512x512", "maskable"), "Ícone 512×512 (maskable)", "ícone adaptativo do Android");

  return manifest;
}

async function checkIcons(manifest) {
  const sources = new Set([
    ...(manifest?.icons ?? []).map((icon) => icon.src),
    "/icons/apple-touch-icon.png",
  ]);

  for (const src of sources) {
    const res = await get(src);
    if (!res.ok) {
      record(false, `Ícone ${src}`, `HTTP ${res.status}`);
      continue;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(buffer).metadata();
    const declared = (manifest?.icons ?? []).find((icon) => icon.src === src)?.sizes;
    const expected = declared ? Number(declared.split("x")[0]) : meta.width;
    const sizeOk = meta.width === expected && meta.height === expected;
    const alphaOk = src.includes("apple-touch") ? !meta.hasAlpha : true;
    record(
      sizeOk && alphaOk && meta.format === "png",
      `Ícone ${src}`,
      `${meta.width}×${meta.height} ${meta.format}${
        src.includes("apple-touch") ? (meta.hasAlpha ? " · tem alpha (iOS não aceita)" : " · opaco") : ""
      }`,
    );
  }
}

async function checkServiceWorker() {
  const res = await get("/sw.js");
  const type = res.headers.get("content-type") ?? "";
  const body = res.ok ? await res.text() : "";
  record(res.ok, "/sw.js acessível", `HTTP ${res.status}`);
  record(
    type.includes("javascript"),
    "Content-Type do service worker",
    type || "ausente",
  );
  record(
    body.includes("addEventListener(\"fetch\"") || body.includes("addEventListener('fetch'"),
    "Service worker trata fetch",
    "necessário para o Chrome considerar o app instalável",
  );
  record(
    res.headers.get("cache-control")?.includes("must-revalidate") ?? false,
    "sw.js sem cache agressivo",
    res.headers.get("cache-control") ?? "ausente",
  );
}

async function checkHtml() {
  const res = await get("/");
  const html = res.ok ? await res.text() : "";
  record(res.ok, "Página inicial responde", `HTTP ${res.status}`);

  const checks = [
    [/<link[^>]+rel="manifest"/i, "<link rel=manifest> no HTML"],
    [/<meta[^>]+name="theme-color"/i, "<meta theme-color> (barra do Android)"],
    [/<meta[^>]+name="apple-mobile-web-app-capable"[^>]+content="yes"/i, "apple-mobile-web-app-capable (iOS tela cheia)"],
    [/<meta[^>]+name="mobile-web-app-capable"[^>]+content="yes"/i, "mobile-web-app-capable"],
    [/<meta[^>]+name="apple-mobile-web-app-title"/i, "apple-mobile-web-app-title (nome no iOS)"],
    [/<link[^>]+rel="apple-touch-icon"/i, "<link rel=apple-touch-icon> (ícone do iOS)"],
    [/viewport-fit=cover/i, "viewport-fit=cover (notch do iPhone)"],
    [/rel="apple-touch-startup-image"/i, "splash screens do iOS"],
  ];
  for (const [pattern, label] of checks) {
    record(pattern.test(html), label, pattern.test(html) ? "presente" : "ausente");
  }

  const declaredSplashes = [...html.matchAll(/rel="apple-touch-startup-image"/g)].length;
  record(
    declaredSplashes === SPLASH_SCREENS.length,
    "Quantidade de splash screens",
    `${declaredSplashes} declaradas / ${SPLASH_SCREENS.length} esperadas`,
  );
}

async function checkSplashFiles() {
  let ok = 0;
  const broken = [];
  for (const spec of SPLASH_SCREENS) {
    const file = splashFileName(spec);
    const res = await get(`/splash/${file}`, { method: "HEAD" });
    if (res.ok) ok += 1;
    else broken.push(file);
    // Sanidade: o media query precisa bater com o arquivo gerado.
    if (!splashMedia(spec).includes(`${spec.width}px`)) broken.push(`${file} (media query)`);
  }
  record(
    broken.length === 0,
    "Arquivos de splash do iOS",
    `${ok}/${SPLASH_SCREENS.length} disponíveis${broken.length ? ` · falhas: ${broken.join(", ")}` : ""}`,
  );
}

async function checkOffline() {
  const res = await get("/offline");
  record(res.ok, "Página offline", `HTTP ${res.status}`);
}

async function checkSecureContext() {
  const url = new URL(BASE);
  const secure =
    url.protocol === "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1";
  record(
    secure,
    "Contexto seguro",
    secure ? `${url.protocol}//${url.host}` : "PWA só instala em HTTPS ou localhost",
  );
}

async function main() {
  console.log(`\n  Verificando instalabilidade do PWA em ${BASE}\n`);

  try {
    await checkSecureContext();
    const manifest = await checkManifest();
    await checkIcons(manifest);
    await checkServiceWorker();
    await checkHtml();
    await checkSplashFiles();
    await checkOffline();
  } catch (err) {
    console.error(`\n  ✗ Não foi possível concluir: ${err.message}`);
    console.error("    O servidor está rodando? (npm run build && npm start)\n");
    process.exit(1);
  }

  let failures = 0;
  for (const { ok, label, detail } of results) {
    if (!ok) failures += 1;
    console.log(`  ${ok ? "✓" : "✗"} ${label.padEnd(46)} ${detail ?? ""}`);
  }

  const total = results.length;
  console.log(
    `\n  ${total - failures}/${total} verificações passaram${
      failures === 0 ? " — pronto para instalar no Android e no iOS.\n" : `\n`
    }`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main();
