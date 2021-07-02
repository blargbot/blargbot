import { Role } from 'eris';
import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType, BBTagContext } from '../core';

export class RolesSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'roles',
            category: SubtagType.API,
            definition: [
                {
                    parameters: [],
                    description: 'Returns an array of roles on the current guild.',
                    exampleCode: 'The roles on this guild are: {roles}.',
                    exampleOut: 'The roles on this guild are: ["11111111111111111","22222222222222222"].',
                    execute: (ctx) => this.getGuildRoles(ctx)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns `user`\'s roles in the current guild. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat has the roles: {roles;Stupid cat}',
                    exampleOut: 'Stupid cat has the roles: ["11111111111111111","22222222222222222"]',
                    execute: (ctx, args) => this.getUserRoles(ctx, args.map(arg => arg.value))
                }
            ]
        });
    }

    public getGuildRoles(
        context: BBTagContext
    ): string {
        let roles = context.guild.roles.map(r => r);
        roles = roles.sort((a, b) => b.position - a.position);
        return JSON.stringify(roles.map(r => r.id));
    }

    public async getUserRoles(
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
            if (member) {
                const guildRoles = context.guild.roles.reduce((o: Record<string, Role>, role) => {
                    o[role.id] = role;
                    return o;
                }, {});
                const roles = member.roles.map(r => guildRoles[r]);
                return JSON.stringify(roles.sort((a, b) => b.position - a.position).map(r => r.id));
            }
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}