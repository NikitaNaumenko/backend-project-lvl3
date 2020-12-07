install: install-deps

run:
	bin/nodejs-package.js 10

install-deps:
	npm ci

test:
	DEBUG=axios,page-loader,nock npm test

test-coverage:
	npm test -- --coverage --coverageProvider=v8

lint:
	npx eslint .

publish:
	npm publish

.PHONY: test
