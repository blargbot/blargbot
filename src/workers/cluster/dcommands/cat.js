const BaseCommand = require('../structures/BaseCommand');
const Wolken = require('wolken');
const newbutils = require('../newbu');

class CatCommand extends BaseCommand {
    constructor(cluster) {
        super({
            name: 'cat',
            category: newbutils.commandTypes.IMAGE,
            usage: 'cat',
            info: 'Gets a picture of a cat.'
        });

        this.wolken = new Wolken(cluster.config.wolke, 'Wolke', 'blargbot/6.0.0');
    }

    async execute(msg, words, text) {
        let res = await this.wolken.getRandom({ type: 'animal_cat', allowNSFW: false });
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
