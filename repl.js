'use strict';

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

        console.log(parser.fromSource(answer));
        console.log(parser.fromSource(answer).Eval());
        loop();
    });
};

loop();
