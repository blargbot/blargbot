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
    fullNameEscaped: {
      get: function fullName() {
        return `${this.username}#${this.discriminator}`.replace(/(_|\*|`|~|\\)/g, '\\$1');
      }
    },
    fullNameId: {
      get: function fullNameId() {
        return `${this.username}#${this.discriminator} (${this.id})`;
      }
    },
    fullNameIdEscaped: {
      get: function fullNameId() {
        return `${this.username}#${this.discriminator} (${this.id})`.replace(/(_|\*|`|~|\\)/g, '\\$1');
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
   * Defining prototypes for Member
   */

  Object.defineProperties(Eris.Member.prototype, {
    position: {
      get: function getMemberPosition() {
        let { guild, roles } = this;
        roles = roles.map(r => {
          return guild.roles.get(r).position;
        });
        roles.sort((a, b) => b - a);
        return roles[0];
      }
    },
    color: {
      get: function getMemberColor() {
        let { guild, roles } = this;
        roles = roles.map(r => guild.roles.get(r)).filter(r => r.color > 0);
        if (roles.length === 0) return 0;
        roles.sort((a, b) => b.position - a.position);
        return roles[0].color;
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
