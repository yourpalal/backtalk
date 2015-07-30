REPORTER = dot
TS_FILES = find bt -name '.ts'
NODE_BIN = `npm bin`
CANOPY = `npm bin`

scripts:
	gulp scripts canopy

dist:
	gulp dist

clean:
	rm -rf build/

test-w: scripts
	@NODE_ENV=test ./node_modules/.bin/mocha build/js/tests/*.js --reporter $(REPORTER) --growl --watch --require source-map-support/register

build/js/bin/repl.js: bt/bin/repl.js
	mkdir -p build/js/bin
	rm -f $@
	cp $(<) $@

repl: scripts build/js/bin/repl.js
	node build/js/bin/repl.js

.PHONY: test test-w repl ALL clean
