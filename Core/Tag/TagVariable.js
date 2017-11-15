class TagVariable {
  constructor(client) {
    this.client = client;
  }

  get prefix() {
    return false;
  }

  async get(ctx, name) {
    if (ctx.isCustomCommand) return await this._ccGet(ctx, name);
    else return await this._tagGet(ctx, name);
  }

  async set(ctx, name, value) {
    if (ctx.isCustomCommand) return await this._ccSet(ctx, name, value);
    else return await this._tagSet(ctx, name, value);
  }

  async _ccGet(ctx, name) {
    return await this._tagGet(ctx, name);
  }

  async _ccSet(ctx, name, value) {
    return await this._tagSet(ctx, name, value);
  }

  async _tagGet(ctx, name) {
    /* NO-OP */
  }

  async _tagSet(ctx, name, value) {
    /* NO-OP */
  }
}

module.exports = TagVariable;