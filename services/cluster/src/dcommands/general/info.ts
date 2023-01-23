import { CommandType } from '@blargbot/cluster/utils/index.js';
import type { IFormattable } from '@blargbot/formatting';
import { util } from '@blargbot/formatting';
import { hasProperty } from '@blargbot/guards';
import * as Eris from 'eris';
import moment from 'moment-timezone';

import type { CommandContext } from '../../command/index.js';
import { GlobalCommand } from '../../command/index.js';
import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.info;

export class InfoCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'info',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: cmd.default.description,
                    execute: (ctx) => this.showInfo(ctx)
                }
            ]
        });
    }
    public showInfo(context: CommandContext): CommandResult {
        if (context.cluster.contributors.patrons.length === 0)
            return cmd.default.notReady;

        const age = moment.duration(moment().diff(1444708800000));
        return {
            embeds: [
                {
                    author: context.util.embedifyAuthor(context.discord.user),
                    title: cmd.default.embed.title,
                    description: cmd.default.embed.description({ age }),
                    fields: [
                        {
                            name: cmd.default.embed.field.patron.name,
                            value: cmd.default.embed.field.patron.value({
                                patrons: context.cluster.contributors.patrons.map(template)
                            }),
                            inline: true
                        },
                        {
                            name: cmd.default.embed.field.donator.name,
                            value: cmd.default.embed.field.donator.value({
                                donators: context.cluster.contributors.donators.map(template)
                            }),
                            inline: true
                        },
                        {
                            name: cmd.default.embed.field.other.name,
                            value: cmd.default.embed.field.other.value.layout({
                                details: context.cluster.contributors.others.map(x => {
                                    const decorator = hasProperty(cmd.default.embed.field.other.value.decorators, x.decorator)
                                        ? cmd.default.embed.field.other.value.decorators[x.decorator]
                                        : cmd.default.embed.field.other.value.decorators.amazing;
                                    const reason = hasProperty(cmd.default.embed.field.other.value.reasons, x.reason)
                                        ? cmd.default.embed.field.other.value.reasons[x.reason]
                                        : cmd.default.embed.field.other.value.reasons.unknown;

                                    return decorator({ user: template(x.user), reason: reason });
                                })
                            })
                        },
                        {
                            name: util.literal('\u200b'),
                            value: cmd.default.embed.field.details.value({ prefix: context.prefix })
                        }
                    ]
                }
            ]
        };
    }
}

function template(value: Eris.User | IFormattable<string>): IFormattable<string> {
    return value instanceof Eris.User
        ? util.literal(value.mention)
        : value;
}
