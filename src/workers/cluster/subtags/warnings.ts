import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import { User } from 'discord.js';

export class WarningsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'warnings',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['user?'],
                    description: 'Gets the number of warnings `user` has. `user` defaults to the user who executed the containing tag.',
                    exampleCode: 'You have {warnings} warning(s)!',
                    exampleOut: 'You have 0 warning(s)!',
                    execute: async (context, [{ value: userStr }], subtag) => {
                        let user: User | undefined = context.user;

                        if (userStr !== '') {
                            user = await context.queryUser(userStr);
                        }
                        if (user === undefined)
                            return this.noUserFound(context, subtag);

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
