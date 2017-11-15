const { DataTag } = require('./Data');

class PublicTag {
  constructor(client, name) {
    this.client;
    this.data = new DataTag(name);
  }

  async execute(original = true) {
    if (original) await this.data.incrementUses();
  }

}