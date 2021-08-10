import { CustomCommandLimit } from '@cluster/bbtag';
import { guard, ModerationType } from '@cluster/utils';
import { GuildCensorExceptions } from '@core/types';
import { GuildMessage } from 'discord.js';

import { ModerationManager } from '../ModerationManager';
import { ModerationManagerBase } from './ModerationManagerBase';

export class CensorManager extends ModerationManagerBase {
    public constructor(manager: ModerationManager) {
        super(manager);
    }

    public async censor(message: GuildMessage): Promise<boolean> {
        if (await this.censorMentions(message))
            return true;

        const censors = await this.cluster.database.guilds.getCensors(message.channel.guild.id);
        if (censors === undefined || censors.list.length === 0 || this.isCensorExempt(message, censors.exception))
            return false;

        const censor = censors.list.find(c => guard.testMessageFilter(c, message));
        if (censor === undefined)
            return false;

        try {
            await message.delete();
        } catch {
            // NOOP
        }

        const result = await this.manager.warns.warn(message.member, this.cluster.discord.user, censor.weight, censor.reason ?? 'Said a blacklisted phrase.');
        let content: string | undefined;
        switch (result.type) {
            case ModerationType.BAN:
                content = censor.banMessage ?? censors.rule?.banMessage;
                break;
            case ModerationType.KICK:
                content = censor.kickMessage ?? censors.rule?.kickMessage;
                break;
            case ModerationType.WARN:
                content = censor.deleteMessage ?? censors.rule?.deleteMessage;
                break;
        }

        if (content !== undefined) {
            await this.cluster.bbtag.execute(content, {
                message: message,
                tagName: 'censor',
                limit: new CustomCommandLimit(),
                inputRaw: message.content,
                isCC: true,
                author: message.channel.guild.id
            });
        }

        return true;
    }

    private async censorMentions(message: GuildMessage): Promise<boolean> {
        const antimention = await this.cluster.database.guilds.getSetting(message.channel.guild.id, 'antimention');
        if (antimention === undefined)
            return false;

        const parsedAntiMention = typeof antimention === 'string' ? parseInt(antimention) : antimention;
        if (parsedAntiMention === 0 || isNaN(parsedAntiMention) || message.mentions.users.size + message.mentions.roles.size < parsedAntiMention)
            return false;

        switch (await this.manager.bans.ban(message.channel.guild, message.author, this.cluster.discord.user, false, 1, 'Mention spam')) {
            case 'success':
            case 'memberTooHigh':
            case 'alreadyBanned':
                return true;
            case 'noPerms':
            case 'moderatorNoPerms':
            case 'moderatorTooLow':
                await this.cluster.util.send(message, `${message.author.username} is mention spamming, but I lack the permissions to ban them!`);
                return true;
        }
    }

    private isCensorExempt(message: GuildMessage, exemptions?: GuildCensorExceptions): boolean {
        if (exemptions === undefined)
            return false;

        const channels = typeof exemptions.channel === 'string' ? [exemptions.channel] : exemptions.channel;
        const users = typeof exemptions.user === 'string' ? [exemptions.user] : exemptions.user;
        const roles = typeof exemptions.role === 'string' ? [exemptions.role] : exemptions.role;
        return channels.includes(message.channel.id)
            || users.includes(message.author.id)
            || roles.some(r => message.member.roles.cache.has(r));
    }
}
