.PHONY: verify test build docker-build docker-run release

IMAGE_NAME ?= pwa-inspecciones
VERSION ?= $(shell node -p "require('./package.json').version" 2>/dev/null || echo "0.1.0")
COMMIT_SHA ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "latest")

verify:
	npm run verify

test:
	npm test

build:
	npm run build

docker-build:
	docker build --build-arg VERSION=$(VERSION) -t $(IMAGE_NAME):latest -t $(IMAGE_NAME):$(VERSION) -t $(IMAGE_NAME):$(COMMIT_SHA) .

docker-run:
	docker run --rm -it -p 3000:3000 --name $(IMAGE_NAME) $(IMAGE_NAME):$(VERSION)

release: docker-build
	@echo "Release compilada con éxito: $(IMAGE_NAME):$(VERSION) y $(IMAGE_NAME):$(COMMIT_SHA)"
