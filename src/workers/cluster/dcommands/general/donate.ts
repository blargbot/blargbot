// const BaseCommand = require('../structures/BaseCommand');
// const newbutils = require('../newbu');

import { BaseGlobalCommand, CommandContext } from '@cluster/command';
import { CommandType } from '@cluster/utils';

export class DonateCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'donate',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: 'Gets my donation information',
                    execute: (ctx) => this.donateDetails(ctx)
                }
            ]
        });
    }

    public async donateDetails(context: CommandContext): Promise<string> {
        const owner = context.discord.application.owner;
        await context.replyDM({
            embeds: [
                {
                    author: owner === null ? undefined : context.util.embedifyAuthor(owner),
                    description: `Hi! This is stupid cat, creator of blargbot. I hope you're enjoying it!

I don't like to beg, but right now I'm a student. Tuition is expensive, and maintaining this project isn't exactly free. I have to pay for services such as web servers and domains, not to mention invest time into developing code to make this bot as good as it can be. I don't expect to be paid for what I'm doing; the most important thing to me is that people enjoy what I make, that my product is making people happy. But still, money doesn't grow on trees. If you want to support me and what I'm doing, I have a patreon available for donations. Prefer something with less commitment? I also have a paypal available.

Thank you for your time. I really appreciate all of my users! :3`,
                    fields: [
                        { name: 'Paypal', value: 'https://paypal.me/stupidcat', inline: true },
                        { name: 'Patreon', value: 'https://www.patreon.com/blargbot', inline: true }
                    ]
                }
            ]
        });
        return this.success('Thanks for the interest! Ive sent you a DM with information about donations.');
    }
}
