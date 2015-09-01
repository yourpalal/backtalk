
import {Evaluator} from "./evaluator";
import {EventEmitter} from "./events";
import * as AST from "./parser/ast" ;
import * as VM from "./vm";

/**
 *  CodeRange ties instructions to lines
 */
export class CodeRange {
    constructor(public start: number, public count:number, public code: AST.Code) {}

    includes(i: number): boolean {
      return (this.start <= i && i <= this.start + this.count);
    }
}

/**
 * SourceInfoCompiler creates debugging info while compiling an AST
 */
export class SourceInfoCompiler extends VM.Compiler {
  ranges: CodeRange[] = [];

  push(i: VM.Instructions.Instruction, code: AST.Code) {
    super.push(i, code);

    if (this.ranges.length == 0) {
      this.ranges.push(new CodeRange(0, 1, code))
      return;
    }

    let current = this.ranges[this.ranges.length - 1];
    if (current.code.lineNumber == code.lineNumber) {
      current.count++;
    } else {
      this.ranges.push(new CodeRange(current.start + current.count, 1, code));
    }
  }
};

export class InteractiveVM extends VM.VM {
  private events: EventEmitter;

  private broken: boolean = false;
  private codeRangeIndex: number = 0;

  constructor(instructions: VM.Instructions.Instruction[],
            private ranges: CodeRange[],
            evaluator: InteractiveEvaluator,
            expresser: VM.Expresser = new VM.ConsoleExpresser()) {
    super(instructions, evaluator, expresser);
    this.events = evaluator.events;
  }

  position(): AST.Code {
    return this.ranges[this.codeRangeIndex].code;
  }

  step() {
    this.instructions[this.ip++].execute(this, this.evaluator);
    if (this.isFinished()) {
      this.finish();
    }

    if (!this.ranges[this.codeRangeIndex].includes(this.ip)) {
      this.codeRangeIndex++;
      this.events.emit('line-changed', this.evaluator, this.position(), this);
    }
  }

  break() {
    this.broken = true;
  }

  continue() {
    this.broken = false;
    setTimeout(() => {
      while (!this.broken && !this.waiting && !this.isFinished()) {
        this.step();
      }
    }, 0);
  }

  // are we waiting for an async operation to complete?
  isReady(): boolean {
    return !this.waiting;
  }

  // async operation has completed
  resume() {
    this.waiting = false;
    if (!this.broken) {
      this.continue();
    }
  }
};

class BreakpointManager {
    private breakpoints: AST.Code[] = [];
    private lineChangedListener: {(code: AST.Code, vm: InteractiveVM): void};

    constructor(private evaluator: InteractiveEvaluator) {
      let self = this;
      this.lineChangedListener = function(code: AST.Code, vm: InteractiveVM) {
        // this is an evaluator
        self.onLineChanged(this, code, vm);
      };

      evaluator.on('line-changed', this.lineChangedListener);
    }

    add(breakpoint: AST.Code) {
      this.breakpoints.push(breakpoint);
    }

    hasMatchingBreakpoint(current: AST.Code): boolean {
      for (var bp of this.breakpoints) {
        if (current.lineNumber === bp.lineNumber && current.chunk === bp.chunk) {
          return true;
        }
      }
      return false;
    }

    onLineChanged(evaluator: InteractiveEvaluator, code: AST.Code, vm: InteractiveVM) {
      if (this.hasMatchingBreakpoint(code)) {
        vm.break();
        evaluator.events.emit('breakpoint-reached', evaluator, vm.position(), vm);
      }
    }
}

/**
 * @class InteractiveEvaluator
 * @description BackTalk evaluator that provides control and information of how
 *      code is run.
 * @extends Evaluator
 */
export class InteractiveEvaluator extends Evaluator {
  public breakpoints: BreakpointManager;
  public events: EventEmitter;

  constructor() {
    super();
    this.events = new EventEmitter([
      'line-changed',
      'breakpoint-reached'
    ]);
    this.breakpoints = new BreakpointManager(this);
  }

  evalExpressions(node: AST.Visitable, expresser: VM.Expresser): void {
    this.body = node;
    let compiler = new SourceInfoCompiler();
    node.accept(compiler);

    let vm = new InteractiveVM(compiler.instructions, compiler.ranges, this, expresser);
    this.events.emit('line-changed', this, vm.position(), vm);
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
