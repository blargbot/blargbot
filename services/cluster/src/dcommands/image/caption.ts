import { guard } from '@blargbot/core/utils/index.js';
import { parse } from '@blargbot/core/utils/parse/index.js';
import type { ValidFont } from '@blargbot/image-types';

import type { CommandContext } from '../../command/index.js';
import { GlobalImageCommand } from '../../command/index.js';
import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.caption;

export class CaptionCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: 'caption',
            flags: [
                { flag: 't', word: 'top', description: cmd.flags.top },
                { flag: 'b', word: 'bottom', description: cmd.flags.bottom },
                { flag: 'f', word: 'font', description: cmd.flags.font }
            ],
            definitions: [
                {
                    parameters: 'fonts',
                    description: cmd.fonts.description,
                    execute: () => this.listFonts()
                },
                {
                    parameters: '',
                    description: cmd.attached.description,
                    execute: (ctx, _, flags) => this.render(ctx, ctx.message.attachments[0]?.url, flags.t?.merge().value, flags.b?.merge().value, flags.f?.merge().value)
                },
                {
                    parameters: '{url+}',
                    description: cmd.linked.description,
                    execute: (ctx, [url], flags) => this.render(ctx, url.asString, flags.t?.merge().value, flags.b?.merge().value, flags.f?.merge().value)
                }
            ]
        });
    }

    public listFonts(): CommandResult {
        return cmd.fonts.success({ fonts: Object.values(validFonts) });
    }

    public async render(
        context: CommandContext,
        url: string | undefined,
        top: string | undefined,
        bottom: string | undefined,
        fontName = 'impact'
    ): Promise<CommandResult> {
        if (url === undefined)
            return cmd.errors.imageMissing;

        if ((top === undefined || top.length === 0)
            && (bottom === undefined || bottom.length === 0))
            return cmd.errors.captionMissing;

        const fontNameLower = fontName.toLowerCase();
        if (!Object.keys(validFonts).includes(fontNameLower))
            return cmd.errors.fontInvalid({ font: fontName, prefix: context.prefix });

        url = parse.url(url);
        if (!guard.isUrl(url))
            return cmd.linked.invalidUrl({ url });

        if (top !== undefined)
            top = await context.util.resolveTags(context, top);

        if (bottom !== undefined)
            bottom = await context.util.resolveTags(context, bottom);

        return await this.renderImage(context, 'caption', {
            url,
            font: validFonts[fontNameLower],
            top: top,
            bottom: bottom
        });
    }
}

const validFonts: { [P in ValidFont as Lowercase<P>]: P } = {
    animeace: 'animeAce',
    annieuseyourtelescope: 'annieUseYourTelescope',
    arcena: 'arcena',
    arial: 'arial',
    comicjens: 'comicJens',
    comicsans: 'comicSans',
    delius: 'delius',
    impact: 'impact',
    indieflower: 'indieFlower',
    sftoontime: 'sfToontime',
    whitney: 'whitney',
    roboto: 'roboto',
    ubuntu: 'ubuntu'
};
