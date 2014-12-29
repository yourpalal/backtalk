REPORTER = dot

grammar.js: grammar.peg
	canopy $(<)

repl: grammar.js
	node repl.js

test: grammar.js
	@NODE_ENV=test ./node_modules/.bin/mocha tests/*.js --reporter $(REPORTER)


test-w: grammar.js
	@NODE_ENV=test ./node_modules/.bin/mocha tests/*.js --reporter $(REPORTER) --growl --watch


.PHONY: test test-w repl
