import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType, randChoose } from '@cluster/utils';
import script from '@res/beemovie.json';

const scriptMap = script.reduce<{ characterLines: typeof script; allLines: typeof script; }>((a, l) => {
    if (l.type !== 2)
        a.allLines.push(l);
    if (l.type === 0)
        a.characterLines.push(l);
    return a;
}, { characterLines: [], allLines: [] });

export class BeemovieCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'beemovie',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: 'Gives a quote from the Bee Movie.',
                    execute: (ctx, _, flags) => this.getQuote(ctx, flags.n !== undefined, flags.c !== undefined)
                }
            ],
            flags: [
                { flag: 'n', word: 'name', description: 'Shows the name of the character the quote is from, if applicable.' },
                { flag: 'c', word: 'only-characters', description: 'Only give quotes from actual characters (no stage directions).' }
            ]
        });
    }

    public getQuote(context: CommandContext, showName: boolean, charactersOnly: boolean): string {
        const lines = scriptMap[charactersOnly ? 'characterLines' : 'allLines'];
        const line = randChoose(lines);

        if (showName && line.actor !== undefined)
            return `${context.config.discord.emotes.beemovie} **${line.actor}**\n${line.content}`;
        return `${context.config.discord.emotes.beemovie} ${line.content}`;
    }
}
