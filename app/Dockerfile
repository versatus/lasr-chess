# Stage 1: Building the app
FROM node:current as builder

WORKDIR /app
COPY package*.json ./
RUN yarn global add bun
RUN bun install
COPY . .
RUN bun run build

# Stage 2: Running the app
FROM node:current
WORKDIR /app
ENV NODE_ENV="production"
ENV LASR_CLI_PATH="/app/bin/linux/lasr_cli"
ENV LASR_RPC_URL="http://lasr-sharks.versatus.io:9292"
ENV FUNGIBLE_TOKEN_NODE_BUILD_PATH="bin/node-wrapper.js"
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

RUN yarn global add bun
RUN bun install -g @versatus/versatus-javascript

EXPOSE 3000

# Start the app
CMD ["yarn", "start"]

