import { BaseGlobalImageCommand, CommandContext } from '@cluster/command';
import { CommandType, commandTypeDetails, guard, randChoose } from '@cluster/utils';
import { ImageResult } from '@image/types';
import cahData from '@res/cah.json';
import { MessageOptions } from 'discord.js';

export class CAHCommand extends BaseGlobalImageCommand {
    public constructor() {
        super({
            name: 'cah',
            definitions: [
                {
                    parameters: '',
                    description: 'Generates a set of Cards Against Humanity cards.',
                    execute: (ctx, _, flags) => this.render(ctx, flags.u !== undefined)
                },
                {
                    parameters: 'packs',
                    description: 'Lists all the Cards against packs I know about',
                    execute: (_, __, flags) => this.listPacks(flags.u !== undefined)
                }
            ],
            flags: [
                { flag: 'u', word: 'unofficial', description: 'Also show unofficial cards.' }
            ]
        });
    }

    public async render(context: CommandContext, unofficial: boolean): Promise<string | ImageResult> {
        const isNsfw = guard.isGuildCommandContext(context) && await context.database.guilds.getSetting(context.channel.guild.id, 'cahnsfw') !== false;

        if (isNsfw && !await commandTypeDetails[CommandType.NSFW].requirement(context))
            return this.error('CAH is considered a NSFW command here, and cannot be used in this channel.');

        const cardIds = unofficial ? packLookup.all : packLookup.official;
        const black = cahData.black[randChoose(cardIds.black)];

        const whiteIds = new Set<number>();
        while (whiteIds.size < black.pick)
            whiteIds.add(randChoose(cardIds.white));

        const white = [...whiteIds].map(id => cahData.white[id]);

        return await this.renderImage(context, 'cah', { black: black.text.replaceAll('_', '______'), white: white });
    }

    public listPacks(unofficial: boolean): MessageOptions {
        const packNames = unofficial ? packs.all : packs.official;
        return {
            content: this.info('These are the packs I know about:'),
            files: [
                {
                    attachment: packNames.join('\n'),
                    name: 'cah-packs.txt'
                }
            ]
        };
    }
}

interface PackLookup {
    official: PackLookupData;
    all: PackLookupData;
}

interface PackLookupData {
    white: Set<number>;
    black: Set<number>;
}

const packLookup = Object.values(cahData.metadata)
    .reduce<PackLookup>(
        (p, m) => {
            for (const data of m.official ? [p.official, p.all] : [p.all]) {
                m.white.forEach(i => data.white.add(i));
                m.black.forEach(i => data.black.add(i));
            }
            return p;
        },
        {
            official: { white: new Set(), black: new Set() },
            all: { white: new Set(), black: new Set() }
        }
    );

const packs = Object.values(cahData.metadata)
    .reduce<{ official: string[]; all: string[]; }>(
        (p, m) => {
            if (m.official)
                p.official.push(m.name);
            p.all.push(m.name);
            return p;
        },
        { official: [], all: [] }
    );
