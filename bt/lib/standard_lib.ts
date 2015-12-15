import {Evaluator} from "./evaluator";
import {FuncParams, Immediate} from "./functions";
import {Library} from "./library";
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

export var library = Library.create()
.func("with_as", ['with $!!:ref as $:val', 'with $!!:ref as:'])
    .help("sets a variable to the given value")
    .callsBody(Library.ONCE)
    .impl((args: FuncParams, self: Evaluator) => {
        let val = args.named.val;

        if (args.body) {
            val = self.makeSub().eval(args.body);
        }

        return Immediate.resolve(val).then((value) => {
            self.scope.set(args.named.ref.name, value);
            return value;
        });
    })

.func("list_of", ['list of:'])
    .callsBody(Library.ONCE)
    .help("returns a list of the result of each expression in the body")
    .impl((args: FuncParams, self: Evaluator) => {
        // StackExpresser calls 'push' on each result
        var list = [];
        self.evalExpressions(args.body, new StackExpresser(list));

        return list;
    })

.func("item_of", ['item $:count of $:list'])
    .help("gets an item from the list.")
    .impl((args: FuncParams, self: Evaluator) => {
        var count = args.getNumber("count");
        return args.named.list[count - 1];
    })

.func("property_of", ['property $:name of $:obj'])
    .help("gets a named property of an object")
    .impl((args: FuncParams, self: Evaluator) => {
        var name = args.getString("name");
        var obj = args.getObject("obj");

        return secure.getProperty(obj, name);
    })

.func("print", ['print $:arg'])
    .help("prints the provided value")
    .impl((args: FuncParams, self: Evaluator) => {
        let env = self.scope.env as StdEnv;
        env.stdout.write(args.named.arg);

        return args.named.arg;
    })

.func("when", ['when :'])
    .help(`Supports conditional execution. The first expression to evaluate
        to true will have its then expression run.

        when:
            $a
            then:
                print "a"
            $b
            then:
                print "b"
            true:
                print "c"
            `)
    .includes()
        .func("then", ["then :"])
            .help("runs the next statement only if the previous guard passed")
        .done()
    .impl((args: FuncParams, self: Evaluator) => {
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
    })
    .library;

export function inScope(scope) {
    scope.env.stdout = new ConsoleWriter();
    library.addToScope(scope);
    return scope;
}
