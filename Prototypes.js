const { DataUser, DataGuild } = require('./Core/Structures/Data');

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
    data: {
        get: function getDatabaseEntry() {
            if (this.storedData == undefined) this.storedData = new DataUser(this.id);
            return this.storedData;
        }
    }
});

/**
 * Defining prototypes for Guild
 */

Object.defineProperties(_dep.Eris.Guild.prototype, {
    data: {
        get: function getDatabaseEntry() {
            if (this.storedData == undefined) this.storedData = new DataGuild(this.id);
            return this.storedData;
        }
    },
    botMember: {
        get: function () {
            return this.members.get(this.shard.client.user.id);
        }
    }
});