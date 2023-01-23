import { bbtag } from '@blargbot/bbtag';
import type { ModerationType } from '@blargbot/cluster/utils/index.js';
import { guard } from '@blargbot/cluster/utils/index.js';
import { FormattableMessageContent } from '@blargbot/core/FormattableMessageContent.js';
import type { GuildCensor, GuildCensorExceptions } from '@blargbot/domain/models/index.js';
import { util } from '@blargbot/formatting';
import { hasValue } from '@blargbot/guards';
import type * as Eris from 'eris';
import moment from 'moment-timezone';

import templates from '../../text.js';
import type { ModerationManager } from '../ModerationManager.js';
import { ModerationManagerBase } from './ModerationManagerBase.js';

export class CensorManager extends ModerationManagerBase {
    readonly #debugOutput: Record<string, { channelId: string; messageId: string; } | undefined>;

    public constructor(manager: ModerationManager) {
        super(manager);
        this.#debugOutput = {};
    }

    public setDebug(guildId: string, id: number, userId: string, channelId: string, messageId: string, type: ModerationType): void {
        this.#debugOutput[this.#getDebugKey(guildId, id, userId, type)] = { channelId, messageId };
    }

    public async censor(message: Eris.Message<Eris.PossiblyUncachedTextableChannel>): Promise<boolean> {
        if (!guard.isGuildMessage(message) || !guard.isWellKnownMessage(message))
            return false;

        if (await this.#censorMentions(message))
            return true;

        const censors = await this.cluster.database.guilds.getCensors(message.channel.guild.id);
        if (censors === undefined || this.#isCensorExempt(message, censors.exception))
            return false;

        const matches = Object.entries(censors.list ?? {})
            .filter((e): e is [string, GuildCensor] => e[1] !== undefined)
            .filter(c => guard.matchMessageFilter(c[1], message) !== undefined);

        if (matches.length === 0)
            return false;

        try {
            await message.delete();
        } catch {
            // NOOP
        }

        if (!hasValue(message.member))
            return true;

        const tags = [];
        for (const [id, censor] of matches) {
            const result = await this.manager.warns.warn(
                message.member,
                this.cluster.discord.user,
                this.cluster.discord.user,
                censor.weight,
                util.literal(censor.reason) ?? templates.censor.warnReason
            );
            const tag = censor[`${result.type}Message`] ?? censors.rule?.[`${result.type}Message`];
            if (tag !== undefined)
                tags.push({ id: parseInt(id), tag, action: result.type });
        }

        await Promise.all(tags.map(async ({ id, tag, action }) => {
            const key = this.#getDebugKey(message.channel.guild.id, id, message.author.id, action);
            const debugCtx = this.#debugOutput[key];
            delete this.#debugOutput[key];

            const result = await this.cluster.bbtag.execute(tag.content, {
                message: message,
                rootTagName: 'censor',
                limit: 'customCommandLimit',
                inputRaw: message.content,
                isCC: true,
                authorId: tag.author ?? undefined,
                authorizerId: tag.authorizer ?? undefined
            });

            if (debugCtx?.channelId === message.channel.id)
                await this.cluster.util.send(message.author, new FormattableMessageContent(bbtag.createDebugOutput(result)));
        }));

        return true;
    }

    async #censorMentions(message: Eris.Message<Eris.KnownGuildTextableChannel>): Promise<boolean> {
        const antimention = await this.cluster.database.guilds.getSetting(message.channel.guild.id, 'antimention');
        if (antimention === undefined)
            return false;

        const parsedAntiMention = typeof antimention === 'string' ? parseInt(antimention) : antimention;
        if (parsedAntiMention === 0 || isNaN(parsedAntiMention) || message.mentions.length + message.roleMentions.length < parsedAntiMention)
            return false;

        switch (await this.manager.bans.ban(
            message.channel.guild,
            message.author,
            this.cluster.discord.user,
            this.cluster.discord.user,
            1,
            templates.censor.mentionSpam.ban.reason,
            moment.duration(Infinity)
        )) {
            case 'success':
            case 'memberTooHigh':
            case 'alreadyBanned':
                return true;
            case 'noPerms':
            case 'moderatorNoPerms':
            case 'moderatorTooLow':
                await this.cluster.util.reply(message, new FormattableMessageContent({
                    content: templates.censor.mentionSpam.ban.failed({ user: message.author })
                }));
                return true;
        }
    }

    #isCensorExempt(message: Eris.Message<Eris.KnownGuildTextableChannel>, exemptions?: GuildCensorExceptions): boolean {
        if (exemptions === undefined)
            return false;

        const channels = exemptions.channel ?? [];
        const users = exemptions.user ?? [];
        const roles = exemptions.role ?? [];
        const userRoles = hasValue(message.member) ? message.member.roles : [];

        return channels.includes(message.channel.id)
            || users.includes(message.author.id)
            || roles.some(r => userRoles.includes(r));
    }

    #getDebugKey(guildId: string, id: number, userId: string, type: ModerationType): string {
        return `${guildId}|${id}|${userId}|${type}`;
    }
}
