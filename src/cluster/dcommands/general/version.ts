import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';

export class VersionCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `version`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: ``,
                    description: `Tells you what version I am on`,
                    execute: (ctx) => this.getVersion(ctx)
                }
            ]
        });
    }

    public async getVersion(context: CommandContext): Promise<string> {
        const version = await context.cluster.version.getVersion();

        return `ℹ️ I am running blargbot version ${version}`;
    }
}
