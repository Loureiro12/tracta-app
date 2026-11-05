# Site do Tracta

Landing page, Termos de Uso e Política de Privacidade. É HTML e CSS estáticos, sem build e sem dependências, então não entra no workspace do pnpm.

| Rota            | Arquivo                  |
| --------------- | ------------------------ |
| `/`             | `index.html`             |
| `/termos/`      | `termos/index.html`      |
| `/privacidade/` | `privacidade/index.html` |

## Rodar

```bash
python3 -m http.server 8080 --directory apps/web
```

Os caminhos são absolutos (`/assets/...`), então abrir o arquivo direto no navegador não carrega o CSS.

## Publicar

Em qualquer hospedagem estática (Cloudflare Pages, Vercel, Netlify), use `apps/web` como raiz, sem comando de build.

Antes de publicar:

1. Preencha os campos pendentes. `grep -rn 'class="pending"' apps/web --include='*.html'` lista todos, e nenhum pode ir para o ar.
2. Confirme o domínio. As tags `canonical` e `og:` usam `https://tracta.app`.
3. Troque o selo "Em breve na App Store" (`.store`, duas vezes em `index.html`) por um link quando o app estiver na loja.

## Manter

- **Os documentos legais descrevem o que o app faz.** Mudou a coleta, o compartilhamento, o fornecedor ou a região dos dados? Atualize `privacidade/index.html` e a data no topo.
- **As telas em `assets/screens` são capturas do app.** São geradas em um simulador com a conta demo e dados de exemplo.
- **Nada de terceiros:** a política promete que o site não usa cookies, analytics nem conteúdo externo. Adicionar qualquer um deles exige mudar o texto.
