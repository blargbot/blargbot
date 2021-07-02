import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType, BBTagContext } from '../core';

export class RoleColorSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'rolecolor',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns `role`\'s hex color code. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.',
                    exampleCode: 'The admin role color is: #{rolecolor;admin}.',
                    exampleOut: 'The admin role ID is: #1b1b1b.',
                    execute: (ctx, args) => this.getRoleHexColor(ctx, args.map(arg => arg.value))
                }
            ]
        });
    }

    public async getRoleHexColor(
        context: BBTagContext,
        args: string[]
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        const role = await context.getRole(args[0], {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
        });

        if (role) {
            return role.color.toString(16).padStart(6, '0');
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}