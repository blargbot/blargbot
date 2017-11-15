class Cache {
  constructor(client, model, pk) {
    this.client = client;
    this.model = model;
    this.pk = pk;
    this._internalCache = {};

    this.registerChangeFeed();
  }

  async get(id) {
    if (!this._internalCache[id]) {
      this._internalCache[id] = await this.model.findById(id);
    }
    return this._internalCache[id];
  }

  async set(id, data) {
    await this.model.upsert(data);
    return this.get(id);
  }

  async rename(oldId, newId) {
    let stored = await this.get(oldId);
    let newStored = await this.get(newId);
    if (newStored != undefined) throw new Error('Entry already exists');
    await stored.set(this.pk, newId, { raw: true });
  }

  async remove(id) {
    delete this._internalCache[id];
    return await (await this.model.findById(id)).destroy({ force: true });
  }

  async registerChangeFeed() {
    // Deprecated, no longer using rethinkdb
    /*
    this._internalCache = {};
    try {
        this.changefeed = await _r.table(this.name).changes().run((err, cursor) => {
            if (err) { } // todo

            cursor.on('error', err => {
                // todo
            });

            cursor.on('data', data => {
                if (data.new_val) {
                    this._internalCache[data.new_val[this.pk || 'id']] = data.new_val;
                } else delete this._internalCache[data.old_val[this.pk || 'id']];
            });
        });
        this.changefeed.on('end', function () {
            setTimeout(this.registerChangeFeed, 10000);
        });
    } catch (err) {
        setTimeout(this.registerChangeFeed, 10000);
    }*/
  }
}

module.exports = Cache;