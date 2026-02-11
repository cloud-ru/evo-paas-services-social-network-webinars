# Install dependencies only when needed
FROM registry_name.cr.cloud.ru/social-network-frontend/base-build:latest AS deps
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile

# Rebuild the source code only when needed
FROM registry_name.cr.cloud.ru/social-network-frontend/base-build:latest AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN BUILD_STANDALONE=true yarn run build

# Production image, copy all the files and run next
FROM registry_name.cr.cloud.ru/social-network-frontend/base-run:latest AS runner
WORKDIR /app

ENV NODE_ENV production

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# Copy ONLY the standalone output - it's completely self-contained
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
