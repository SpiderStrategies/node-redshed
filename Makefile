build:
	./node_modules/.bin/browserify lib/http/public/index.js -o lib/http/public/bundle.js

test:
	@NODE_ENV=testing NODE_PATH=../ ./node_modules/.bin/mocha -R spec test

.PHONY: test
