#!/bin/bash
# This script runs the database migrations automatically by selecting the first option for all prompts

echo "Creating tables from schema.ts automatically..."

# Create a temporary file with multiple 'y' answers (one per expected prompt)
echo -e "y\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny\ny" > answers.txt

# Run the migration command and pipe the answers
cat answers.txt | npx drizzle-kit push

# Remove the temporary file
rm answers.txt

echo "Migration completed!"