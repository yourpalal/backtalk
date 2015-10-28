export class Code {
    constructor(public lineNumber: number = -1, public chunk: string = "unnamed") { }

    atLine(line: number): Code {
        return new Code(line);
    }
}


export interface Visitor {
    visitAddOp(v: AddOp, ...args: any[]): any;
    visitSubOp(v: SubOp, ...args: any[]): any;
    visitOrOp(v: OrOp, ...args: any[]): any;
    visitAndOp(v: AndOp, ...args: any[]): any;
    visitNotOp(v: NotOp, ...args: any[]): any;
    visitDivideOp(v: DivideOp, ...args: any[]): any;
    visitMultOp(v: MultOp, ...args: any[]): any;
    visitBinOpNode(v: BinOpNode, ...args: any[]): any;
    visitLiteral(v: Literal, ...args: any[]): any;
    visitBareWord(v: BareWord, ...args: any[]): any;
    visitUnaryMinus(v: UnaryMinus, ...args: any[]): any;
    visitRef(v: Ref, ...args: any[]): any;
    visitSyntaxError(v: SyntaxError, ...args: any[]): any;
    visitCompoundExpression(v: CompoundExpression, ...args: any[]): any;
    visitFuncArg(v: FuncArg, ...args: any[]): any;
    visitHangingCall(v: HangingCall, ...args: any[]): any;
    visitFuncCall(v: FuncCall, ...args: any[]): any;
}

export class BaseVisitor implements Visitor {
    visitAndOp(v: AndOp, ...args: any[]): any { return this.visitVisitable(v, ...args); }
    visitOrOp(v: OrOp, ...args: any[]): any { return this.visitVisitable(v, ...args); }
    visitNotOp(v: NotOp, ...args: any[]): any { return this.visitVisitable(v, ...args); }
    visitAddOp(v: AddOp, ...args: any[]): any { return this.visitVisitable(v, ...args); }
    visitSubOp(v: SubOp, ...args: any[]): any { return this.visitVisitable(v, ...args); }
    visitDivideOp(v: DivideOp, ...args: any[]): any { return this.visitVisitable(v, ...args); }
    visitMultOp(v: MultOp, ...args: any[]): any { return this.visitVisitable(v, ...args); }
    visitBinOpNode(v: BinOpNode, ...args: any[]): any { return this.visitVisitable(v, ...args); }
    visitLiteral(v: Literal, ...args: any[]): any { return this.visitVisitable(v, ...args); }
    visitBareWord(v: BareWord, ...args: any[]): any { return this.visitVisitable(v, ...args); }
    visitUnaryMinus(v: UnaryMinus, ...args: any[]): any { return this.visitVisitable(v, ...args); }
    visitRef(v: Ref, ...args: any[]): any { return this.visitVisitable(v, ...args); }
    visitFuncArg(v: FuncArg, ...args: any[]): any { return this.visitVisitable(v, ...args); }
    visitSyntaxError(v: SyntaxError, ...args: any[]): any { return this.visitVisitable(v, ...args); }
    visitCompoundExpression(v: CompoundExpression, ...args: any[]): any { return this.visitVisitable(v, ...args); }
    visitHangingCall(v: HangingCall, ...args: any[]): any { return this.visitVisitable(v, ...args); }
    visitFuncCall(v: FuncCall, ...args: any[]): any { return this.visitVisitable(v, ...args); }

    protected visitVisitable(v: Visitable, ...args: any[]): any {
        throw new Error(`visit ${v.constructor['name']} not implemented`);
    }
}

export interface Visitable {
    accept(v: Visitor, ...args: any[]): any;
    acceptForChildren(v: Visitor, ...args: any[]): any;
    code: Code;
}

export class ASTItem {
    public code: Code = null;
}

export abstract class BinOpBase extends ASTItem {
    constructor(public right: BinOp) {
        super();
    }

    accept(visitor: Visitor, ...args: any[]): any {
        return this.getVisitMethod(visitor).apply(visitor, [this].concat(args));
    }

    acceptForChildren(v: Visitor, ...args: any[]): any {
        return this.right.accept(v, ...args);
    }

    abstract getVisitMethod(visitor: Visitor): Function;
}

export class AddOp extends BinOpBase implements Visitable {
    getVisitMethod(visitor: Visitor): Function { return visitor.visitAddOp; }
}


export class SubOp extends BinOpBase implements Visitable {
    getVisitMethod(visitor: Visitor): Function { return visitor.visitSubOp; }
}

export class DivideOp extends BinOpBase implements Visitable {
    getVisitMethod(visitor: Visitor): Function { return visitor.visitDivideOp; }
}

export class MultOp extends BinOpBase implements Visitable {
    getVisitMethod(visitor: Visitor): Function { return visitor.visitMultOp; }
}

