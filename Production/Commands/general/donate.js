const { GeneralCommand } = require('../../../Core/Structures/Command');

class DonateCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'donate',
            keys: {
                message: '.message',
                willdm: '.willdm'
            }
        });
    }

    async execute(ctx) {
        await ctx.decodeAndSend(this.keys.willdm);
        let pc = await ctx.author.getDMChannel();
        await this.decodeAndSend(pc, this.keys.message);
    }
}

module.exports = DonateCommand;