/// <reference path="../typings/argparser.d.ts" />
/// <reference path="../typings/tsd.d.ts" />

'use strict';

import argparser = require('argparser');
import readline = require('readline');

import BT = require('../lib/back_talker');
import {Shell} from '../lib/shell';


var args = argparser.nonvals("ast").parse(),
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

var print_parse_tree = function(pt, prefix = "") {
    console.log(prefix + "<" + (pt.isa || "unknown")  + ">" + '"' + pt.textValue + '"');

    pt.elements.forEach(function(e) {
        print_parse_tree(e, prefix + "  ");
    });
};

var evaluator = new BT.Evaluator(scope),
    scope = evaluator.scope,
    shell = new Shell(evaluator);
    ;

scope.addFunc({
    patterns: ['q'],
    impl: function() {
      console.log('goodbye!');
      rl.close();
      process.exit();
    }
});

shell.eval = function(source) {
  try {
    var ast = BT.parse(source, print_parse_tree);
    if (args.opt("ast")) {
      console.log(ast);
    }
    console.log(shell.evaluator.eval(ast));
  } catch (e) {
    if (e instanceof BT.Syntax.ParseError) {
        console.log(e.message);
    } else {
        throw e;
    }
  }
}

rl.setPrompt("::>");
rl.prompt();

rl.on('line', function(line) {
  shell.processLine(line);
  if (shell.multiline) {
    rl.setPrompt(".. ");
  } else {
    rl.setPrompt("::>");
  }
  rl.prompt();
});
