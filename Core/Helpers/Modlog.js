const BaseHelper = require('./BaseHelper');
const EventEmitter = require('eventemitter3');
const moment = require('moment');

class ModlogHelper extends BaseHelper {
    constructor(client) {
        super(client);
        this.emitter = new EventEmitter();
    }

    get eventMap() {
        return {
            default: {},
            kick: { code: 20, emote: ':boot:', key: 'modlog.events.kick', color: 0xdb7b1c, requiresAudit: true },
            ban: { code: 22, emote: ':hammer:', key: 'modlog.events.ban', color: 0xcc0c1c },
            unban: { code: 23, emote: ':angel:', key: 'modlog.events.unban', color: 0x79add1 },
            mute: { code: 25, emote: ':mute:', key: 'modlog.events.mute', color: 0xd80f66 },
            unmute: { code: 25, emote: ':loud_sound:', key: 'modlog.events.unmute', color: 0x1cdb68 },
            rename: { code: 24, emote: ':pen_ballpoint:', key: 'modlog.events.rename', color: 0xffee02, requireAudit: true },
            warn: { emote: ':warning:', key: 'modlog.events.warn', color: 0xd1be79 },
            pardon: { emote: ':cookie:', key: 'modlog.events.pardon', color: 0x79d196 },
            specialAdd: { emote: ':inbox_tray:', key: 'modlog.events.specialroleadd', color: 0x42f4ee },
            specialRemove: { emote: ':outbox_tray:', key: 'modlog.events.specialroleremove', color: 0x42f4ee },
            custom: {}
        };
    }

    async performModlog(guild, type, params) {
        let channel = await guild.data.getModlogChannel(this.eventMap.hasOwnProperty(type) ? type : 'custom');
        if (channel === null) return;

        let audit = this.eventMap[type] && this.eventMap[type].code !== undefined
            ? await this.getAuditEntry(guild, type, params.targetID)
            : null;

        if (audit == null && this.eventMap[type].requiresAudit) return;

        let mod = audit && audit.user ? audit.user : params.user;
        if (typeof mod === 'string') mod = this.client.users.get(mod);
        let reason = audit && audit.reason ? audit.reason : params.reason;
        if (mod && mod.id === this.client.user.id) {
            if (reason.includes(':'))
                reason = reason.split(':').slice(1).join(':');
            else reason = undefined;
        }

        let GuildModlog = this.client.models.GuildModlog;


        let target = this.client.users.get(params.targetID) || await this.client.getRESTUser(params.targetID);

        await this.send(channel, type, target, mod, reason, params.fields || [], params.color);
    }

    async update(ctx, caseId, reason) {
        let model = await ctx.guild.data.getModlog(caseId);
        if (model == null) return false;
        let msg2 = await this.client.getChannel(await model.get('channelId')).getMessage(await model.get('msgId'));
        let embed = msg2.embeds[0];
        embed.timestamp = moment(embed.timestamp).toISOString();
        embed.footer = {
            text: ctx.author.fullName,
            icon_url: ctx.author.avatarURL
        };
        embed.description = reason;
        await msg2.edit({ embed });
        model.update({
            modId: ctx.author.id,
            reason
        }, {
                where: {
                    guildId: ctx.guild.id,
                    caseId
                }
            });
    }

    async send(channel, type, target, mod, reason, fields, color) {
        let embed = this.client.Helpers.Embed.build();
        const decode = this.client.Helpers.Message.decode.bind(this.client.Helpers.Message);
        if (!Array.isArray(target)) target = [target];

        let model = await channel.guild.data.addModlog(mod ? mod.id : undefined, type, reason, target.map(t => t.id));
        let caseId = await model.get('caseId');
        let event = this.eventMap[type];
        let title = await decode(channel, 'modlog.case', {
            icon: event ? event.emote : ':exclamation:',
            number: caseId,
            event: event ? await decode(channel, event.key) : type
        });
        embed.setTitle(title)
            .setDescription(reason || await decode(channel, 'modlog.setreason', { number: caseId }))
            .addField(await decode(channel, 'generic.user'), target.map(t => t.fullNameId).join('\n'), false)
            .setTimestamp()
            .setColor(event ? event.color : (color || 0x0));

        if (mod)
            embed.setFooter(mod.fullName, mod.avatarURL);

        for (const field of fields) {
            embed.addField(field.name, field.value, field.inline);
        }
        let msg2 = await embed.send(channel);
        await model.update({ msgId: msg2.id, channelId: msg2.channel.id }, {
            where: {
                caseId, guildId: await model.get('guildId')
            }
        });
    }

    async construct(params) {
        return;
    }

    async getAuditEntry(guild, type, target) {
        try {
            let code = this.eventMap[type].code;
            let entries = await guild.getAuditLogs(10, undefined, code);
            for (const entry of entries.entries) {
                if (entry.targetID === target)
                    return entry;
            }
        } catch (err) {
            console.error(err);
            return null;
        }
    }

}

module.exports = ModlogHelper;