# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

FROM base AS dev
ENV NODE_ENV=development
COPY tsconfig.json next.config.js next-env.d.ts postcss.config.js tailwind.config.ts ./
COPY src ./src
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

FROM base AS build
ENV NODE_ENV=production
COPY tsconfig.json next.config.js next-env.d.ts postcss.config.js tailwind.config.ts ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS prod
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund
COPY --from=build /app/.next ./.next
COPY --from=build /app/next.config.js ./
COPY --from=build /app/src ./src
EXPOSE 3000
CMD ["npm", "run", "start"]
