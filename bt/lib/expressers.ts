
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
  public result: any = null;

  express(current: any) {
    this.result = current;
  }

  finish() {}
}

export class ConsoleExpresser implements Expresser {
  express(current: any) {
    console.log(current);
  }

  finish() {
  }
}
