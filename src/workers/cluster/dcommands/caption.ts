import { BaseGlobalCommand, CommandContext, RatelimitMiddleware, SingleThreadMiddleware } from '@cluster/command';
import { CommandType } from '@cluster/utils';
import { guard, humanize } from '@core/utils';
import { ImageResult, ValidFont } from '@image/types';
import { duration } from 'moment';

export class CaptionCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'caption',
            category: CommandType.IMAGE,
            definitions: [
                {
                    parameters: 'fonts',
                    description: 'Lists the fonts that are supported',
                    execute: () => this.listFonts()
                },
                {
                    parameters: '',
                    description: 'Puts captions on an attached image.',
                    execute: (ctx, _, flags) => this.caption(ctx, ctx.message.attachments.first()?.url, flags.t?.merge().value, flags.b?.merge().value, flags.f?.merge().value)
                },
                {
                    parameters: '{url+}',
                    description: 'Puts captions on the image in the URL.',
                    execute: (ctx, [url], flags) => this.caption(ctx, url, flags.t?.merge().value, flags.b?.merge().value, flags.f?.merge().value)
                }
            ],
            flags: [
                { flag: 't', word: 'top', description: 'The top caption.' },
                { flag: 'b', word: 'bottom', description: 'The bottom caption.' },
                { flag: 'f', word: 'font', description: 'The font to use (case insensitive). Use the command with the -l flag to view the available fonts. Defaults to impact.' }
            ]
        });

        this.middleware.push(new SingleThreadMiddleware(c => c.channel.id));
        this.middleware.push(new RatelimitMiddleware(duration(5, 'seconds'), c => c.author.id));
    }

    public listFonts(): string {
        return this.info(`The supported fonts are:${humanize.smartJoin(Object.keys(fontLookup), ', ', ' and ')}`);
    }

    public async caption(
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
            return this.error(`${fontName} is not a supported font! Use \`${context.prefix}caption list\` to see alla available fonts`);

        if (!guard.isUrl(url))
            return this.error(`${url} is not a valid url!`);

        await context.channel.sendTyping();
        const result = await context.cluster.images.render('caption', {
            url,
            font: fontLookup[fontName],
            input: { top: top, bottom: bottom }
        });

        if (result === undefined || result.data.length === 0)
            return this.error('Something went wrong while trying to render that!');

        return result;
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
    ubuntu: 'Ubuntu-Regular.ttf'
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
}
