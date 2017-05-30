const { DataUser, DataGuild } = require('./Core/Structures/Data');
const Eris = require('eris');

module.exports = function (client) {
    /**
     * Defining prototypes for Message
     */

    Object.defineProperty(Eris.Message.prototype, "guild", {
        get: function guild() {
            return this.channel.guild;
        }
    });

    /**
     * Defining prototypes for User
     */

    Object.defineProperties(Eris.User.prototype, {
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
                if (this.storedData == undefined) this.storedData = new DataUser(client, this.id, this);
                return this.storedData;
            }
        }
    });

    /**
     * Defining prototypes for Guild
     */

    Object.defineProperties(Eris.Guild.prototype, {
        data: {
            get: function getDatabaseEntry() {
                if (this.storedData == undefined) this.storedData = new DataGuild(client, this.id, this);
                return this.storedData;
            }
        },
        botMember: {
            get: function () {
                return this.members.get(this.shard.client.user.id);
            }
        }
    });
};

