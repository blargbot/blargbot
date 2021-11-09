import { BaseSubtag } from '@cluster/bbtag';
import { UserNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';
import { User } from 'discord.js';

export class WarningsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'warnings',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: ['user?'],
                    description: 'Gets the number of warnings `user` has. `user` defaults to the user who executed the containing tag.',
                    exampleCode: 'You have {warnings} warning(s)!',
                    exampleOut: 'You have 0 warning(s)!',
                    execute: async (context, [userStr]) => {
                        let user: User | undefined = context.user;

                        if (userStr.value !== '') {
                            user = await context.queryUser(userStr.value);
                        }
                        if (user === undefined)
                            throw new UserNotFoundError(userStr.value);

                        const storedGuild = await context.database.guilds.get(context.guild.id);
                        if (storedGuild?.warnings !== undefined && storedGuild.warnings.users !== undefined && storedGuild.warnings.users[user.id] !== undefined)
                            return storedGuild.warnings.users[user.id]?.toString();
                        return '0';
                    }
                }
            ]
        });
    }
}
