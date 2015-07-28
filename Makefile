REPORTER = dot
TS_FILES = find bt -name '.ts'

scripts: grammar.js
	gulp scripts

dist:
	gulp dist

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

build/js/bin/repl.js: bt/bin/repl.js
	mkdir -p build/js/bin
	rm -f $@
	cp $(<) $@

repl: scripts build/js/lib/grammar.js build/js/bin/repl.js
	node build/js/bin/repl.js

.PHONY: test test-w repl ALL clean
