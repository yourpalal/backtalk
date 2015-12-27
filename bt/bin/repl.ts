/// <reference path="../typings/argparser.d.ts" />
/// <reference path="../typings/tsd.d.ts" />

import * as argparser from 'argparser';
import * as readline from 'readline';

import * as BT from '../lib/index';
import {Shell} from '../lib/shell';


class REPLParser extends BT.Parser {
    printParse: boolean = false;
    printAst: boolean = false;

    constructor() {
        super();
    }

    inspect(parseTree) {
        if (this.printParse) {
            REPLParser.print_parse_tree(parseTree);
        }
    }

    parse(source: string, chunkName: string = "unknown"): BT.ParseResult {
        let result = super.parse(source, chunkName).throwErrors();

        if (this.printAst) {
            console.log(JSON.stringify(result.ast, REPLParser.json_replacer, 2));
        }
        return result;
    }

    static json_replacer(k: string, v: any) {
        if (k === "code") {
            return undefined;
        }
        return v;
    }

    static print_parse_tree(pt, prefix = "") {
        console.log(prefix + "<" + (pt.isa || "unknown") + ">" + '"' + pt.textValue + '"');
        pt.elements.forEach(e => REPLParser.print_parse_tree(e, prefix + "  "));
    }
}

class REPLShell extends Shell {
    constructor(private repl: REPL) {
        super(repl.evaluator);
    }

    eval(source: string) {
        try {
            let {ast} = this.repl.parser.parse(source);

            this.waiting = true;
            Promise.resolve(this.evaluator.eval(ast)).then((val) => {
                if (val !== undefined) {
                    console.log(val);
                }
                this.resume();
            });
        } catch (e) {
            if (e instanceof BT.BaseError) {
                console.log(e.toString());
                this.resume();
            } else {
                throw e;
            }
        }
    }

    resume() {
        this.repl.resume();
        super.resume();
    }
}

class REPL {
    parser: REPLParser;
    rl: readline.ReadLine;
    evaluator: BT.Evaluator;
    shell: Shell;
    scope: BT.Scope;

    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.parser = new REPLParser();
        this.parser.printAst = argparser.nonvals("ast").parse().ast;

        this.evaluator = new BT.Evaluator();
        this.scope = this.evaluator.scope;
        this.shell = new REPLShell(this);

        this.init_scope();
    }

    init_scope() {
        this.scope.addCommand(['q'], () => {
            console.log('goodbye!');
            this.rl.close();
            process.exit();
        });

        this.scope.addCommand(["repl <debug|stop debug|no debug>:on <ast|parse>:what"], (args) => {
            let on = args.choose('on', [true, false, false]);
            if (args.named['what'] == 0) {
                this.parser.printAst = on;
            } else {
                this.parser.printParse = on;
            }
        });

        this.scope.addCommand(["repl ls", "help"], (args) => {
            this.scope.commands.each((k, v) => console.log(k));
        });

        this.scope.addCommand(["repl scope"], (args) => {
            console.log(this.scope.names);
        });
    }

    begin() {
        this.rl.setPrompt("::>");
        this.rl.prompt();

        this.rl.on('line', (line) => {
            this.shell.processLine(line);
            if (this.shell.multiline) {
                this.rl.setPrompt(".. ");
            } else {
                this.rl.setPrompt("::>");
            }
            if (!this.shell.waiting) {
                this.rl.prompt();
            }
        });
    }

    resume() {
        this.rl.prompt();
    }
}

new REPL().begin();
