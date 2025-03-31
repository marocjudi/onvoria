#!/bin/bash

# Vérifier si DATABASE_URL est défini
if [ -z "$DATABASE_URL" ]; then
  echo "Erreur: Variable d'environnement DATABASE_URL non définie."
  exit 1
fi

echo "Exécution des migrations de base de données..."

# Exécuter les migrations
npx drizzle-kit push

# Vérifier le code de retour
if [ $? -eq 0 ]; then
  echo "Migrations exécutées avec succès!"
else
  echo "Erreur lors de l'exécution des migrations."
  exit 1
fi

# Script complémentaire pour créer les tables manquantes si nécessaire
echo "Vérification et création des tables manquantes..."

# Commande SQL pour créer company_branding si elle n'existe pas
COMPANY_BRANDING_SQL="
CREATE TABLE IF NOT EXISTS company_branding (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  custom_css TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"

# Commande SQL pour créer invoice_templates si elle n'existe pas
INVOICE_TEMPLATES_SQL="
CREATE TABLE IF NOT EXISTS invoice_templates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  html_template TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"

# Commande SQL pour créer notification_templates si elle n'existe pas
NOTIFICATION_TEMPLATES_SQL="
CREATE TABLE IF NOT EXISTS notification_templates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_template TEXT NOT NULL,
  sms_template TEXT,
  whatsapp_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"

# Exécution des commandes SQL via le protocole postgres:// dans DATABASE_URL
if [[ "$DATABASE_URL" == postgres://* ]]; then
  # Extraire les informations de connexion de DATABASE_URL
  DB_USER=$(echo $DATABASE_URL | sed -r 's/postgres:\/\/([^:]+):.*/\1/')
  DB_PASS=$(echo $DATABASE_URL | sed -r 's/postgres:\/\/[^:]+:([^@]+).*/\1/')
  DB_HOST=$(echo $DATABASE_URL | sed -r 's/postgres:\/\/[^@]+@([^:]+):.*/\1/')
  DB_PORT=$(echo $DATABASE_URL | sed -r 's/postgres:\/\/[^@]+@[^:]+:([0-9]+)\/.*/\1/')
  DB_NAME=$(echo $DATABASE_URL | sed -r 's/postgres:\/\/[^@]+@[^:]+:[0-9]+\/([^?]+).*/\1/')
  
  # Exécuter les commandes SQL
  PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$COMPANY_BRANDING_SQL"
  PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$INVOICE_TEMPLATES_SQL"
  PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$NOTIFICATION_TEMPLATES_SQL"
  
  if [ $? -eq 0 ]; then
    echo "Tables supplémentaires créées ou vérifiées avec succès!"
  else
    echo "Attention: Problème lors de la création des tables supplémentaires."
    # Ne pas quitter avec une erreur car les migrations principales ont réussi
  fi
else
  echo "Format de DATABASE_URL non pris en charge pour les tables supplémentaires."
  echo "Assurez-vous de créer manuellement les tables company_branding, invoice_templates et notification_templates si nécessaire."
fi

echo "Processus de migration terminé."