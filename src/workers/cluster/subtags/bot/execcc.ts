import { Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class ExecccSubtag extends Subtag {
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
                    execute: async (context, args) => {
                        const tagName = args[0].value.toLowerCase();
                        const ccommand = await context.getCached('cc_' + tagName as `cc_${string}`, async (key) => context.database.guilds.getCommand(context.guild.id, key));

                        if (ccommand === null)
                            throw new BBTagRuntimeError('CCommand not found: ' + tagName);
                        if ('alias' in ccommand)
                            throw new BBTagRuntimeError('Cannot execcc imported tag: ' + tagName);

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
                            cooldown: ccommand.cooldown ?? 0,
                            inputRaw: input
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
            ]
        });
    }
}
