const DataBase = require('./DataBase');

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
    let stored = await this.getObject();
    // TODO: rename
    await this.setObject(stored);
  }

  async setContent(content) {
    return await this.setObject({
      content,
      lastmodified: Date.now()
    });
  }

  async getUses() {
    return await this.getKey('uses');
  }

  async setUses(uses) {
    return await this.setKey('uses', uses);
  }

  async incrementUses() {
    return await this.setObject({
      uses: (await this.getUses()) + 1,
      lastuse: Date.now()
    });
  }

  async getVariable(name) {
    return (await this.getKey(`variables`) || {})[name];
  }

  async setVariable(name, value) {
    return await this.setKey(`variables.${name}`, value);
  }

}

module.exports = DataCustomCommand;