.PHONY: dev start stop restart status doctor test test-frontend test-backend test-security logs logs-backend logs-frontend logs-ollama docker-up docker-down docker-logs

dev start:
	./vjt dev start

stop:
	./vjt dev stop

restart:
	./vjt dev restart

status:
	./vjt dev status

doctor:
	./vjt dev doctor

test:
	./vjt test all

test-frontend:
	./vjt test frontend

test-backend:
	./vjt test backend

test-security:
	./vjt test security

logs:
	./vjt logs

logs-backend:
	./vjt logs backend

logs-frontend:
	./vjt logs frontend

logs-ollama:
	./vjt logs ollama

docker-up:
	./vjt docker up

docker-down:
	./vjt docker down

docker-logs:
	./vjt docker logs
