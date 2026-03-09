# 1-qadam: Build (React loyihasini yig'ish)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2-qadam: Production (Nginx orqali xizmat ko'rsatish)
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# React Router uchun Nginx sozlamasi
RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]