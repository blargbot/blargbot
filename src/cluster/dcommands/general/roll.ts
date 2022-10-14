import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType, guard, parse, randChoose, randInt, repeat } from '@blargbot/cluster/utils';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.roll;
export class RollCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `roll`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: `{dice=1d20} {modifier:integer?} {details+?}`,
                    description: cmd.default.description,
                    execute: (ctx, [dice, modifier, details]) => this.rollDice(ctx, dice.asString, modifier.asOptionalInteger, details.asOptionalString)
                }
            ]
        });
    }

    public rollDice(context: CommandContext, dice: string, modifier = 0, details?: string): CommandResult {
        switch (dice.toLowerCase()) {
            case `cat`: return {
                embeds: [{
                    author: context.util.embedifyAuthor(context.author),
                    image: { url: randChoose(cats) }
                }]
            };
            case `rick`: return {
                embeds: [{
                    author: context.util.embedifyAuthor(context.author),
                    image: { url: randChoose(ricks) }
                }]
            };
            case `character`: return {
                embeds: [{
                    author: context.util.embedifyAuthor(context.author),
                    description: cmd.default.character.embed.description({
                        stats: repeat(6, id => {
                            const rolls = repeat(4, () => randInt(1, 6));
                            const total = rolls.reduce((p, c) => p + c, 0);
                            const min = Math.min(...rolls);
                            return { id, rolls, total, min, result: total - min };
                        })
                    })
                }]
            };
        }

        const match = /^(\d+) ?d ?(\d+)$/.exec(dice);
        if (match === null || match.length !== 3)
            return cmd.default.diceInvalid({ dice });
        const rollCount = parse.int(match[1], { strict: true });
        const faceCount = parse.int(match[2], { strict: true });

        if (rollCount === undefined || rollCount < 1 || faceCount === undefined || faceCount < 2)
            return cmd.default.diceInvalid({ dice });

        if (rollCount > maxRolls || faceCount > maxFaces)
            return cmd.default.tooBig({ maxRolls, maxFaces });

        const rolls = repeat(rollCount, () => randInt(1, faceCount));
        const subtotal = rolls.reduce((p, c) => p + c, 0);
        const total = subtotal + modifier;
        const modifierText = modifier === 0 ? undefined
            : cmd.default.embed.description.modifier({ total: subtotal, sign: modifier < 0 ? `-` : `+`, modifier: Math.abs(modifier) });

        let natText = undefined;

        if (faceCount === 20 && rollCount === 1) {
            const key = `natural${rolls[0]}` as const;
            if (guard.hasProperty(cmd.default.embed.description, key))
                natText = cmd.default.embed.description[key];
        }

        return {
            embeds: [
                {
                    author: context.util.embedifyAuthor(context.author),
                    title: cmd.default.embed.title({ faces: faceCount, rolls: rollCount }),
                    description: cmd.default.embed.description.layout({
                        rolls,
                        total,
                        details,
                        modifier: modifierText,
                        natural: natText
                    })
                }
            ]
        };
    }
}

const maxFaces = 2000;
const maxRolls = 100;

const cats = [
    `http://gifrific.com/wp-content/uploads/2013/06/Cat-Rolls-In-A-Ball.gif`,
    `https://media.giphy.com/media/4LTGEdPBPjA10eKu1Dby/giphy.gif`,
    `https://media.giphy.com/media/yOQFhJjH31dUQ/giphy.gif`
];

const ricks = [
    `https://media.giphy.com/media/5kq0GCjHA8Rwc/giphy.gif`,
    `https://giphy.com/gifs/rick-astley-Ju7l5y9osyymQ`,
    `https://tenor.com/Eszv.gif`
];
