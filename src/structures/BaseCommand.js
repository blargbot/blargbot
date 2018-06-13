class BaseCommand {
    constructor(params = {}) {
        this.name = params.name || '';
        this.category = params.category || bu.CommandType.GENERAL;
        this.hidden = params.hidden || false;
        this.usage = params.usage || '';
        this.info = params.info || '';
        this.aliases = params.aliases || [];
        this.onlyOn = params.onlyOn || undefined;
        this.flags = params.flags || undefined;
        this.cannotDisable = params.cannotDisable || false;
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
