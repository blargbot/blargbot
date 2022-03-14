import { BaseGlobalCommand, CommandContext } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';
import { User } from 'eris';
import moment from 'moment-timezone';

export class TimezoneCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'timezone',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: 'Gets your current timezone',
                    execute: (ctx) => this.getTimezone(ctx, ctx.author)
                },
                {
                    parameters: '{timezone}',
                    description: 'Sets your current timezone',
                    execute: (ctx, [timezone]) => this.setTimezone(ctx, ctx.author, timezone.asString)
                }
            ]
        });
    }

    public async getTimezone(context: CommandContext, user: User): Promise<string> {
        const timezone = await context.database.users.getSetting(user.id, 'timezone');
        if (timezone === undefined)
            return this.info('You haven\'t set a timezone yet.');

        const zone = moment().tz(timezone);
        if (zone.zoneAbbr() === '')
            return this.warning(`Your stored timezone code is \`${timezone}\`, which isnt valid! Please update it when possible.`);

        return this.info(`Your stored timezone code is \`${timezone}\`, which is equivalent to ${zone.format('z (Z)')}.`);
    }

    public async setTimezone(context: CommandContext, user: User, timezone: string): Promise<string> {
        const zone = moment().tz(timezone);
        if (zone.zoneAbbr() === '')
            return this.error(`\`${timezone}\` is not a valid timezone! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.`);

        await context.database.users.setSetting(user.id, 'timezone', timezone);
        return this.success(`Ok, your timezone code is now set to \`${timezone}\`, which is equivalent to ${zone.format('z (Z)')}.`);
    }
}
