import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';
import { guard } from '@blargbot/core/utils';
import { literal } from '@blargbot/domain/messages/types';
import moment from 'moment-timezone';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.info;

export class InfoCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `info`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: ``,
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
                            value: cmd.default.embed.field.patron.value({ patrons: context.cluster.contributors.patrons }),
                            inline: true
                        },
                        {
                            name: cmd.default.embed.field.donator.name,
                            value: cmd.default.embed.field.donator.value({ donators: context.cluster.contributors.donators }),
                            inline: true
                        },
                        {
                            name: cmd.default.embed.field.other.name,
                            value: cmd.default.embed.field.other.value.layout({
                                details: context.cluster.contributors.others.map(x => {
                                    const decorator = guard.hasProperty(cmd.default.embed.field.other.value.decorators, x.decorator)
                                        ? cmd.default.embed.field.other.value.decorators[x.decorator]
                                        : cmd.default.embed.field.other.value.decorators.amazing;
                                    const reason = guard.hasProperty(cmd.default.embed.field.other.value.reasons, x.reason)
                                        ? cmd.default.embed.field.other.value.reasons[x.reason]
                                        : cmd.default.embed.field.other.value.reasons.unknown;

                                    return decorator({ user: x.user, reason: reason });
                                })
                            })
                        },
                        {
                            name: literal(`\u200b`),
                            value: cmd.default.embed.field.details.value({ prefix: context.prefix })
                        }
                    ]
                }
            ]
        };
    }
}
