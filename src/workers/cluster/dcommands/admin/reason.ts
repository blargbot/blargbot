import { BaseGuildCommand } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { CommandType } from '@cluster/utils';

export class ReasonCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'reason',
            category: CommandType.ADMIN,
            definitions: [
                {
                    parameters: '{caseId:number?} {reason+}',
                    description: 'Sets the reason for an action on the modlog.',
                    execute: (ctx, [caseId, reason]) => this.setReason(ctx, caseId, reason)
                }
            ]
        });
    }

    public async setReason(context: GuildCommandContext, caseId: number | undefined, reason: string): Promise<string> {
        switch (await context.cluster.moderation.modLog.updateReason(context.channel.guild, caseId, context.author, reason)) {
            case 'MISSING_CASE':
                if (caseId === undefined)
                    return this.error('There arent any modlog entries yet!');
                return this.error(`I couldnt find a modlog entry with a case if od ${caseId}`);
            case 'SUCCESS_NO_MESSAGE':
                return this.warning('The modlog has been updated! I couldnt find the message to update however.');
            case 'SUCCESS':
                return this.success('The modlog has been updated!');
        }
    }
}
