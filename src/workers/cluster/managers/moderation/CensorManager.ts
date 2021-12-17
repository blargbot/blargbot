import { bbtagUtil, guard, ModerationType } from '@cluster/utils';
import { GuildCensor, GuildCensorExceptions, GuildTriggerTag } from '@core/types';
import { KnownGuildTextableChannel, Message } from 'eris';
import moment from 'moment-timezone';

import { ModerationManager } from '../ModerationManager';
import { ModerationManagerBase } from './ModerationManagerBase';

export class CensorManager extends ModerationManagerBase {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #debugOutput: Record<string, { channelId: string; messageId: string; } | undefined>;

    public constructor(manager: ModerationManager) {
        super(manager);
        this.#debugOutput = {};
    }

    public async censor(message: Message<KnownGuildTextableChannel>): Promise<boolean> {
        if (await this.censorMentions(message))
            return true;

        const censors = await this.cluster.database.guilds.getCensors(message.channel.guild.id);
        if (censors === undefined || this.isCensorExempt(message, censors.exception))
            return false;

        const [id, censor] = Object.entries(censors.list ?? {})
            .filter((e): e is [string, GuildCensor] => e[1] !== undefined)
            .find(c => guard.testMessageFilter(c[1], message)) ?? [];

        if (censor === undefined || id === undefined)
            return false;

        try {
            await message.delete();
        } catch {
            // NOOP
        }

        const result = await this.manager.warns.warn(message.member, this.cluster.discord.user, censor.weight, censor.reason ?? 'Said a blacklisted phrase.');
        let tag: GuildTriggerTag | undefined;
        let type: 'ban' | 'delete' | 'kick';
        switch (result.type) {
            case ModerationType.BAN:
                tag = censor.banMessage ?? censors.rule?.banMessage;
                type = 'ban';
                break;
            case ModerationType.KICK:
                tag = censor.kickMessage ?? censors.rule?.kickMessage;
                type = 'kick';
                break;
            case ModerationType.WARN:
                tag = censor.deleteMessage ?? censors.rule?.deleteMessage;
                type = 'delete';
                break;
        }

        if (tag !== undefined) {
            const result = await this.cluster.bbtag.execute(tag.content, {
                message: message,
                rootTagName: 'censor',
                limit: 'customCommandLimit',
                inputRaw: message.content,
                isCC: true,
                author: tag.author,
                authorizer: tag.authorizer
            });

            const key = this.getDebugKey(message.channel.guild.id, parseInt(id), message.author.id, type);
            const debugCtx = this.#debugOutput[key];
            if (debugCtx !== undefined) {
                delete this.#debugOutput[key];
                await this.cluster.util.send(debugCtx.channelId, {
                    ...bbtagUtil.createDebugOutput(result),
                    messageReference: { messageID: debugCtx.messageId }
                });
            }
        }

        return true;
    }

    private async censorMentions(message: Message<KnownGuildTextableChannel>): Promise<boolean> {
        const antimention = await this.cluster.database.guilds.getSetting(message.channel.guild.id, 'antimention');
        if (antimention === undefined)
            return false;

        const parsedAntiMention = typeof antimention === 'string' ? parseInt(antimention) : antimention;
        if (parsedAntiMention === 0 || isNaN(parsedAntiMention) || message.mentions.length + message.roleMentions.length < parsedAntiMention)
            return false;

        switch (await this.manager.bans.ban(message.channel.guild, message.author, this.cluster.discord.user, false, 1, 'Mention spam', moment.duration(Infinity))) {
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

    private isCensorExempt(message: Message<KnownGuildTextableChannel>, exemptions?: GuildCensorExceptions): boolean {
        if (exemptions === undefined)
            return false;

        const channels = exemptions.channel ?? [];
        const users = exemptions.user ?? [];
        const roles = exemptions.role ?? [];

        return channels.includes(message.channel.id)
            || users.includes(message.author.id)
            || roles.some(r => message.member.roles.includes(r));
    }

    public setDebug(guildId: string, id: number, userId: string, channelId: string, messageId: string, type: 'ban' | 'delete' | 'kick'): void {
        this.#debugOutput[this.getDebugKey(guildId, id, userId, type)] = { channelId, messageId };
    }

    private getDebugKey(guildId: string, id: number, userId: string, type: 'ban' | 'delete' | 'kick'): string {
        return `${guildId}|${id}|${userId}|${type}`;
    }
}
