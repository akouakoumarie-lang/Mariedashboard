# Image de production de l'API NutriPlan. Contexte de build : dossier nutriplan/
#   docker build -f apps/api/Dockerfile -t nutriplan-api .
ARG NODE_IMAGE=node:22-bookworm-slim
FROM ${NODE_IMAGE} AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/core packages/core
COPY apps/api apps/api
COPY apps/mobile/package.json apps/mobile/package.json
RUN npm ci --workspace @nutriplan/api --workspace @nutriplan/core --include-workspace-root --ignore-scripts \
 && npm run build -w @nutriplan/core \
 && npm run prisma:generate -w @nutriplan/api \
 && npx --workspace @nutriplan/api nest build \
 && npm prune --omit=dev --workspace @nutriplan/api --workspace @nutriplan/core --include-workspace-root

FROM ${NODE_IMAGE}
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/packages/core/package.json packages/core/package.json
COPY --from=build /app/packages/core/dist packages/core/dist
COPY --from=build /app/apps/api/package.json apps/api/package.json
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/prisma apps/api/prisma
WORKDIR /app/apps/api
USER node
EXPOSE 3000
# Les migrations sont appliquées au démarrage (non destructif), puis l'API démarre.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
