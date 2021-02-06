import { BaseUtilities } from '../core/BaseUtilities';
import request from 'request';
import { Cluster } from './Cluster';
import { GuildSettings, StoredGuildCommand, StoredGuild, StoredUser } from '../core/RethinkDb';
import { AnyChannel, GuildTextableChannel, Member, Message, Permission, Textable, TextableChannel, User } from 'eris';
import * as r from 'rethinkdb';
import { commandTypes, defaultStaff, guard, parse, snowflake } from '../newbu';
import { BaseDCommand } from '../structures/BaseDCommand';
import { BanStore } from '../structures/BanStore';
import { ModerationUtils } from '../core/ModerationUtils';
import { MessageIdQueue } from '../structures/MessageIdQueue';
import moment from 'moment';

type CanExecuteDiscordCommandOptions = {
    storedGuild?: StoredGuild,
    permOverride?: GuildSettings['permoverride'],
    staffPerms?: GuildSettings['staffperms']
};

export class ClusterUtilities extends BaseUtilities {
    readonly #guildCache: Map<string, StoredGuild>;
    readonly #userCache: Map<string, StoredUser>;
    readonly bans: BanStore;
    readonly commandMessages: MessageIdQueue;
    readonly moderation: ModerationUtils;

    constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster);
        this.#guildCache = new Map();
        this.#userCache = new Map();
        this.bans = new BanStore();
        this.moderation = new ModerationUtils(this.cluster);
        this.commandMessages = new MessageIdQueue(100);
    }

    async guildSetting<T extends keyof GuildSettings>(guildId: string, key: T): Promise<GuildSettings[T] | null> {
        let guild = await this.getGuild(guildId);
        if (guild === null || guild.settings === undefined)
            return null;

        if (!(key in guild.settings))
            return null;

        return guild.settings[key];
    }

    async processUser(user: User) {
        if (user.discriminator == '0000') return;
        let storedUser = await this.cluster.rethinkdb.getUser(user.id);
        if (!storedUser) {
            console.debug(`inserting user ${user.id} (${user.username})`);
            await this.cluster.rethinkdb.query(r =>
                r.table('user').insert({
                    userid: user.id,
                    username: user.username,
                    usernames: [{
                        name: user.username,
                        date: r.epochTime(moment().valueOf() / 1000)
                    }],
                    isbot: user.bot,
                    lastspoke: r.epochTime(moment().valueOf() / 1000),
                    lastcommand: null,
                    lastcommanddate: null,
                    discriminator: user.discriminator,
                    todo: []
                }));
        } else {
            let newUser: StoredUser = {};
            let update = false;
            if (storedUser.username != user.username) {
                newUser.username = user.username;
                newUser.usernames = storedUser.usernames ?? [];
                newUser.usernames.push({
                    name: user.username,
                    date: r.epochTime(moment().valueOf() / 1000)
                });
                update = true;
            }
            if (storedUser.discriminator != user.discriminator) {
                newUser.discriminator = user.discriminator;
                update = true;
            }
            if (storedUser.avatarURL != user.avatarURL) {
                newUser.avatarURL = user.avatarURL;
                update = true;
            }

            if (update)
                await this.cluster.rethinkdb.query(r => r.table('user').get(user.id).update(newUser));
        }
    }

    async insertChatlog(msg: Message, type: number) {
        this.cluster.metrics.chatlogCounter.labels(type === 0 ? 'create' : type === 1 ? 'update' : 'delete').inc();
        let data = {
            id: snowflake.create(),
            content: msg.content,
            attachment: msg.attachments[0] ? msg.attachments[0].url : undefined,
            userid: msg.author.id,
            msgid: msg.id,
            channelid: msg.channel.id,
            guildid: 'guild' in msg.channel ? msg.channel.guild.id : 'DM',
            msgtime: Date.now(),
            type: type,
            embeds: JSON.stringify(msg.embeds)
        };
        try {
            await this.cluster.cassandra.execute(insertChatlog, data, { prepare: true });
            await this.cluster.cassandra.execute(insertChatlogMap, { id: data.id, msgid: msg.id, channelid: msg.channel.id }, { prepare: true });
        } catch (err) {

        }
    }

    postStats() {
        var stats = {
            server_count: this.guilds.size,
            shard_count: this.shards.size,
            shard_id: this.cluster.id
        };
        this.logger.log(stats);
        request.post({
            'url': `https://discord.bots.gg/api/v1/bots/${this.user.id}/stats`,
            'headers': {
                'content-type': 'application/json',
                'Authorization': this.config.general.botlisttoken,
                'User-Agent': 'blargbot/1.0 (ratismal)'
            },
            'json': true,
            body: stats
        }, (err) => {
            if (err)
                this.logger.error(err);
        });

        if (!this.config.general.isbeta) {
            this.logger.info('Posting to matt');

            request.post({
                'url': 'https://www.carbonitex.net/discord/data/botdata.php',
                'headers': {
                    'content-type': 'application/json'
                },
                'json': true,
                body: {
                    'key': this.config.general.carbontoken,
                    'servercount': stats.server_count,
                    shard_count: stats.shard_count,
                    shard_id: stats.shard_id,
                    'logoid': this.user.avatar
                }
            }, (err) => {
                if (err)
                    this.logger.error(err);
            });

            let shards = [];
            for (const shardId of this.shards.map(s => s.id)) {
                shards[shardId] = this.guilds.filter(g => g.shard.id === shardId);
            }
            request.post({
                url: `https://discordbots.org/api/bots/${this.user.id}/stats`,
                json: true,
                headers: {
                    'content-type': 'application/json',
                    'Authorization': this.config.general.botlistorgtoken,
                    'User-Agent': 'blargbot/1.0 (ratismal)'
                },
                body: {
                    shards
                }
            }, err => {
                if (err)
                    this.logger.error(err);
            });
        }
    }

    async canExecuteCustomCommand(msg: Message<GuildTextableChannel>, command: StoredGuildCommand, quiet: boolean) {
        return command !== null
            && !command.hidden
            && (!command.roles?.length || await this.hasPerm(msg, command.roles, quiet));
    }

    hasRole(msg: Member | Message, roles: string | string[], override = true) {
        let member: Member;
        if (msg instanceof Member) {
            member = msg;
        } else {
            if (msg.member === null)
                return false;
            member = msg.member;
        }

        if (override
            && (member.id === this.cluster.config.discord.users.owner
                || member.guild.ownerID == member.id
                || member.permissions.json.administrator))
            return true;

        if (!Array.isArray(roles))
            roles = [roles];

        return roles.some(r => member.roles.includes(r));
    }


    isBotHigher(member: Member) {
        let botPos = this.getPosition(member.guild.members.get(this.cluster.discord.user.id)!);
        let memPos = this.getPosition(member);
        return botPos > memPos;
    }

    getPosition(member: Member) {
        return member.roles
            .map(r => member.guild.roles.get(r))
            .filter(guard.hasValue)
            .sort((a, b) => b.position - a.position)[0]
            ?.position ?? 0;
    }

    async canExecuteDiscordCommand(
        msg: Message<AnyChannel & Textable>,
        command: BaseDCommand,
        quiet: boolean = false,
        options: CanExecuteDiscordCommandOptions = {}
    ) {
        if (msg.author.id == this.cluster.config.discord.users.owner)
            return true;

        let category = commandTypes.properties[command.category];

        if (!guard.isGuildMessage(msg)) {
            return category.perm === undefined;
        }

        let { storedGuild, permOverride, staffPerms } = options;
        let adminrole: string | undefined;
        if (!storedGuild) {
            storedGuild = await this.getGuild(msg.channel.guild.id) ?? undefined;
            if (storedGuild?.settings) {
                permOverride = storedGuild.settings.permoverride;
                staffPerms = storedGuild.settings.staffperms;
                if (storedGuild.settings.adminrole !== undefined && storedGuild.settings.adminrole !== "")
                    adminrole = storedGuild.settings.adminrole;
            }
        }

        let commandPerms = storedGuild?.commandperms?.[command.name];
        if (commandPerms?.disabled && !command.cannotDisable)
            return false;

        if (!await category.requirement(this.cluster, msg))
            return false;

        if (permOverride) {
            staffPerms ??= defaultStaff;
            let allow = typeof staffPerms === 'number' ? staffPerms : parseInt(staffPerms);
            if (!isNaN(allow) && this.comparePerms(msg.member!, allow))
                return true;
        }

        if (commandPerms) {
            if (commandPerms.permission && this.comparePerms(msg.member!, commandPerms.permission))
                return true;

            if (commandPerms.rolename)
                return await this.hasPerm(msg, [commandPerms.rolename], quiet);
        }

        if (category.perm && !await this.hasPerm(msg, [adminrole || category.perm], quiet))
            return false;

        return true;
    }

    async isUserStaff(userId: string, guildId: string) {
        if (userId == guildId) return true;

        let guild = this.guilds.get(guildId);
        if (!guild) return false;

        let member = guild.members.get(userId);
        if (!member) return false;

        if (guild.ownerID == userId) return true;
        if (member.permissions.has('administrator')) return true;

        let storedGuild = await this.getGuild(guildId);
        if (storedGuild?.settings?.permoverride) {
            let allow = storedGuild.settings.staffperms || defaultStaff;
            if (typeof allow === 'string')
                allow = parseInt(allow);
            let member = this.guilds.get(guildId)?.members.get(userId);
            if (member && this.comparePerms(member, allow)) {
                return true;
            }
        }
        return false;
    }

    async getGuild(guildid: string) {
        if (!this.#guildCache.has(guildid)) {
            let guild = await this.rethinkdb.getGuild(guildid);
            if (guild)
                this.#guildCache.set(guildid, guild);
        }
        return this.#guildCache.get(guildid) ?? null;
    }


    async getUser(userid: string) {
        if (!this.#userCache.has(userid)) {
            let user = await this.rethinkdb.getUser(userid);
            if (user)
                this.#userCache.set(userid, user);
        }
        return this.#userCache.get(userid) ?? null;
    };

    comparePerms(member: Member, allow?: number) {
        allow ??= defaultStaff;
        let newPerm = new Permission(allow, 0);
        for (let key in newPerm.json) {
            if (member.permissions.has(key)) {
                return true;
            }
        }
        return false;
    }

    async hasPerm(msg: Member | Message, roles: string[], quiet: boolean, override = true) {
        let member: Member;
        let channel: TextableChannel | undefined;
        if (msg instanceof Member) {
            member = msg;
        } else {
            if (!('guild' in msg.channel))
                return true;
            if (!msg.member)
                return false;
            member = msg.member;
            channel = msg.channel;
        }
        if (override
            && (member.id === this.cluster.config.discord.users.owner
                || member.guild.ownerID == member.id
                || member.permissions.json.administrator)
        ) {
            return true;
        }

        roles = roles.map(p => p.toLowerCase());
        let guildRoles = member.guild.roles.filter(m =>
            roles.includes(m.name.toLowerCase())
            || roles.some(p => parse.entityId(p, "@&", true) === m.id));

        if (guildRoles.some(r => member.roles.includes(r.id)))
            return true;

        if (channel && !quiet) {
            let guild = await this.getGuild(member.guild.id);
            if (!guild?.settings?.disablenoperms) {
                let permString = roles.map(m => '`' + m + '`').join(', or ');
                this.send(channel, `You need the role ${permString} in order to use this command!`);
            }
        }
        return false;
    };

    public readonly ccommand = {
        set: async (guildid: string, key: string, value: StoredGuildCommand) => {
            let storedGuild = await this.cluster.util.getGuild(guildid);
            key = key.toLowerCase();
            if (!storedGuild)
                return false;

            if (!storedGuild.ccommands)
                storedGuild.ccommands = {};

            storedGuild.ccommands[key] = value;

            await this.cluster.rethinkdb.query(r =>
                r.table('guild')
                    .get(guildid)
                    .update({ ccommands: storedGuild!.ccommands }));
            return true;
        },
        get: async (guildid: string, key: string) => {
            let storedGuild = await this.cluster.util.getGuild(guildid);
            key = key.toLowerCase();
            if (!storedGuild?.ccommands?.[key])
                return null;

            return storedGuild.ccommands[key]!;
        },
        rename: async (guildid: string, key1: string, key2: string) => {
            let storedGuild = await this.cluster.util.getGuild(guildid);
            key1 = key1.toLowerCase();
            key2 = key2.toLowerCase();

            if (!storedGuild?.ccommands?.[key1])
                return false;

            storedGuild.ccommands[key2] = storedGuild.ccommands[key1];
            delete storedGuild.ccommands[key1];

            await this.cluster.rethinkdb.query(r =>
                r.table('guild')
                    .get(guildid)
                    .replace(storedGuild!));
            return true;
        },
        remove: async (guildid: string, key: string) => {
            let storedGuild = await this.cluster.util.getGuild(guildid);
            key = key.toLowerCase();

            if (!storedGuild?.ccommands?.[key])
                return false;

            delete storedGuild.ccommands[key];

            await this.cluster.rethinkdb.query(r =>
                r.table('guild')
                    .get(guildid)
                    .replace(storedGuild!));
            return true;
        },
        sethelp: async (guildid: string, key: string, help: string) => {
            let storedGuild = await this.cluster.util.getGuild(guildid);
            key = key.toLowerCase();

            if (!storedGuild?.ccommands?.[key])
                return false;

            storedGuild.ccommands[key]!.help = help;
            await this.cluster.rethinkdb.query(r =>
                r.table('guild')
                    .get(guildid)
                    .replace(storedGuild!));
            return true;
        },
        gethelp: async (guildid: string, key: string) => {
            let storedGuild = await this.cluster.util.getGuild(guildid);
            key = key.toLowerCase();

            return storedGuild?.ccommands?.[key]?.help;
        },
        setlang: async (guildid: string, key: string, lang: string) => {
            let storedGuild = await this.cluster.util.getGuild(guildid);
            key = key.toLowerCase();

            if (!storedGuild?.ccommands?.[key])
                return false;

            storedGuild.ccommands[key]!.lang = lang;
            await this.cluster.rethinkdb.query(r =>
                r.table('guild')
                    .get(guildid)
                    .replace(storedGuild!));
            return true;
        },
        getlang: async (guildid: string, key: string) => {
            let storedGuild = await this.cluster.util.getGuild(guildid);
            key = key.toLowerCase();

            return storedGuild?.ccommands?.[key]?.lang;
        }
    };


}


const insertChatlog = `
    INSERT INTO chatlogs (id, content, attachment, userid, msgid, channelid, guildid, msgtime, type, embeds)
        VALUES (:id, :content, :attachment, :userid, :msgid, :channelid, :guildid, :msgtime, :type, :embeds)
        USING TTL 604800
`;
const insertChatlogMap = `
    INSERT INTO chatlogs_map (id, msgid, channelid) VALUES (:id, :msgid, :channelid) USING TTL 604800
`;