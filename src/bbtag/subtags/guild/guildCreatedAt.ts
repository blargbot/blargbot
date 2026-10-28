import moment from 'moment-timezone';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.guildCreatedAt;

export interface GetGuildCreatedTimestampFeature {
    getGuildCreatedTimestamp(guildId: string): Promise<Temporal.Instant | undefined>;
}

type Features = GetGuildCreatedTimestampFeature;
export class GuildCreatedAtSubtag extends CompiledSubtag {
    readonly #features: GetGuildCreatedTimestampFeature;
    public constructor(features: Features) {
        super({
            name: 'guildCreatedAt',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: ['format?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [format]) => this.getGuildCreatedDate(ctx, format.value)
                }
            ]
        });
        this.#features = features;
    }

    public async getGuildCreatedDate(context: BBTagContext, format: string): Promise<string> {
        const timestamp = await this.#features.getGuildCreatedTimestamp(context.root.guildId)
            ?? Temporal.Now.instant();
        return moment(timestamp.epochMilliseconds).utcOffset(0).format(format);
    }
}
