const CommandArgs = require('./CommandArgs');

class Context {
    constructor(client, msg, text) {
        this.client = client;
        this.msg = msg;
        this.text = text;
        this.words = new CommandArgs(this.text);
    }

    async send(content, file) {
        return await this.client.Helpers.Message.send(this, content, file);
    }

    async decode(key, args) {
        return await this.client.Helpers.Message.decode(this, key, args);
    }

    async decodeAndSend(key, args, file) {
        return await this.client.Helpers.Message.decodeAndSend(this, key, args, file);
    }

    get channel() {
        return this.msg.channel;
    }

    get author() {
        return this.msg.author;
    }

    get guild() {
        return this.msg.guild;
    }

}

module.exports = Context;