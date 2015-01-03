'use strict';

var argparser = require('argparser')
                .nonvals("ast")
                .parse();
var BT = require('./back_talker');
var readline = require('readline');


var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


var scope = new BT.Scope(),
    context = new BT.Context(),
    evaluator = new BT.Evaluator(scope, context),
    running = true
    ;

context.addFunc({
    patterns: ['q'],
    impl: function() { running = false; return 'goodbye!';}
});


function loop() {
    rl.question('$>: ', function(answer) {

        try {
            var ast = BT.parse(answer);
            if (argparser.opt("ast")) {
                console.log(ast, typeof ast);
            }
            console.log(evaluator.eval(ast));
        } catch (e) {
            if (e instanceof BT.AST.ParseError) {
                console.log(e);
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
