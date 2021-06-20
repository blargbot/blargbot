import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext } from '../core/bbtag';
import { SubtagType } from '../utils';

export class UserNickSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'usernick',
            category: SubtagType.API,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the nickname of the executing user.',
                    exampleCode: 'Your nick is {usernick}!',
                    exampleOut: 'Your nick is Cool Dude 1337!',
                    execute: (ctx) => (ctx.member.nick || ctx.user.username).replace(/@/g, '@\u200b')
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns `user`\'s nickname. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat\'s nickname is {usernick;Stupid cat}!',
                    exampleOut: 'Stupid cat\'s nickname is Secretly Awoken',
                    execute: (ctx, args) => this.getUserNick(ctx, args.map(arg => arg.value))
                }
            ]
        });
    }

    public async getUserNick(
        context: BBTagContext,
        args: string[]
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        const user = await context.getUser(args[0], {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
        });

        if (user) {
            const member = context.guild.members.get(user.id);
            if (member)
                return (member.nick || user.username).replace(/@/g, '@\u200b');
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
