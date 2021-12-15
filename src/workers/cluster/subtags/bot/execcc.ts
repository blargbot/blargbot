import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

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
        const ccommand = await context.getCached('cc', tagName, async (key) => context.database.guilds.getCommand(context.guild.id, key));

        if (ccommand === null)
            throw new BBTagRuntimeError('CCommand not found: ' + tagName);
        if ('alias' in ccommand)
            throw new BBTagRuntimeError('Cannot execcc imported tag: ' + tagName);

        const childContext = context.makeChild({
            tagName,
            cooldown: ccommand.cooldown ?? 0,
            inputRaw: args.map(a => `"${a}"`).join(' ')
        });

        context.scopes.pushScope(true);
        try {
            const result = await context.engine.execute(ccommand.content, childContext);
            return result.content;
        } finally {
            context.errors.push(...childContext.errors);
            context.scopes.popScope();
        }
    }
}
