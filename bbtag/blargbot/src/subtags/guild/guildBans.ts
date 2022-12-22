import * as Eris from 'eris';

import { BBTagRuntimeError } from '../../errors/BBTagRuntimeError.js';
import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';

export class GuildBansSubtag extends Subtag {
    public constructor() {
        super({
            name: 'guildBans',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id[]',
                    execute: (ctx) => this.getGuildBans(ctx)
                }
            ]
        });
    }

    public async getGuildBans(context: BBTagContext): Promise<string[]> {
        try {
            return await context.util.getBannedUsers(context.guild);
        } catch (err: unknown) {
            if (!(err instanceof Eris.DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError('Missing required permissions', err.message);
        }
    }
}
