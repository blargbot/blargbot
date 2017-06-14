class TagError extends Error {
    constructor(key, args) {
        super('Generic Tag Error');
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.key = key;
        this.args = args;
        this.decoded = null;
    }

    setDecoded(msg) {
        this.decoded = msg;
    }
}

module.exports = TagError;