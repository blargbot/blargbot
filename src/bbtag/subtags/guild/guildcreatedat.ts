import moment from 'moment-timezone';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class GuildCreatedAtSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `guildcreatedat`,
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [`format?`],
                    description: `Returns the date the current guild was created, in UTC+0. If a \`format\` code is specified, the date is formatted accordingly. Leave blank for default formatting. See the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information.`,
                    exampleCode: `This guild was created on {guildcreatedat;YYYY/MM/DD HH:mm:ss}`,
                    exampleOut: `This guild was created on 2016/01/01 01:00:00`,
                    returns: `string`,
                    execute: (ctx, [format]) => this.getGuildCreatedDate(ctx, format.value)
                }
            ]
        });
    }

    public getGuildCreatedDate(context: BBTagContext, format: string): string {
        return moment(context.guild.createdAt).utcOffset(0).format(format);
    }
}
