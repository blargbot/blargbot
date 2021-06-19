import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';
import moment from 'moment';

export class GuildCreateDat extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'guildcreatedat',
            category: SubtagType.API,
            definition: [
                {
                    args: ['format?'],
                    description: 'Returns the date the current guild was created, in UTC+0. If a `format` code is specified, the date is ' +
                    'formatted accordingly. Leave blank for default formatting. See the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information.',
                    exampleCode: 'This guild was created on {guildcreatedat;YYYY/MM/DD HH:mm:ss}',
                    exampleOut: 'This guild was created on 2016/01/01 01:00:00',
                    execute: (ctx, args) => moment(ctx.guild.createdAt).utcOffset(0).format(args[0]?.value || '')
                }
            ]
        });
    }
}