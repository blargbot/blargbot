import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType, randChoose, randInt } from '@blargbot/cluster/utils';
import { literal } from '@blargbot/domain/messages/types';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.rr;

export class RussianRouletteCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'rr',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{bullets:integer=1} {emote?}',
                    description: cmd.default.description,
                    execute: (ctx, [bullets, emote]) => this.play(ctx, bullets.asInteger, emote.asOptionalString)
                }
            ]
        });
    }

    public async play(context: CommandContext, bullets: number, emote: string | undefined): Promise<CommandResult> {
        emote ??= randChoose(emotes);
        if (bullets <= 0)
            return cmd.default.notEnoughBullets;
        if (bullets === 6)
            return cmd.default.guaranteedDeath;
        if (bullets > 6)
            return cmd.default.tooManyBullets;

        const query = await context.createConfirmQuery({
            prompt: cmd.default.confirm.prompt({ bullets }),
            continue: {
                label: cmd.default.confirm.continue,
                emoji: { name: '😅' }
            },
            cancel: {
                label: cmd.default.confirm.cancel,
                emoji: { name: '😖' }
            },
            fallback: true // "cancel" is the positive action here
        });

        if (query.prompt === undefined) {
            await query.cancel();
            return cmd.default.jammed;
        }

        const you = await context.send(context.channel, literal(`${emote}🔫`));
        if (await query.getResult()) {
            await Promise.all([
                context.edit(query.prompt, cmd.default.chicken),
                you?.edit('🐔')
            ]);
        } else if (randInt(1, 6) <= bullets) {
            await Promise.all([
                you?.edit('💥🔫'),
                context.edit(query.prompt, cmd.default.died)
            ]);
        } else {
            await Promise.all([
                you?.edit('😌🔫'),
                context.edit(query.prompt, cmd.default.lived)
            ]);
        }

        return undefined;
    }
}

const emotes = ['😀', '😬', '😂', '😃', '😄', '😉', '😨', '😣', '😖', '😫', '😤', '😳', '😐', '😑', '😷', '😭', '😪', '😜', '😊', '😺'];
