import { BaseSubtag } from '@cluster/bbtag';
import { discordUtil, SubtagType } from '@cluster/utils';
import { User } from 'discord.js';

export class UserSetNickSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'usersetnick',
            category: SubtagType.API,
            aliases: ['setnick'],
            definition: [
                {
                    parameters: ['nick', 'user?'],
                    description: 'Sets `user`\'s nickname to `nick`. Leave `nick` blank to reset their nickname.',
                    exampleCode: '{usersetnick;super cool nickname}\n{//;Reset the the nickname}\n{usersetnick;}',
                    exampleOut: '', //TODO meaningful output
                    execute: async (context, [{ value: nick }, { value: userStr }], subtag): Promise<string | void> => {
                        let user: User | undefined = context.user;
                        if (userStr !== '') {
                            user = await context.queryUser(userStr);
                        }

                        if (user === undefined)
                            return this.noUserFound(context, subtag);

                        const member = await context.util.getMember(context.guild, user.id);

                        try {
                            if (user.id === context.discord.user.id)
                                await member?.setNickname(nick);
                            else {
                                const fullReason = discordUtil.formatAuditReason(context.user, context.scope.reason);
                                await member?.setNickname(nick, fullReason);
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
