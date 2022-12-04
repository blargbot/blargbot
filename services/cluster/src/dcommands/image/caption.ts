import { guard } from '@blargbot/core/utils/index.js';
import { parse } from '@blargbot/core/utils/parse/index.js';
import type { ValidFont } from '@blargbot/image/types.js';

import type { CommandContext} from '../../command/index.js';
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
        return cmd.fonts.success({ fonts: Object.keys(fontLookup) });
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

        if (!Object.keys(fontLookup).includes(fontName))
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
            font: fontLookup[fontName],
            top: top,
            bottom: bottom
        });
    }
}

const fontLookup: { [P in ValidFont as FontNames[P]]: P } = {
    animeace: 'animeace.ttf',
    annieuseyourtelescope: 'AnnieUseYourTelescope.ttf',
    arcena: 'ARCENA.ttf',
    arial: 'arial.ttf',
    comicjens: 'comicjens.ttf',
    comicsans: 'comicsans.ttf',
    delius: 'delius.ttf',
    impact: 'impact.ttf',
    indieflower: 'IndieFlower.ttf',
    roboto: 'Roboto-Regular.ttf',
    sftoontime: 'SFToontime.ttf',
    ubuntu: 'Ubuntu-Regular.ttf',
    whitney: 'whitney.ttf'
};
interface FontNames {
    ['ARCENA.ttf']: 'arcena';
    ['arial.ttf']: 'arial';
    ['animeace.ttf']: 'animeace';
    ['AnnieUseYourTelescope.ttf']: 'annieuseyourtelescope';
    ['comicjens.ttf']: 'comicjens';
    ['impact.ttf']: 'impact';
    ['SFToontime.ttf']: 'sftoontime';
    ['delius.ttf']: 'delius';
    ['IndieFlower.ttf']: 'indieflower';
    ['Roboto-Regular.ttf']: 'roboto';
    ['Ubuntu-Regular.ttf']: 'ubuntu';
    ['comicsans.ttf']: 'comicsans';
    ['whitney.ttf']: 'whitney';
}
