/**
 * Gera todos os ícones e splash screens do PWA a partir de um SVG vetorial.
 * Uso: npm run icons
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { SPLASH_SCREENS, splashFileName } from "../lib/splash.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iconsDir = path.join(root, "public", "icons");
const splashDir = path.join(root, "public", "splash");

const BRAND_FROM = "#17b869";
const BRAND_TO = "#0a7a43";
const SPLASH_BG = "#f3f5f7";

/** Carrinho de compras desenhado no viewBox 24×24 (mesmo traço dos ícones da UI). */
const CART_GLYPH = `
  <path d="M2.5 3h2.2l2.1 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L20.5 7H6"
        fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="9.5" cy="20" r="1.5" fill="#fff"/>
  <circle cx="17.5" cy="20" r="1.5" fill="#fff"/>
`;

function iconSvg(size, { maskable = false } = {}) {
  // Em ícones maskable o sistema recorta as bordas: o desenho fica menor e o fundo sangra.
  const radius = maskable ? 0 : size * 0.225;
  const glyph = size * (maskable ? 0.44 : 0.6);
  const offset = (size - glyph) / 2;
  const scale = glyph / 24;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${BRAND_FROM}"/>
        <stop offset="1" stop-color="${BRAND_TO}"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#g)"/>
    <!-- O desenho do carrinho não é centrado no viewBox 24×24: compensa o eixo para ficar óptico. -->
    <g transform="translate(${offset + glyph * 0.021} ${offset - glyph * 0.01}) scale(${scale})">${CART_GLYPH}</g>
  </svg>`;
}

function splashSvg(width, height) {
  const box = Math.min(width, height) * 0.28;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="${SPLASH_BG}"/>
    <g transform="translate(${(width - box) / 2} ${(height - box) / 2})">
      ${iconSvg(box).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}
    </g>
  </svg>`;
}

async function png(svg, file) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(file);
  return file;
}

async function main() {
  await rm(iconsDir, { recursive: true, force: true });
  await rm(splashDir, { recursive: true, force: true });
  await mkdir(iconsDir, { recursive: true });
  await mkdir(splashDir, { recursive: true });

  const created = [];

  created.push(await png(iconSvg(192), path.join(iconsDir, "icon-192.png")));
  created.push(await png(iconSvg(512), path.join(iconsDir, "icon-512.png")));
  created.push(await png(iconSvg(192, { maskable: true }), path.join(iconsDir, "maskable-192.png")));
  created.push(await png(iconSvg(512, { maskable: true }), path.join(iconsDir, "maskable-512.png")));
  // iOS não aceita transparência nem PNG com canal alpha no ícone da tela de início.
  await sharp(Buffer.from(iconSvg(180)))
    .flatten({ background: BRAND_TO })
    .png({ compressionLevel: 9 })
    .toFile(path.join(iconsDir, "apple-touch-icon.png"));
  created.push(path.join(iconsDir, "apple-touch-icon.png"));

  // Ícone que o Next serve como favicon (app/icon.png).
  await png(iconSvg(256), path.join(root, "app", "icon.png"));
  created.push(path.join(root, "app", "icon.png"));

  // SVG cru também é útil para telas grandes e para o README.
  await writeFile(path.join(iconsDir, "icon.svg"), iconSvg(512), "utf8");
  created.push(path.join(iconsDir, "icon.svg"));

  for (const spec of SPLASH_SCREENS) {
    const width = spec.width * spec.scale;
    const height = spec.height * spec.scale;
    created.push(await png(splashSvg(width, height), path.join(splashDir, splashFileName(spec))));
  }

  console.log(`✓ ${created.length} arquivos gerados`);
  console.log(`  ícones  → public/icons (${created.length - SPLASH_SCREENS.length} arquivos)`);
  console.log(`  splash  → public/splash (${SPLASH_SCREENS.length} telas de abertura do iOS)`);
}

main().catch((err) => {
  console.error("Falha ao gerar os ícones:", err);
  process.exit(1);
});
