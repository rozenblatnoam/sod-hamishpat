FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Remove workspace-only dep that doesn't exist outside the monorepo
RUN npm pkg delete dependencies['@dyanim/shared'] && \
    npm install --omit=dev

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
