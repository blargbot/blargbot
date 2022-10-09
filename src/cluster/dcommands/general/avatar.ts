import { GlobalCommand, SendTypingMiddleware } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';
import { humanize, parse } from '@blargbot/core/utils';
import { ImageFormat, User } from 'eris';
import fetch from 'node-fetch';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.avatar;

export class AvatarCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `avatar`,
            category: CommandType.GENERAL,
            flags: [
                { flag: `f`, word: `format`, description: cmd.flags.format },
                { flag: `s`, word: `size`, description: cmd.flags.size }
            ],
            definitions: [
                {
                    parameters: ``,
                    description: cmd.self.description,
                    execute: (ctx, _, flags) => this.getAvatar(ctx.author, flags.f?.merge().value, flags.s?.merge().value)
                },
                {
                    parameters: `{user:user+}`,
                    description: cmd.user.description,
                    execute: (_, [user], flags) => this.getAvatar(user.asUser, flags.f?.merge().value, flags.s?.merge().value)
                }
            ]
        });

        this.middleware.push(new SendTypingMiddleware());
    }

    public async getAvatar(user: User, format: string | undefined, size: string | number | undefined): Promise<CommandResult> {
        if (format !== undefined && !allowedFormats.includes(format))
            return `❌ ${format} is not a valid format! Supported formats are ${humanize.smartJoin(allowedFormats, `, `, ` and `)}`;

        const parsedSize = typeof size === `string` ? size = parse.int(size, { strict: true }) : size;

        if (parsedSize !== undefined && !allowedImageSizes.includes(parsedSize))
            return `❌ ${size ?? parsedSize} is not a valid image size! Supported sizes are ${humanize.smartJoin(allowedImageSizes, `, `, ` and `)}`;

        const avatarUrl = user.dynamicAvatarURL(format, parsedSize ?? 512);

        const avatar = await fetch(avatarUrl);

        return {
            content: `✅ <@${user.id}>'s avatar`,
            files: [{ file: await avatar.buffer(), name: new URL(avatarUrl).pathname.split(`/`).pop() ?? `${user.id}.${format ?? `png`}` }]
        };
    }
}

const allowedFormats = Object.keys<ImageFormat>({
    jpeg: 0,
    jpg: 0,
    png: 0,
    webp: 0,
    gif: 0
});

const allowedImageSizes = [
    16,
    32,
    64,
    56,
    96,
    128,
    256,
    300,
    512,
    600,
    1024,
    2048,
    4096
];
