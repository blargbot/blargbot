const { DataTag, DataCustomCommand } = require('./Data');
const SubTag = require('./SubTag');
const TagError = require('./TagError');

class TagContext {
    constructor(client, params = {}, data) {
        this.client = client;
        this.ctx = params.ctx;
        this.guild = this.ctx.guild;
        this.channel = this.ctx.channel;
        this.user = this.ctx.author;

        this.content = params.content;
        this.fallback = null;

        this.author = params.author;
        this.name = params.name;

        this.isCustomCommand = params.isCustomCommand || data instanceof DataCustomCommand || false;
        this.terminate = false;
        this.isStaff = false;

        this.result = '';

        this.data = data;

        this.totalLoops = 0;
        this.totalExecs = 0;
        this.totalTimers = 0;
        this.tempArgs = {};

        this.vars = {};
    }

    async decode(key, args) {
        return await this.client.Helpers.Message.decode(this.channel, key, args);
    }

    get msg() {
        return this.ctx.msg;
    }

    get words() {
        return this.ctx.words;
    }

    async process() {
        try {
            this.rawContent = this.content || await this.data.getContent();
            this.lexedContent = await this.client.TagLexer.parse(this.rawContent);
            this.result = await this.processSub(this.lexedContent);
            return this.result;
        } catch (err) {
            if (err instanceof TagError) {
                return 'Parsing Error: ' + await this.decode(err.key, err.args);
            } else {
                throw err;
            }
        }
    }

    async processSub(elemMap) {
        const oldFallback = this.fallback;
        let content = "";
        for (const element of elemMap) {
            if (this.terminate) break;
            try {
                if (element instanceof SubTag) {
                    let name = element.name;
                    if (Array.isArray(name)) {
                        name = await this.processSub(name);
                    }
                    if (this.client.TagManager.has(name)) {
                        const res = await this.client.TagManager.execute(name, this, element.args);
                        if (res.terminate) this.terminate = true;
                        if (res.replace) {
                            if (res.replaceTarget) {
                                content.replace(res.replaceTarget, res.content);
                            } else {
                                content = res.content;
                            }
                        } else {
                            content += res.content;
                        }
                    } else {
                        throw new TagError(this.client.Constants.TagError.TAG_NOT_FOUND, { tag: name });
                    }
                } else if (Array.isArray(element)) {
                    content += await this.processSub(element);
                } else content += element;
            } catch (err) {
                if (err instanceof TagError) {
                    if (err.decoded === '') content += ''; // TODO: redo, messy
                    if (err.decoded !== null) content += this.fallback || `\`${err.decoded}\``;
                    else content += this.fallback || `\`${await this.decode(err.key, err.args)} [${element.rowIndex}:${element.columnIndex}]\``;
                } else {
                    throw err;
                }
            }
        }
        this.fallback = oldFallback;
        return content;
    }
}

module.exports = TagContext;