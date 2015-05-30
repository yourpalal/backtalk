REPORTER = dot
TS_FILES = find bt -name '.ts'

scripts: grammar.js
	gulp scripts

clean:
	rm -rf build/

grammar.js: grammar.peg
	canopy $(<)

testnos: scripts build/js/lib/grammar.js
	@NODE_ENV=test ./node_modules/.bin/mocha build/js/tests/*.js -u bdd

test: scripts build/js/lib/grammar.js
	@NODE_ENV=test ./node_modules/.bin/mocha build/js/tests/*.js -u bdd --require source-map-support/register


test-w: gen/grammar.js
	@NODE_ENV=test ./node_modules/.bin/mocha build/js/tests/*.js --reporter $(REPORTER) --growl --watch --require source-map-support/register


.PHONY: test test-w repl ALL clean
