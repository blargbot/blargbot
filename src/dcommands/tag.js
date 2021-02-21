"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagCommand = void 0;
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
                        execute: (msg, [tagName], _, raw) => this.create(msg, tagName, utils_1.humanize.smartSplitSkip(raw, 2)),
                        description: 'Creates a new tag with the content you give'
                    },
                    'edit': {
                        parameters: '{tagName?} {content*}',
                        execute: (msg, [tagName], _, raw) => this.edit(msg, tagName, utils_1.humanize.smartSplitSkip(raw, 2)),
                        description: 'Edits an existing tag to have the content you specify'
                    },
                    'set': {
                        parameters: '{tagName?} {content*}',
                        execute: (msg, [tagName], _, raw) => this.set(msg, tagName, utils_1.humanize.smartSplitSkip(raw, 2)),
                        description: 'Sets the tag to have the content you specify. If the tag doesnt exist it will be created.'
                    },
                    'delete|remove': {
                        parameters: '{tagName?}',
                        execute: (msg, [tagName]) => this.delete(msg, tagName),
                        description: 'Deletes an existing tag'
                    },
                    'rename': {
                        parameters: '{oldName?} {newName?}',
                        execute: (msg, [oldName, newName]) => this.rename(msg, oldName, newName),
                        description: 'Renames the tag'
                    },
                    'raw': {
                        parameters: '{tagName?}',
                        execute: (msg, [tagName]) => this.raw(msg, tagName),
                        description: ''
                    },
                    'permdelete': {
                        parameters: '{tagName}',
                        execute: () => '',
                        description: ''
                    },
                    'cooldown': {
                        parameters: '{tagName} {duration?:duration}',
                        execute: () => '',
                        description: ''
                    },
                    'info': {
                        parameters: '{tagName}',
                        execute: () => '',
                        description: ''
                    },
                    'top': {
                        parameters: '',
                        execute: () => '',
                        description: ''
                    },
                    'author': {
                        parameters: '{tagName}',
                        execute: () => '',
                        description: ''
                    },
                    'search': {
                        parameters: '{tagName}',
                        execute: () => '',
                        description: ''
                    },
                    'list': {
                        parameters: '{author?}',
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
    async create(message, tagName, content) {
        const match = await this.requestEditableTag(message, tagName);
        if (typeof match !== 'object')
            return match;
        if (match.tag !== undefined)
            return `❌ The \`${match.tagName}\` tag already exists!`;
        return await this.saveTag(message, 'set', match.tagName, content, match.tag);
    }
    async edit(message, tagName, content) {
        const match = await this.requestEditableTag(message, tagName);
        if (typeof match !== 'object')
            return match;
        if (match.tag === undefined)
            return `❌ The \`${match.tagName}\` tag doesn\'t exist!`;
        return await this.saveTag(message, 'set', match.tagName, content, match.tag);
    }
    async delete(message, tagName) {
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
    async set(message, tagName, content) {
        const match = await this.requestEditableTag(message, tagName);
        if (typeof match !== 'object')
            return match;
        return await this.saveTag(message, 'set', match.tagName, content, match.tag);
    }
    async rename(message, oldName, newName) {
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
    async raw(message, tagName) {
        const match = await this.requestReadableTag(message, tagName);
        if (typeof match !== 'object')
            return match;
        const response = `The raw code for \`${match.tagName}\` is:\n\`\`\`${match.tag.lang}\n${match.tag.content}\n\`\`\``;
        return response.length < 2000
            ? response
            : {
                content: `The raw code for \`${match.tagName}\` is attached`,
                files: {
                    name: match.tag.name + '.bbtag',
                    file: match.tag.content
                }
            };
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
        name = (await this.util.awaitQuery(message, query))?.content;
        if (name === undefined)
            return undefined;
        name = normalizeName(name);
        return name.length > 0 ? name : undefined;
    }
    async requestTagContent(message, content) {
        if (content !== undefined && content.length > 0)
            return content;
        content = (await this.util.awaitQuery(message, 'Enter the tag\'s contents:'))?.content;
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
        return { tagName: match.tagName, tag: match.tag };
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