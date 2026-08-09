# Lista de Compras

PWA de lista de compras para mercado: você cadastra a lista em casa, inicia a compra no mercado,
informa o preço de cada produto (que é multiplicado pela quantidade cadastrada) e finaliza vendo o
total gasto. Todo o histórico fica salvo com data e hora.

Next.js 16 (App Router + Server Actions) · MongoDB/Mongoose · Tailwind CSS 4 · sem tela de login.

## Como rodar

```bash
npm install
cp .env.example .env.local     # ajuste a MONGODB_URI
npm run dev                    # http://localhost:3000
```

`MONGODB_URI` aceita tanto um MongoDB local (`mongodb://127.0.0.1:27017/lista-compras`) quanto o
MongoDB Atlas (`mongodb+srv://...`). Sem o banco no ar o app abre normalmente, mas mostra um aviso
no lugar das listas.

## Fluxo do app

| Tela | Rota | O que faz |
| --- | --- | --- |
| Em aberto | `/` | Listas cadastradas e compras em andamento |
| Nova lista | `/nova` | Cadastro de produtos com quantidade e unidade |
| Compra | `/listas/[id]` | Botão **Iniciar compra** e, depois, o modo de compra |
| Finalizadas | `/finalizadas` | Histórico agrupado por mês, com o total de cada compra |
| Resumo | `/finalizadas/[id]` | Itens, preços, duração e total gasto |
| Instalar | `/instalar` | Instalação no celular + verificação dos requisitos |

**Iniciar compra** grava `startedAt` com a data/hora do clique. Ao tocar num item você informa o
valor unitário e o app calcula `quantidade × valor`. **Finalizar compra** grava `finishedAt` e
congela o total — é o que aparece em Finalizadas com mês, dia e hora.

## PWA

Instalável no Android (Chrome/Edge/Samsung Internet) e no iOS (Safari → Compartilhar → Adicionar à
Tela de Início). Já vem com:

- `app/manifest.ts` → `/manifest.webmanifest` com `display: standalone`, atalhos e ícones
- ícones 192/512 comuns e **maskable**, mais `apple-touch-icon` opaco de 180px
- 15 splash screens de iOS (`public/splash`) com os media queries de cada aparelho
- service worker próprio (`public/sw.js`): app shell em cache, navegação network-first e página
  `/offline` como fallback
- banner de instalação no Android e passo a passo ilustrado no iOS

```bash
npm run icons                  # regera ícones e splash screens a partir do SVG
npm run verify:pwa             # checa a instalabilidade em http://localhost:3000
npm run verify:pwa -- https://seu-dominio.com
```

> Em celular, a instalação só é oferecida em **HTTPS**. Em desenvolvimento use `localhost` (que o
> navegador trata como contexto seguro) ou exponha o servidor por um túnel HTTPS.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build de produção e execução |
| `npm run typecheck` | TypeScript sem emitir arquivos |
| `npm run icons` | Gera `public/icons` e `public/splash` |
| `npm run verify:pwa` | Relatório de instalabilidade do PWA |
