import { BaseGlobalCommand, CommandContext } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';
import { User } from 'eris';
import moment from 'moment';

export class TimeCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'time',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: 'Gets the time in your timezone',
                    execute: (ctx) => this.getUserTime(ctx, ctx.author)
                },
                {
                    parameters: '{user:user+}',
                    description: 'Gets the current time for the user',
                    execute: (ctx, [user]) => this.getUserTime(ctx, user.asUser)
                },
                {
                    parameters: '{timezone}',
                    description: 'Gets the current time in the timezone',
                    execute: (_, [timezone]) => this.getTime(timezone.asString)
                },
                {
                    parameters: '{timezone1} {timezone2} {time+}',
                    description: 'Converts a `time` from `timezone1` to `timezone2`',
                    execute: (_, [from, to, time]) => this.changeTimezone(time.asString, from.asString, to.asString)
                }
            ]
        });
    }

    public async getUserTime(context: CommandContext, user: User): Promise<string> {
        const timezone = await context.database.users.getSetting(user.id, 'timezone');
        if (timezone === undefined)
            return this.error(`${user.mention} has not set their timezone with the \`${context.prefix}timezone\` command yet.`);

        const now = moment().tz(timezone);
        if (now.zoneAbbr() === '')
            return this.error(`${user.mention} doesnt have a valid timezone set. They need to update it with the \`${context.prefix}timezone\` command`);

        return this.info(`It is currently **${now.format('LT')}** for **${user.mention}**.`);
    }

    public getTime(timezone: string): string {
        const now = moment().tz(timezone);
        if (now.zoneAbbr() === '')
            return this.error(`\`${timezone}\` is not a valid timezone! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.`);

        return this.info(`In **${now.zoneAbbr()}**, it is currently **${now.format('LT')}**`);
    }

    public changeTimezone(time: string, from: string, to: string): string {
        const source = moment.tz(time, ['hh:mma', 'HH:mm'], true, from);
        const dest = source.clone().tz(to);

        if (source.zoneAbbr() === '')
            return this.error(`\`${from}\` is not a valid timezone! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.`);
        if (dest.zoneAbbr() === '')
            return this.error(`\`${to}\` is not a valid timezone! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.`);
        if (!dest.isValid() || !source.isValid())
            return this.error(`\`${time}\` is not a valid time! Please use the 12 or 24 hour format, e.g. 1:32pm or 13:32`);
        return this.info(`When it's **${source.format('LT')}** in **${source.zoneAbbr()}**, it's **${dest.format('LT')}** in **${dest.zoneAbbr()}**.`);
    }
}
