const { GeneralCommand } = require('../../Core/Structures/Command');
const superagent = require('superagent');

class CatCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'cat'
        });
    }

    async execute(ctx) {
        let res1 = await superagent.get('http://random.cat/meow');

        await ctx.send({
            embed: {
                color: this.client.Helpers.Random.getRandomInt(0x000000, 0xffffff),
                image: {
                    url: res1.body.file
                }
            }
        });
    }
}

module.exports = CatCommand;