REPORTER = spec

test:
	@./node_modules/.bin/mocha -R spec --globals server,httpsServer

.PHONY: test