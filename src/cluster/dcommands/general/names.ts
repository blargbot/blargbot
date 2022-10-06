import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType, pluralise as p } from '@blargbot/cluster/utils';
import { EmbedOptions, User } from 'eris';
import moment from 'moment-timezone';

export class NamesCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `names`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: `{user:user+?}`,
                    description: `Returns the names that I've seen the specified user have in the past 30 days.`,
                    execute: (ctx, [user], flags) => this.listNames(ctx, user.asOptionalUser ?? ctx.author, flags.a !== undefined, flags.v !== undefined)
                },
                {
                    parameters: `remove {names+?}`,
                    description: `Removes the names ive seen you use in the past 30 days`,
                    execute: (ctx, [names]) => this.removeNames(ctx, names.asOptionalString)
                }
            ],
            flags: [
                { flag: `a`, word: `all`, description: `Gets all the names.` },
                { flag: `v`, word: `verbose`, description: `Gets more information about the retrieved names.` }
            ]
        });
    }

    public async listNames(context: CommandContext, user: User, all: boolean, detailed: boolean): Promise<EmbedOptions | string> {
        let usernames = await context.database.users.getUsernames(user.id);
        if (usernames === undefined || usernames.length === 0)
            return this.info(`I havent seen any usernames for ${user.mention} yet!`);

        const embed: EmbedOptions = {
            author: context.util.embedifyAuthor(user),
            title: `Historical usernames`
        };

        if (!all) {
            const cutoff = moment().add(-30, `days`);
            embed.description += `Since <t:${cutoff.unix()}>`;
            usernames = usernames.filter(u => moment(u.date).isAfter(cutoff));

            if (usernames.length === 0)
                return this.info(`I havent seen ${user.mention} change their username since <t:${cutoff.unix()}>!`);
        }

        embed.description = detailed
            ? usernames.map(u => `${u.name} - <t:${moment(u.date).unix()}:R>`).join(`\n`)
            : usernames.map(u => u.name).join(`\n`);

        return embed;
    }

    public async removeNames(context: CommandContext, names: string | undefined): Promise<string> {
        let usernames = await context.database.users.getUsernames(context.author.id);
        if (usernames === undefined || usernames.length === 0)
            return this.info(`You dont have any usernames to remove!`);

        const nameLookup = names?.toLowerCase();
        usernames = nameLookup === undefined ? usernames : usernames.filter(u => nameLookup.includes(u.name.toLowerCase()));

        if (usernames.length === 0)
            return this.error(`I couldnt find any of the usernames you gave!`);

        const countStr = nameLookup === undefined ? `**all usernames**` : `${usernames.length} ${p(usernames.length, `username`)}`;
        const confirmed = await context.util.queryConfirm({
            context: context.channel,
            actors: context.author,
            prompt: this.warning(`Are you sure you want to remove ${countStr}`),
            confirm: `Yes`,
            cancel: `No`,
            fallback: false
        });

        if (!confirmed)
            return this.success(`I wont remove any usernames then!`);

        await context.database.users.removeUsernames(context.author.id, nameLookup === undefined ? `all` : usernames.map(u => u.name));
        return this.success(`Successfully removed ${countStr}!`);
    }
}
