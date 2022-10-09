import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { codeBlock, CommandType } from '@blargbot/cluster/utils';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.addDomain;

export class AddDomainCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `adddomain`,
            category: CommandType.DEVELOPER,
            aliases: [`addomain`],
            definitions: [
                {
                    parameters: `{domains[]}`,
                    description: cmd.default.description,
                    execute: (ctx, [domains]) => this.toggleDomains(ctx, domains.asStrings)
                }
            ]
        });
    }

    public async toggleDomains(ctx: CommandContext, domains: readonly string[]): Promise<CommandResult> {
        const result = await ctx.cluster.domains.toggle(...domains);

        const output = [`✅ Boy howdy, thanks for the domains!\n`];
        if (result.added.length > 0)
            output.push(`These ones are great!${codeBlock(result.added.join(`\n`))}`);
        if (result.removed.length > 0)
            output.push(`I always hated these ones anyways.${codeBlock(result.removed.join(`\n`))}`);
        output.push(`Just remember: it might take up to 15 minutes for these to go live.`);

        return output.join(``);
    }
}
