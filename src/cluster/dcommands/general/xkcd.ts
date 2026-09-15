import type { CommandContext } from '@blargbot/cluster';
import { CommandType, GlobalCommand } from '@blargbot/cluster';
import { util } from '@blargbot/formatting';
import { random } from '@blargbot/util';
import z from 'zod';

import { templates } from '../../text.js';
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
            comicNumber = random.int(0, comic.num);
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
            const info = comicInfoMapping.safeParse(await response.json());
            return info.success ? info.data : undefined;
        } catch {
            return undefined;
        }
    }
}

const comicInfoMapping = z.object({
    num: z.number(),
    title: z.string(),
    year: z.string(),
    alt: z.string(),
    img: z.string()
});
type ComicInfo = z.infer<typeof comicInfoMapping>;
