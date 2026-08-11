-include .env

build:
	docker compose build

# run:
# 	docker compose start

dev:
	docker compose start

stop:
	docker compose stop
	docker ps -a | grep ${DOCKER_APP}

# db-fresh:
# 	docker exec -it ${DOCKER_APP}-api sh -c "php artisan migrate:fresh --seed"

# test:
# 	docker exec -it ${DOCKER_APP}-api sh -c "php artisan test"

tty:
	docker exec -it ${DOCKER_APP}-api bash

ttyu:
	docker exec -it -u 1000:1000 ${DOCKER_APP}-api bash

# openapi:
# 	docker exec -it ${DOCKER_APP}-api sh -c "./vendor/bin/openapi app/ --version 3.1.0 --output openapi.yaml"

setup:
	cp -n ./.env.example ./.env
	cp -n ./api/.env.example ./api/.env
	make build
	docker compose up -d
# 	docker exec -it ${DOCKER_APP}-api sh -c "composer install"
# 	docker exec -it ${DOCKER_APP}-api sh -c "chown -R apache:apache /api/storage"
# 	docker exec -it ${DOCKER_APP}-api sh -c "php artisan key:generate"
# 	docker exec -it ${DOCKER_APP}-api sh -c "touch /api/openapi.yml"
# 	docker exec -it ${DOCKER_APP}-api sh -c "php artisan jwt:secret --force"
# Wait for MySQL to be ready
# 	sleep 15
# 	make db-fresh
