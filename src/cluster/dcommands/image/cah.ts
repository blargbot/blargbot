import { ClusterUtilities } from '@blargbot/cluster';
import { CommandContext, GlobalImageCommand } from '@blargbot/cluster/command';
import { CommandType, commandTypeDetails, guard, randChoose } from '@blargbot/cluster/utils';
import cahData from '@blargbot/res/cah.json';
import { Guild, KnownTextableChannel, User } from 'eris';

import { CommandResult } from '../../types';

export class CAHCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: `cah`,
            definitions: [
                {
                    parameters: ``,
                    description: `Generates a set of Cards Against Humanity cards.`,
                    execute: (ctx, _, flags) => this.render(ctx, flags.u !== undefined)
                },
                {
                    parameters: `packs`,
                    description: `Lists all the Cards against packs I know about`,
                    execute: (_, __, flags) => this.listPacks(flags.u !== undefined)
                }
            ],
            flags: [
                { flag: `u`, word: `unofficial`, description: `Also show unofficial cards.` }
            ]
        });
    }

    public async isVisible(util: ClusterUtilities, location?: Guild | KnownTextableChannel, user?: User): Promise<boolean> {
        if (!await super.isVisible(util, location, user))
            return false;

        if (location === undefined)
            return true;

        const guild = location instanceof Guild ? location : guard.isGuildChannel(location) ? location.guild : undefined;
        if (guild === undefined || await util.database.guilds.getSetting(guild.id, `cahnsfw`) !== true)
            return true;

        return await commandTypeDetails[CommandType.NSFW].isVisible(util, location, user);
    }

    public async render(context: CommandContext, unofficial: boolean): Promise<CommandResult> {
        const cardIds = unofficial ? packLookup.all : packLookup.official;
        const black = cahData.black[randChoose(cardIds.black)];

        const whiteIds = new Set<number>();
        while (whiteIds.size < black.pick)
            whiteIds.add(randChoose(cardIds.white));

        const white = [...whiteIds].map(id => cahData.white[id]);

        return await this.renderImage(context, `cah`, { black: black.text.replaceAll(`_`, `______`), white: white });
    }

    public listPacks(unofficial: boolean): CommandResult {
        const packNames = unofficial ? packs.all : packs.official;
        return {
            content: `ℹ️ These are the packs I know about:`,
            files: [
                {
                    file: packNames.join(`\n`),
                    name: `cah-packs.txt`
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
