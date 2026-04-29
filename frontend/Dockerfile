FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_URL=http://10.200.15.225:8080
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN NODE_OPTIONS=--max-old-space-size=512 npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
