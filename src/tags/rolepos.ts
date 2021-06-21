import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext } from '../core/bbtag';
import { SubtagType } from '../utils';

export class RolePosSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'rolepos',
            category: SubtagType.API,
            aliases: ['roleposition'],
            definition: [
                {
                    parameters: ['role', 'quiet?'],
                    description: 'Returns the position of `role`. If `quiet` is specified, if `role` can\'t be found it will simply return nothing.\n**Note**: the highest role will have the highest position, and the lowest role will have the lowest position and therefore return `0` (`@everyone`).',
                    exampleCode: 'The position of Mayor is {rolepos;Mayor}',
                    exampleOut: 'The position of Mayor is 10',
                    execute: (ctx, args) => this.getRolePosition(ctx, args.map(arg => arg.value))
                }
            ]
        });
    }

    public async getRolePosition(
        context: BBTagContext,
        args: string[]
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        const role = await context.getRole(args[0], {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
        });

        if (role) {
            return role.position.toString();
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}