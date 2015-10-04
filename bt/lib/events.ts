/**
 * @class EventEmitter
 * @description Very basic events support with listeners.
 */
export class EventEmitter {
    private listeners: { [s: string]: Function[] } = {};

    constructor(names: string[], private forwardTo: EventEmitter = null) {
        names.forEach((n: string) => this.listeners[n] = []);
    }

    /**
     * Start listening to an event.
     * @method EventEmitter#on
     * @param  {string}   name [event name]
     * @param  {Function} f [callback function]
     */
    on(name: string, f: Function) {
        this.listeners[name].push(f);
    }

    emit(name: string, thisArg: any, ...args) {
        this.listeners[name].forEach((l) => l.apply(thisArg, args));
        if (this.forwardTo !== null) {
            this.forwardTo.emit(name, thisArg, ...args);
        }
    }

    emitAsync(name: string, thisArg: any, ...args) {
        setTimeout(() => {
            this.listeners[name].forEach((l) => l.apply(thisArg, args));
        }, 0);

        if (this.forwardTo !== null) {
            this.forwardTo.emitAsync(name, thisArg, ...args);
        }
    }
}
