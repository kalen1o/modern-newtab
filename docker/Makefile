dev:
	docker-compose up -d

stop:
	docker-compose down

rebuild: stop
	docker-compose build --no-cache
	docker-compose up -d
