REPORTER = dot
BT_FILES = gen/grammar.js ast.js back_talker.js

ALL: gen/grammar.js gen/bt.js
	@echo 'cool'

gen/grammar.js: grammar.peg
	canopy $(<)

gen/bt.js: $(BT_FILES)
	./node_modules/.bin/browserify -s BackTalker back_talker.js -o $@

repl: gen/grammar.js gen/bt_node.js
	node repl.js

test: gen/grammar.js
	@NODE_ENV=test ./node_modules/.bin/mocha tests/*.js --reporter $(REPORTER)


test-w: gen/grammar.js
	@NODE_ENV=test ./node_modules/.bin/mocha tests/*.js --reporter $(REPORTER) --growl --watch


.PHONY: test test-w repl ALL
