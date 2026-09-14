import type { CommandContext } from '@blargbot/cluster';
import { CommandType, GlobalCommand  } from '@blargbot/cluster';

import { templates } from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.addDomain;

export class AddDomainCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'adddomain',
            category: CommandType.DEVELOPER,
            aliases: ['addomain'],
            definitions: [
                {
                    parameters: '{domains[]}',
                    description: cmd.default.description,
                    execute: (ctx, [domains]) => this.toggleDomains(ctx, domains.asStrings)
                }
            ]
        });
    }

    public async toggleDomains(ctx: CommandContext, domains: readonly string[]): Promise<CommandResult> {
        const result = await ctx.cluster.domains.toggle(...domains);
        return cmd.default.success(result);
    }
}
