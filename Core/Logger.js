class Logger {
    constructor() {
        console.log('Shard:', process.env.SHARD_ID);
    }
}

module.exports = Logger;