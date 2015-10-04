import {Evaluator} from "./evaluator";
import {FuncParams, FuncResult, Immediate} from "./functions";
import {StackExpresser} from "./expressers";

var parts = [
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
            var parts = [];
            self.evalExpressions(args.body, new StackExpresser(parts));

            return parts;
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
            console.log(args.named.arg);

            return args.named.arg;
        }
    }

];

export function inScope(scope) {
    parts.forEach(function(f) {
        scope.addFunc(f.patterns, f.impl);
    });
    return scope;
}
