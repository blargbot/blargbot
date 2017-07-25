const { ImageCommand } = require('../../../Core/Structures/Command');
const superagent = require('superagent');

class CatCommand extends ImageCommand {
    constructor(client) {
        super(client, {
            name: 'cat'
        });
    }

    async execute(ctx) {
        let res1 = await superagent.get('http://random.cat/meow');

        await ctx.send({
            embed: {
                color: this.client.Helpers.Random.randInt(0x000000, 0xffffff),
                image: {
                    url: res1.body.file
                }
            }
        });
    }
}

module.exports = CatCommand;