const moment = require('moment-timezone');
const { BaseEventHandler } = require('../structures/BaseEventHandler');
const { humanize } = require('../newbu');

class ReadyEventHandler extends BaseEventHandler {
    /**
     * @param {import('../cluster').Cluster} cluster
     */
    constructor(cluster) {
        super(cluster.discord, 'ready', cluster.logger);
        this.cluster = cluster;

        this.obtainEventTimer;
        this.processEventTimer;
    }

    async handle() {
        this.cluster.sender.send('ready', this.cluster.discord.guilds.map(g => g.id));
        this.logger.init(`Ready! Logged in as ${this.cluster.discord.user.username}#${this.cluster.discord.user.discriminator}`);

        let home;
        if (home = this.cluster.discord.guilds.get(this.cluster.config.discord.guilds.home)) {
            let police = home.members.filter(m => m.roles.includes(this.cluster.config.discord.roles.police)).map(m => m.id);
            await this.cluster.rethinkdb.table('vars').get('police').replace({
                value: police, varname: 'police'
            });
            let support = home.members.filter(m => m.roles.includes(this.cluster.config.discord.roles.support)).map(m => m.id);
            await this.cluster.rethinkdb.table('vars').get('support').replace({
                value: support, varname: 'support'
            });
        }

        if (this.cluster.id == 0) {
            let restart = await this.cluster.rethinkdb.table('vars').get('restart').run();
            if (restart && restart.varvalue) {
                this.cluster.util.send(restart.varvalue.channel, 'Ok I\'m back. It took me ' + humanize.duration(moment(), moment(restart.varvalue.time)) + '.');
                this.cluster.rethinkdb.table('vars').get('restart').delete().run();
            }
        }

        this.cluster.metrics.guildGauge.set(this.cluster.discord.guilds.size);

        let guilds = (await this.cluster.rethinkdb.table('guild').withFields('guildid').run()).map(g => g.guildid);
        //console.dir(guilds);
        this.cluster.discord.guilds.forEach(async (g) => {
            if (guilds.indexOf(g.id) == -1) {
                let guild = this.cluster.discord.guilds.get(g.id);
                let members = guild.memberCount;
                let users = guild.members.filter(m => !m.user.bot).length;
                let bots = guild.members.filter(m => m.user.bot).length;
                let percent = Math.floor(bots / members * 10000) / 100;
                var message = `:ballot_box_with_check: Guild: \`${guild.name}\`` +
                    ` (\`${guild.id}\`)! ${percent >= 80 ? '- ***BOT GUILD***' : ''}\n   Total: **${members}** | Users: **${users}** | Bots: **${bots}** | Percent: **${percent}**`;
                this.cluster.util.send(this.cluster.config.discord.channels.joinlog, message);

                this.logger.log('Inserting a missing guild ' + g.id);
                await this.cluster.rethinkdb.table('guild').insert({
                    guildid: g.id,
                    active: true,
                    name: g.name,
                    settings: {},
                    channels: {},
                    commandperms: {},
                    ccommands: {},
                    modlog: []
                }).run();
            }
            // bu.guildCache[g.id] = await r.table('guild').get(g.id);
        });

        // gameId = bu.getRandomInt(0, 4);
        // if (config.general.isbeta)
        //     bu.avatarId = 4;
        // else
        //     bu.avatarId = 0;
        // switchGame();
        this.cluster.util.postStats();
        this.initEvents();

        let blacklist = await this.cluster.rethinkdb.table('vars').get('guildBlacklist');

        for (const g of Object.keys(blacklist.values)) {
            if (blacklist.values[g] && this.cluster.discord.guilds.get(g)) {
                let guild = this.cluster.discord.guilds.get(g);
                try {
                    let owner = guild.members.get(guild.ownerID).user;
                    let pc = await owner.getDMChannel();

                    await pc.createMessage(`Greetings! I regret to inform you that your guild, **${guild.name}** (${guild.id}), is on my blacklist. Sorry about that! I'll be leaving now. I hope you have a nice day.`);
                } catch (err) { }
                return await guild.leave();
            }
        }
    }

    async initEvents() {
        this.logger.init('Starting event interval!');
        if (this.obtainEventTimer)
            clearInterval(this.obtainEventTimer);
        this.obtainEventTimer = setInterval(() => {
            this.cluster.triggers.obtain();
        }, 5 * 60 * 1000);

        if (this.processEventTimer)
            clearInterval(this.processEventTimer);
        this.processEventTimer = setInterval(() => {
            this.cluster.triggers.process();
        }, 10 * 1000);

        await this.cluster.triggers.obtain();
        await this.cluster.triggers.process();
    }
}

module.exports = { ReadyEventHandler };