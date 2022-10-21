import { humanize, parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import templates from '../../text';
import { BBTagRuntimeState } from '../../types';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.exec;

export class ExecSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'exec',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['tag', 'args*'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [tag, ...args]) => this.execTag(ctx, tag.value, args.map(a => a.value))
                }
            ]
        });
    }

    public async execTag(context: BBTagContext, name: string, args: string[]): Promise<string> {
        const tagName = name;
        const tag = await context.getTag('tag', tagName, (key) => context.database.tags.get(key));

        if (tag === null)
            throw new BBTagRuntimeError(`Tag not found: ${tagName}`);

        let input = args[0] ?? '';
        if (args.length > 1)
            input = humanize.smartSplit.inverse(bbtag.tagArray.flattenArray(args).map(x => parse.string(x)));

        return await context.withScope(true, () => context.withChild({
            tagName,
            cooldown: tag.cooldown ?? 0,
            inputRaw: input
        }, async context => {
            const result = await context.engine.execute(tag.content, context);
            if (context.data.state === BBTagRuntimeState.RETURN)
                context.data.state = BBTagRuntimeState.RUNNING;
            return result.content;
        }));
    }
}
