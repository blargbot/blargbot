const BaseHelper = require('./BaseHelper');
const EventEmitter = require('eventemitter3');

class ModlogHelper extends BaseHelper {
    constructor(client) {
        super(client);
        this.emitter = new EventEmitter();
    }

    get eventMap() {
        return {
            default: {},
            kick: { code: 20, emote: ':boot:', formatted: 'Kick', color: 0xdb7b1c },
            ban: { code: 22, emote: ':hammer:', formatted: 'Ban', color: 0xcc0c1c },
            unban: { code: 23, emote: ':angel:', formatted: 'Unban', color: 0x79add1 },
            mute: { code: 25, emote: ':mute:', formatted: 'Mute', color: 0xd80f66 },
            unmute: { code: 25, emote: ':loud_sound:', formatted: 'Unmute', color: 0x1cdb68 },
            rename: { code: 24, emote: ':pen_ballpoint:', formatted: 'Rename', color: 0xffee02 },
            warn: { emote: ':warning:', formatted: 'Warning', color: 0xd1be79 },
            pardon: { emote: ':cookie:', formatted: 'Pardon', color: 0x79d196 },
            specialAdd: { emote: ':inbox_tray:', formatted: 'Special Role Added', color: 0x42f4ee },
            specialRemove: { emote: ':outbox_tray:', formatted: 'Special Role Removed', color: 0x42f4ee },
            custom: {}
        };
    }

    async performModlog(guild, type, params) {
        let audit = this.eventMap[type] && this.eventMap[type].code !== undefined
            ? await this.getAuditEntry(guild, type, params.targetID)
            : null;

        let mod = audit && audit.user ? audit.user : params.user;
        let reason = audit && audit.reason ? audit.reason : params.reason;
        if (mod.id === this.client.user.id) {
            if (reason.includes(':'))
                reason = reason.split(':').slice(1).join(':');
            else reason = undefined;
        }

        let GuildModlog = this.client.models.GuildModlog;

        let channel = await guild.data.getModlogChannel(type);
    }

    async send(channel, type, target, mod, fields) {
        let embed = this.client.Helpers.EmbedBuilder.build();


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