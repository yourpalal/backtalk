'use strict';

var grammar = require('./grammar');
var AST = require('./ast');

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

        console.log(AST.fromSource(answer).transform());
        console.log(AST.fromSource(answer).transform().Eval());
        loop();
    });
};

loop();
