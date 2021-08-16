import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType } from '@cluster/utils';
import { MessageEmbedOptions, MessageOptions, User } from 'discord.js';
import moment from 'moment-timezone';

export class NamesCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'names',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{user:user+?}',
                    description: 'Returns the names that I\'ve seen the specified user have in the past 30 days.',
                    execute: (ctx, [user], flags) => this.listNames(ctx, user ?? ctx.author, flags.a !== undefined, flags.v !== undefined)
                },
                {
                    parameters: 'remove {names+?}',
                    description: 'Removes the names ive seen you use in the past 30 days',
                    execute: (ctx, [names]) => this.removeNames(ctx, names)
                }
            ],
            flags: [
                { flag: 'a', word: 'all', description: 'Gets all the names.' },
                { flag: 'v', word: 'verbose', description: 'Gets more information about the retrieved names.' }
            ]
        });
    }

    public async listNames(context: CommandContext, user: User, all: boolean, detailed: boolean): Promise<MessageOptions | string> {
        let usernames = await context.database.users.getUsernames(user.id);
        if (usernames === undefined || usernames.length === 0)
            return this.info(`I havent seen any usernames for ${user.toString()} yet!`);

        const embed: MessageEmbedOptions = {
            author: context.util.embedifyAuthor(user),
            title: 'Historical usernames'
        };

        if (!all) {
            const cutoff = moment().add(-30, 'days');
            embed.description += `Since <t:${cutoff.unix()}>`;
            usernames = usernames.filter(u => moment(u.date).isAfter(cutoff));

            if (usernames.length === 0)
                return this.info(`I havent seen ${user.toString()} change their username since <t:${cutoff.unix()}>!`);
        }

        embed.description = detailed
            ? usernames.map(u => `${u.name} - <t:${moment(u.date).unix()}:R>`).join('\n')
            : usernames.map(u => u.name).join('\n');

        return { embeds: [embed] };
    }

    public async removeNames(context: CommandContext, names: string): Promise<string> {
        let usernames = await context.database.users.getUsernames(context.author.id);
        if (usernames === undefined || usernames.length === 0)
            return this.info('You dont have any usernames to remove!');

        const nameLookup = names.toLowerCase();
        usernames = names.length === 0 ? usernames : usernames.filter(u => nameLookup.includes(u.name.toLowerCase()));

        if (usernames.length === 0)
            return this.error('I couldnt find any of the usernames you gave!');

        const countStr = names.length === 0 ? '**all usernames**' : `${usernames.length} username${usernames.length === 1 ? '' : 's'}`;
        if (!await context.util.queryConfirm(context.channel, context.author, this.warning(`Are you sure you want to remove ${countStr}`), 'Yes', 'No'))
            return this.success('I wont remove any usernames then!');

        await context.database.users.removeUsernames(context.author.id, names.length === 0 ? 'all' : usernames.map(u => u.name));
        return this.success(`Successfully removed ${countStr}!`);
    }
}
