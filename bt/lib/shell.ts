import {Evaluator} from "./evaluator";
import {Immediate} from "./commands";

/** @module shell */

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

/** @class shell.Shell
 * @description Implements line-by-line processing, with simple heuristics that allow users
 * to input multiline statements one line at a time. Used in the backtalk repl.
 */
export class Shell {
    private processor: LineProcessor;
    private queue: string[] = [];
    public waiting = false;
    public multiline = false;

    constructor(public evaluator: Evaluator) {
        this.processor = null;
    }

    eval(source: string) {
        this.waiting = true;
        Immediate.resolve(this.evaluator.evalString(source)).then((val) => {
            this.resume();
        });
    }

    resume() {
        this.waiting = false;
        while (!this.waiting && this.queue.length > 0) {
            this.dequeueString();
        }
    }

    processLine(line: string) {
        this.queue.push(line);
        if (!this.waiting) {
            this.dequeueString();
        }
    }

    private dequeueString() {
        let line = this.queue.shift();
        let colon = line.match(/:\s*$/);

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
