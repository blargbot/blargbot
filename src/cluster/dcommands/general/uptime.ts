import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType } from '@cluster/utils';

export class UptimeCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'uptime',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: 'Gets how long ive been online for',
                    execute: (ctx) => this.getUptime(ctx)
                }
            ]
        });
    }

    public getUptime(context: CommandContext): string {
        return this.info(`I came online <t:${context.cluster.createdAt.unix()}:R> at <t:${context.cluster.createdAt.unix()}>`);
    }
}
