FROM node:18-alpine

WORKDIR /app

# Kopiowanie plików zależności
COPY package.json package-lock.json* ./

# Instalacja zależności z flagą --legacy-peer-deps
RUN npm install --legacy-peer-deps

# Kopiowanie reszty aplikacji
COPY . .

# Otwórz port dla ng serve
EXPOSE 4200

# Uruchomienie serwera developerskiego w trybie watch (z ulepszonymi opcjami dla hot reload)
CMD ["npm", "run", "start:watch", "--", "--host", "0.0.0.0", "--disable-host-check"] 