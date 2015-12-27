import {Evaluator} from "./evaluator";
export * from "./expressers";
import {Expresser, ConsoleExpresser} from "./expressers";
import {CommandResult} from "./commands";
import * as AST from "./parser/ast";


export class VM {
    protected stack: any[] = [];

    protected ip: number = 0;
    protected waiting: boolean = true;

    constructor(public instructions: Instructions.Instruction[],
        protected evaluator: Evaluator,
        protected expresser: Expresser = new ConsoleExpresser()) {
    }

    pop(): any {
        return this.stack.pop();
    }

    push(b: any) {
        this.stack.push(b);
    }

    yoink(count: number): any[] {
        return this.stack.splice(this.stack.length - count, count);
    }

    express(r: any) {
        this.expresser.express(r);
    }

    resume() {
        this.waiting = false;
        while (!this.isFinished() && !this.waiting) {
            this.instructions[this.ip++].execute(this, this.evaluator);
        }

        if (this.isFinished()) {
            this.finish();
        }
    }

    wait() {
        this.waiting = true;
    }

    isFinished() {
        return this.ip >= this.instructions.length;
    }

    finish() {
        this.expresser.finish();
    }

}

export module Instructions {
    export interface Instruction {
        execute(vm: VM, evaluator: Evaluator);
    }

    export class Push implements Instruction {
        constructor(private value: any) { }

        execute(vm: VM, evaluator: Evaluator) {
            vm.push(this.value);
        }
    }

    export var pushZero = new Push(0);

    export class Express {
        static execute(vm: VM, evaluator: Evaluator) {
            vm.express(vm.pop());
        }
    }

    export class And {
        static execute(vm: VM, evaluator: Evaluator) {
            let right = vm.pop();
            let left = vm.pop();
            vm.push(left && right);
        }
    }

    export class Or {
        static execute(vm: VM, evaluator: Evaluator) {
            var right = vm.pop();
            vm.push(vm.pop() || right);
        }
    }

    export class Not {
        static execute(vm: VM, evaluator: Evaluator) {
            vm.push(!vm.pop());
        }
    }

    export class Add {
        static execute(vm: VM, evaluator: Evaluator) {
            var right = vm.pop();
            vm.push(vm.pop() + right);
        }
    }

    export class Sub {
        static execute(vm: VM, evaluator: Evaluator) {
            var right = vm.pop();
            vm.push(vm.pop() - right);
        }
    }

    export class Mult {
        static execute(vm: VM, evaluator: Evaluator) {
            var right = vm.pop();
            vm.push(vm.pop() * right);
        }
    }

    export class Div {
        static execute(vm: VM, evaluator: Evaluator) {
            var right = vm.pop();
            vm.push(vm.pop() / right);
        }
    }

    export class CallCommand {
        constructor(private name: string) {
        }

        execute(vm: VM, evaluator: Evaluator) {
            var func = evaluator.scope.findCommandOrThrow(this.name),
                args = vm.yoink(func.vivification.length),
                result = func.call(args, evaluator);

            CallCommand.handleCommandResult(vm, evaluator, result);
        }

        static handleCommandResult(vm: VM, evaluator: Evaluator, result: CommandResult) {
            if (result === undefined || result === null || result.then === undefined) {
                return vm.push(result);
            }

            vm.wait();
            result.then((value) => {
                vm.push(value);
                vm.resume();
            });
        }
    }

    export class CallHanging {
        constructor(private name: string, private body: AST.CompoundExpression) {
        }

        execute(vm: VM, evaluator: Evaluator) {
            var func = evaluator.scope.findCommandOrThrow(this.name),
                args = vm.yoink(func.vivification.length),
                result = func.call(args, evaluator, this.body);

            CallCommand.handleCommandResult(vm, evaluator, result);
        }
    }

    export class Get {
        constructor(private name: string) {
        }

        execute(vm: VM, evaluator: Evaluator) {
            vm.push(evaluator.scope.get(this.name));
        }
    }

    export class GetVivifiable {
        constructor(private name: string) {
        }

        execute(vm: VM, evaluator: Evaluator) {
            vm.push(evaluator.scope.getVivifiable(this.name));
        }
    }
}

class ArgsCompiler extends AST.BaseVisitor {
    constructor(private compiler: Compiler) { super(); }

    visitVisitable(a: AST.Visitable): any { return a.accept(this.compiler); }

    visitCommandArg(node: AST.CommandArg) {
        node.body.accept(this);
    }

    visitRef(node: AST.Ref) {
        this.compiler.push(new Instructions.GetVivifiable(node.name), node.code);
    }
}

export class Compiler extends AST.BaseVisitor {
    instructions: Instructions.Instruction[] = [];
    private argsCompiler: ArgsCompiler;

    constructor() {
        super();
        this.argsCompiler = new ArgsCompiler(this);
    }

    static compile(ast: AST.Visitable): Instructions.Instruction[] {
        var c = new Compiler();
        ast.accept(c);
        return c.instructions;
    }

    push(i: Instructions.Instruction, code: AST.Code) {
        this.instructions.push(i);
    }

    visitHangingCall(node: AST.HangingCall) {
        // don't want to visit body as well
        node.acceptForArgs(this);
        this.push(new Instructions.CallHanging(node.name, node.body), node.code);
    }

    visitCommand(node: AST.CommandCall) {
        node.acceptForChildren(this);
        this.push(new Instructions.CallCommand(node.name), node.code);
    }

    visitBinOpNode(node: AST.BinOpNode) {
        node.acceptForChildren(this);
    }

    visitNotOp(node: AST.NotOp) {
        node.acceptForChildren(this);
        this.push(Instructions.Not, node.code);
    }

    visitAndOp(node: AST.AndOp) {
        node.acceptForChildren(this);
        if (node.not) {
            this.push(Instructions.Not, node.code);
        }
        this.push(Instructions.And, node.code);
    }

    visitOrOp(node: AST.OrOp) {
        node.acceptForChildren(this);
        if (node.not) {
            this.push(Instructions.Not, node.code);
        }
        this.push(Instructions.Or, node.code);
    }

    visitAddOp(node: AST.AddOp) {
        node.acceptForChildren(this);
        this.push(Instructions.Add, node.code);
    }

    visitSubOp(node: AST.SubOp) {
        node.acceptForChildren(this);
        this.push(Instructions.Sub, node.code);
    }

    visitDivideOp(node: AST.DivideOp) {
        node.acceptForChildren(this);
        this.push(Instructions.Div, node.code);
    }

    visitMultOp(node: AST.MultOp) {
        node.acceptForChildren(this);
        this.push(Instructions.Mult, node.code);
    }

    visitLiteral(node: AST.Literal) {
        this.push(new Instructions.Push(node.val), node.code);
    }

    visitUnaryMinus(node: AST.UnaryMinus) {
        this.push(Instructions.pushZero, node.code);
        node.acceptForChildren(this);
        this.push(Instructions.Sub, node.code);
    }

    visitCommandArg(node: AST.CommandArg) {
        node.acceptForChildren(this.argsCompiler);
    }

    visitRef(node: AST.Ref) {
        this.push(new Instructions.Get(node.name), node.code);
    }

    visitCompoundExpression(node: AST.CompoundExpression) {
        node.parts.forEach((part) => {
            part.accept(this);
            this.push(Instructions.Express, part.code);
        });
    }
}
