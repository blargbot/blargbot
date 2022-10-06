import { humanize, parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import { BBTagRuntimeState } from '../../types';
import { bbtag, SubtagType } from '../../utils';

export class ExecccSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `execcc`,
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [`ccommand`, `args*`],
                    description: `Executes another \`ccommand\`, giving it \`args\` as the input. Useful for modules.\n\`{exec}\` executes \`ccommand\` as if \`ccommand\`'s code was in the root ccommand.`,
                    exampleCode: `Let me do a ccommand for you. {execcc;f}`,
                    exampleOut: `Let me do a ccommand for you. User#1111 has paid their respects. Total respects given: 5`,
                    returns: `string`,
                    execute: (ctx, [ccommand, ...args]) => this.execCustomCommand(ctx, ccommand.value, args.map(a => a.value))
                }
            ]
        });
    }

    public async execCustomCommand(context: BBTagContext, name: string, args: string[]): Promise<string> {
        const tagName = name.toLowerCase();
        const ccommand = await context.getTag(`cc`, tagName, (key) => context.database.guilds.getCommand(context.guild.id, key));

        if (ccommand === null)
            throw new BBTagRuntimeError(`CCommand not found: ${tagName}`);
        if (`alias` in ccommand)
            throw new BBTagRuntimeError(`Cannot execcc imported tag: ${tagName}`);

        let input = args[0] ?? ``;
        if (args.length > 1)
            input = humanize.smartSplit.inverse(bbtag.tagArray.flattenArray(args).map(x => parse.string(x)));

        return await context.withScope(true, () => context.withChild({
            tagName,
            cooldown: ccommand.cooldown ?? 0,
            inputRaw: input
        }, async context => {
            const result = await context.engine.execute(ccommand.content, context);
            if (context.data.state === BBTagRuntimeState.RETURN)
                context.data.state = BBTagRuntimeState.RUNNING;
            return result.content;
        }));
    }
}
