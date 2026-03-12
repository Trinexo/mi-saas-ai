# Generación de repositorio descargable

## Objetivo

Permitir crear un paquete completo del proyecto listo para distribuir o instalar.

---

# Estructura final del paquete

test-platform/

backend/
frontend/
database/
scripts/
docker/
docs/

docker-compose.yml
README.md
.env.example

---

# Script de empaquetado

scripts/build-package.sh

#!/bin/bash

PROJECT_NAME="test-platform"

mkdir $PROJECT_NAME

cp -r backend $PROJECT_NAME/
cp -r frontend $PROJECT_NAME/
cp -r database $PROJECT_NAME/
cp -r docker $PROJECT_NAME/
cp -r docs $PROJECT_NAME/

tar -czf $PROJECT_NAME.tar.gz $PROJECT_NAME

echo "Paquete generado: $PROJECT_NAME.tar.gz"

---

# Uso

chmod +x scripts/build-package.sh

./scripts/build-package.sh
