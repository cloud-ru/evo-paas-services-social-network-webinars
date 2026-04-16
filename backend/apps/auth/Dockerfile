
FROM registry-name.cr.cloud.ru/base/backend-build:latest AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY nest-cli.json ./
COPY tsconfig*.json ./

COPY . .

RUN yarn install --frozen-lockfile
RUN npx prisma generate --schema apps/auth/prisma/schema.prisma
RUN yarn build auth

FROM registry-name.cr.cloud.ru/base/backend-run:latest

WORKDIR /app
COPY --from=builder /app/dist/apps/auth ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./

RUN yarn install --frozen-lockfile --production
COPY --from=builder /app/libs/prisma-auth ./libs/prisma-auth
COPY --from=builder /app/apps/auth/prisma ./apps/auth/prisma

EXPOSE 3001

CMD ["node", "dist/main"]
