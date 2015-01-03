'use strict';

var argparser = require('argparser')
                .nonvals("ast")
                .parse();

var AST = require('./ast'),
    parser = new AST.Parser();

var BT = require('./back_talker');

var readline = require('readline');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


var scope = new BT.Scope(),
    evaluator = new BT.Evaluator(scope)
    ;

function loop() {
    rl.question('$>: ', function(answer) {
        if (answer == 'q') {
            rl.close();
            process.exit();
        }

        try {
            var ast = parser.fromSource(answer);
            if (argparser.opt("ast")) {
                console.log(ast, typeof ast);
            }
            console.log(evaluator.eval(ast));
        } catch (e) {
            if (e instanceof AST.ParseError) {
                console.log(e);
            } else {
                throw e;
            }
        }
        loop();
    });
};

loop();
