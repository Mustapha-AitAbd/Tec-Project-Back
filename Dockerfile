# Utilisez une image Node.js comme base
FROM node:14

# Définissez le répertoire de travail dans le conteneur
WORKDIR /app

# Copiez les fichiers package.json et package-lock.json
COPY package*.json ./

# Installez les dépendances
RUN npm install

# Copiez le reste des fichiers de l'application
COPY . .

# Exposez le port sur lequel l'application s'exécutera
EXPOSE 8083

# Commande pour démarrer l'application
CMD ["npm", "start"]
