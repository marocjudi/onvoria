# Guide de Déploiement d'Onvaria

Ce document fournit des instructions détaillées pour déployer l'application Onvaria dans différents environnements.

## 1. Déploiement sur Railway (recommandé)

Railway est une plateforme de déploiement cloud très adaptée à cette application:

1. Créez un compte sur [Railway.app](https://railway.app)
2. Créez un nouveau projet et importez votre dépôt Git
3. Ajoutez un service PostgreSQL à votre projet
4. Configurez les variables d'environnement suivantes:
   - `DATABASE_URL`: automatiquement configuré par Railway
   - `STRIPE_SECRET_KEY`: votre clé secrète Stripe
   - `VITE_STRIPE_PUBLIC_KEY`: votre clé publique Stripe
   - `STRIPE_PRICE_ID_BASIC`: ID du prix pour l'abonnement Basic
   - `STRIPE_PRICE_ID_PROFESSIONAL`: ID du prix pour l'abonnement Professional
   - `STRIPE_PRICE_ID_ENTERPRISE`: ID du prix pour l'abonnement Enterprise
   - `SESSION_SECRET`: une chaîne aléatoire pour sécuriser les sessions
   - Pour les notifications optionnelles: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
5. Déployez l'application (Railway utilisera automatiquement le Dockerfile)
6. Pour lancer les migrations de base de données, utilisez la commande custom suivante dans Railway:
   ```
   chmod +x run-migrations.sh && ./run-migrations.sh
   ```
7. Configurez un domaine personnalisé si nécessaire

## 2. Déploiement sur DigitalOcean

### Option A: App Platform

1. Créez un compte DigitalOcean
2. Dans App Platform, créez une nouvelle application à partir de votre dépôt Git
3. Ajoutez un composant de base de données PostgreSQL
4. Configurez les mêmes variables d'environnement que pour Railway
5. Ajoutez une commande de build: `npm ci && npm run build`
6. Ajoutez une commande de démarrage: `npm start`
7. Pour les migrations, ajoutez un job pré-déploiement: `chmod +x run-migrations.sh && ./run-migrations.sh`
8. Déployez l'application
9. Configurez un domaine personnalisé si nécessaire

### Option B: Droplet

1. Créez un nouveau Droplet avec Ubuntu 22.04
2. Installez Node.js 18, NGINX et PostgreSQL
```bash
# Installez Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installez NGINX
sudo apt-get install -y nginx

# Installez PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib
```

3. Clonez votre dépôt sur le serveur
```bash
git clone https://github.com/votre-username/onvaria.git
cd onvaria
```

4. Créez un fichier .env avec toutes les variables d'environnement nécessaires
5. Installez les dépendances et construisez l'application
```bash
npm ci
npm run build
```

6. Exécutez le script de migrations
```bash
chmod +x run-migrations.sh
./run-migrations.sh
```

7. Configurez NGINX comme proxy inverse
```bash
sudo nano /etc/nginx/sites-available/onvaria

# Ajoutez la configuration suivante
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Activez le site
sudo ln -s /etc/nginx/sites-available/onvaria /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

8. Installez PM2 et démarrez l'application
```bash
sudo npm install -g pm2
pm2 start npm --name "onvaria" -- start
pm2 startup
pm2 save
```

9. Configurez SSL avec Let's Encrypt
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

## 3. Déploiement sur serveur VPS ou dédié (VPS générique)

Si vous utilisez un autre fournisseur de VPS comme Linode, Vultr, Hetzner, etc.:

1. Suivez les étapes similaires à celles de l'option DigitalOcean Droplet
2. Assurez-vous que votre serveur dispose d'au moins 2 Go de RAM pour des performances optimales
3. Pensez à configurer une stratégie de sauvegarde régulière pour votre base de données

## 4. Résolution des problèmes courants

### Migrations de base de données

Si vous rencontrez des problèmes avec les migrations de base de données:

1. Vérifiez que `DATABASE_URL` est correctement configuré
2. Assurez-vous que l'utilisateur de la base de données a les permissions nécessaires
3. Si la structure des tables ne correspond pas au schéma attendu, utilisez:
```sql
-- Vérifier les tables existantes
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Si nécessaire, supprimez les tables problématiques (ATTENTION: cela supprimera toutes les données)
DROP TABLE IF EXISTS users, clients, tickets, payments, invoices CASCADE;

-- Puis réexécutez les migrations
```

### Problèmes de mémoire

Si l'application crash avec une erreur de mémoire:
1. Augmentez la mémoire allouée à Node.js: `NODE_OPTIONS=--max_old_space_size=4096 npm start`
2. Si vous utilisez un VPS ou un Droplet, augmentez la RAM disponible

### Problèmes de performance

1. Utilisez un CDN comme Cloudflare pour améliorer les temps de chargement
2. Activez la compression gzip dans NGINX
3. Optimisez les index de votre base de données PostgreSQL

## 5. Maintenance et mises à jour

- Configurez des sauvegardes quotidiennes de la base de données
- Utilisez Uptime Robot ou Pingdom pour surveiller la disponibilité du service
- Planifiez des mises à jour régulières des dépendances npm avec `npm audit fix`
- Mettez en place des tests automatisés avant chaque déploiement
- Utilisez le versioning sémantique pour gérer les versions de votre application

## 6. Optimisations pour la production

### Réglages Node.js

Pour optimiser les performances de Node.js en production:

```bash
# Dans votre fichier .env ou au démarrage de l'application
NODE_ENV=production
NODE_OPTIONS=--max_old_space_size=4096
```

### Réglages PostgreSQL

Modifiez le fichier `postgresql.conf` pour optimiser les performances:

```
# Mémoire
shared_buffers = 1GB  # 25% de la RAM du serveur
work_mem = 50MB       # Ajustez selon le nombre d'utilisateurs simultanés
maintenance_work_mem = 256MB

# Planification/Statistiques
effective_cache_size = 3GB  # 75% de la RAM du serveur
random_page_cost = 1.1      # Pour les SSD

# Write-Ahead Log
wal_buffers = 16MB
```

### NGINX pour la mise en cache

Ajoutez la configuration suivante à votre fichier NGINX:

```nginx
# Cache pour les fichiers statiques
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 30d;
    add_header Cache-Control "public, no-transform";
}

