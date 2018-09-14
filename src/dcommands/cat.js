const BaseCommand = require('../structures/BaseCommand'),
    Wolken = require('wolken');

const wolken = new Wolken(config.wolke, 'Wolke', 'blargbot/6.0.0');

class CatCommand extends BaseCommand {
    constructor() {
        super({
            name: 'cat',
            category: bu.CommandType.IMAGE,
            usage: 'cat',
            info: 'Gets a picture of a cat.'
        });
    }

    async execute(msg, words, text) {
        let res = await wolken.getRandom({ type: 'animal_cat', allowNSFW: false });
        await bu.send(msg, {
            embed: {
                image: {
                    url: res.url
                },
                footer: {
                    text: 'Powered by weeb.sh'
                },
                color: bu.getRandomInt(0x1, 0xffffff)
            }
        });
    }
}

module.exports = CatCommand;
