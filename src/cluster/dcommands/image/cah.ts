import type { ClusterUtilities, CommandContext } from '@blargbot/cluster';
import { CommandType, commandTypeDetails, GlobalImageCommand, guard } from '@blargbot/cluster';
import { cah } from '@blargbot/res';
import { random } from '@blargbot/util';
import * as eris from 'eris';

import { templates } from '../../text.js';
import type { CommandResult } from '../../types.js';

await cah.ensureLoaded();
const cmd = templates.commands.cah;

export class CAHCommand extends GlobalImageCommand {
    public constructor() {
        super({
            name: 'cah',
            flags: [
                { flag: 'u', word: 'unofficial', description: cmd.flags.unofficial }
            ],
            definitions: [
                {
                    parameters: '',
                    description: cmd.default.description,
                    execute: (ctx, _, flags) => this.render(ctx, flags.u !== undefined)
                },
                {
                    parameters: 'packs',
                    description: cmd.packs.description,
                    execute: (_, __, flags) => this.listPacks(flags.u !== undefined)
                }
            ]
        });
    }

    public async isVisible(util: ClusterUtilities, location?: eris.Guild | eris.KnownTextableChannel, user?: eris.User): Promise<boolean> {
        if (!await super.isVisible(util, location, user))
            return false;

        if (location === undefined)
            return true;

        const guild = location instanceof eris.Guild ? location : guard.isGuildChannel(location) ? location.guild : undefined;
        if (guild === undefined || await util.database.guilds.getSetting(guild.id, 'cahnsfw') !== true)
            return true;

        return await commandTypeDetails[CommandType.NSFW].isVisible(util, location, user);
    }

    public async render(context: CommandContext, unofficial: boolean): Promise<CommandResult> {
        const cardIds = unofficial ? packLookup.all : packLookup.official;
        const black = cah.data.black[random.pick(cardIds.black)];

        const whiteIds = new Set<number>();
        while (whiteIds.size < black.pick)
            whiteIds.add(random.pick(cardIds.white));

        const white = [...whiteIds].map(id => cah.data.white[id]);

        return await this.renderImage(context, { type: 'cah', black: black.text.replaceAll('_', '______'), white: white });
    }

    public listPacks(unofficial: boolean): CommandResult {
        const packNames = unofficial ? packs.all : packs.official;
        return {
            content: cmd.packs.success,
            file: [
                {
                    file: packNames.join('\n'),
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

const packLookup = Object.values(cah.data.metadata)
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

const packs = Object.values(cah.data.metadata)
    .reduce<{ official: string[]; all: string[]; }>(
        (p, m) => {
            if (m.official)
                p.official.push(m.name);
            p.all.push(m.name);
            return p;
        },
        { official: [], all: [] }
    );
