import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType, BBTagContext } from '../core';

export class RoleNameSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'rolename',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns `role`\'s name. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admin role name is: {rolename;admin}.',
                    exampleOut: 'The admin role name is: Adminstrator.',
                    execute: (ctx, args) => this.getRoleName(ctx, args.map(arg => arg.value))
                }
            ]
        });
    }

    public async getRoleName(
        context: BBTagContext,
        args: string[]
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        const role = await context.getRole(args[0], {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
        });

        if (role) {
            return role.name;
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}