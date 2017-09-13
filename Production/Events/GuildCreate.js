const { Event } = require('../../Core/Structures');

class GuildCreate extends Event {
    constructor(client) {
        super(client, 'guildCreate');
    }

    async execute(guild) {
        // temp stuff
        let storedGuild = await this.client.models.WhitelistedGuild.find({ where: { id: guild.id } });
        if (storedGuild === null) {
            await guild.defaultChannel.createMessage(`This guild is not whitelisted, so I'm leaving. Please contact \`stupid cat#8160\` to get whitelisted.`);
            await guild.leave();
            return;
        }
        // end temp stuff

        this.client.sender.send('guildCreate', guild.id);
    }
}

module.exports = GuildCreate;