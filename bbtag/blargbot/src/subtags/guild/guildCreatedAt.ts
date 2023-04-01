import snowflake from '@blargbot/snowflakes';
import moment from 'moment-timezone';

import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.guildCreatedAt;

@Subtag.id('guildCreatedAt')
@Subtag.ctorArgs()
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

    public getGuildCreatedDate(context: BBTagScript, format: string): string {
        const createdAt = snowflake.parse(context.runtime.guild.id).timestampMs;
        return moment(createdAt).utcOffset(0).format(format);
    }
}
