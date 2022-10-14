import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';
import { User } from 'eris';
import moment from 'moment-timezone';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.names;

export class NamesCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `names`,
            category: CommandType.GENERAL,
            flags: [
                { flag: `a`, word: `all`, description: cmd.flags.all },
                { flag: `v`, word: `verbose`, description: cmd.flags.verbose }
            ],
            definitions: [
                {
                    parameters: `{user:user+?}`,
                    description: cmd.list.description,
                    execute: (ctx, [user], flags) => this.listNames(ctx, user.asOptionalUser ?? ctx.author, flags.a !== undefined, flags.v !== undefined)
                },
                {
                    parameters: `remove {names+?}`,
                    description: cmd.remove.description,
                    execute: (ctx, [names]) => this.removeNames(ctx, names.asOptionalString)
                }
            ]
        });
    }

    public async listNames(context: CommandContext, user: User, all: boolean, detailed: boolean): Promise<CommandResult> {
        let usernames = await context.database.users.getUsernames(user.id);
        if (usernames === undefined || usernames.length === 0)
            return cmd.list.none.ever({ user });

        const cutoff = moment().add(-30, `days`);
        if (!all)
            usernames = usernames.filter(u => moment(u.date).isAfter(cutoff));
        const data = usernames.map(u => ({ name: u.name, time: moment(u.date) }));

        return {
            embeds: [
                {
                    author: context.util.embedifyAuthor(user),
                    title: cmd.list.embed.title,
                    description: cmd.list.embed.description[all ? `ever` : `since`][detailed ? `detailed` : `simple`]({ from: cutoff, usernames: data })
                }
            ]
        };
    }

    public async removeNames(context: CommandContext, names: string | undefined): Promise<CommandResult> {
        let usernames = await context.database.users.getUsernames(context.author.id);
        if (usernames === undefined || usernames.length === 0)
            return cmd.remove.none;

        const nameLookup = names?.toLowerCase();
        usernames = nameLookup === undefined ? usernames : usernames.filter(u => nameLookup.includes(u.name.toLowerCase()));

        if (usernames.length === 0)
            return cmd.remove.notFound;

        const confirmed = await context.queryConfirm({
            prompt: nameLookup === undefined
                ? cmd.remove.confirm.prompt.all
                : cmd.remove.confirm.prompt.some({ count: usernames.length }),
            continue: cmd.remove.confirm.continue,
            cancel: cmd.remove.confirm.cancel,
            fallback: false
        });

        if (!confirmed)
            return cmd.remove.cancelled;

        await context.database.users.removeUsernames(context.author.id, nameLookup === undefined ? `all` : usernames.map(u => u.name));
        return nameLookup === undefined
            ? cmd.remove.success.all
            : cmd.remove.success.some({ count: usernames.length });
    }
}