export class AndOp extends BinOpBase implements Visitable {
    constructor(public not: boolean, right: BinOp) { super(right); }
    getVisitMethod(visitor: Visitor): Function { return visitor.visitAndOp; }
}

export class OrOp extends BinOpBase implements Visitable {
    constructor(public not: boolean, right: BinOp) { super(right); }
    getVisitMethod(visitor: Visitor): Function { return visitor.visitOrOp; }
}

export type BinOp = AddOp | SubOp | DivideOp | MultOp | OrOp | AndOp;

export class BinOpNode extends ASTItem implements Visitable {
    constructor(public left: any, public ops: BinOp[]) { super(); }
    accept(visitor: Visitor, ...args: any[]): any {
        return visitor.visitBinOpNode.apply(visitor, [this].concat(args));
    }

    acceptForChildren(v: Visitor, ...args: any[]): any {
        this.left.accept(v, ...args);
        this.ops.forEach((op) => op.accept(v, ...args));
    }
}

export class NotOp extends ASTItem implements Visitable {
    constructor(public val: Visitable) {
        super();
    }

    accept(visitor: Visitor, ...args: any[]): any {
        return visitor.visitNotOp(this, ...args);
    }

    acceptForChildren(visitor: Visitor, ...args: any[]): any {
        return this.val.accept(visitor, ...args);
    }
}

export class Literal extends ASTItem implements Visitable {
    constructor(public val: string|number|boolean) { super(); }
    accept(visitor: Visitor, ...args: any[]): any {
        return visitor.visitLiteral.apply(visitor, [this].concat(args));
    }

    acceptForChildren(v: Visitor, ...args: any[]): any { }
}

export class BareWord extends ASTItem implements Visitable {
    constructor(public bare: string) { super(); }
    accept(visitor: Visitor, ...args: any[]): any {
        return visitor.visitBareWord.apply(visitor, [this].concat(args));
    }

    acceptForChildren(v: Visitor, ...args: any[]): any { }
}

export class UnaryMinus extends ASTItem implements Visitable {
    constructor(public val: Visitable) { super(); }
    accept(visitor: Visitor, ...args: any[]): any {
        return visitor.visitUnaryMinus.apply(visitor, [this].concat(args));
    }

    acceptForChildren(v: Visitor, ...args: any[]): any {
        return this.val.accept(v, ...args);
    }
}

export class SyntaxError extends ASTItem implements Visitable {
    constructor() { super(); }
    accept(visitor: Visitor, ...args: any[]): any {
        return visitor.visitSyntaxError.apply(visitor, [this].concat(args));
    }

    acceptForChildren(visitor: Visitor, ...args: any[]): any {
        return undefined;
    }
}
export class Ref extends ASTItem implements Visitable {
    constructor(public name: any) { super(); }
    accept(visitor: Visitor, ...args: any[]): any {
        return visitor.visitRef.apply(visitor, [this].concat(args));
    }

    acceptForChildren(v: Visitor, ...args: any[]): any { }
}

export class CompoundExpression extends ASTItem implements Visitable {
    constructor(public parts: Visitable[]) {
        super();
        this.code = parts.length > 0 ? parts[0].code : null;
    }

    accept(visitor: Visitor, ...args: any[]): any {
        return visitor.visitCompoundExpression.apply(visitor, [this].concat(args));
    }

    acceptForChildren(v: Visitor, ...args: any[]): any {
        this.parts.forEach((part) => part.accept(v, ...args));
    }
}

export class FuncArg extends ASTItem implements Visitable {
    constructor(public body: Visitable) { super(); }

    accept(visitor: Visitor, ...args: any[]): any {
        return visitor.visitFuncArg.apply(visitor, [this].concat(args));
    }

    acceptForChildren(v: Visitor, ...args: any[]): any {
        this.body.accept(v, ...args);
    }
}

export class HangingCall extends ASTItem implements Visitable {
    public body: CompoundExpression;

    constructor(public name: string, public args: FuncArg[]) { super(); }
    accept(visitor: Visitor, ...args: any[]): any {
        return visitor.visitHangingCall.apply(visitor, [this].concat(args));
    }

    acceptForArgs(v: Visitor, ...args: any[]): any {
        this.args.forEach((arg) => arg.accept(v, ...args));
    }

    acceptForChildren(v: Visitor, ...args: any[]): any {
        this.acceptForArgs(v, ...args);
        this.body.accept(v, ...args);
    }
}

export class FuncCall extends ASTItem implements Visitable {
    constructor(public name: string, public args: FuncArg[]) { super(); }
    accept(visitor: Visitor, ...args: any[]): any {
        return visitor.visitFuncCall.apply(visitor, [this].concat(args));
    }

    acceptForChildren(v: Visitor, ...args: any[]): any {
        this.args.forEach((arg) => arg.accept(v, ...args));
    }
}
