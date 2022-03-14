import { BaseGlobalCommand, CommandContext } from '@blargbot/cluster/command';
import { CommandType, mapping, randInt } from '@blargbot/cluster/utils';
import { EmbedOptions } from 'eris';
import fetch from 'node-fetch';

export class XKCDCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'xkcd',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{comicNumber:integer?}',
                    description: 'Gets an xkcd comic. If a number is not specified, gets a random one.',
                    execute: (ctx, [comicNumber]) => this.getComic(ctx, comicNumber.asOptionalInteger)
                }
            ]
        });
    }

    public async getComic(context: CommandContext, comicNumber: number | undefined): Promise<string | EmbedOptions> {
        if (comicNumber === undefined) {
            const comic = await this.requestComic(undefined);
            if (comic === undefined)
                return this.error('Seems like xkcd is down 😟');
            comicNumber = randInt(0, comic.num);
        }

        const comic = await this.requestComic(comicNumber);
        if (comic === undefined)
            return this.error('Seems like xkcd is down 😟');

        return {
            author: context.util.embedifyAuthor(context.author),
            title: `xkcd #${comic.num}: ${comic.title}`,
            description: comic.alt,
            image: { url: comic.img },
            footer: { text: `xkcd ${comic.year}` }
        };
    }

    private async requestComic(comicNumber: number | undefined): Promise<ComicInfo | undefined> {
        const response = await fetch(`http://xkcd.com/${comicNumber === undefined ? '' : `${comicNumber}/`}info.0.json`);
        try {
            const info = comicInfoMapping(await response.json());
            return info.valid ? info.value : undefined;
        } catch {
            return undefined;
        }
    }
}

interface ComicInfo {
    num: number;
    title: string;
    year: string;
    alt: string;
    img: string;
}

const comicInfoMapping = mapping.object<ComicInfo>({
    num: mapping.number,
    title: mapping.string,
    year: mapping.string,
    alt: mapping.string,
    img: mapping.string
});
