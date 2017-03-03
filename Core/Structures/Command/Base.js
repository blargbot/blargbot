class BaseCommand {
    constructor(options) {
        if (this.constructor === BaseCommand) {
            throw new Error("Can't instantiate an abstract class!");
        }
        this.hidden = options.hidden || false;
        this.usage = options.usage || '';
        this.info = options.info || '';
        this.name = options.name || this.constructor.name;
    }

    get webInfo() {
        let paragraphs = this.info.replace(/\n+/g, '\n').split('\n');
        let output;
        for (const line of paragraphs) {

        }
    }

    async execute(msg, words) {

    }

    async event(params) {

    }

    async send(msg, content, file) {
        await _client.Helpers.Message.send(msg, content, file);
    }

    async canExecute(msg) {
        return true;
    }
}

module.exports = BaseCommand;