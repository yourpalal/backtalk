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

        try {
            console.log(parser.fromSource(answer));
            console.log(parser.fromSource(answer).Eval());
        } catch (e) {
            console.log(e, Object.keys(e));
        }
        loop();
    });
};

loop();
