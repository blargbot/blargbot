import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types.js';
import { CommandType } from '@blargbot/cluster/utils/index.js';

import { GuildCommand } from '../../command/index.js';
import templates from '../../text.js';

const cmd = templates.commands.reason;

export class ReasonCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'reason',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: '{caseId:integer?} {reason+}',
                    description: cmd.default.description,
                    execute: (ctx, [caseId, reason]) => this.setReason(ctx, caseId.asOptionalInteger, reason.asString)
                }
            ]
        });
    }

    public async setReason(context: GuildCommandContext, caseId: number | undefined, reason: string): Promise<CommandResult> {
        switch (await context.cluster.moderation.modLog.updateReason(context.channel.guild, caseId, context.author, reason)) {
            case 'MISSING_CASE': return caseId === undefined
                ? cmd.default.none
                : cmd.default.unknownCase({ caseId });
            case 'SUCCESS_NO_MESSAGE': return cmd.default.success.messageMissing;
            case 'SUCCESS': return cmd.default.success.default;
        }
    }
}
