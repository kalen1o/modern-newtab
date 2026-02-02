#!/bin/bash

# Clean Flyway schema history to fix migration issues
psql -h localhost -U newtab -d newtab -c "DROP TABLE IF EXISTS public.newtab_schema_history;"

echo "Flyway history cleaned. Please restart the service."
