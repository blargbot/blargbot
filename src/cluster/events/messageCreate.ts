import { GuildTextableChannel, Member, Message, TextableChannel, TextChannel } from 'eris';
import { Timer } from '../../structures/Timer';
import request from 'request';
import { commandTypes, createRegExp, guard, ModerationType, modlogColour, parse, randInt, sleep } from '../../newbu';
import { Cluster } from '..';
import { StoredGuildCommand, StoredGuild } from '../../core/RethinkDb';
import { BaseDCommand } from '../../structures/BaseDCommand';
import { DiscordEventService } from '../../structures/DiscordEventService';

export class MessageCreateEventHandler extends DiscordEventService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #arWhitelist: Set<string>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #whitelistInterval?: NodeJS.Timeout;

    public constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageCreate', cluster.logger);
        this.#arWhitelist = new Set<string>();
    }

    public start(): void {
        super.start();
        this.#whitelistInterval = setInterval(() => void this.checkWhitelist(), 1000 * 60 * 15);
        void this.checkWhitelist();
    }

    public stop(): void {
        super.stop();
        if (this.#whitelistInterval) {
            clearInterval(this.#whitelistInterval);
            this.#whitelistInterval = undefined;
        }
    }

    public async execute(message: Message): Promise<void> {
        const { channel, author } = message;
        if (channel instanceof TextChannel && channel.guild.shard.ready) {
            this.cluster.metrics.messageCounter.inc();
            void this.cluster.util.processUser(author);
            const storedGuild = await this.cluster.util.getGuild(channel.guild.id);
            if (storedGuild?.settings?.makelogs)
                void this.cluster.util.insertChatlog(message, 0);

            if (author.id == this.cluster.discord.user.id)
                this.handleOurMessage(message);

            if (author.id !== this.cluster.discord.user.id)
                void this.handleUserMessage(message, storedGuild);
        }
    }

    public async handleUserMessage(msg: Message, storedGuild: StoredGuild | null): Promise<void> {
        let prefix: string | undefined;
        const prefixes: string[] = [];
        const storedUser = await this.cluster.util.getCachedUser(msg.author.id);
        if (storedUser && storedUser.prefixes)
            prefixes.push(...storedUser.prefixes);

        if (guard.isGuildMessage(msg) && storedGuild !== null) {
            void this.handleAntiMention(msg, storedGuild);
            void this.handleCensor(msg, storedGuild);
            void this.handleRoleme(msg, storedGuild);
            void this.handleAutoresponse(msg, storedGuild, true);
            void this.handleTableflip(msg);
            if (storedGuild.settings) {
                if (Array.isArray(storedGuild.settings.prefix))
                    prefixes.push(...storedGuild.settings.prefix);
                else if (storedGuild.settings.prefix !== undefined)
                    prefixes.push(storedGuild.settings.prefix);
            }
        }

        if (await this.handleBlacklist(msg, storedGuild))
            return;

        prefixes.push(this.cluster.config.discord.defaultPrefix, this.cluster.discord.user.username);
        prefixes.sort((a, b) => b.length - a.length); //sort descending

        let doCleverbot = false;
        if (msg.content.startsWith(`<@${this.cluster.discord.user.id}>`)
            || msg.content.startsWith(`<@!${this.cluster.discord.user.id}>`)) {
            prefix = /<@!?[0-9]{17,21}>/.exec(msg.content)?.[0];
            this.logger.debug('Was a mention');
            doCleverbot = true;
        } else {
            for (const p of prefixes) {
                if (msg.content.toLowerCase().startsWith(p.toLowerCase())) {
                    prefix = p;
                    break;
                }
            }
        }

        if (prefix === undefined) {
            this.cluster.util.messageAwaiter.emit(msg);
            if (guard.isGuildMessage(msg) && storedGuild)
                void this.handleAutoresponse(msg, storedGuild, false);
            return;
        }

        if (storedUser?.blacklisted) {
            await this.cluster.util.send(msg, `You have been blacklisted from the bot for the following reason: ${storedUser.blacklisted}`);
            return;
        }

        try {
            const command = msg.content.substring(prefix.length).trim();
            if (await this.handleDiscordCommand(msg, command)) {
                if (guard.isGuildMessage(msg) && storedGuild)
                    this.handleDeleteNotif(msg, storedGuild);
                return;
            }

            if (doCleverbot && !msg.author.bot && !storedGuild?.settings?.nocleverbot) {
                void this.handleCleverbot(msg);
            } else {
                this.cluster.util.messageAwaiter.emit(msg);
            }

            if (guard.isGuildMessage(msg) && storedGuild)
                void this.handleAutoresponse(msg, storedGuild, false);
        } catch (err) {
            this.logger.error(err?.stack);
        }
    }

    public async flipTables(msg: Message<GuildTextableChannel>, unflip: boolean): Promise<void> {
        const tableflip = await this.cluster.util.guildSetting(msg.channel.guild.id, 'tableflip');
        if (tableflip) {
            const seed = randInt(0, 3);
            await this.cluster.util.send(msg, tables[unflip ? 'unflip' : 'flip'].prod[seed]);
        }
    }

    public async handleCustomCommand<TChannel extends GuildTextableChannel>(
        msg: Message<TChannel>,
        text: string,
        words: string[]
    ): Promise<boolean> {
        const commandName = words[0].toLowerCase();
        const command = await this.cluster.util.ccommand.get(msg.channel.guild.id, commandName);
        if (command === null || !await this.cluster.util.canExecuteCustomCommand(msg, command, true))
            return false;

        const { authorizer, alias } = command;
        let { uses = 0, content, flags, cooldown, author } = command;
        if (alias)
            ({ uses = 0, content = '', flags, cooldown, author }
                = await this.cluster.rethinkdb.getTag(alias) ?? {});

        if (!content)
            return false;

        this.logger.command(`Custom command '${text}' executed by ${msg.author.username} (${msg.author.id}) on server ${msg.channel.guild.name} (${msg.channel.guild.id})`);
        const input = text
            .replace(words[0], '')
            .trim()
            .split('\n')
            .map(l => l.trim())
            .join('\n');

        if (alias !== undefined) {
            await this.cluster.rethinkdb.query(r =>
                r.table('tag')
                    .get(alias)
                    .update({ uses: uses + 1, lastuse: r.now() }));
        }
        await this.cluster.bbtag.execute({
            context: msg,
            name: commandName,
            limits: 'ccommand',
            source: content,
            flags,
            input: input,
            isCC: true,
            tagVars: alias !== undefined,
            cooldown,
            author,
            authorizer
        });
        this.cluster.metrics.commandCounter.labels('custom', 'custom').inc();

        return true;
    }

    public async handleDiscordCommand(msg: Message<TextableChannel>, text: string): Promise<boolean> {
        if (msg.author.bot)
            return false;

        const words = parse.words(text);
        if (words.length === 0)
            return false;

        if (guard.isGuildMessage(msg) && await this.handleCustomCommand(msg, text, words))
            return true;

        const command = this.cluster.commands.get(words[0].toLowerCase());
        if (!command || !await this.cluster.util.canExecuteDiscordCommand(msg, command))
            return false;

        try {
            const outputLog = guard.isGuildMessage(msg)
                ? `Command '${text}' executed by ${msg.author.username} (${msg.author.id}) on server ${msg.channel.guild.name} (${msg.channel.guild.id})`
                : `Command '${text}' executed by ${msg.author.username} (${msg.author.id}) in a PM (${msg.channel.id}) Message ID: ${msg.id}`;
            this.logger.command(outputLog);
            const timer = new Timer().start();
            await this.executeCommand(command, msg, words, text);
            timer.end();
            this.cluster.metrics.commandLatency.labels(command.name, commandTypes.properties[command.category].name.toLowerCase()).observe(timer.elapsed);
            this.cluster.metrics.commandCounter.labels(command.name, commandTypes.properties[command.category].name.toLowerCase()).inc();
        } catch (err) {
            this.logger.error(err.stack);
            this.cluster.metrics.commandError.labels(command.name).inc();
        } finally {
            return true;
        }
    }

    public async executeCommand(command: BaseDCommand, msg: Message<TextableChannel>, words: string[], text: string): Promise<void> {
        try {
            await command.execute(msg, words, text);
        } catch (err) {
            this.logger.error(err);
            if (err.code === 50001 && !(await this.cluster.rethinkdb.getUser(msg.author.id))?.dontdmerrors) {
                if (!guard.isGuildChannel(msg.channel))
                    void this.cluster.util.sendDM(msg.author,
                        'Oops, I dont seem to have permission to do that!');
                else
                    void this.cluster.util.sendDM(msg.author,
                        'Hi! You asked me to do something, but I didn\'t have permission to do it! Please make sure I have permissions to do what you asked.\n' +
                        `Guild: ${msg.channel.guild.name}\n` +
                        `Channel: ${msg.channel.name}\n` +
                        `Command: ${msg.content}\n` +
                        '\n' +
                        'If you wish to stop seeing these messages, do the command `dmerrors`.');
            }
            throw err;
        }
    }



    public handleOurMessage(msg: Message): void {
        if (guard.isGuildChannel(msg.channel))
            this.logger.output(`${msg.channel.guild.name} (${msg.channel.guild.id})> ${msg.channel.name} ` +
                `(${msg.channel.id})> ${msg.author.username}> ${msg.content} (${msg.id})`);
        else
            this.logger.output(`PM> ${msg.channel.recipient.username} (${msg.channel.id})> ` +
                `${msg.author.username}> ${msg.content} (${msg.id})`);
    }

    public async handleAntiMention(msg: Message<GuildTextableChannel>, storedGuild: StoredGuild): Promise<void> {
        const antimention = storedGuild.settings?.antimention;
        if (antimention === undefined)
            return;

        const parsedAntiMention = parseInt(antimention);
        if (parsedAntiMention === 0 || isNaN(parsedAntiMention) || msg.mentions.length < parsedAntiMention)
            return;

        this.cluster.util.bans.set(msg.channel.guild.id, msg.author.id, {
            mod: this.cluster.discord.user,
            type: 'Auto-Ban',
            reason: 'Mention spam'
        });

        try {
            await this.cluster.discord.banGuildMember(msg.channel.guild.id, msg.author.id, 1);
        } catch (err) {
            this.cluster.util.bans.clear(msg.channel.guild.id, msg.author.id);
            await this.cluster.util.send(msg, `${msg.author.username} is mention spamming, but I lack the permissions to ban them!`);
        }
    }

    public async handleCensor(msg: Message<GuildTextableChannel>, storedGuild: StoredGuild): Promise<void> {
        const censor = storedGuild.censor;
        if (!censor?.list?.length)
            return;

        //First, let's check exceptions
        const { channel, user, role } = censor.exception ?? {};
        if ((channel?.length && channel.includes(msg.channel.id))
            || (user?.length && user.includes(msg.author.id))
            || (role?.length && msg.member && this.cluster.util.hasRole(msg.member, role)))
            return;

        for (const cens of censor.list) {
            const term = cens.term;
            if (cens.regex) {
                try {
                    const regex = createRegExp(term);
                    if (!regex.test(msg.content))
                        continue;
                } catch (err) { }
            }
            else if (!msg.content.toLowerCase().includes(term.toLowerCase()))
                continue;

            const res = await this.cluster.util.moderation.warn(msg.author, msg.channel.guild, cens.weight);
            if (cens.weight > 0) {
                await this.cluster.util.moderation.log(
                    msg.channel.guild,
                    msg.author,
                    this.cluster.discord.user,
                    'Auto-Warning',
                    cens.reason || 'Said a blacklisted phrase.',
                    modlogColour.WARN,
                    [
                        {
                            name: 'Warnings',
                            value: `Assigned: ${cens.weight}\nNew Total: ${res?.count || 0}`,
                            inline: true
                        }
                    ]);
            }
            try {
                await msg.delete();
            } catch (err) {
                // bu.send(msg, `${bu.getFullName(msg.author)} said a blacklisted word, but I was not able to delete it.`);
            }
            let content = '';
            switch (res?.type) {
                case ModerationType.KICK:
                    content = cens.deleteMessage ?? censor.rule?.deleteMessage ?? ''; // TODO cant find the definition for the default messages
                    break;
                case ModerationType.BAN:
                    content = cens.banMessage ?? censor.rule?.banMessage ?? ''; // TODO cant find the definition for the default messages
                    break;
                case ModerationType.WARN:
                    content = cens.kickMessage ?? censor.rule?.kickMessage ?? ''; // TODO cant find the definition for the default messages
                    break;
            }
            await this.cluster.bbtag.execute({
                context: msg,
                name: 'censor',
                limits: 'ccommand',
                source: content,
                input: msg.content,
                isCC: true
            });
        }
    }

    public async handleRoleme(msg: Message<GuildTextableChannel>, storedGuild: StoredGuild): Promise<void> {
        if (!storedGuild?.roleme?.length || !msg.member)
            return;

        const rolemes = storedGuild.roleme.filter(m => m.channels.indexOf(msg.channel.id) > -1 || m.channels.length == 0);
        if (rolemes.length == 0)
            return;

        for (const roleme of rolemes) {
            let message = roleme.message;
            let content = msg.content;
            if (!roleme.casesensitive) {
                message = message.toLowerCase();
                content = content.toLowerCase();
            }
            if (message !== content)
                continue;

            const roleList = new Set(msg.member.roles);
            roleme.add?.forEach(r => roleList.add(r));
            roleme.remove?.forEach(r => roleList.add(r));

            try {
                await msg.member.edit({ roles: [...roleList] });
                this.logger.verbose(roleme.output);
                await this.cluster.bbtag.execute({
                    context: msg,
                    name: 'roleme',
                    limits: 'ccommand',
                    source: roleme.output || 'Your roles have been edited!',
                    input: '',
                    isCC: true
                });
            } catch (err) {
                await this.cluster.util.send(msg, 'A roleme was triggered, but I don\'t have the permissions required to give you your role!');
            }
        }
    }

    public async checkWhitelist(): Promise<void> {
        const whitelist = await this.cluster.rethinkdb.getVar('arwhitelist');
        this.#arWhitelist = new Set(whitelist?.values);
    }

    public defaultMember(msg: Message<GuildTextableChannel>, tag: StoredGuildCommand): Member | null {
        if (msg.member)
            return msg.member;

        const id = tag.authorizer || tag.author;
        if (!id)
            return null;

        return msg.channel.guild.members.get(id) ?? null;
    }

    public async handleAutoresponse(msg: Message<GuildTextableChannel>, storedGuild: StoredGuild, everything = false): Promise<void> {
        if (!this.#arWhitelist.has(msg.channel.guild.id) || msg.author.discriminator === '0000')
            return;

        if (storedGuild && storedGuild.autoresponse && storedGuild.ccommands) {
            const ars = storedGuild.autoresponse;
            if (everything) {
                if (ars.everything && storedGuild.ccommands[ars.everything.executes]) {
                    const tag = storedGuild.ccommands[ars.everything.executes];
                    if (tag) {
                        await this.cluster.bbtag.execute({
                            context: msg,
                            limits: 'autoresponse_everything',
                            source: tag.content,
                            author: tag.author,
                            input: msg.content,
                            isCC: true,
                            name: ars.everything.executes,
                            silent: true
                        });
                    }
                }
            } else if (ars.list?.length) {
                for (const ar of ars.list) {
                    if (ar.regex) {
                        try {
                            const exp = createRegExp(ar.term);
                            if (exp.exec(msg.content) === null)
                                continue;
                        } catch (err) {
                            this.logger.log(err);
                            await this.cluster.util.send(msg, 'Unsafe or invalid regex! Terminating.');
                            return;
                        }
                    } else if (!msg.content.includes(ar.term))
                        continue;

                    if (storedGuild.ccommands[ar.executes]) {
                        const tag = storedGuild.ccommands[ar.executes];
                        if (tag) {
                            await this.cluster.bbtag.execute({
                                context: msg,
                                limits: 'autoresponse_general',
                                source: tag.content,
                                author: tag.author,
                                input: msg.content,
                                isCC: true,
                                name: ar.executes
                            });
                        }
                    }
                }
            }
        }
    }

    public async handleBlacklist(msg: Message, storedGuild: StoredGuild | null): Promise<boolean> {
        if (!(guard.isGuildMessage(msg) && storedGuild?.channels?.[msg.channel.id]))
            return false;

        return !!storedGuild.channels[msg.channel.id]?.blacklisted
            && !await this.cluster.util.isUserStaff(msg.author.id, msg.channel.guild.id);
    }

    public handleDeleteNotif(msg: Message<GuildTextableChannel>, storedGuild: StoredGuild): void {
        const deletenotif = storedGuild.settings?.deletenotif;
        if (deletenotif && deletenotif != '0')
            this.cluster.util.commandMessages.push(msg.channel.guild.id, msg.id);
    }


    public queryCleverbot(input: string): Promise<string> {
        return new Promise<string>((res, rej) => {
            request.post(this.cluster.config.cleverbot.endpoint, { form: { input } }, (err, _, bod: string) => {
                if (err) rej(err);
                else {
                    const content = /<font size="2" face="Verdana" color=darkred>(.+)<\/font>/.exec(bod);
                    if (content)
                        return res(content[1].replace(/(\W)alice(\W)/gi, '$1blargbot$2').replace(/<br>/gm, '\n'));
                    res('Hi, I\'m blargbot! It\'s nice to meet you.');
                }
            });
        });
    }

    public async handleCleverbot(msg: Message): Promise<void> {
        await this.cluster.discord.sendChannelTyping(msg.channel.id);
        let username = this.cluster.discord.user.username;
        if (guard.isGuildMessage(msg)) {
            const member = msg.channel.guild.members.get(this.cluster.discord.user.id);
            if (member?.nick)
                username = member.nick;
        }

        const msgToSend = msg.content.replace(new RegExp('@' + '\u200b' + username + ',?'), '').trim();
        this.cluster.metrics.cleverbotStats.inc();
        try {
            const response = await this.queryCleverbot(msgToSend);
            await sleep(1500);
            await this.cluster.util.send(msg, response);
        } catch (err) {
            this.logger.error(err);
            await this.cluster.util.send(msg, 'Failed to contact the API. Blame cleverbot.io');
        }
    }

    public async handleTableflip(msg: Message<GuildTextableChannel>): Promise<void> {
        if (msg.content.indexOf('(╯°□°）╯︵ ┻━┻') > -1 && !msg.author.bot) {
            await this.flipTables(msg, false);
        }
        if (msg.content.indexOf('┬─┬﻿ ノ( ゜-゜ノ)') > -1 && !msg.author.bot) {
            await this.flipTables(msg, true);
        }
    }
}

const tables = {
    flip: {
        prod: [
            'Whoops! Let me get that for you ┬──┬﻿ ¯\\\\_(ツ)',
            '(ヘ･_･)ヘ┳━┳ What are you, an animal?',
            'Can you not? ヘ(´° □°)ヘ┳━┳',
            'Tables are not meant to be flipped ┬──┬ ノ( ゜-゜ノ)',
            '(ﾉ´･ω･)ﾉ ﾐ ┸━┸ Wheee!',
            '┻━┻ ︵ヽ(`Д´)ﾉ︵﻿ ┻━┻ Get these tables out of my face!',
            '┻━┻ミ＼(≧ﾛ≦＼) Hey, catch!',
            'Flipping tables with elegance! (/¯◡ ‿ ◡)/¯ ~ ┻━┻'
        ]
    },
    unflip: {
        prod: [
            '┬──┬﻿ ¯\\\\_(ツ) A table unflipped is a table saved!',
            '┣ﾍ(≧∇≦ﾍ)… (≧∇≦)/┳━┳ Unflip that table!',
            'Yay! Cleaning up! ┣ﾍ(^▽^ﾍ)Ξ(ﾟ▽ﾟ*)ﾉ┳━┳',
            'ヘ(´° □°)ヘ┳━┳ Was that so hard?',
            '(ﾉ´･ω･)ﾉ ﾐ ┸━┸ Here comes the entropy!',
            'I\'m sorry, did you just pick that up? ༼ﾉຈل͜ຈ༽ﾉ︵┻━┻',
            'Get back on the ground! (╯ರ ~ ರ）╯︵ ┻━┻',
            'No need to be so serious! (ﾉ≧∇≦)ﾉ ﾐ ┸━┸'
        ]
    }
};