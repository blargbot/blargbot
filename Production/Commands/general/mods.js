const { GeneralCommand } = require('../../../Core/Structures/Command');

class ModsCommand extends GeneralCommand {
    constructor(client) {
        super(client, {
            name: 'mods',
            keys: {
                mods: { key: '.mods', value: 'Mods on **{{guild}}**' },
                nomods: { key: '.nomods', value: 'There are no mods on this guild.' },
                nomodsstatus: { key: '.nomodsonline', value: 'There are no online mods.' }
            },
            aliases: ['staff']
        });
    }

    get online() { return '<:online:313956277808005120>'; }
    get away() { return '<:away:313956277220802560>'; }
    get dnd() { return '<:dnd:313956276893646850>'; }
    get offline() { return '<:offline:313956277237710868>'; }

    sortUsers(a, b) { return a.user.fullName.toLowerCase() > b.user.fullName.toLowerCase(); }

    async execute(ctx) {
        const mods = (await Promise.filter(ctx.channel.guild.members, async m => await ctx.checkStaff(m[0])))
            .map(m => m[1]);
        if (mods.length === 0)
            return await ctx.decodeAndSend(this.keys.nomods);

        let online = mods.filter(m => m.status === 'online').sort(this.sortUsers);
        let offline = mods.filter(m => m.status === 'offline').sort(this.sortUsers);
        let away = mods.filter(m => m.status === 'idle').sort(this.sortUsers);
        let dnd = mods.filter(m => m.status === 'dnd').sort(this.sortUsers);
        let onlineOnly = false;
        if (ctx.input._[0] && ['o', 'online'].includes(ctx.input._[0].toLowerCase())) {
            onlineOnly = true;
        }

        if (onlineOnly && online.length === 0)
            return await ctx.decodeAndSend(this.keys.nomodsstatus);

        let msg = await ctx.decode(this.keys.mods, { guild: ctx.guild.name }) + '\n';
        let arrs = [];
        arrs.push(online.map(m => `${this.online} **${m.user.fullName}** (${m.user.id})`).join('\n'));
        if (!onlineOnly) {
            arrs.push(away.map(m => `${this.away} **${m.user.fullName}** (${m.user.id})`).join('\n'));
            arrs.push(dnd.map(m => `${this.dnd} **${m.user.fullName}** (${m.user.id})`).join('\n'));
            arrs.push(offline.map(m => `${this.offline} **${m.user.fullName}** (${m.user.id})`).join('\n'));
        }
        msg += arrs.filter(m => m.length > 0).join('\n');
        return await ctx.send(msg);
    }
}

module.exports = ModsCommand;