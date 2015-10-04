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
    public result: any;
    private interim: any;
    private resolve: (any) => any;

    constructor() {
        this.result = new Promise((r) => this.resolve = r);
    }

    express(current: any) {
        this.interim = current;
    }

    finish() {
        this.resolve(this.interim);
        this.result = this.interim;
    }
}


export class ConsoleExpresser implements Expresser {
    express(current: any) {
        console.log(current);
    }

    finish() {
    }
}
