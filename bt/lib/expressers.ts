export interface Expresser {
    express(result: any);
    finish();
}

export class DoNothingExpresser implements Expresser {
    express() {
    }

    finish() {
    }
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

export class StateMachineExpresser<T extends Expresser> implements Expresser {
    constructor(public state: T = null) {
    }

    setState(state: T) {
        this.state = state;
    }

    express(current: any) {
        this.state.express(current);
    }

    finish() {
        this.state.finish();
    }
}
