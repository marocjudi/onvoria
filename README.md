# Onvaria - Plateforme de Gestion de Services de Réparation

Onvaria est une application SaaS complète conçue pour rationaliser les opérations commerciales des services de réparation, offrant une gestion de bout en bout des tickets de réparation, de la facturation, des paiements et des communications avec les clients.

## Technologies clés

- **Frontend** : React avec TypeScript et Vite
- **Backend** : Node.js avec Express
- **Base de données** : PostgreSQL avec Drizzle ORM
- **Authentification** : Passport.js avec session
- **Internationalisation** : Support pour l'anglais, le français et l'espagnol
- **Paiements** : Intégration Stripe
- **Notifications** : SMS, WhatsApp et email

## Prérequis

- Node.js v18 ou supérieur
- PostgreSQL 14 ou supérieur
- Un compte Stripe pour les paiements et les abonnements
- Facultatif : Un compte Twilio pour les notifications SMS et WhatsApp

## Configuration

### Variables d'environnement

Pour exécuter l'application, vous devez configurer les variables d'environnement suivantes :

**Base de données :**
- `DATABASE_URL` : URL de connexion à votre base de données PostgreSQL

**Stripe (Paiements) :**
- `STRIPE_SECRET_KEY` : Clé secrète Stripe (commence par sk_)
- `VITE_STRIPE_PUBLIC_KEY` : Clé publique Stripe (commence par pk_)
- `STRIPE_PRICE_ID_BASIC` : ID du prix pour l'abonnement Basic
- `STRIPE_PRICE_ID_PROFESSIONAL` : ID du prix pour l'abonnement Professional
- `STRIPE_PRICE_ID_ENTERPRISE` : ID du prix pour l'abonnement Enterprise

**Twilio (Notifications, facultatif) :**
- `TWILIO_ACCOUNT_SID` : SID de votre compte Twilio
- `TWILIO_AUTH_TOKEN` : Jeton d'authentification Twilio
- `TWILIO_PHONE_NUMBER` : Numéro de téléphone Twilio pour l'envoi de SMS

### Installation

1. Clonez le dépôt :
   ```bash
   git clone <URL_DU_DEPOT>
   cd onvaria
   ```

2. Installez les dépendances :
   ```bash
   npm ci
   ```

3. Correction des dépendances obsolètes (optionnel) :
   ```bash
   ./fix-dependencies.sh
   ```

4. Exécutez les migrations de base de données :
   ```bash
   ./run-migrations.sh
   ```

5. Démarrez l'application en mode développement :
   ```bash
   npm run dev
   ```

## Déploiement

### Option 1 : Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/vDX4k7)

1. Cliquez sur le bouton ci-dessus pour déployer sur Railway
2. Configurez les variables d'environnement requises dans l'interface Railway
3. Le déploiement se fera automatiquement après chaque commit

### Option 2 : Docker

1. Construisez l'image Docker :
   ```bash
   docker build -t onvaria .
   ```

2. Exécutez le conteneur :
   ```bash
   docker run -p 5000:5000 --env-file .env onvaria
   ```

### Option 3 : VPS ou serveur dédié

1. Clonez le dépôt sur votre serveur
2. Installez les dépendances : `npm ci`
3. Créez un fichier `.env` avec les variables d'environnement nécessaires
4. Exécutez les migrations : `./run-migrations.sh`
5. Construisez l'application : `npm run build`
6. Démarrez le serveur de production : `npm start`

## Structure du projet

- `/client` : Code source du frontend
- `/server` : Code source du backend
- `/shared` : Types et schémas partagés entre le frontend et le backend
- `/migrations` : Migrations de base de données

## Plans d'abonnement

L'application propose trois niveaux d'abonnement :

1. **Basic** : Pour les techniciens individuels
   - Gestion des tickets de réparation
   - Facturation de base
   - Support client

2. **Professional** : Pour les boutiques de réparation
   - Tout ce qui est inclus dans Basic
   - Gestion des employés
   - Modèles de facture personnalisés
   - Intégration des paiements
   - Notifications automatiques

3. **Enterprise** : Pour les entreprises plus importantes
   - Tout ce qui est inclus dans Professional
   - Support multi-boutiques
   - Analyse avancée des données
   - API personnalisée
   - Support prioritaire

## License

Copyright © 2023-2025 Onvaria. Tous droits réservés.