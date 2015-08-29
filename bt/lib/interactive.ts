
import {Evaluator} from "./evaluator";
import {EventEmitter} from "./events";
import * as syntax from "./syntax" ;
import * as VM from "./vm";

/**
 *  CodeRange ties instructions to lines
 */
export class CodeRange {
    constructor(public start: number, public count:number, public code: syntax.Code) {}

    includes(i: number): boolean {
      return (this.start <= i && i <= this.start + this.count);
    }
}

/**
 * SourceInfoCompiler creates debugging info while compiling an AST
 */
export class SourceInfoCompiler extends VM.Compiler {
  ranges: CodeRange[] = [];

  push(i: VM.Instructions.Instruction, code: syntax.Code) {
    super.push(i, code);

    if (this.ranges.length == 0) {
      this.ranges.push(new CodeRange(0, 1, code))
      return;
    }

    // -1's are considered as part of the next line we see
    let current = this.ranges[this.ranges.length - 1];
    if (current.code.lineNumber == -1) {
      current.code = code;
    }

    if (current.code.lineNumber == code.lineNumber) {
      current.count++;
    } else {
      this.ranges.push(new CodeRange(current.start + current.count, 1, code));
    }
  }
};

export class InteractiveVM extends VM.VM {
  events: EventEmitter;

  constructor(instructions: VM.Instructions.Instruction[],
            evaluator: Evaluator,
            expresser: VM.Expresser = new VM.ConsoleExpresser()) {
    super(instructions, evaluator, expresser);
    this.events = new EventEmitter(['ready']);
  }

  isReady(): boolean {
    return !this.waiting;
  }

  step(): number {
    this.instructions[this.ip++].execute(this, this.evaluator);
    return this.ip;
  }

  resume() {
    this.waiting = false;
    if (this.isFinished()) {
      this.finish();
    }

    this.events.emitAsync('ready', this, this.ip);
  }
};

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

  evalExpressions(node: syntax.Visitable, expresser: VM.Expresser): void {
    this.body = node;
    let compiler = new SourceInfoCompiler();
    node.accept(compiler);

    let vm = new InteractiveVM(compiler.instructions, this, expresser);

    let codeRangeIndex = 0;
    this.events.emit('line-changed', this, compiler.ranges[codeRangeIndex].code.lineNumber);

    let step = () => {
      if (vm.isFinished()) {
        return;
      }

      if (!compiler.ranges[codeRangeIndex].includes(vm.step())) {
        codeRangeIndex++;
        this.events.emit('line-changed', this, compiler.ranges[codeRangeIndex].code.lineNumber);
      }

      // trigger a "ready" event manually
      if (vm.isReady()) {
        vm.wait();
        vm.resume();
      }
    }

    vm.events.on("ready", step);
    vm.resume();
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
}



 /**
  *  @event InteractiveEvaluator#line-changed
  *  @description emitted when a new line is reached
  *  @arg line {number} the line number
  */
