const DataBase = require('./DataBase');
const DataTag = require('./DataTag');

class DataCustomCommand extends DataBase {
  constructor(client, id, guildId) {
    super(client, id, client.models.GuildCustomCommand);
    this.guildId = guildId;
    this.guild = this.client.getDataGuild(guildId);

  }

  get template() {
    return {
      commandName: this.id,
      guildId: this.guildId,
      content: '',
      lastUsed: Date.now(),
      variables: {},
      roles: [],
      desc: null,
      usage: null,
      authorId: 0,
      locked: false
    };
  }

  async reloadObject() {
    if (this.object === null) this.object = await this.model.findOne({ where: { commandName: this.id, guildId: this.guildId } });
    else this.object = await this.object.reload();
  }

  async getAuthor() {
    return await this.getKey('author');
  }

  async setAuthor(id) {
    return await this.setKey('author', id);
  }

  async getContent() {
    return await this.getKey('content');
  }

  async rename(id) {
    id = DataTag.stripTitle(id);
    let obj = await this.getObject(id);
    obj.set('commandName', id);
    await obj.save();
    this.id = id;
    return obj;
  }

  async setContent(content) {
    return await this.setObject({
      content,
      lastmodified: Date.now()
    });
  }

  async getVariable(name) {
    return (await this.getKey(`variables`) || {})[name];
  }

  async setVariable(name, value) {
    return await this.setKey(`variables.${name}`, value);
  }

  async getUsage() {
    return await this.getKey('usage');
  }

  async setUsage(value) {
    this.setKey('usage', value);
  }

  async getDesc() {
    return await this.getKey('desc');
  }

  async setDesc(value) {
    return await this.setKey('desc', value);
  }
}

module.exports = DataCustomCommand;