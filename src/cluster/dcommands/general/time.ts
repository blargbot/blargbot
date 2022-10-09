import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';
import { User } from 'eris';
import moment from 'moment-timezone';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.time;

export class TimeCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `time`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: ``,
                    description: cmd.self.description,
                    execute: (ctx) => this.getUserTime(ctx, ctx.author)
                },
                {
                    parameters: `{user:user+}`,
                    description: cmd.user.description,
                    execute: (ctx, [user]) => this.getUserTime(ctx, user.asUser)
                },
                {
                    parameters: `in {timezone}`,
                    description: cmd.timezone.description,
                    execute: (_, [timezone]) => this.getTime(timezone.asString)
                },
                {
                    parameters: `{timezone1} {timezone2} {time+}`,
                    description: cmd.convert.description,
                    execute: (_, [from, to, time]) => this.changeTimezone(time.asString, from.asString, to.asString)
                }
            ]
        });
    }

    public async getUserTime(context: CommandContext, user: User): Promise<CommandResult> {
        const timezone = await context.database.users.getSetting(user.id, `timezone`);
        if (timezone === undefined)
            return `❌ ${user.mention} has not set their timezone with the \`${context.prefix}timezone\` command yet.`;

        const now = moment().tz(timezone);
        if (now.zoneAbbr() === ``)
            return `❌ ${user.mention} doesnt have a valid timezone set. They need to update it with the \`${context.prefix}timezone\` command`;

        return `ℹ️ It is currently **${now.format(`LT`)}** for **${user.mention}**.`;
    }

    public getTime(timezone: string): CommandResult {
        const now = moment().tz(timezone);
        if (now.zoneAbbr() === ``)
            return `❌ \`${timezone}\` is not a valid timezone! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.`;

        return `ℹ️ In **${now.zoneAbbr()}**, it is currently **${now.format(`LT`)}**`;
    }

    public changeTimezone(time: string, from: string, to: string): CommandResult {
        const source = moment.tz(time, [`hh:mma`, `HH:mm`], true, from);
        const dest = source.clone().tz(to);

        if (source.zoneAbbr() === ``)
            return `❌ \`${from}\` is not a valid timezone! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.`;
        if (dest.zoneAbbr() === ``)
            return `❌ \`${to}\` is not a valid timezone! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.`;
        if (!dest.isValid() || !source.isValid())
            return `❌ \`${time}\` is not a valid time! Please use the 12 or 24 hour format, e.g. 1:32pm or 13:32`;
        return `ℹ️ When it's **${source.format(`LT`)}** in **${source.zoneAbbr()}**, it's **${dest.format(`LT`)}** in **${dest.zoneAbbr()}**.`;
    }
}
