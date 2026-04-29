FROM node:20-alpine AS build
WORKDIR /app

# Dica: No futuro, mude o localhost para o IP do servidor da empresa
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
# Alteramos de npm ci para npm install para evitar o erro 1
RUN npm install 

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
