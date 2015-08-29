import {FuncResult} from './functions';

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
  public result: FuncResult = new FuncResult();

  express(current: any) {
    this.interimResult = current;
  }

  finish() {
    this.result.set(this.interimResult);
  }
}

export class ConsoleExpresser implements Expresser {
  express(current: any) {
    console.log(current);
  }

  finish() {
  }
}
