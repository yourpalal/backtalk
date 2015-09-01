/// <reference path="../typings/argparser.d.ts" />
/// <reference path="../typings/tsd.d.ts" />

import * as argparser from 'argparser';
import * as readline from 'readline';

import * as BT from '../lib/back_talker';
import {Shell} from '../lib/shell';


class REPLParser extends BT.Parser {
  print_parse: boolean = false;
  print_ast: boolean = false;

  constructor() {
    super()
  }

  inspect(parse_tree) {
    if (this.print_parse) {
      REPLParser.print_parse_tree(parse_tree);
    }
  }

  parse(source: string, chunkName: string = "unknown"): BT.AST.Visitable {
    let ast = super.parse(source, chunkName);

    if (this.print_ast) {
      console.log(JSON.stringify(ast, REPLParser.json_replacer, 2));
    }
    return ast;
  }

  static json_replacer(k: string, v: any) {
    if (k === "code") {
      return undefined
    }
    return v;
  }

  static print_parse_tree(pt, prefix = "") {
    console.log(prefix + "<" + (pt.isa || "unknown")  + ">" + '"' + pt.textValue + '"');
    pt.elements.forEach(e => REPLParser.print_parse_tree(e, prefix + "  "));
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
    this.parser.print_ast = argparser.nonvals("ast").parse().ast

    this.evaluator = new BT.Evaluator(),
    this.scope = this.evaluator.scope,
    this.shell = new Shell(this.evaluator);
    this.shell.eval = (source) => this.shell_eval(source);

    this.init_scope();
  }

  shell_eval(source) {
    try {
      var ast = this.parser.parse(source);
      var result = this.shell.evaluator.eval(ast);
      if (typeof result !== 'undefined') {
        console.log(result);
      }
    } catch (e) {
      if (e instanceof BT.BaseError) {
        console.log(e.toString());
      } else {
          throw e;
      }
    }
  }

  init_scope() {
    this.scope.addFunc(['q'], () => {
      console.log('goodbye!');
      this.rl.close();
      process.exit();
    });

    this.scope.addFunc(["repl <debug|stop debug|no debug>:on <ast|parse>:what"], (args) => {
        let on = args.choose('on', [true, false, false]);
        if (args.named['what'] == 0) {
          this.parser.print_ast = on;
        } else {
          this.parser.print_parse = on;
        }
    });

    this.scope.addFunc(["repl ls", "help"], (args) => {
      this.scope.funcs.each((k, v) => console.log(k));
    });

    this.scope.addFunc(["repl scope"], (args) => {
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
      this.rl.prompt();
    });
  }
}

new REPL().begin();
