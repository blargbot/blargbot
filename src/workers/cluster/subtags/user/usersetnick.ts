import { BaseSubtag } from '@cluster/bbtag';
import { UserNotFoundError } from '@cluster/bbtag/errors';
import { discordUtil, SubtagType } from '@cluster/utils';
import { User } from 'discord.js';

export class UserSetNickSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'usersetnick',
            category: SubtagType.USER,
            aliases: ['setnick'],
            definition: [
                {
                    parameters: ['nick', 'user?'],
                    description: 'Sets `user`\'s nickname to `nick`. Leave `nick` blank to reset their nickname.',
                    exampleCode: '{usersetnick;super cool nickname}\n{//;Reset the the nickname}\n{usersetnick;}',
                    exampleOut: '', //TODO meaningful output
                    execute: async (context, [nick, userStr], subtag): Promise<string | void> => {
                        let user: User | undefined = context.user;
                        if (userStr.value !== '') {
                            user = await context.queryUser(userStr.value);
                        }

                        if (user === undefined)
                            throw new UserNotFoundError(userStr.value);

                        const member = await context.util.getMember(context.guild, user.id);

                        try {
                            if (user.id === context.discord.user.id)
                                await member?.setNickname(nick.value);
                            else {
                                const fullReason = discordUtil.formatAuditReason(context.user, context.scopes.local.reason);
                                await member?.setNickname(nick.value, fullReason);
                            }
                        } catch (err: unknown) {
                            if (err instanceof Error) {
                                this.customError('Could not change nickname', context, subtag);
                            }
                        }
                    }
                }
            ]
        });
    }
}
