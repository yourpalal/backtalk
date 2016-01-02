import {Evaluator} from "./evaluator";
import {CommandParams} from "./commands";
import {Library, CommandMeta} from "./library";
import {Immediate} from "./immediate";
import * as secure from "./secure";
import {StackExpresser} from "./expressers";

export interface StdEnv {
    stdout: ConsoleWriter;
}

export class ConsoleWriter {
    write(...args: any[]) {
        (console as any).log(...args);
    }
}

export var library = Library.create()
.command("with_as", ['with $!!:ref as $:val', 'with $!!:ref as:'])
    .help("sets a variable to the given value")
    .callsBody(Library.ONCE)
    .impl((args: CommandParams, self: Evaluator) => {
        let val = args.named.val;

        if (args.body) {
            val = self.makeSub().eval(args.body);
        }

        return Immediate.resolve(val).then((value) => {
            self.scope.set(args.named.ref.name, value);
            return value;
        });
    })

.command("list_of", ['list of:'])
    .callsBody(Library.ONCE)
    .help("returns a list of the result of each expression in the body")
    .impl((args: CommandParams, self: Evaluator) => {
        // StackExpresser calls 'push' on each result
        var list = [];
        self.evalExpressions(args.body, new StackExpresser(list));

        return list;
    })

.command("item_of", ['item $:count of $:list'])
    .help("gets an item from the list.")
    .impl((args: CommandParams, self: Evaluator) => {
        var count = args.getNumber("count");
        return args.named.list[count - 1];
    })

.command("property_of", ['property $:name of $:obj'])
    .help("gets a named property of an object")
    .impl((args: CommandParams, self: Evaluator) => {
        var name = args.getString("name");
        var obj = args.getObject("obj");

        return secure.getProperty(obj, name);
    })

.command("print", ['print $:arg'])
    .help("prints the provided value")
    .impl((args: CommandParams, self: Evaluator) => {
        let env = self.scope.env as StdEnv;
        env.stdout.write(args.named.arg);

        return args.named.arg;
    })

.command("if", ['if :'])
    .callsBody(Library.ONCE)
    .help(`Supports conditional execution. The first case to evaluate
        to true will have its body run.

        if:
            in case $a then:
                print "a"
            in case $b then:
                print "b"
            in case ($a & $b) then:
                print "ab"
            otherwise:
                print "c"
            `)
    .includes()
        .command("in case", ["in case $:guard then:"])
            .callsBody(Library.ONCE)
            .help("runs the provided body only if the case matches, and it is the first case to do so.")
        .command("otherwise", ["otherwise:"])
            .callsBody(Library.ONCE)
            .help("runs the provided body only if no cases match")
        .done()
    .impl((args: CommandParams, self: Evaluator, meta: CommandMeta) => {
        let sub = self.makeSub();
        let running = true;
        let result: any = null;
        let otherwise = null;

        meta.includes.addToScope(sub.scope, {
            "in case": (a: CommandParams) => {
                if (!running) {
                    return false;
                }

                return Immediate.resolve(a.get("guard")).then((v) => {
                    if (!v) {
                        return false;
                    }

                    running = false;
                    result = sub.eval(a.body);
                    return result;
                });
            },
            "otherwise": (a: CommandParams) => {
                otherwise = a.body;
            }
        });

        return Immediate.resolve(sub.eval(args.body))
            .then(() => {
                if (!running) {
                    return result;
                } else if (otherwise !== null) {
                    return sub.eval(otherwise);
                } else {
                    return false;
                }
            });
    })
    .library;

export function inScope(scope) {
    scope.env.stdout = new ConsoleWriter();
    library.addToScope(scope);
    return scope;
}
