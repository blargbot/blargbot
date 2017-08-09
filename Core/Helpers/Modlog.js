const BaseHelper = require('./BaseHelper');
const EventEmitter = require('eventemitter3');

class ModlogHelper extends BaseHelper {
    constructor(client) {
        super(client);
        this.emitter = new EventEmitter();
    }

    get eventList() {
        return ['default', 'kick', 'ban', 'mute', 'unban', 'unmute', 'rename', 'warn', 'pardon', 'custom'];
    }

    get codeMap() {
        return {
            kick: 20,
            ban: 22,
            unban: 23,
            member_update: 24,
            member_role_update: 25
        };
    }

    get colorMap() {
        return {
            kick: 0xdb7b1c,
            ban: 0xcc0c1c,
            unban: 0x79add1,
            mute: 0xd80f66,
            unmute: 0x1cdb68,
            warn: 0xd1be79,
            pardon: 0x79d196,
            rename: 0xffee02
        };
    }

    async performModlog(guild, type, params) {
        let audit = this.codeMap.hasOwnProperty(params.code)
            ? await this.getAuditEntry(guild, params.code, params.targetID)
            : null;

        let mod = audit && audit.user ? audit.user : params.user;
        let reason = audit && audit.reason ? audit.reason : params.reason;
        if (mod.id === this.client.user.id) {
            if (reason.includes('with reason:'))
                reason = reason.split('with reason:')[1];
            else reason = undefined;
        }

        let GuildModlog = this.client.models.GuildModlog;

        let channel = await guild.data.getModlogChannel(type);

    }

    async construct(params) {
        return;
    }

    async getAuditEntry(guild, type, target) {
        try {
            let code = this.codeMap[type];
            let entries = await guild.getAuditLogs(10, undefined, code);
            for (const entry of entries.entries) {
                if (entry.targetID === target)
                    return entry;
            }
        } catch (err) { return null; }
    }

}

module.exports = ModlogHelper;