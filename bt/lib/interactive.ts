
import {Evaluator} from "./evaluator";
import {EventEmitter} from "./events";
import * as syntax from "./syntax" ;

/**
 * @class InteractiveEvaluator
 * @description BackTalk evaluator that provides control and information of how
 *      code is run.
 * @extends Evaluator
 */
export class InteractiveEvaluator extends Evaluator {
  private events: EventEmitter;

  private currentLine: number = 0;

  constructor() {
    super();
    this.events = new EventEmitter([
      'line-changed'
    ]);
  }

  eval(node: syntax.Visitable): any {
    this.currentLine = -1;
    return node.accept(this);
  }

  /**
   * Start listening to an event.
   * @method InteractiveEvaluator#on
   * @param  {string}   name [event name]
   * @param  {Function} f [callback function]
   */
  on(name:string, f: Function) {
    return this.events.on(name, f);
  }

  private nextCode(c: syntax.Code) {
    if (c.lineNumber != -1 && c.lineNumber != this.currentLine) {
      this.currentLine = c.lineNumber;
      this.events.emit('line-changed', this, this.currentLine);
    }
  }

  public visitAddOp(a: syntax.AddOp, left): any {
    this.nextCode(a.code);
    return super.visitAddOp(a, left);
  }

  public visitSubOp(a: syntax.SubOp, left): any {
    this.nextCode(a.code);
    return super.visitSubOp(a, left);
  }

  public visitDivideOp(a: syntax.DivideOp, left): any {
    this.nextCode(a.code);
    return super.visitDivideOp(a, left);
  }

  public visitMultOp(a: syntax.MultOp, left): any {
    this.nextCode(a.code);
    return super.visitMultOp(a, left);
  }

  public visitBinOpNode(a: syntax.BinOpNode, ...args): any {
    this.nextCode(a.code);
    return super.visitBinOpNode(a, ...args);
  }

  public visitLiteral(a: syntax.Literal): any {
    this.nextCode(a.code);
    return super.visitLiteral(a);
  }

  public visitBareWord(a: syntax.BareWord): any {
    this.nextCode(a.code);
    return super.visitBareWord(a);
  }

  public visitUnaryMinus(a: syntax.UnaryMinus): any {
    this.nextCode(a.code);
    return super.visitUnaryMinus(a);
  }

  public visitCompoundExpression(a: syntax.CompoundExpression): any {
    this.nextCode(a.code);
    return super.visitCompoundExpression(a);
  }

  public visitFuncCall(a: syntax.FuncCall): any {
    this.nextCode(a.code);
    return super.visitFuncCall(a);
  }

  public visitRef(a: syntax.Ref) {
    this.nextCode(a.code);
    return super.visitRef(a);
  }
}



 /**
  *  @event InteractiveEvaluator#line-changed
  *  @description emitted when a new line is reached
  *  @arg line {number} the line number
  */
