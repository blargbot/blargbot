import { EmbedField, Message, MessageFile, User } from 'eris';
import { Cluster } from '../cluster';
import { BaseCommand } from '../core/command';
import { StoredTag } from '../core/database';
import { bbtagUtil, commandTypes, humanize } from '../utils';

export class TagCommand extends BaseCommand {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'tag',
            aliases: ['t'],
            category: commandTypes.GENERAL,
            info: 'Tags are a system of public commands that anyone can create or run, using the BBTag language.\n',
            handler: {
                parameters: '{tagName} {args*}',
                execute: () => '', //(msg, [tagName, ...args]) => '',
                subcommands: {
                    'create|add': {
                        parameters: '{tagName?} {content*}',
                        execute: (msg, [tagName], _, raw) => this.create(msg, tagName, humanize.smartSplitSkip(raw, 2)),
                        description: 'Creates a new tag with the content you give'
                    },
                    'edit': {
                        parameters: '{tagName?} {content*}',
                        execute: (msg, [tagName], _, raw) => this.edit(msg, tagName, humanize.smartSplitSkip(raw, 2)),
                        description: 'Edits an existing tag to have the content you specify'
                    },
                    'set': {
                        parameters: '{tagName?} {content*}',
                        execute: (msg, [tagName], _, raw) => this.set(msg, tagName, humanize.smartSplitSkip(raw, 2)),
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
                        execute: () => '', //(msg, [tagName]) => '',
                        description: ''
                    },
                    'cooldown': {
                        parameters: '{tagName} {duration?:duration}',
                        execute: () => '', //(msg, [tagName, duration]) => '',
                        description: ''
                    },
                    'info': {
                        parameters: '{tagName}',
                        execute: () => '', //(msg, [tagName]) => '',
                        description: ''
                    },
                    'top': {
                        parameters: '',
                        execute: () => '', //(msg) => '',
                        description: ''
                    },
                    'author': {
                        parameters: '{tagName}',
                        execute: () => '', //(msg, [tagName]) => '',
                        description: ''
                    },
                    'search': {
                        parameters: '{tagName}',
                        execute: () => '', //(msg, [tagName]) => '',
                        description: ''
                    },
                    'list': {
                        parameters: '{author?}',
                        execute: () => '', //(msg, [author]) => '',
                        description: ''
                    },
                    'favourite|favorite': {
                        parameters: '{tagName}',
                        execute: () => '', //(msg, [tagName]) => '',
                        description: ''
                    },
                    'report': {
                        parameters: '{tagName} {reason+}',
                        execute: () => '', //(msg, [tagName, ...reason]) => '',
                        description: ''
                    },
                    'test|eval|exec|vtest': {
                        parameters: 'debug? {code+}',
                        execute: () => '', //(msg, [debug, ...code]) => '',
                        description: ''
                    },
                    'debug': {
                        parameters: '{tagName} {args*}',
                        execute: () => '', //(msg, [tagName, ...args]) => '',
                        description: ''
                    },
                    'flag': {
                        parameters: '{tagName}',
                        execute: () => '', //(msg, [tagName]) => '',
                        description: '',
                        subcommands: {
                            'create|add': {
                                parameters: '{tagName} {flags+}',
                                execute: () => '', //(msg, [tagName, ...flags]) => '',
                                description: ''
                            },
                            'delete|remove': {
                                parameters: '{tagName} {flags+}',
                                execute: () => '', //(msg, [tagName, ...flags]) => '',
                                description: ''
                            }
                        }
                    },
                    'setlang': {
                        parameters: '{tagName} {language}',
                        execute: () => '', //(msg, [tagName, language]) => '',
                        description: ''
                    }
                }
            }
        });

    }


    public async create(message: Message, tagName: string | undefined, content: string | undefined): Promise<string | undefined> {
        const match = await this.requestEditableTag(message, tagName);
        if (typeof match !== 'object')
            return match;

        if (match.tag !== undefined)
            return `❌ The \`${match.tagName}\` tag already exists!`;

        return await this.saveTag(message, 'set', match.tagName, content, match.tag);
    }

    public async edit(message: Message, tagName: string | undefined, content: string | undefined): Promise<string | undefined> {
        const match = await this.requestEditableTag(message, tagName);
        if (typeof match !== 'object')
            return match;

        if (match.tag === undefined)
            return `❌ The \`${match.tagName}\` tag doesn\'t exist!`;

        return await this.saveTag(message, 'set', match.tagName, content, match.tag);
    }

    public async delete(message: Message, tagName: string | undefined): Promise<string | undefined> {
        const match = await this.requestEditableTag(message, tagName);
        if (typeof match !== 'object')
            return match;

        if (match.tag === undefined)
            return `❌ The \`${match.tagName}\` tag doesn\'t exist!`;

        await this.database.tags.delete(match.tagName);
        void this.logChange(TagChangeAction.DELETE, message.author, message.id, {
            author: `${(await this.database.users.get(match.tag.author))?.username} (${match.tag.author})`,
            tag: match.tagName,
            content: match.tag.content
        });
        return `✅ The \`${match.tagName}\` tag is gone forever!`;
    }

    public async set(message: Message, tagName: string | undefined, content: string | undefined): Promise<string | undefined> {
        const match = await this.requestEditableTag(message, tagName);
        if (typeof match !== 'object')
            return match;

        return await this.saveTag(message, 'set', match.tagName, content, match.tag);
    }

    public async rename(message: Message, oldName: string | undefined, newName: string | undefined): Promise<string | undefined> {
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

        void this.logChange(TagChangeAction.RENAME, message.author, message.id, {
            oldName: from.tagName,
            newName: to.tagName
        });
        return `✅ The \`${from.tagName}\` tag has been renamed to \`${to.tagName}\`.`;
    }

    private async raw(message: Message, tagName: string | undefined): Promise<string | { content: string, files: MessageFile } | undefined> {
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

    private async saveTag(message: Message, operation: string, tagName: string, content: string | undefined, oldTag?: DeepReadOnly<StoredTag>): Promise<string | undefined> {
        content = await this.requestTagContent(message, content);
        if (content === undefined)
            return;

        const analysis = this.cluster.bbtag.check(content);
        if (analysis.errors.length > 0)
            return `❌ There were errors with the bbtag you provided!\n${bbtagUtil.stringifyAnalysis(analysis)}`;


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

        void this.logChange(oldTag ? TagChangeAction.EDIT : TagChangeAction.CREATE, message.author, message.id, {
            tag: tagName,
            content
        });

        return `✅ Tag \`${tagName}\` ${operation}.\n${bbtagUtil.stringifyAnalysis(analysis)}`;
    }

    private async requestTagName(message: Message, name: string | undefined, query = 'Enter the name of the tag:'): Promise<string | undefined> {
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

    private async requestTagContent(message: Message, content: string | undefined): Promise<string | undefined> {
        if (content !== undefined && content.length > 0)
            return content;

        content = (await this.util.awaitQuery(message, 'Enter the tag\'s contents:'))?.content;
        if (content === undefined)
            return undefined;

        return content.length > 0 ? content : undefined;
    }

    private async requestEditableTag(
        message: Message,
        tagName: string | undefined
    ): Promise<{ tagName: string, tag?: DeepReadOnly<StoredTag> } | string | undefined> {
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

    private async requestReadableTag(
        message: Message,
        tagName: string | undefined
    ): Promise<{ tagName: string, tag: DeepReadOnly<StoredTag> } | string | undefined> {
        const match = await this.requestTag(message, tagName);
        if (typeof match !== 'object')
            return match;

        if (match.tag === undefined)
            return `❌ The \`${tagName}\` tag doesn\'t exist!`;

        return { tagName: match.tagName, tag: match.tag };
    }

    private async requestTag(
        message: Message,
        tagName: string | undefined
    ): Promise<{ tagName: string, tag?: DeepReadOnly<StoredTag> } | string | undefined> {
        tagName = await this.requestTagName(message, tagName);
        if (tagName === undefined) return;

        const tag = await this.database.tags.get(tagName);
        if (tag === undefined)
            return { tagName: tagName };
        if (tag !== undefined && tag.deleted)
            return `❌ The \`${tagName}\` tag has been permanently deleted!`;

        return { tagName, tag };
    }

    private async logChange(
        action: TagChangeAction,
        user: User,
        messageId: string,
        details: Record<string, string>): Promise<void> {
        const files: MessageFile[] = [];
        const fields: EmbedField[] = [];
        if ('tag' in details && 'content' in details)
            files.push({ name: details.tag + '.bbtag', file: details.content });

        for (const key of Object.keys(details)) {
            fields.push({
                name: key,
                value: humanize.truncate(details[key], 1000, '(too long)'),
                inline: true
            });
        }

        await this.util.send(this.config.discord.channels.taglog, {
            embed: {
                title: action,
                color: tagChangeActionColour[action],
                fields,
                author: {
                    name: humanize.fullName(user),
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

function normalizeName(title: string): string {
    return title.replace(/[^\d\w .,\/#!$%\^&\*;:{}[\]=\-_~()]/gi, '');
}

const enum TagChangeAction {
    CREATE = 'Create',
    RENAME = 'Rename',
    EDIT = 'Edit',
    DELETE = 'Delete'
}

const tagChangeActionColour: { [P in TagChangeAction]: number } = {
    [TagChangeAction.CREATE]: 0x0eed24,
    [TagChangeAction.RENAME]: 0x6b0eed,
    [TagChangeAction.EDIT]: 0xf20212,
    [TagChangeAction.DELETE]: 0x02f2ee
};