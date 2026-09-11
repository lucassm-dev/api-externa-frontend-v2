# Imagem do frontend: Node compila, nginx serve. Sem SSR — o build produz só o
# bundle de navegador —, então a imagem final não precisa de runtime de Node.

FROM node:24-alpine AS construcao

WORKDIR /app

# O Playwright entra como dependência de desenvolvimento para a conferência
# visual em navegador. A imagem não roda navegador nenhum: baixar os binários
# aqui só engordaria a camada de build.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# package.json e lock antes do resto: enquanto as dependências não mudarem,
# esta camada vem do cache e o build não reinstala nada.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM nginx:1.27-alpine AS producao

# O entrypoint oficial do nginx roda envsubst nos arquivos desta pasta. O filtro
# restringe a substituição às variáveis BACKEND_*, senão o envsubst comeria as
# variáveis do próprio nginx ($uri, $host, $remote_addr).
ENV NGINX_ENVSUBST_FILTER=BACKEND_
ENV BACKEND_URL=http://backend:8080

COPY nginx/padrao.conf.template /etc/nginx/templates/default.conf.template
COPY --from=construcao /app/dist/api-externa-frontend/browser /usr/share/nginx/html

EXPOSE 80

# 127.0.0.1 e não localhost: dentro do container localhost resolve primeiro
# para ::1, e o nginx escuta só em IPv4 — o healthcheck bateria num endereço
# onde ninguém atende e marcaria o container como doente com o site no ar.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/saude || exit 1
