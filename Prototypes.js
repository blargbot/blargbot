/**
 * Defining prototypes for Message
 */

Object.defineProperty(_dep.Eris.Message.prototype, "guild", {
    get: function guild() {
        return this.channel.guild;
    }
});

/**
 * Defining prototypes for User
 */

Object.defineProperties(_dep.Eris.User.prototype, {
    fullName: {
        get: function fullName() {
            return `${this.username}#${this.discriminator}`;
        }
    },
    fullNameId: {
        get: function fullNameId() {
            return `${this.username}#${this.discriminator} (${this.id})`;
        }
    },
    database: {
        get: async function getDatabaseEntry() {
            return await _cache.User.get(this.id);
        }
    }
});
_dep.Eris.User.prototype.setDatabase = async function (data) {
    return await _cache.User.set(this.id, data);
};

/**
 * Defining prototypes for Guild
 */

Object.defineProperties(_dep.Eris.Guild.prototype, {
    database: {
        get: async function getDatabaseEntry() {
            return await _cache.Guild.get(this.id);
        }
    },
    botMember: {
        get: function () {
            return this.members.get(this.shard.client.user.id);
        }
    }
});
_dep.Eris.Guild.prototype.setDatabase = async function (data) {
    return await _cache.Guild.set(this.id, data);
};