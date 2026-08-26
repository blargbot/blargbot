import type { CommandContext } from '@blargbot/cluster/command/index.js';
import { GlobalCommand } from '@blargbot/cluster/command/index.js';
import { CommandType, randInt } from '@blargbot/cluster/utils/index.js';
import { util } from '@blargbot/formatting';
import { mapping } from '@blargbot/mapping';

import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.xkcd;

export class XKCDCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'xkcd',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '{comicNumber:integer?}',
                    description: cmd.default.description,
                    execute: (ctx, [comicNumber]) => this.getComic(ctx, comicNumber.asOptionalInteger)
                }
            ]
        });
    }

    public async getComic(context: CommandContext, comicNumber: number | undefined): Promise<CommandResult> {
        if (comicNumber === undefined) {
            const comic = await this.#requestComic(undefined, context);
            if (comic === undefined)
                return cmd.default.down;
            comicNumber = randInt(0, comic.num);
        }

        const comic = await this.#requestComic(comicNumber, context);
        if (comic === undefined)
            return cmd.default.down;

        return {
            embeds: [
                {
                    author: context.util.embedifyAuthor(context.author),
                    title: cmd.default.embed.title({ id: comic.num, title: comic.title }),
                    description: util.literal(comic.alt),
                    image: { url: comic.img },
                    footer: {
                        text: cmd.default.embed.footer.text({ year: comic.year })
                    }
                }
            ]
        };
    }

    async #requestComic(comicNumber: number | undefined, context: CommandContext): Promise<ComicInfo | undefined> {
        const response = await context.util.fetch(`http://xkcd.com/${comicNumber === undefined ? '' : `${comicNumber}/`}info.0.json`);
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
