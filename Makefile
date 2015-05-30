REPORTER = dot

build/js/lib/back_talker.js: build/js/grammar.js bt/**/**.ts
	gulp scripts

clean:
	rm -rf build/

build/js/grammar.js: grammar.peg
	mkdir -p build/js/lib
	canopy $(<)
	mv grammar.js build/js/lib

test: build/js/lib/back_talker.js build/js/grammar.js
	@NODE_ENV=test ./node_modules/.bin/mocha build/js/tests/*.js -u bdd


test-w: gen/grammar.js
	@NODE_ENV=test ./node_modules/.bin/mocha build/js/tests/*.js --reporter $(REPORTER) --growl --watch


.PHONY: test test-w repl ALL clean
