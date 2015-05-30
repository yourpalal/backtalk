REPORTER = dot

scripts: clean build/js/grammar.js bt/**/**.ts
	gulp scripts

clean:
	rm -rf build/

build/js/grammar.js: grammar.peg
	mkdir -p build/js
	canopy $(<)
	mv grammar.js build/js

test: gen/grammar.js
	@NODE_ENV=test ./node_modules/.bin/mocha tests/*.js -u bdd


test-w: gen/grammar.js
	@NODE_ENV=test ./node_modules/.bin/mocha tests/*.js --reporter $(REPORTER) --growl --watch


.PHONY: test test-w repl ALL clean
