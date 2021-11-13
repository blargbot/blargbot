import { Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class ExecSubtag extends Subtag {
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
                    execute: async (context, args) => {
                        const tagName = args[0].value.toLowerCase();
                        const tag = await context.getCached('tag_' + tagName as `tag_${string}`, (key) => context.database.tags.get(key));

                        if (tag === null)
                            throw new BBTagRuntimeError('Tag not found: ' + tagName);
                        let input: string;
                        switch (args.length) {
                            case 1:
                                input = '';
                                break;
                            case 2:
                                input = args[1].value;
                                break;
                            default:
                                input = '"' + args.slice(1).map(arg => arg.value).join('" "') + '"';
                        }
                        const childContext = context.makeChild({
                            tagName,
                            cooldown: tag.cooldown ?? 0,
                            inputRaw: input
                        });

                        context.scopes.pushScope(true);
                        try {
                            const result = await context.engine.execute(tag.content, childContext);
                            return result.content;
                        } finally {
                            context.errors.push(...childContext.errors);
                            context.scopes.popScope();
                        }
                    }
                }
            ]
        });
    }
}
