import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext } from '../core/bbtag';
import { SubtagType } from '../utils';

export class UserIsBotSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'userisbot',
            category: SubtagType.API,
            aliases: ['userbot'],
            definition: [
                {
                    parameters: [],
                    description: 'Returns whether the executing user is a bot.',
                    exampleCode: 'Are you a bot? {userisbot}',
                    exampleOut: 'Are you a bot? false',
                    execute: (ctx) => ctx.user.bot.toString()
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns whether a `user` is a bot. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Is Stupid cat a bot? {userisbot;Stupid cat}',
                    exampleOut: 'Stupid cat\'s username is Stupid cat!',
                    execute: (ctx, args) => this.getUserIsBot(ctx, args.map(arg => arg.value))
                }
            ]
        });
    }

    public async getUserIsBot(
        context: BBTagContext,
        args: string[]
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        const user = await context.getUser(args[0], {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
        });

        if (user) {
            return user.bot.toString();
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}