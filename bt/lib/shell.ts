import {Evaluator} from "./evaluator";

interface LineProcessor {
  processLine(line: string);
}

class SingleLineProcesor implements LineProcessor {
  constructor(private shell: Shell) {
  }

  processLine(line: string): boolean {
    this.shell.eval(line);
    return true;
  }
}

class MultiLineProcessor implements LineProcessor {
  private lines: string[];

  constructor(private shell: Shell) {
    this.lines = [];
  }

  processLine(line: string): boolean {
    if (!line.match(/^\s*$/)) {
      this.lines.push(line);
      return false;
    }

    this.shell.eval(this.lines.join("\n"));
    return true;
  }
}

export class Shell {
  private processor: LineProcessor;
  public multiline = false;

  constructor(public evaluator: Evaluator) {
    this.processor = null;
  }

  eval(source: string) {
    this.evaluator.evalString(source);
  }

  processLine(line: string) {
    var colon = line.match(/:\s*$/);

    if (this.processor == null && colon) {
      this.multiline = true;
      this.processor = new MultiLineProcessor(this);
    } else if (this.processor == null && !colon) {
      this.multiline = false;
      this.processor = new SingleLineProcesor(this);
    }

    if (this.processor.processLine(line)) {
      this.processor = null;
      this.multiline = false;
    }
  }
}
