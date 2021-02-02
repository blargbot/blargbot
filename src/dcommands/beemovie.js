const BaseCommand = require('../structures/BaseCommand');

const beemovie = require('../../res/beemovie.json');

class BeeMovieCommand extends BaseCommand {
    constructor() {
        super({
            name: 'beemovie',
            category: bu.CommandType.GENERAL,
            usage: '',
            info: 'Gives a quote from the Bee Movie.',
            flags: [{
                flag: 'n',
                word: 'name',
                desc: 'Shows the name of the character the quote is from, if applicable.'
            },
            {
                flag: 'c',
                word: 'only-characters',
                desc: 'Only give quotes from actual characters (no stage directions).'
            }]
        });

        this.lines = beemovie.filter(l => l.type !== 2);
        this.characterLines = beemovie.filter(l => l.type === 0);
    }

    async execute(msg, words, text) {
        const input = bu.parseInput(this.flags, words);
        const lines = input.c ? this.characterLines : this.lines;
        const { content, actor } = lines[Math.floor(Math.random() * lines.length)];

        let output = [`<${config.discord.emotes.beemovie}> `];
        if (input.n && actor) output.push(`**${actor}**\n`);
        output.push(content);

        await bu.send(msg, output.join(''));
    }
}

module.exports = BeeMovieCommand;
