class Logger {
    constructor() {
        console.log('Shard:', process.env.SHARD_ID);
        this.master = process.env.SHARD_ID === -1;
    }
}

module.exports = Logger;