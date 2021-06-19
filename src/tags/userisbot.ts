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
                    args: [],
                    description: 'Returns whether the executing user is a bot.',
                    exampleCode: 'Are you a bot? {userisbot}',
                    exampleOut: 'Are you a bot? false',
                    execute: (ctx) => ctx.user.username.replace(/@/g, '@\u200b')
                },
                {
                    args: ['user', 'quiet?'],
                    description: 'Returns whether a `user` is a bot. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Is Stupid cat a bot? {userisbot;Stupid cat}',
                    exampleOut: 'Stupid cat\'s username is Stupid cat!',
                    execute: (ctx, args) => this.getUserName(ctx, args.map(arg => arg.value))
                }
            ]
        });
    }

    public async getUserName(
        context: BBTagContext,
        args: string[]
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        const user = await context.getUser(args[0], {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
        });

        if (user) {
            return user.username.replace(/@/g, '@\u200b');
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('userisbot')
        .withAlias('userbot')
        .withArgs(a => [a.optional('user'), a.optional('quiet')])
        .withDesc('Returns whether a `user` is a bot. `user` defaults to the user who executed the containing tag. ' +
            'If `quiet` is specified, if `user` can\'t be found it will simply return nothing.')
        .withExample(
            'Are you a bot? {userisbot}',
            'Are you a bot? false'
        )
        .whenArgs('0-2', async function (subtag, context, args) {
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1],
                user = context.user;

            if (args[0])
                user = await context.getUser(args[0], {
                    quiet, suppress: context.scope.suppressLookup,
                    label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
                });

            if (user != null)
                return user.bot;

            if (quiet)
                return '';
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();