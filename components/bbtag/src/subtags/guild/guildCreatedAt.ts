import moment from 'moment-timezone';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.guildCreatedAt;

@Subtag.id('guildCreatedAt')
@Subtag.factory()
export class GuildCreatedAtSubtag extends CompiledSubtag {
    public constructor() {
        super({
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
    }

    public getGuildCreatedDate(context: BBTagContext, format: string): string {
        return moment(context.guild.createdAt).utcOffset(0).format(format);
    }
}
