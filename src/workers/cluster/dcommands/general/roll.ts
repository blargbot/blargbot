import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { codeBlock, CommandType, parse, pluralise as p, randChoose, randInt, repeat } from '@cluster/utils';
import { EmbedOptions } from 'eris';

export class RollCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'roll',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{dice=1d20} {modifier:integer?}',
                    description: 'Rolls the dice you tell it to, and adds the modifier',
                    execute: (ctx, [dice, modifier]) => this.rollDice(ctx, dice.asString, modifier.asOptionalInteger)
                }
            ]
        });
    }

    public rollDice(context: CommandContext, dice: string, modifier?: number): EmbedOptions | string {
        switch (dice.toLowerCase()) {
            case 'cat': return {
                author: context.util.embedifyAuthor(context.author),
                image: { url: randChoose(cats) }
            };
            case 'rick': return {
                author: context.util.embedifyAuthor(context.author),
                image: { url: randChoose(ricks) }
            };
            case 'character': return {
                author: context.util.embedifyAuthor(context.author),
                description: codeBlock(repeat(6, i => {
                    const rolls = repeat(4, () => randInt(1, 6));
                    const total = rolls.reduce((p, c) => p + c, 0);
                    const min = Math.min(...rolls);
                    return `Stat #${i} - [ ${rolls.join(', ')} ] > ${total.toString().padStart(2, ' ')} - ${min} > ${(total - min).toString().padStart(2, ' ')}`;
                }).join('\n'), 'xl')
            };
        }

        const match = /^(\d+) ?d ?(\d+)$/.exec(dice);
        if (match === null || match.length !== 3)
            return this.error(`\`${dice}\` is not a valid dice!`);
        const rollCount = parse.int(match[1]);
        const faceCount = parse.int(match[2]);

        if (isNaN(rollCount) || rollCount < 1 || isNaN(faceCount) || faceCount < 2)
            return this.error(`\`${dice}\` is not a valid dice!`);

        if (rollCount > maxRolls || faceCount > maxFaces)
            return this.error(`Youre limited to ${maxRolls} of a d${maxFaces}`);

        const rolls = repeat(rollCount, () => randInt(1, faceCount));
        const total = rolls.reduce((p, c) => p + c, 0) + (modifier ?? 0);
        const modifierText = modifier === undefined || modifier === 0 ? '' : modifier < 0
            ? `**Modifier**: ${total + modifier} - ${-modifier}\n`
            : `**Modifier**: ${total - modifier} + ${modifier}\n`;

        let natText = '';

        switch (rolls[0]) {
            case 1:
                if (rollCount === 1 && faceCount === 20)
                    natText = codeBlock('- Natural 1...', 'diff');
                break;
            case 20:
                if (rollCount === 1 && faceCount === 20)
                    natText = codeBlock('+ NATURAL 20', 'diff');
                break;
        }

        return {
            author: context.util.embedifyAuthor(context.author),
            title: `🎲 ${rollCount} ${p(rollCount, 'roll')} of a ${faceCount} sided dice:`,
            description: `${rolls.join(', ')}\n${modifierText}**Total**: ${total}${natText}`
        };
    }
}

const maxFaces = 2000;
const maxRolls = 100;

const cats = [
    'http://gifrific.com/wp-content/uploads/2013/06/Cat-Rolls-In-A-Ball.gif',
    'https://media.giphy.com/media/4LTGEdPBPjA10eKu1Dby/giphy.gif',
    'https://media.giphy.com/media/yOQFhJjH31dUQ/giphy.gif'
];

const ricks = [
    'https://media.giphy.com/media/5kq0GCjHA8Rwc/giphy.gif',
    'https://giphy.com/gifs/rick-astley-Ju7l5y9osyymQ',
    'https://tenor.com/Eszv.gif'
];
