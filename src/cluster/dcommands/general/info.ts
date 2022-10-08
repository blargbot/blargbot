import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType } from '@blargbot/cluster/utils';
import { humanize } from '@blargbot/core/utils';
import { EmbedOptions } from 'eris';
import moment from 'moment-timezone';

import { CommandResult } from '../../types';

const year = [undefined, `year`, `years`];
const month = [undefined, `month`, `months`];
const day = [undefined, `day`, `days`];
const hour = [undefined, `hour`, `hours`];
const minute = [undefined, `minute`, `minutes`];
const second = [undefined, `second`, `seconds`];

export class InfoCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `info`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: ``,
                    description: `Returns some info about me.`,
                    execute: (ctx) => this.showInfo(ctx)
                }
            ]
        });
    }
    public showInfo(context: CommandContext): CommandResult {
        if (context.cluster.contributors.patrons.length === 0)
            return `⚠️ Im still waking up! Try again in a minute or two`;

        const age = moment.duration(moment().diff(1444708800000));
        const ageStr = humanize.smartJoin(
            [
                { val: age.years(), quantity: year },
                { val: age.months(), quantity: month },
                { val: age.days(), quantity: day },
                { val: age.hours(), quantity: hour },
                { val: age.minutes(), quantity: minute },
                { val: age.seconds(), quantity: second }
            ]
                .map(x => ({ val: x.val, quantity: x.quantity[Math.min(x.val, x.quantity.length - 1)] }))
                .filter(x => x.quantity !== undefined)
                .map(x => `${x.val} ${x.quantity ?? ``}`),
            `, `,
            `, and `
        );

        return {
            author: context.util.embedifyAuthor(context.discord.user),
            title: `About me!`,
            description: `I am a multipurpose bot with new features implemented regularly, written in typescript using [Eris](https://abal.moe/Eris/).
                    
🎂 I am currently ${ageStr} old!`,
            fields: [
                {
                    name: `️️️️️️️️❤️ Special thanks to my patrons! ❤️`,
                    value: context.cluster.contributors.patrons.map(u => typeof u === `string` ? u : humanize.fullName(u)).join(`\n`),
                    inline: true
                },
                {
                    name: `️️️️️️️️❤️ Special thanks to all my other donators! ❤️`,
                    value: context.cluster.contributors.donators.map(u => typeof u === `string` ? u : humanize.fullName(u)).join(`\n`),
                    inline: true
                },
                {
                    name: `❤️ Special huge thanks to: ❤️`,
                    value: context.cluster.contributors.others.map(x => {
                        const user = typeof x.user === `string` ? x.user : humanize.fullName(x.user);
                        return `🎉 The ${x.decorator} **${user}** for ${x.reason}!`;
                    }).join(`\n`)
                },
                {
                    name: `\u200b`,
                    value: `For commands, do \`${context.prefix}help\`. For information about supporting me, do \`${context.prefix}donate\`. 
For any additional information, such as command documentation, please visit my website: <https://blargbot.xyz>`
                }
            ]
        };
    }
}
