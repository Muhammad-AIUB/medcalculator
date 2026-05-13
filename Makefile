# MedCalc Pro - local developer helpers

.PHONY: help install be-install fe-install dev be-dev fe-dev \
	db-push db-migrate db-migrate-deploy db-generate db-studio db-reset \
	lint test test-e2e env-setup

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage: make \033[36m<target>\033[0m\n\nTargets:\n"} \
		/^[a-zA-Z_-]+:.*##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""

install: be-install fe-install ## Install all dependencies

be-install: ## Install backend dependencies
	cd backend && npm install

fe-install: ## Install frontend dependencies
	cd frontend && npm install

dev: ## Print the two manual dev commands
	@echo "Terminal 1: cd backend && npm run start:dev"
	@echo "Terminal 2: cd frontend && npm run dev"

be-dev: ## Run backend in local dev mode
	cd backend && npm run start:dev

fe-dev: ## Run frontend in local dev mode
	cd frontend && npm run dev

db-push: ## Push Prisma schema
	cd backend && npx prisma db push

db-migrate: ## Run Prisma migration dev
	cd backend && npx prisma migrate dev

db-migrate-deploy: ## Deploy Prisma migrations
	cd backend && npx prisma migrate deploy

db-generate: ## Regenerate Prisma client
	cd backend && npx prisma generate

db-studio: ## Open Prisma Studio
	cd backend && npx prisma studio

db-reset: ## Reset database
	cd backend && npx prisma migrate reset --force

lint: ## Lint both frontend and backend
	cd backend && npm run lint
	cd frontend && npm run lint

test: ## Run backend tests
	cd backend && npm run test

test-e2e: ## Run backend e2e tests
	cd backend && npm run test:e2e

env-setup: ## Copy .env.example to .env if missing
	@[ -f .env ] || (cp .env.example .env && echo "Created .env")
	@echo "Env file ready. Review .env before starting."
