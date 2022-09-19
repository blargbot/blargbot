import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';
import { guard, humanize } from '@blargbot/core/utils';
import { parse } from '@blargbot/core/utils/parse';
import { ImageResult, ValidFont } from '@blargbot/image/types';

export class CaptionCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: 'caption',
            definitions: [
                {
                    parameters: 'fonts',
                    description: 'Lists the fonts that are supported',
                    execute: () => this.listFonts()
                },
                {
                    parameters: '',
                    description: 'Puts captions on an attached image.',
                    execute: (ctx, _, flags) => this.render(ctx, ctx.message.attachments[0]?.url, flags.t?.merge().value, flags.b?.merge().value, flags.f?.merge().value)
                },
                {
                    parameters: '{url+}',
                    description: 'Puts captions on the image in the URL.',
                    execute: (ctx, [url], flags) => this.render(ctx, url.asString, flags.t?.merge().value, flags.b?.merge().value, flags.f?.merge().value)
                }
            ],
            flags: [
                { flag: 't', word: 'top', description: 'The top caption.' },
                { flag: 'b', word: 'bottom', description: 'The bottom caption.' },
                { flag: 'f', word: 'font', description: 'The font to use (case insensitive). Use the command with the -l flag to view the available fonts. Defaults to impact.' }
            ]
        });
    }

    public listFonts(): string {
        return this.info(`The supported fonts are:${humanize.smartJoin(Object.keys(fontLookup), ', ', ' and ')}`);
    }

    public async render(
        context: CommandContext,
        url: string | undefined,
        top: string | undefined,
        bottom: string | undefined,
        fontName = 'impact'
    ): Promise<string | ImageResult> {
        if (url === undefined)
            return this.error('You didnt tell me what image I should caption!');

        if ((top === undefined || top.length === 0)
            && (bottom === undefined || bottom.length === 0))
            return this.error('You must give atleast 1 caption!');

        if (!Object.keys(fontLookup).includes(fontName))
            return this.error(`${fontName} is not a supported font! Use \`${context.prefix}caption list\` to see all available fonts`);

        url = parse.url(url);
        if (!guard.isUrl(url))
            return this.error(`${url} is not a valid url!`);

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
