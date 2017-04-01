const { DataTag } = require('./Data');

class PublicTag {
    constructor(name) {
        this.data = new DataTag(name);
    }

    async execute(original = true) {
        if (original) await this.data.incrementUses();
    }

}