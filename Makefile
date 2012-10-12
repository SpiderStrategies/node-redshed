test:
	@NODE_ENV=testing NODE_PATH=../ ./node_modules/.bin/mocha -R spec test

.PHONY: test
