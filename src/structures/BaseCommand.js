class BaseCommand {
    constructor(params = {}) {
        this.category = params.category;
        this.hidden = params.hidden || false;
        this.usage = params.usage || '';
        this.info = params.info || '';
        this.aliases = params.aliases || [];
    }

    get isCommand() {
        return true;
    }

    get longinfo() {
        return this.info;
    }

    execute(msg, words, text) {

    }
}

module.exports = BaseCommand;