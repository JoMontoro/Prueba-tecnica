.PHONY: deploy install migrate health test

# Despliegue automatizado del reto fullstack
# Uso: make deploy

DEPLOY_MODE ?= local

deploy: install migrate
	@echo ">>> Desplegando en modo $(DEPLOY_MODE)..."
	DEPLOY_MODE=$(DEPLOY_MODE) ./deploy.sh

install:
	@echo ">>> Instalando dependencias..."
	cd Back-tecnica && npm install --silent
	cd ../Front-tecnica && npm install --silent

build:
	@echo ">>> Construyendo frontend..."
	cd Front-tecnica && npm run build

migrate:
	@echo ">>> Aplicando migraciones..."
	cd Back-tecnica && npm run migrate

health:
	@echo ">>> Comprobando salud de los servicios..."
	curl -sf http://localhost:${PORT:-3001}/health && echo ""
	curl -sf http://localhost:5173 >/dev/null && echo "Frontend OK" || echo "Frontend no responde en :5173"

test:
	@echo ">>> No hay pruebas automatizadas configuradas aún."
	@exit 0

clean:
	@echo ">>> Limpiando..."
	rm -rf Back-tecnica/node_modules Front-tecnica/node_modules Front-tecnica/dist
