import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';
import { User } from 'eris';
import moment from 'moment-timezone';

import { CommandResult } from '../../types';

export class TimezoneCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `timezone`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: ``,
                    description: `Gets your current timezone`,
                    execute: (ctx) => this.getTimezone(ctx, ctx.author)
                },
                {
                    parameters: `{timezone}`,
                    description: `Sets your current timezone. A list of [allowed timezones can be found on wikipedia](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List) under the \`TZ database name\` column`,
                    execute: (ctx, [timezone]) => this.setTimezone(ctx, ctx.author, timezone.asString)
                }
            ]
        });
    }

    public async getTimezone(context: CommandContext, user: User): Promise<CommandResult> {
        const timezone = await context.database.users.getSetting(user.id, `timezone`);
        if (timezone === undefined)
            return `ℹ️ You haven't set a timezone yet.`;

        const zone = moment().tz(timezone);
        if (zone.zoneAbbr() === ``)
            return `⚠️ Your stored timezone code is \`${timezone}\`, which isnt valid! Please update it when possible.`;

        return `ℹ️ Your stored timezone code is \`${timezone}\`, which is equivalent to ${zone.format(`z (Z)`)}.`;
    }

    public async setTimezone(context: CommandContext, user: User, timezone: string): Promise<CommandResult> {
        const zone = moment().tz(timezone);
        if (zone.zoneAbbr() === ``)
            return `❌ \`${timezone}\` is not a valid timezone! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.`;

        await context.database.users.setSetting(user.id, `timezone`, timezone);
        return `✅ Ok, your timezone code is now set to \`${timezone}\`, which is equivalent to ${zone.format(`z (Z)`)}.`;
    }
}
