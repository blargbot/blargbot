class Command {
    constructor(options) {
        if (this.constructor === Command) {
            throw new Error("Can't instantiate an abstract class!");
        }
        this.hidden = options.hidden || false;
        this.usage = options.usage || '';
        this.info = options.info || '';
        this.longinfo = options.longinfo || '';
    }

    async execute(msg, words) {

    }

    async event(params) {

    }

    async canExecute(msg) {
        return true;
    }
}