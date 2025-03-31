FROM node:18-alpine

WORKDIR /app

# Installer les outils nécessaires
RUN apk add --no-cache bash curl

# Copier fichiers de configuration uniquement pour installer les dépendances
COPY package*.json ./
COPY tsconfig.json ./

# Supprimer html-to-pdf-js du package.json et installer les dépendances sans audit
RUN sed -i 's/"html-to-pdf-js": "[^"]*",//g' package.json && \
    npm ci --no-audit --no-fund

# Copier le reste des fichiers
COPY . .

# Construire l'application
RUN npm run build

# Exposer le port
EXPOSE 5000

# Variables d'environnement par défaut
ENV NODE_ENV=production \
    PORT=5000

# Commande de démarrage
CMD ["npm", "start"]