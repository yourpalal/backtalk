'use strict';

var argparser = require('argparser')
                .nonvals("ast")
                .parse();

var parser = new (require('./ast').Parser)();
var readline = require('readline');

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


function loop() {
    rl.question('$>: ', function(answer) {
        if (answer == 'q') {
            rl.close();
            process.exit();
        }

        try {
            var ast = parser.fromSource(answer);
            if (argparser.opt("ast")) {
                console.log(ast);
            }
            console.log(ast.Eval());
        } catch (e) {
            console.log(e, Object.keys(e));
        }
        loop();
    });
};

loop();
