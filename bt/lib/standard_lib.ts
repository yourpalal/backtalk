import {Evaluator} from "./evaluator";
import {FuncParams, Immediate} from "./functions";
import {StackExpresser} from "./expressers";

export interface StdEnv {
    stdout: ConsoleWriter;
}

export class ConsoleWriter {
    write(...args: any[]) {
        (console as any).log(...args);
    }
}

var funcs = [
    { // assignment
        patterns: ['with $!!:ref as $:val', 'with $!!:ref as:'],
        impl: function(args: FuncParams, self: Evaluator) {
            let val = args.named.val;

            if (args.body) {
                val = self.makeSub().eval(args.body);
            }

            return Immediate.wrap(val).then((value) => {
                self.scope.set(args.named.ref.name, value);
                return value;
            });
        }
    },
    { // list constructor
        patterns: ['list of:'],
        impl: function(args: FuncParams, self: Evaluator) {
            // StackExpresser calls 'push' on each result
            var list = [];
            self.evalExpressions(args.body, new StackExpresser(list));

            return list;
        }
    },
    { // list accessor
        patterns: ['item $:count of $:list'],
        impl: function(args: FuncParams, self: Evaluator) {
            var count = args.getNumber("count");
            return args.named.list[count - 1];
        }
    },
    { // printer
        patterns: ['print $:arg'],
        impl: function(args: FuncParams, self: Evaluator) {
            let env = self.scope.env as StdEnv;
            env.stdout.write(args.named.arg);

            return args.named.arg;
        }
    }
];

export function inScope(scope) {
    scope.env.stdout = new ConsoleWriter();
    funcs.forEach(function(f) {
        scope.addFunc(f.patterns, f.impl);
    });
    return scope;
}
