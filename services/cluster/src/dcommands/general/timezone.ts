import { CommandType } from '@blargbot/cluster/utils/index.js';
import type * as Eris from 'eris';
import moment from 'moment-timezone';

import type { CommandContext} from '../../command/index.js';
import { GlobalCommand } from '../../command/index.js';
import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.timeZone;

export class TimezoneCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'timezone',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: cmd.get.description,
                    execute: (ctx) => this.getTimezone(ctx, ctx.author)
                },
                {
                    parameters: '{timezone}',
                    description: cmd.set.description,
                    execute: (ctx, [timezone]) => this.setTimezone(ctx, ctx.author, timezone.asString)
                }
            ]
        });
    }

    public async getTimezone(context: CommandContext, user: Eris.User): Promise<CommandResult> {
        const timezone = await context.database.users.getProp(user.id, 'timezone');
        if (timezone === undefined)
            return cmd.get.notSet;

        const now = moment().tz(timezone);
        if (now.zoneAbbr() === '')
            return cmd.get.timezoneInvalid({ timezone });

        return cmd.get.success({ timezone, now });
    }

    public async setTimezone(context: CommandContext, user: Eris.User, timezone: string): Promise<CommandResult> {
        const now = moment().tz(timezone);
        if (now.zoneAbbr() === '')
            return cmd.set.timezoneInvalid({ timezone });

        await context.database.users.setProp(user.id, 'timezone', timezone);
        return cmd.set.success({ timezone, now });
    }
}