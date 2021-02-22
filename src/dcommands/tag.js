"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagCommand = void 0;
const moment_1 = __importDefault(require("moment"));
const command_1 = require("../core/command");
const utils_1 = require("../utils");
class TagCommand extends command_1.BaseCommand {
    constructor(cluster) {
        super(cluster, {
            name: 'tag',
            aliases: ['t'],
            category: utils_1.commandTypes.GENERAL,
            info: 'Tags are a system of public commands that anyone can create or run, using the BBTag language.\n',
            handler: {
                parameters: '{tagName} {args*}',
                execute: () => '',
                subcommands: {
                    'create|add': {
                        parameters: '{tagName?} {content*}',
                        execute: (msg, [tagName], _, raw) => this.createTag(msg, tagName, utils_1.humanize.smartSplitSkip(raw, 2)),
                        description: 'Creates a new tag with the content you give'
                    },
                    'edit': {
                        parameters: '{tagName?} {content*}',
                        execute: (msg, [tagName], _, raw) => this.editTag(msg, tagName, utils_1.humanize.smartSplitSkip(raw, 2)),
                        description: 'Edits an existing tag to have the content you specify'
                    },
                    'set': {
                        parameters: '{tagName?} {content*}',
                        execute: (msg, [tagName], _, raw) => this.setTag(msg, tagName, utils_1.humanize.smartSplitSkip(raw, 2)),
                        description: 'Sets the tag to have the content you specify. If the tag doesnt exist it will be created.'
                    },
                    'delete|remove': {
                        parameters: '{tagName?}',
                        execute: (msg, [tagName]) => this.deleteTag(msg, tagName),
                        description: 'Deletes an existing tag'
                    },
                    'rename': {
                        parameters: '{oldName?} {newName?}',
                        execute: (msg, [oldName, newName]) => this.renameTag(msg, oldName, newName),
                        description: 'Renames the tag'
                    },
                    'raw': {
                        parameters: '{tagName?}',
                        execute: (msg, [tagName]) => this.getRawTag(msg, tagName),
                        description: ''
                    },
                    'list': {
                        parameters: '{author*}',
                        execute: (msg, [author]) => this.listTags(msg, author.join('')),
                        description: ''
                    },
                    'search': {
                        parameters: '{tagName?}',
                        execute: (msg, [tagName]) => this.searchTags(msg, tagName),
                        description: ''
                    },
                    'permdelete': {
                        parameters: '{tagName} {reason+}',
                        execute: (msg, [tagName, reason]) => this.disableTag(msg, tagName, reason.join(' ')),
                        description: ''
                    },
                    'cooldown': {
                        parameters: '{tagName} {duration?:duration}',
                        execute: (msg, [tagName, duration]) => this.setTagCooldown(msg, tagName, duration),
                        description: ''
                    },
                    'author': {
                        parameters: '{tagName?}',
                        execute: (msg, [tagName]) => this.getTagAuthor(msg, tagName),
                        description: ''
                    },
                    'info': {
                        parameters: '{tagName?}',
                        execute: (msg, [tagName]) => this.getTagInfo(msg, tagName),
                        description: ''
                    },
                    'top': {
                        parameters: '',
                        execute: () => '',
                        description: ''
                    },
                    'favourite|favorite': {
                        parameters: '{tagName}',
                        execute: () => '',
                        description: ''
                    },
                    'report': {
                        parameters: '{tagName} {reason+}',
                        execute: () => '',
                        description: ''
                    },
                    'test|eval|exec|vtest': {
                        parameters: 'debug? {code+}',
                        execute: () => '',
                        description: ''
                    },
                    'debug': {
                        parameters: '{tagName} {args*}',
                        execute: () => '',
                        description: ''
                    },
                    'flag': {
                        parameters: '{tagName}',
                        execute: () => '',
                        description: '',
                        subcommands: {
                            'create|add': {
                                parameters: '{tagName} {flags+}',
                                execute: () => '',
                                description: ''
                            },
                            'delete|remove': {
                                parameters: '{tagName} {flags+}',
                                execute: () => '',
                                description: ''
                            }
                        }
                    },
                    'setlang': {
                        parameters: '{tagName} {language}',
                        execute: () => '',
                        description: ''
                    }
                }
            }
        });
    }
    async createTag(message, tagName, content) {
        const match = await this.requestEditableTag(message, tagName);
        if (typeof match !== 'object')
            return match;
        if (match.tag !== undefined)
            return `❌ The \`${match.tagName}\` tag already exists!`;
        return await this.saveTag(message, 'set', match.tagName, content, match.tag);
    }
    async editTag(message, tagName, content) {
        const match = await this.requestEditableTag(message, tagName);
        if (typeof match !== 'object')
            return match;
        if (match.tag === undefined)
            return `❌ The \`${match.tagName}\` tag doesn\'t exist!`;
        return await this.saveTag(message, 'set', match.tagName, content, match.tag);
    }
    async deleteTag(message, tagName) {
        const match = await this.requestEditableTag(message, tagName);
        if (typeof match !== 'object')
            return match;
        if (match.tag === undefined)
            return `❌ The \`${match.tagName}\` tag doesn\'t exist!`;
        await this.database.tags.delete(match.tagName);
        void this.logChange("Delete" /* DELETE */, message.author, message.id, {
            author: `${(await this.database.users.get(match.tag.author))?.username} (${match.tag.author})`,
            tag: match.tagName,
            content: match.tag.content
        });
        return `✅ The \`${match.tagName}\` tag is gone forever!`;
    }
    async setTag(message, tagName, content) {
        const match = await this.requestEditableTag(message, tagName);
        if (typeof match !== 'object')
            return match;
        return await this.saveTag(message, 'set', match.tagName, content, match.tag);
    }
    async renameTag(message, oldName, newName) {
        const from = await this.requestEditableTag(message, oldName);
        if (typeof from !== 'object')
            return from;
        if (from.tag === undefined)
            return `❌ The \`${from.tagName}\` tag doesn\'t exist!`;
        const to = await this.requestEditableTag(message, newName);
        if (typeof to !== 'object')
            return to;
        if (to.tag !== undefined)
            return `❌ The \`${to.tagName}\` tag doesn\'t exist!`;
        await this.database.tags.delete(from.tagName);
        await this.database.tags.add({
            ...from.tag,
            name: to.tagName
        });
        void this.logChange("Rename" /* RENAME */, message.author, message.id, {
            oldName: from.tagName,
            newName: to.tagName
        });
        return `✅ The \`${from.tagName}\` tag has been renamed to \`${to.tagName}\`.`;
    }
    async getRawTag(message, tagName) {
        const match = await this.requestReadableTag(message, tagName);
        if (typeof match !== 'object')
            return match;
        const response = `The raw code for \`${match.name}\` is:\n\`\`\`${match.lang}\n${match.content}\n\`\`\``;
        return response.length < 2000
            ? response
            : {
                content: `The raw code for \`${match.name}\` is attached`,
                files: {
                    name: match.name + '.bbtag',
                    file: match.content
                }
            };
    }
    async listTags(message, author) {
        const args = [
            message.channel,
            message.author,
            ' tags',
            async (skip, take) => await this.database.tags.list(skip, take),
            async () => await this.database.tags.count(),
            100,
            ', '
        ];
        if (author) {
            const user = await this.util.getUser(message, author);
            if (!user)
                return;
            args[2] += ` made by **${utils_1.humanize.fullName(user)}**`;
            args[3] = async (skip, take) => await this.database.tags.byAuthor(user.id, skip, take);
            args[4] = async () => await this.database.tags.byAuthorCount(user.id);
        }
        switch (await this.util.displayPaged(...args)) {
            case false: return '❌ No results found!';
            case true: return '✅ I hope you found what you were looking for!';
            case null: return undefined;
        }
    }
    async searchTags(message, query) {
        if (query === undefined || query?.length === 0)
            query = (await this.util.awaitQuery(message.channel, message.author, 'What would you like to search for?'))?.content;
        if (query === undefined || query?.length === 0)
            return;
        const _query = query;
        const result = await this.util.displayPaged(message.channel, message.author, ` tags matching \`${query}\``, (skip, take) => this.database.tags.search(_query, skip, take), () => this.database.tags.searchCount(_query), 100, ', ');
        switch (result) {
            case false: return '❌ No results found!';
            case true: return '✅ I hope you found what you were looking for!';
            case null: return undefined;
        }
    }
    async disableTag(message, tagName, reason) {
        tagName = normalizeName(tagName);
        if (!await this.database.tags.disable(tagName, message.author.id, reason))
            return `❌ The \`${tagName}\` tag doesn\'t exist!`;
        return `✅ The \`${tagName}\` tag has been deleted`;
    }
    async setTagCooldown(message, tagName, cooldown) {
        if (cooldown !== undefined && cooldown.asMilliseconds() < 0)
            return '❌ The cooldown must be greater than 0ms';
        const match = await this.requestEditableTag(message, tagName);
        if (typeof match !== 'object')
            return match;
        if (match.tag === undefined)
            return `❌ The \`${match.tagName}\` tag doesn\'t exist!`;
        await this.database.tags.setCooldown(match.tagName, cooldown?.asMilliseconds());
        cooldown ?? (cooldown = moment_1.default.duration());
        return `✅ The \`${match.tagName}\` now has a cooldown of \`${utils_1.humanize.duration(cooldown)}\`.`;
    }
    async getTagAuthor(message, tagName) {
        const match = await this.requestReadableTag(message, tagName);
        if (typeof match !== 'object')
            return match;
        const response = [];
        const author = await this.database.users.get(match.author);
        response.push(`The tag \`${match.name}\` was made by **${utils_1.humanize.fullName(author)}**`);
        if (match.authorizer !== undefined && match.authorizer !== match.author) {
            const authorizer = await this.database.users.get(match.authorizer);
            response.push(`and is authorized by **${utils_1.humanize.fullName(authorizer)}**`);
        }
        return response.join(' ');
    }
    async getTagInfo(message, tagName) {
        const match = await this.requestReadableTag(message, tagName);
        if (typeof match !== 'object')
            return match;
        const fields = [];
        const embed = {
            title: `__**Tag | ${match.name}**__`,
            fields: fields,
            color: 978212,
            timestamp: new Date(),
            footer: {
                text: utils_1.humanize.fullName(message.author),
                icon_url: message.author.avatarURL
            }
        };
        const favouriteCount = Object.values(match.favourites ?? {}).filter(v => v).length;
        const author = await this.database.users.get(match.author);
        embed.author = {
            name: utils_1.humanize.fullName(author),
            icon_url: author?.avatarURL
        };
        fields.push({
            name: 'Author',
            value: `${utils_1.humanize.fullName(author)} (${author?.userid ?? match.author})`,
            inline: true
        });
        if (match.authorizer !== undefined && match.authorizer !== match.author) {
            const authorizer = await this.database.users.get(match.authorizer);
            fields.push({
                name: 'Authorizer',
                value: `${utils_1.humanize.fullName(authorizer)} (${authorizer?.userid ?? match.authorizer})`,
                inline: true
            });
        }
        if (match.cooldown !== undefined)
            fields.push({ name: 'Cooldown', value: utils_1.humanize.duration(moment_1.default.duration(match.cooldown)), inline: true });
        fields.push({ name: 'Last modified', value: moment_1.default(match.lastmodified.valueOf()).format('LLLL'), inline: true });
        fields.push({ name: 'Use count', value: `${match.uses} time${match.uses == 1 ? '' : 's'}`, inline: true });
        fields.push({ name: 'Favourite count', value: `${favouriteCount} time${favouriteCount == 1 ? '' : 's'}`, inline: true });
        if (match.reports !== undefined && match.reports > 0)
            fields.push({ name: '⚠️ Reports ⚠️', value: `${match.reports} time${match.reports == 1 ? '' : 's'}**`, inline: true });
        if (match.flags !== undefined && match.flags.length > 0) {
            const flags = match.flags.map(flag => `\`-${flag.flag}\`/\`--${flag.word}\`: ${flag.desc ?? 'No description.'}`);
            fields.push({ name: 'Flags', value: flags.join('\n') });
        }
        return { embed };
    }
    async saveTag(message, operation, tagName, content, oldTag) {
        content = await this.requestTagContent(message, content);
        if (content === undefined)
            return;
        const analysis = this.cluster.bbtag.check(content);
        if (analysis.errors.length > 0)
            return `❌ There were errors with the bbtag you provided!\n${utils_1.bbtagUtil.stringifyAnalysis(analysis)}`;
        await this.database.tags.set({
            name: tagName,
            author: message.author.id,
            authorizer: oldTag?.authorizer ?? message.author.id,
            content,
            lastmodified: new Date(),
            uses: oldTag?.uses ?? 0,
            flags: [...oldTag?.flags ?? []],
            lang: oldTag?.lang ?? ''
        });
        void this.logChange(oldTag ? "Edit" /* EDIT */ : "Create" /* CREATE */, message.author, message.id, {
            tag: tagName,
            content
        });
        return `✅ Tag \`${tagName}\` ${operation}.\n${utils_1.bbtagUtil.stringifyAnalysis(analysis)}`;
    }
    async requestTagName(message, name, query = 'Enter the name of the tag:') {
        if (name !== undefined) {
            name = normalizeName(name);
            if (name.length > 0)
                return name;
        }
        name = (await this.util.awaitQuery(message.channel, message.author, query))?.content;
        if (name === undefined)
            return undefined;
        name = normalizeName(name);
        return name.length > 0 ? name : undefined;
    }
    async requestTagContent(message, content) {
        if (content !== undefined && content.length > 0)
            return content;
        content = (await this.util.awaitQuery(message.channel, message.author, 'Enter the tag\'s contents:'))?.content;
        if (content === undefined)
            return undefined;
        return content.length > 0 ? content : undefined;
    }
    async requestEditableTag(message, tagName) {
        const match = await this.requestTag(message, tagName);
        if (typeof match !== 'object')
            return match;
        if (message.author.id !== this.config.discord.users.owner
            && match.tag !== undefined
            && match.tag.author !== message.author.id) {
            return `❌ You don\'t own the \`${tagName}\` tag!`;
        }
        return { tagName: match.tagName, tag: match.tag };
    }
    async requestReadableTag(message, tagName) {
        const match = await this.requestTag(message, tagName);
        if (typeof match !== 'object')
            return match;
        if (match.tag === undefined)
            return `❌ The \`${tagName}\` tag doesn\'t exist!`;
        return match.tag;
    }
    async requestTag(message, tagName) {
        tagName = await this.requestTagName(message, tagName);
        if (tagName === undefined)
            return;
        const tag = await this.database.tags.get(tagName);
        if (tag === undefined)
            return { tagName: tagName };
        if (tag !== undefined && tag.deleted)
            return `❌ The \`${tagName}\` tag has been permanently deleted!`;
        return { tagName, tag };
    }
    async logChange(action, user, messageId, details) {
        const files = [];
        const fields = [];
        if ('tag' in details && 'content' in details)
            files.push({ name: details.tag + '.bbtag', file: details.content });
        for (const key of Object.keys(details)) {
            fields.push({
                name: key,
                value: utils_1.humanize.truncate(details[key], 1000, '(too long)'),
                inline: true
            });
        }
        await this.util.send(this.config.discord.channels.taglog, {
            embed: {
                title: action,
                color: tagChangeActionColour[action],
                fields,
                author: {
                    name: utils_1.humanize.fullName(user),
                    icon_url: user.avatarURL,
                    url: `${this.config.website.secure ? 'https' : 'http'}://${this.config.website.host}/user/${user.id}`
                },
                timestamp: new Date(),
                footer: {
                    text: `MsgID: ${messageId}`
                }
            }
        }, files);
    }
}
exports.TagCommand = TagCommand;
function normalizeName(title) {
    return title.replace(/[^\d\w .,\/#!$%\^&\*;:{}[\]=\-_~()]/gi, '');
}
const tagChangeActionColour = {
    ["Create" /* CREATE */]: 0x0eed24,
    ["Rename" /* RENAME */]: 0x6b0eed,
    ["Edit" /* EDIT */]: 0xf20212,
    ["Delete" /* DELETE */]: 0x02f2ee
};
//# sourceMappingURL=tag.js.map