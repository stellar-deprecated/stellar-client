# Check if we need to prepend docker commands with sudo
SUDO := $(shell docker version >/dev/null 2>&1 || echo "sudo")

# If TAG is not provided set default value
TAG ?= stellar/stellar-client:$(shell git rev-parse --short HEAD)$(and $(shell git status -s),-dirty-$(shell id -u -n))

docker-build:
	$(SUDO) docker build -t $(TAG) .

docker-push:
	$(SUDO) docker push $(TAG)
