import {FuncResult, FutureResult} from './functions';

export interface Expresser {
  express(result: any);
  finish();
}

export class StackExpresser implements Expresser {
  constructor(private frame: { push(any): void }) {
  }

  express(result: any) {
    this.frame.push(result);
  }

  finish() {
  }
}

export class ResultExpresser implements Expresser {
  private interimResult: any = null;

  public result: FuncResult;
  public future: FutureResult;

  constructor() {
      this.result = new FuncResult();
      this.future = this.result.beginAsync();
  }

  express(current: any) {
    this.interimResult = current;
  }

  finish() {
    this.future.set(this.interimResult);
  }
}

export class ConsoleExpresser implements Expresser {
  express(current: any) {
    console.log(current);
  }

  finish() {
  }
}
