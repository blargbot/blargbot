import { humanize, parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import { BBTagRuntimeError } from '../../errors/index';
import templates from '../../text';
import { BBTagRuntimeState } from '../../types';
import { bbtag, SubtagType } from '../../utils/index';

const tag = templates.subtags.execCustomCommand;

export class ExecCustomCommandSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'execCustomCommand',
            aliases: ['execCC'],
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['name', 'args*'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [name, ...args]) => this.execCustomCommand(ctx, name.value, args.map(a => a.value))
                }
            ]
        });
    }

    public async execCustomCommand(context: BBTagContext, name: string, args: string[]): Promise<string> {
        const tagName = name.toLowerCase();
        const ccommand = await context.getTag('cc', tagName, (key) => context.database.guilds.getCommand(context.guild.id, key));

        if (ccommand === null)
            throw new BBTagRuntimeError(`CCommand not found: ${tagName}`);
        if ('alias' in ccommand)
            throw new BBTagRuntimeError(`Cannot execcc imported tag: ${tagName}`);

        let input = args[0] ?? '';
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
