import { CommandContext, GlobalCommand } from '../../command/index';
import { CommandType } from '@blargbot/cluster/utils';
import { User } from 'eris';
import moment from 'moment-timezone';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.time;

export class TimeCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'time',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: cmd.self.description,
                    execute: (ctx) => this.getUserTime(ctx, ctx.author)
                },
                {
                    parameters: '{user:user+}',
                    description: cmd.user.description,
                    execute: (ctx, [user]) => this.getUserTime(ctx, user.asUser)
                },
                {
                    parameters: 'in {timezone}',
                    description: cmd.timezone.description,
                    execute: (_, [timezone]) => this.getTime(timezone.asString)
                },
                {
                    parameters: '{timezone1} {timezone2} {time+}',
                    description: cmd.convert.description,
                    execute: (_, [from, to, time]) => this.changeTimezone(time.asString, from.asString, to.asString)
                }
            ]
        });
    }

    public async getUserTime(context: CommandContext, user: User): Promise<CommandResult> {
        const timezone = await context.database.users.getProp(user.id, 'timezone');
        if (timezone === undefined)
            return cmd.user.timezoneNotSet({ prefix: context.prefix, user });

        const now = moment().tz(timezone);
        if (now.zoneAbbr() === '')
            return cmd.user.timezoneInvalid({ prefix: context.prefix, user });

        return cmd.user.success({ now, user });
    }

    public getTime(timezone: string): CommandResult {
        const now = moment().tz(timezone);
        if (now.zoneAbbr() === '')
            return cmd.errors.timezoneInvalid({ timezone });

        return cmd.timezone.success({ now, timezone });
    }

    public changeTimezone(time: string, from: string, to: string): CommandResult {
        const source = moment.tz(time, ['hh:mma', 'HH:mm'], true, from);
        const dest = source.clone().tz(to);

        if (source.zoneAbbr() === '')
            return cmd.errors.timezoneInvalid({ timezone: from });
        if (dest.zoneAbbr() === '')
            return cmd.errors.timezoneInvalid({ timezone: to });
        if (!dest.isValid() || !source.isValid())
            return cmd.convert.invalidTime({ time });
        return cmd.convert.success({
            dest,
            source,
            destTimezone: dest.zoneAbbr(),
            sourceTimezone: source.zoneAbbr()
        });
    }
}
