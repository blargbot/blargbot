import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType } from '@cluster/utils';

export class DMErrorsCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'dmerrors',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: 'Toggles whether to DM you errors.',
                    execute: ctx => this.toggleDMErrors(ctx)
                }
            ]
        });
    }

    public async toggleDMErrors(context: CommandContext): Promise<string> {
        const dmErrors = await context.database.users.getSetting(context.author.id, 'dontdmerrors');
        await context.database.users.setSetting(context.author.id, 'dontdmerrors', dmErrors !== true);

        if (dmErrors === true)
            return this.success('I will now DM you if I have an issue running a command.');
        return this.success('I won\'t DM you if I have an issue running a command.');
    }
}
