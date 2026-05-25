# Stage 1: build the static site
FROM node:20-alpine AS build
WORKDIR /src

# Cache layer: install deps before copying source
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: serve via nginx
FROM nginx:1.27-alpine
COPY --from=build /src/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080