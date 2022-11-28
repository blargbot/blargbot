import moment from 'moment-timezone';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.guildCreatedAt;

export class GuildCreatedAtSubtag extends CompiledSubtag {
    public constructor() {
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
    }

    public getGuildCreatedDate(context: BBTagContext, format: string): string {
        return moment(context.guild.createdAt).utcOffset(0).format(format);
    }
}
