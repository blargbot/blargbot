import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class ExecccSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'execcc',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['ccommand', 'args*'],
                    description: 'Executes another `ccommand`, giving it `args` as the input. Useful for modules.' +
                        '\n`{exec}` executes `ccommand` as if `ccommand`\'s code was in the root ccommand.',
                    exampleCode: 'Let me do a ccommand for you. {execcc;f}',
                    exampleOut: 'Let me do a ccommand for you. User#1111 has paid their respects. Total respects given: 5',
                    returns: 'string',
                    execute: (ctx, [ccommand, ...args]) => this.execCustomCommand(ctx, ccommand.value, args.map(a => a.value))
                }
            ]
        });
    }

    public async execCustomCommand(context: BBTagContext, name: string, args: string[]): Promise<string> {
        const tagName = name.toLowerCase();
        const ccommand = await context.getTag('cc', tagName, (key) => context.database.guilds.getCommand(context.guild.id, key));

        if (ccommand === null)
            throw new BBTagRuntimeError('CCommand not found: ' + tagName);
        if ('alias' in ccommand)
            throw new BBTagRuntimeError('Cannot execcc imported tag: ' + tagName);

        return await context.withStack(() => context.withScope(true, () => context.withChild({
            tagName,
            cooldown: ccommand.cooldown ?? 0,
            inputRaw: args.map(a => `"${a}"`).join(' ')
        }, async context => {
            const ast = bbtagUtil.parse(ccommand.content, true);
            return await context.engine.eval(ast, context);
        })));
    }
}
