import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType } from '@cluster/utils';

export class InviteCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'invite',
            aliases: ['join'],
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: 'Gets you invite information.',
                    execute: (ctx) => this.invite(ctx)
                }
            ]
        });
    }

    public invite(context: CommandContext): string {
        return [
            'Invite me to your guild!',
            `<${context.util.websiteLink('invite')}>`,
            'Don\'t need the moderation functions? Use this link instead:',
            `<${context.util.websiteLink('minvite')}>`,
            'Join my support guild!',
            'https://discord.gg/015GVxZxI8rtlJgXF`'
        ].join('\n');
    }
}
