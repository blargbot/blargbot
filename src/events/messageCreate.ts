import { AnyChannel, AnyGuildChannel, Guild, GuildChannel, GuildTextableChannel, Message, Textable, TextableChannel, TextChannel, User } from 'eris';
import { BaseEventHandler } from '../structures/BaseEventHandler';
import CleverbotIO from 'better-cleverbot-io';
import { Timer } from '../structures/Timer';
import request from 'request';
import { commandTypes, createRegExp, guard, ModerationType, modlogColour, parse, randInt, sleep, snowflake } from '../newbu';
import { Cluster } from '../cluster';
import { StoredGuildCommand, StoredGuild, StoredTag } from '../core/RethinkDb';
import { BaseDCommand } from '../structures/BaseDCommand';

class MessageCreateEventHandler extends BaseEventHandler {
    readonly #cleverCache: {};
    readonly #cleverbot: CleverbotIO;
    #arWhitelist: Set<string>;
    #whitelistInterval?: NodeJS.Timeout;

    constructor(
        public readonly cluster: Cluster
    ) {
        super(cluster.discord, 'messageCreate', cluster.logger);
        this.#arWhitelist = new Set<string>();
        this.#cleverCache = {};
        this.#cleverbot = new CleverbotIO({
            user: this.cluster.config.cleverbot.ioid,
            key: this.cluster.config.cleverbot.iokey,
            nick: 'blargbot' + snowflake.create()
        });

        this.#cleverbot.create().then(session => {
            this.logger.init('Cleverbot.io initialized with session', session);
        });
    }

    install() {
        super.install();
        this.#whitelistInterval = setInterval(() => this.checkWhitelist(), 1000 * 60 * 15);
        this.checkWhitelist();
    }

    uninstall() {
        super.uninstall();
        if (this.#whitelistInterval) {
            clearInterval(this.#whitelistInterval);
            this.#whitelistInterval = undefined;
        }
    }

    async handle(message: Message) {
        const { channel, author, member } = message;
        if (channel instanceof TextChannel && channel.guild.shard.ready) {
            this.cluster.metrics.messageCounter.inc();
            this.cluster.util.processUser(author);
            let storedGuild = await this.cluster.util.getGuild(channel.guild.id);
            if (storedGuild?.settings?.makelogs)
                this.cluster.util.insertChatlog(message, 0);

            if (author.id == this.cluster.discord.user.id)
                this.handleOurMessage(message);

            if (author.id !== this.cluster.discord.user.id)
                this.handleUserMessage(message, storedGuild);
        }
    }

    async handleUserMessage(msg: Message, storedGuild: StoredGuild | null) {
        let prefix: string | undefined;
        let prefixes: string[] = [];
        let storedUser = await this.cluster.util.getUser(msg.author.id);
        if (storedUser && storedUser.prefixes)
            prefixes.push(...storedUser.prefixes);

        if (guard.isGuildMessage(msg) && storedGuild !== null) {
            this.handleAntiMention(msg, storedGuild);
            this.handleCensor(msg, storedGuild);
            this.handleRoleme(msg, storedGuild);
            this.handleAutoresponse(msg, storedGuild, true);
            this.handleTableflip(msg);
            if (Array.isArray(storedGuild.settings?.prefix))
                prefixes.push(...storedGuild.settings!.prefix);
            else if (storedGuild.settings?.prefix !== undefined)
                prefixes.push(storedGuild.settings.prefix);
        }

        if (await this.handleBlacklist(msg, storedGuild))
            return;

        prefixes.push(this.cluster.config.discord.defaultPrefix, this.cluster.discord.user.username);
        prefixes.sort((a, b) => b.length - a.length); //sort descending

        let doCleverbot = false;
        if (msg.content.startsWith(`<@${this.cluster.discord.user.id}>`)
            || msg.content.startsWith(`<@!${this.cluster.discord.user.id}>`)) {
            prefix = msg.content.match(/<@!?[0-9]{17,21}>/)![0];
            console.debug('Was a mention');
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
                this.handleAutoresponse(msg, storedGuild, false);
            return;
        }

        if (storedUser?.blacklisted) {
            await this.cluster.util.send(msg, 'You have been blacklisted from the bot for the following reason: ' + storedUser.blacklisted);
            return;
        }

        try {
            let command = msg.content.substring(prefix.length).trim();
            if (await this.handleDiscordCommand(msg, command)) {
                if (guard.isGuildMessage(msg) && storedGuild)
                    this.handleDeleteNotif(msg, storedGuild);
                return;
            }

            if (doCleverbot && !msg.author.bot && !storedGuild?.settings?.nocleverbot) {
                this.handleCleverbot(msg);
            } else {
                this.cluster.util.messageAwaiter.emit(msg);
            }

            if (guard.isGuildMessage(msg) && storedGuild)
                this.handleAutoresponse(msg, storedGuild, false);
        } catch (err) {
            this.logger.error(err?.stack);
        }
    }

    sendMessageToIrc(msg: string) {
        this.cluster.sender.send('ircMessage', msg);
    }


    async flipTables(msg: Message<GuildTextableChannel>, unflip: boolean) {
        let tableflip = await this.cluster.util.guildSetting(msg.channel.guild.id, 'tableflip');
        if (tableflip) {
            var seed = randInt(0, 3);
            this.cluster.util.send(msg, tables[unflip ? 'unflip' : 'flip'].prod[seed]);
        }
    };

    async handleCustomCommand<TChannel extends GuildTextableChannel>(msg: Message<TChannel>, text: string, words: string[]) {
        let commandName = words[0].toLowerCase();
        let command = await this.cluster.util.ccommand.get(msg.channel.guild.id, commandName);
        if (command === null || !await this.cluster.util.canExecuteCustomCommand(msg, command, true))
            return false;

        let { authorizer, alias, uses = 0, content, flags, cooldown, author } = command ?? {};
        if (alias)
            ({ uses = 0, content = '', flags, cooldown, author }
                = await this.cluster.rethinkdb.getTag(alias) ?? {});

        if (!content)
            return false;

        this.logger.command(`Custom command '${text}' executed by ${msg.author.username} (${msg.author.id}) on server ${msg.channel.guild.name} (${msg.channel.guild.id})`);
        let input = text
            .replace(words[0], '')
            .trim()
            .split('\n')
            .map(l => l.trim())
            .join('\n');

        if (alias !== undefined) {
            await this.cluster.rethinkdb.query(r =>
                r.table('tag')
                    .get(alias!)
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

    async handleDiscordCommand(msg: Message<TextableChannel>, text: string) {
        if (msg.author.bot)
            return false;

        let words = parse.words(text);
        if (words.length === 0)
            return false;

        if (guard.isGuildMessage(msg) && await this.handleCustomCommand(msg, text, words))
            return true;

        let command = this.cluster.commands.get(words[0].toLowerCase());
        if (!command || !await this.cluster.util.canExecuteDiscordCommand(msg, command))
            return false;

        try {
            let outputLog = guard.isGuildMessage(msg)
                ? `Command '${text}' executed by ${msg.author.username} (${msg.author.id}) on server ${msg.channel.guild.name} (${msg.channel.guild.id})`
                : `Command '${text}' executed by ${msg.author.username} (${msg.author.id}) in a PM (${msg.channel.id}) Message ID: ${msg.id}`;
            this.logger.command(outputLog);
            let timer = new Timer().start();
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

    async executeCommand(command: BaseDCommand, msg: Message<TextableChannel>, words: string[], text: string) {
        try {
            await command.execute(msg, words, text);
        } catch (err) {
            this.logger.error(err);
            if (err.code === 50001 && !(await this.cluster.rethinkdb.getUser(msg.author.id))?.dontdmerrors) {
                if (!guard.isGuildChannel(msg.channel))
                    this.cluster.util.sendDM(msg.author,
                        `Oops, I dont seem to have permission to do that!`);
                else
                    this.cluster.util.sendDM(msg.author,
                        `Hi! You asked me to do something, but I didn't have permission to do it! Please make sure I have permissions to do what you asked.\n` +
                        `Guild: ${msg.channel.guild.name}\n` +
                        `Channel: ${msg.channel.name}\n` +
                        `Command: ${msg.content}\n` +
                        `\n` +
                        `If you wish to stop seeing these messages, do the command \`dmerrors\`.`);
            }
            throw err;
        }
    };



    handleOurMessage(msg: Message) {
        if (guard.isGuildChannel(msg.channel))
            this.logger.output(`${msg.channel.guild.name} (${msg.channel.guild.id})> ${msg.channel.name} ` +
                `(${msg.channel.id})> ${msg.author.username}> ${msg.content} (${msg.id})`);
        else
            this.logger.output(`PM> ${msg.channel.recipient.username} (${msg.channel.id})> ` +
                `${msg.author.username}> ${msg.content} (${msg.id})`);
    }

    async handleAntiMention(msg: Message<GuildTextableChannel>, storedGuild: StoredGuild) {
        let antimention = storedGuild.settings?.antimention;
        if (antimention === undefined)
            return;

        let parsedAntiMention = parseInt(antimention);
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
            this.cluster.util.send(msg, `${msg.author.username} is mention spamming, but I lack the permissions to ban them!`);
        }
    }

    async handleCensor(msg: Message<GuildTextableChannel>, storedGuild: StoredGuild) {
        let censor = storedGuild.censor;
        if (!censor?.list?.length)
            return;

        //First, let's check exceptions
        let { channel, user, role } = censor.exception ?? {};
        if ((channel?.length && channel.includes(msg.channel.id))
            || (user?.length && user.includes(msg.author.id))
            || (role?.length && msg.member && this.cluster.util.hasRole(msg.member, role)))
            return;

        for (const cens of censor.list) {
            let term = cens.term;
            if (cens.regex) {
                try {
                    let regex = createRegExp(term);
                    if (!regex.test(msg.content))
                        continue;
                } catch (err) { }
            }
            else if (!msg.content.toLowerCase().includes(term.toLowerCase()))
                continue;

            let res = await this.cluster.util.moderation.warn(msg.author, msg.channel.guild, cens.weight);
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
                isCC: true,
            });
        }
    };

    async handleRoleme(msg: Message<GuildTextableChannel>, storedGuild: StoredGuild) {
        if (!storedGuild?.roleme?.length || !msg.member)
            return;

        let rolemes = storedGuild.roleme.filter(m => m.channels.indexOf(msg.channel.id) > -1 || m.channels.length == 0);
        if (rolemes.length == 0)
            return;

        for (let roleme of rolemes) {
            let { casesensitive, message } = roleme;
            let content = msg.content;
            if (!casesensitive) {
                message = message.toLowerCase();
                content = content.toLowerCase();
            }
            if (message !== content)
                continue;

            let roleList = new Set(msg.member.roles);
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
                    isCC: true,
                });
            } catch (err) {
                this.cluster.util.send(msg, 'A roleme was triggered, but I don\'t have the permissions required to give you your role!');
            }
        }
    }

    async checkWhitelist() {
        let whitelist = await this.cluster.rethinkdb.getVar('arwhitelist');
        this.#arWhitelist = new Set(whitelist?.values);
    }

    defaultMember(msg: Message<GuildTextableChannel>, tag: StoredGuildCommand) {
        if (msg.member)
            return msg.member;

        const id = tag.authorizer || tag.author;
        if (!id)
            return undefined;

        return msg.channel.guild.members.get(id);
    }

    async handleAutoresponse(msg: Message<GuildTextableChannel>, storedGuild: StoredGuild, everything = false) {
        if (!this.#arWhitelist.has(msg.channel.guild.id)) return; // selective whitelist for now
        if (!msg.member && msg.author.discriminator !== '0000') {
            // skip over non-members who aren't webhooks
            return;
        }

        if (storedGuild && storedGuild.autoresponse && storedGuild.ccommands) {
            let ars = storedGuild.autoresponse;
            // let m = {
            //     ...msg,
            //     guild: msg.guild
            // };
            if (everything) {
                if (ars.everything && storedGuild.ccommands[ars.everything.executes]) {
                    const tag = storedGuild.ccommands[ars.everything.executes]!;
                    // TODO Why were we replacing the message objects member?
                    // if (!this.defaultMember(m, tag))
                    //     return;
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
                return;
            }

            if (ars.list?.length) {
                for (const ar of ars.list) {
                    if (ar.regex) {
                        try {
                            let exp = createRegExp(ar.term);
                            if (msg.content.match(exp) === null)
                                continue;
                        } catch (err) {
                            console.log(err);
                            this.cluster.util.send(msg, 'Unsafe or invalid regex! Terminating.');
                            return;
                        }
                    } else if (!msg.content.includes(ar.term))
                        continue;

                    if (storedGuild.ccommands[ar.executes]) {
                        const tag = storedGuild.ccommands[ar.executes]!;
                        if (!this.defaultMember(msg, tag)) return;
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

    async handleBlacklist(msg: Message, storedGuild: StoredGuild | null) {
        if (!(guard.isGuildMessage(msg) && storedGuild?.channels?.[msg.channel.id]))
            return false;

        return storedGuild.channels[msg.channel.id]!.blacklisted
            && !await this.cluster.util.isUserStaff(msg.author.id, msg.channel.guild.id)
    }

    handleDeleteNotif(msg: Message<GuildTextableChannel>, storedGuild: StoredGuild) {
        let deletenotif = storedGuild.settings?.deletenotif;
        if (deletenotif && deletenotif != '0')
            this.cluster.util.commandMessages.push(msg.channel.guild.id, msg.id);
    }


    queryCleverbot(input: string) {
        return new Promise<string>((res, rej) => {
            request.post(this.cluster.config.cleverbot.endpoint, { form: { input } }, (err, re, bod) => {
                if (err) rej(err);
                else {
                    let content = bod.match(/<font size="2" face="Verdana" color=darkred>(.+)<\/font>/);
                    if (content)
                        res(content[1].replace(/(\W)alice(\W)/gi, '$1blargbot$2').replace(/<br>/gm, '\n'));
                    else res('Hi, I\'m blargbot! It\'s nice to meet you.');
                }
            });
        });
    }

    async handleCleverbot(msg: Message) {
        await this.cluster.discord.sendChannelTyping(msg.channel.id);
        let username = this.cluster.discord.user.username;
        if (guard.isGuildMessage(msg)) {
            let member = msg.channel.guild.members.get(this.cluster.discord.user.id);
            if (member?.nick)
                username = member.nick;
        }

        let msgToSend = msg.content.replace(new RegExp('@' + '\u200b' + username + ',?'), '').trim();
        this.cluster.metrics.cleverbotStats.inc();
        try {
            let response = await this.queryCleverbot(msgToSend);
            await sleep(1500);
            await this.cluster.util.send(msg, response);
        } catch (err) {
            try {
                //cleverbot.setNick('blargbot' + msg.channel.id);
                let response = await this.#cleverbot.ask(msgToSend);
                await sleep(1500);
                await this.cluster.util.send(msg, response);
            } catch (err) {
                console.error(err);
                await sleep(1500);
                await this.cluster.util.send(msg, `Failed to contact the API. Blame cleverbot.io`);
            }
        }
    }

    handleTableflip(msg: Message<GuildTextableChannel>) {
        if (msg.content.indexOf('(╯°□°）╯︵ ┻━┻') > -1 && !msg.author.bot) {
            this.flipTables(msg, false);
        }
        if (msg.content.indexOf('┬─┬﻿ ノ( ゜-゜ノ)') > -1 && !msg.author.bot) {
            this.flipTables(msg, true);
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