#!/bin/bash

# Supprime le package problématique html-to-pdf-js
npm uninstall html-to-pdf-js

# Installe @react-pdf/renderer si ce n'est pas déjà fait
npm list @react-pdf/renderer || npm install @react-pdf/renderer

# Lance l'audit et tente de corriger les problèmes non critiques
npm audit fix

echo "Les dépendances ont été mises à jour et les vulnérabilités non critiques ont été corrigées."