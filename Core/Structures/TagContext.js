class TagContext {
    constructor(client, params) {
        this.client = client;
        this.ctx = params.ctx;
        this.content = params.content;
        this.fallback = '';
        this.author = params.author;
        this.name = params.name;
        this.isCustomCommand = params.ccommand || false;
        this.terminate = false;
        this.isStaff = false;

        this.totalLoops = 0;
        this.totalExecs = 0;
        this.totalTimers = 0;
    }

    get msg() {
        return this.ctx.msg;
    }

    get words() {
        return this.ctx.words;
    }

    async process() {

    }

    async processTag() {

    }
}