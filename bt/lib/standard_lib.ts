import {Evaluator} from "./evaluator";
import {FuncParams, Immediate} from "./functions";
import * as secure from "./secure";
import {Expresser, StackExpresser, StateMachineExpresser} from "./expressers";

export interface StdEnv {
    stdout: ConsoleWriter;
}

export class ConsoleWriter {
    write(...args: any[]) {
        (console as any).log(...args);
    }
}

interface WhenState extends Expresser {
    running: boolean;
    result: any;
}

class WhenGuardingExpresser implements WhenState {
    running: boolean = false;
    result: boolean = false;

    constructor(private parent: StateMachineExpresser<WhenState>) {
    }

    express(result: any) {
        if (result) {
            this.parent.setState(new WhenRunningExpresser());
        }
    }

    finish() {
    }
}

class WhenRunningExpresser implements Expresser {
    running: boolean = true;
    result: any;
    resolve: (any) => any;

    constructor() {
        this.result = new Promise<any>((r) => this.resolve = r);
    }

    express(result: any) {
        if (this.running) {
            this.running = false;
            this.resolve(result);
            this.result = result;
        }
    }

    finish() {
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

            return Immediate.resolve(val).then((value) => {
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
    { // property accessor
        patterns: ['property $:name of $:obj'],
        impl: function(args: FuncParams, self: Evaluator) {
            var name = args.getString("name");
            var obj = args.getObject("obj");

            return secure.getProperty(obj, name);
        }
    },
    { // printer
        patterns: ['print $:arg'],
        impl: function(args: FuncParams, self: Evaluator) {
            let env = self.scope.env as StdEnv;
            env.stdout.write(args.named.arg);

            return args.named.arg;
        }
    },
    { // conditional execution
        patterns: ['when :'],
        impl: function(args: FuncParams, self: Evaluator) {
            let sub = self.makeSub();
            let expresser = new StateMachineExpresser<WhenState>();
            expresser.setState(new WhenGuardingExpresser(expresser));

            sub.scope.addFunc(['then :'], function(a: FuncParams): any {
                if (expresser.state.running) {
                    return sub.eval(a.body);
                }
                return false;
            });
            sub.evalExpressions(args.body, expresser);

            return expresser.state.result;
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
