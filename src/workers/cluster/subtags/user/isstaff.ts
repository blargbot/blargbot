import { Cluster } from '@cluster';
import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class IsStaffSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super({
            name: 'isstaff',
            aliases: ['ismod'],
            category: SubtagType.API,
            definition: [
                {
                    parameters: [],
                    description: 'Checks if the tag author is staff',
                    exampleCode: '{if;{isstaff};The author is a staff member!;The author is not a staff member :(}',
                    exampleOut: 'The author is a staff member!',
                    execute: async (context) => {
                        return (await context.isStaff).toString();
                    }
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Checks if `user` is a member of staff. ' +
                        'If the `user` cannot be found `false` will be returned.',
                    exampleCode: '{if;{isstaff;{userid}};You are a staff member!;You are not a staff member :(}',
                    exampleOut: 'You are not a staff member :(',
                    execute: async (context, args) => {
                        const user = await context.queryUser(args[0].value, { noLookup: args[1].value !== '' });

                        if (user === undefined) return false.toString();

                        return (await cluster.util.isUserStaff(user.id, context.guild.id)).toString();
                    }
                }
            ]
        });
    }
}
