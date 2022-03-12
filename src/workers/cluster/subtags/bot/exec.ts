import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { bbtag, humanize, SubtagType } from '@cluster/utils';

export class ExecSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'exec',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['tag', 'args*'],
                    description: 'Executes another `tag`, giving it `args` as the input. Useful for modules.' +
                        '\n`{exec}` executes `tag` as if `tag`\'s code was in the root tag/ccommand.',
                    exampleCode: 'Let me do a tag for you. {exec;f}',
                    exampleOut: 'Let me do a tag for you. User#1111 has paid their respects. Total respects given: 5',
                    returns: 'string',
                    execute: (ctx, [tag, ...args]) => this.execTag(ctx, tag.value, args.map(a => a.value))
                }
            ]
        });
    }

    public async execTag(context: BBTagContext, name: string, args: string[]): Promise<string> {
        const tagName = name.toLowerCase();
        const tag = await context.getTag('tag', tagName, (key) => context.database.tags.get(key));

        if (tag === null)
            throw new BBTagRuntimeError('Tag not found: ' + tagName);

        return await context.withStack(() => context.withScope(true, () => context.withChild({
            tagName,
            cooldown: tag.cooldown ?? 0,
            inputRaw: humanize.smartSplit.inverse(args)
        }, async context => {
            const ast = bbtag.parse(tag.content, true);
            return await context.engine.eval(ast, context);
        })));
    }
}
