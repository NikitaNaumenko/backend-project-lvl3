install: install-deps

link:
	npm link

install-deps:
	npm ci

test:
	DEBUG=axios,page-loader,nock npm test

test-coverage:
	npm test -- --coverage --coverageProvider=v8 --no-warnings

lint:
	npx eslint .

publish:
	npm publish

.PHONY: test
