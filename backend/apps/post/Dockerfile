
FROM evo-social-network-sedg1l.cr.cloud.ru/base/backend-build:latest AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY nest-cli.json ./
COPY tsconfig*.json ./

COPY . .

RUN yarn install --frozen-lockfile
RUN npx prisma generate --schema apps/post/prisma/schema.prisma
RUN yarn build post

FROM evo-social-network-sedg1l.cr.cloud.ru/base/backend-run:latest

WORKDIR /app
COPY --from=builder /app/dist/apps/post ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./

RUN yarn install --frozen-lockfile --production
COPY --from=builder /app/libs/prisma-post ./libs/prisma-post
COPY --from=builder /app/apps/post/prisma ./apps/post/prisma

EXPOSE 3005

CMD ["node", "dist/main"]
