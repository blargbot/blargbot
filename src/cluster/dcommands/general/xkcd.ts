import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType, randInt } from '@blargbot/cluster/utils';
import { mapping } from '@blargbot/mapping';
import fetch from 'node-fetch';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.xkcd;

export class XKCDCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `xkcd`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: `{comicNumber:integer?}`,
                    description: cmd.default.description,
                    execute: (ctx, [comicNumber]) => this.getComic(ctx, comicNumber.asOptionalInteger)
                }
            ]
        });
    }

    public async getComic(context: CommandContext, comicNumber: number | undefined): Promise<CommandResult> {
        if (comicNumber === undefined) {
            const comic = await this.#requestComic(undefined);
            if (comic === undefined)
                return `❌ Seems like xkcd is down 😟`;
            comicNumber = randInt(0, comic.num);
        }

        const comic = await this.#requestComic(comicNumber);
        if (comic === undefined)
            return `❌ Seems like xkcd is down 😟`;

        return {
            author: context.util.embedifyAuthor(context.author),
            title: `xkcd #${comic.num}: ${comic.title}`,
            description: comic.alt,
            image: { url: comic.img },
            footer: { text: `xkcd ${comic.year}` }
        };
    }

    async #requestComic(comicNumber: number | undefined): Promise<ComicInfo | undefined> {
        const response = await fetch(`http://xkcd.com/${comicNumber === undefined ? `` : `${comicNumber}/`}info.0.json`);
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