# Compression gzip
gzip on;
gzip_comp_level 5;
gzip_min_length 256;
gzip_proxied any;
gzip_vary on;
gzip_types
  application/javascript
  application/json
  application/x-javascript
  text/css
  text/javascript
  text/plain
  text/xml;
```

## 7. Stratégie de sauvegarde

### Sauvegarde automatique sur Railway

Railway propose des sauvegardes automatiques de la base de données. Assurez-vous qu'elles sont activées dans les paramètres de votre projet.

### Script de sauvegarde pour PostgreSQL

Pour les serveurs VPS, créez un script de sauvegarde:

```bash
#!/bin/bash
# Fichier: /usr/local/bin/backup-postgres.sh

BACKUP_DIR="/var/backups/postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="onvaria"
BACKUP_FILE="$BACKUP_DIR/$DB_NAME-$TIMESTAMP.sql.gz"

# Créer le répertoire de sauvegarde s'il n'existe pas
mkdir -p $BACKUP_DIR

# Sauvegarde avec pg_dump et compression gzip
pg_dump -U postgres $DB_NAME | gzip > $BACKUP_FILE

# Supprimer les sauvegardes de plus de 30 jours
find $BACKUP_DIR -name "$DB_NAME-*.sql.gz" -mtime +30 -delete
```

Rendez le script exécutable et planifiez-le avec cron:

```bash
chmod +x /usr/local/bin/backup-postgres.sh
echo "0 2 * * * /usr/local/bin/backup-postgres.sh" | sudo tee -a /etc/crontab
```

### Sauvegarde vers un stockage externe

Pour une sécurité maximale, configurez le transfert automatique des sauvegardes vers un stockage externe:

```bash
# Installation de rclone
curl https://rclone.org/install.sh | sudo bash

# Configuration pour Google Drive, AWS S3, etc.
rclone config

# Ajoutez cette ligne à votre script de sauvegarde
rclone copy $BACKUP_FILE remote:onvaria-backups/
```