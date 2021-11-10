import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType } from '@cluster/utils';
import { SendPayload } from '@core/types';
import { humanize, parse } from '@core/utils';
import { AllowedImageFormat, AllowedImageSize, User } from 'discord.js';
import fetch from 'node-fetch';

export class AvatarCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'avatar',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: 'Gets your avatar',
                    execute: (ctx, _, flags) => this.getAvatar(ctx, ctx.author, flags.f?.merge().value, flags.s?.merge().value)
                },
                {
                    parameters: '{user:user+}',
                    description: 'Gets the avatar of the user you chose',
                    execute: (ctx, [user], flags) => this.getAvatar(ctx, user.asUser, flags.f?.merge().value, flags.s?.merge().value)
                }
            ],
            flags: [
                { flag: 'f', word: 'format', description: `The file format. Can be ${humanize.smartJoin(allowedFormats, ', ', ' or ')}.` },
                { flag: 's', word: 'size', description: `The file size. Can be ${humanize.smartJoin(allowedImageSizes, ', ', ' or ')}.` }
            ]
        });
    }

    public async getAvatar(context: CommandContext, user: User, format: string | undefined, size: string | number | undefined): Promise<SendPayload> {
        if (format !== undefined && !allowedFormats.includes(format))
            return this.error(`${format} is not a valid format! Supported formats are ${humanize.smartJoin(allowedFormats, ', ', ' and ')}`);

        const parsedSize = typeof size === 'string' ? size = parse.int(size) : size;

        if (parsedSize !== undefined && !allowedImageSizes.includes(parsedSize))
            return this.error(`${size ?? parsedSize} is not a valid image size! Supported sizes are ${humanize.smartJoin(allowedImageSizes, ', ', ' and ')}`);

        const avatarUrl = user.displayAvatarURL({
            dynamic: format === undefined,
            format: format ?? 'png',
            size: parsedSize ?? 512
        });

        await context.channel.sendTyping();
        const avatar = await fetch(avatarUrl);

        return {
            content: this.success(`${user.toString()}'s avatar`),
            files: [{ attachment: await avatar.buffer(), name: new URL(avatarUrl).pathname.split('/').pop() }]
        };
    }
}

const allowedFormats = Object.keys<AllowedImageFormat>({
    jpeg: 0,
    jpg: 0,
    png: 0,
    webp: 0
});

const allowedImageSizes = Object.values<{ [P in AllowedImageSize]: P }>({
    '16': 16,
    '32': 32,
    '64': 64,
    '56': 56,
    '96': 96,
    '128': 128,
    '256': 256,
    '300': 300,
    '512': 512,
    '600': 600,
    '1024': 1024,
    '2048': 2048,
    '4096': 4096
});
