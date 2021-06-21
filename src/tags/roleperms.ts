import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext } from '../core/bbtag';
import { SubtagType } from '../utils';

export class RolePermsSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'roleperms',
            category: SubtagType.API,
            aliases: ['rolepermissions'],
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns `role`\'s permission number. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admin role\'s permissions are: {roleperms;admin}.',
                    exampleOut: 'The admin role\'s permissions are: 8.',
                    execute: (ctx, args) => this.getRolePerms(ctx, args.map(arg => arg.value))
                }
            ]
        });
    }

    public async getRolePerms(
        context: BBTagContext,
        args: string[]
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        const role = await context.getRole(args[0], {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
        });

        if (role) {
            return role.permissions.allow.toString();
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}