'use strict';

var argparser = require('argparser')
                .nonvals("ast")
                .parse();
var BT = require('../lib/back_talker');
var readline = require('readline');


var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


var print_parse_tree = function(pt, prefix) {
    prefix = prefix || "";
    console.log(prefix + "<" + (pt.isa || "unknown")  + ">" + '"' + pt.textValue + '"');

    pt.elements.forEach(function(e) {
        print_parse_tree(e, prefix + "  ");
    });
};

var evaluator = new BT.Evaluator(scope),
    scope = evaluator.scope,
    running = true
    ;

scope.addFunc({
    patterns: ['q'],
    impl: function() { running = false; return 'goodbye!';}
});


function loop() {
    rl.question('$>: ', function(answer) {

        try {
            var ast = BT.parse(answer, print_parse_tree);
            if (argparser.opt("ast")) {
                console.log(ast);
            }
            console.log(evaluator.eval(ast));
        } catch (e) {
            if (e instanceof BT.Syntax.ParseError) {
                console.log(e.message);
            } else {
                throw e;
            }
        }
        if (!running) {
            rl.close();
            process.exit();
        }
        loop();
    });
};

loop();
