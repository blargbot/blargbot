import { AnalysisResult } from '@blargbot/bbtag';
import { FlagDefinition } from '@blargbot/domain/models/index.js';
import { FormatString, IFormattable } from '@blargbot/formatting';
import Eris from 'eris';
import moment from 'moment-timezone';

import { Command } from './command/Command.js';

interface UserTag {
    readonly username?: string;
    readonly discriminator?: string;
}

export const templates = FormatString.defineTree('cluster', t => ({
    common: {
        query: {
            cancel: 'Cancel',
            cantUse: '❌ This isn\'t for you to use!',
            choose: {
                paged: t<{ content?: IFormattable<string>; page: number; pageCount: number; }>('{content#bool({}\n|)}Page {page}/{pageCount}')
            },
            user: {
                prompt: {
                    default: 'ℹ️ Please select a user from the drop down',
                    filtered: t<{ filter: string; }>('ℹ️ Multiple users matching `{filter}` found! Please select one from the drop down.')
                },
                placeholder: 'Select a user',
                choice: {
                    label: t<{ user: Eris.User; }>('{user.username}#{user.discriminator}'),
                    description: t<{ user: Eris.User; }>('Id: {user.id}')
                }
            },
            member: {
                prompt: {
                    default: 'ℹ️ Please select a user from the drop down',
                    filtered: t<{ filter: string; }>('ℹ️ Multiple users matching `{filter}` found! Please select one from the drop down.')
                },
                placeholder: 'Select a user',
                choice: {
                    label: t<{ member: Eris.Member; }>('{member.nick#bool({}|{~member.username})} ({member.username}#{member.discriminator})'),
                    description: t<{ member: Eris.Member; }>('Id: {member.id}')
                }
            },
            sender: {
                prompt: {
                    default: 'ℹ️ Please select a user or webhook from the drop down',
                    filtered: t<{ filter: string; }>('ℹ️ Multiple users or webhooks matching `{filter}` found! Please select one from the drop down.')
                },
                placeholder: 'Select a user or webhook',
                choice: {
                    label: {
                        user: t<{ user: Eris.User; }>('{user.username}#{user.discriminator}'),
                        webhook: t<{ webhook: Eris.Webhook; }>('{webhook.name}')
                    },
                    description: t<{ sender: Eris.User | Eris.Webhook; }>('Id: {sender.id}')
                }
            },
            role: {
                prompt: {
                    default: 'ℹ️ Please select a role from the drop down',
                    filtered: t<{ filter: string; }>('ℹ️ Multiple roles matching `{filter}` found! Please select one from the drop down.')
                },
                placeholder: 'Select a role',
                choice: {
                    label: t<{ role: Eris.Role; }>('{role.name}'),
                    description: t<{ role: Eris.Role; }>('Id: {role.id} Color: {role.color#color}')
                }
            },
            channel: {
                prompt: {
                    default: 'ℹ️ Please select a channel from the drop down',
                    filtered: t<{ filter: string; }>('ℹ️ Multiple channel matching `{filter}` found! Please select one from the drop down.')
                },
                placeholder: 'Select a channel',
                choice: {
                    label: {
                        guild: t<{ channel: Eris.GuildChannel; }>('{channel.name}'),
                        dm: 'DM'
                    },
                    description: t<{ channel: Eris.Channel; parent?: { label: IFormattable<string>; emoji: string; }; }>('Id: {channel.id}{parent#bool({emoji} {label}|)}')
                }
            },
            paged: {
                prompt: t<{ header?: IFormattable<string>; page: number; pageCount: number; content: IFormattable<string>; }>('{header#bool({}\n|)}Page **#{page}/{pageCount}**\n{content}\nType a number between **1 and {pageCount}** to view that page.')
            }
        }
    },
    regex: {
        tooLong: '❌ Regex is too long!',
        invalid: '❌ Regex is invalid!',
        unsafe: '❌ Regex is unsafe!\nIf you are 100% sure your regex is valid, it has likely been blocked due to how I detect catastrophic backtracking.\nYou can find more info about catastrophic backtracking here: <https://www.regular-expressions.info/catastrophic.html>',
        matchesEverything: '❌ Your regex cannot match everything!'
    },
    respawn: {
        success: t<{ duration: moment.Duration; }>('Ok I\'m back. It took me {duration#duration(F)}')
    },
    roleme: {
        failed: 'A roleme was triggered, but I don\'t have the permissions required to give you your role!'
    },
    poll: {
        embed: {
            footer: {
                text: 'The poll will end'
            }
        },
        success: {
            noVotes: 'The votes are in! A total of **0** votes were collected!\n\n No one voted, how sad 😦',
            tie: t<{ total: number; count: number; winners: Iterable<string>; }>('The votes are in! A total of **{total}** {total#plural(1:vote was|votes were)} collected!\n\n It was a tie between these choices at **{count}** {count#plural(1:vote|votes)} each:\n\n{winners#join(, | and )}'),
            single: t<{ total: number; count: number; winner: string; }>('The votes are in! A total of **{total}** {total#plural(1:vote was|votes were)} collected!\n\n At **{count}** {count#plural(1:vote|votes)}, the winner is:\n\n{winner}')
        }
    },
    guild: {
        blacklisted: t<{ guild: Eris.Guild; }>('Greetings! I regret to inform you that your guild, **{guild.name}** ({guild.id}), is on my blacklist. Sorry about that! I\'ll be leaving now. I hope you have a nice day.'),
        joined: t<{ guild: Eris.Guild; botGuild: boolean; size: number; userCount: number; botCount: number; botFraction: number; }>('☑️ Guild: `{guild.name}` (`{guild.id}`)! {botGuild#bool(- ***BOT GUILD***|)}\n    Total: **{size}** | Users: **{userCount}** | Bots: **{botCount}** | Percent: **{botFraction#percent}**')
    },
    autoresponse: {
        prompt: t<{ guild: Eris.Guild; channelId: string; reason: string; code: string; user: Eris.User; }>('New AR request from **{user.username}#{user.discriminator}** ({user#tag}):\n**Guild**: {guild.name} ({guild.id})\n**Channel**: {channelId}\n**Members**: {guild.members.size}\n\n{reason}\n\n```js\n{code}\n```'),
        whitelist: {
            approved: '✅ Congratz, your guild has been whitelisted for autoresponses! 🎉\n*It may take up to 15 minutes for them to become available*',
            rejected: '❌ Sorry, your guild has been rejected for autoresponses. 😿'
        }
    },
    announcements: {
        prompt: {
            channel: 'ℹ️ Please select the channel that announcements should be put in.',
            role: 'ℹ️ Please select the role to mention when announcing.'
        }
    },
    modlog: {
        defaultReason: t<{ prefix: string; caseId: number; }>('Responsible moderator, please do `{prefix}reason {caseId}` to set.'),
        types: {
            generic: 'Generic',
            pardon: 'Pardon',
            timeout: 'Timeout',
            timeoutClear: 'Timeout Clear',
            softBan: 'Soft Ban',
            ban: 'Ban',
            massBan: 'Mass Ban',
            unban: 'Unban',
            kick: 'Kick',
            unmute: 'Unmute',
            mute: 'Mute',
            temporaryMute: 'Temporary Mute',
            warning: 'Warning'
        },
        embed: {
            title: t<{ caseId: number; }>('Case {caseId}'),
            description: t<{ users: Iterable<Eris.User>; }>('{users#map({username}#{discriminator} \\({id}\\))#join(\n)}'),
            footer: {
                text: t<{ user: Eris.User; }>('{user.username}#{user.discriminator} ({user.id})')
            },
            field: {
                type: {
                    name: 'Type'
                },
                reason: {
                    name: 'Reason',
                    value: t<{ reason: IFormattable<string>; }>('{reason}')
                },
                pardons: {
                    name: 'Pardons',
                    value: t<{ count: number; warnings: number; }>('Assigned: {count}\nNew Total: {warnings}')
                },
                warnings: {
                    name: 'Warnings',
                    value: t<{ count: number; warnings: number; }>('Assigned: {count}\nNew Total: {warnings}')
                },
                duration: {
                    name: 'Duration',
                    value: t<{ duration: moment.Duration; }>('{duration#duration(F)}')
                },
                user: {
                    name: 'User',
                    value: t<{ user: Eris.User; }>('{user.username}#{user.discriminator} ({user.id})')
                }
            }
        }
    },
    eventLog: {
        disabled: t<{ event: string; channel: Eris.Channel; }>('❌ Disabled logging of the `{event}` event because the channel {channel#tag} doesn\'t exist or I don\'t have permission to post messages in it!'),
        events: {
            timeoutAdded: 'ℹ️ User Was Timed Out',
            timeoutRemoved: 'ℹ️ User Timeout Was Removed',
            banned: 'ℹ️ User was banned',
            unbanned: 'ℹ️ User Was Unbanned',
            joined: 'ℹ️ User Joined',
            left: 'ℹ️ User Left',
            messageDeleted: 'ℹ️ Message Deleted',
            messageUpdated: 'ℹ️ Message Updated',
            roleRemoved: 'ℹ️ Special Role Removed',
            roleAdded: 'ℹ️ Special Role Added',
            nicknameUpdated: 'ℹ️ Nickname Updated',
            usernameUpdated: 'ℹ️ Username Updated',
            avatarUpdated: 'ℹ️ Avatar Updated'
        },
        embed: {
            description: {
                avatarUpdated: '➡️ Old avatar\n⬇️ New avatar',
                bulkDelete: 'Bulk Message Delete',
                userUpdated: {
                    username: 'Username changed.',
                    discriminator: 'Discriminator changed.',
                    both: 'Username changed.\nDiscriminator changed.'
                }
            },
            field: {
                reason: {
                    name: 'Reason',
                    value: t<{ reason: string; }>('{reason}')
                },
                message: {
                    name: 'Message Id',
                    value: t<{ messageId: string; }>('{messageId}')
                },
                channel: {
                    name: 'Channel',
                    value: t<{ channelIds: Iterable<string>; }>('{channelIds#map(<#{}>)#join(\n)}')
                },
                oldUsername: {
                    name: 'Old Name',
                    value: t<{ user: Eris.User; }>('{user.username}#{user.discriminator}')
                },
                newUsername: {
                    name: 'New Name',
                    value: t<{ user: Eris.User; }>('{user.username}#{user.discriminator}')
                },
                oldNickname: {
                    name: 'Old Nickname',
                    value: t<{ nickname: string; }>('{nickname}')
                },
                newNickname: {
                    name: 'New Nickname',
                    value: t<{ nickname: string; }>('{nickname}')
                },
                role: {
                    name: 'Role',
                    value: t<{ roleId: string; }>('<@&{roleId}> ({roleId})')
                },
                updatedBy: {
                    name: 'Updated By',
                    value: t<{ userId: string; }>('<@{userId}> ({userId})')
                },
                created: {
                    name: 'Created',
                    value: t<{ time: moment.Moment; }>('{time#tag}')
                },
                until: {
                    name: 'Until',
                    value: t<{ time: moment.Moment; }>('{time#tag}')
                },
                count: {
                    name: 'Count',
                    value: t<{ count: number; }>('{count}')
                },
                content: {
                    name: {
                        old: {
                            unavailable: 'Old Message (Unavailable)',
                            empty: 'Old Message (Empty)',
                            default: 'Old Message'
                        },
                        new: {
                            unavailable: 'New Message (Unavailable)',
                            empty: 'New Message (Empty)',
                            default: 'New Message'
                        },
                        current: {
                            unavailable: 'Content (Unavailable)',
                            empty: 'Content (Empty)',
                            default: 'Content'
                        }
                    },
                    value: {
                        chatLogsOff: 'This message wasn\'t logged. ChatLogging is currently turned off',
                        unknown: 'This message wasn\'t logged. ChatLogging was off when it was sent, or it is older than 2 weeks',
                        expired: 'This message is no longer logged as it is older than 2 weeks',
                        notLogged: 'This message wasn\'t logged. ChatLogging was off when it was sent.',
                        empty: 'This message has no content. It had either an attachment or an embed',
                        default: t<{ content: string; }>('{content#overflow(1024|... (too long to display))}')
                    }
                }
            }

        }
    },
    warning: {
        autoBan: t<{ warnings: number; limit: number; }>('[ Auto-Ban ] Exceeded ban limit ({warnings}/{limit})'),
        autoKick: t<{ warnings: number; limit: number; }>('[ Auto-Ban ] Exceeded ban limit ({warnings}/{limit})'),
        autoTimeout: t<{ warnings: number; limit: number; }>('[ Auto-Ban ] Exceeded ban limit ({warnings}/{limit})')
    },
    mute: {
        autoUnmute: t<{ duration?: moment.Duration; }>('Automatically unmuted after {duration#duration(F)=some time}.'),
        createReason: 'Automatic muted role configuration'
    },
    moderation: {
        auditLog: t<{ moderator: Eris.User; reason?: IFormattable<string>; }>('[{moderator.username}#{moderator.discriminator}]{reason#bool( {}|)}')
    },
    censor: {
        warnReason: 'Said a blacklisted phrase.',
        mentionSpam: {
            ban: {
                reason: 'Mention Spam',
                failed: t<{ user: Eris.User; }>('{user#tag} is mention spamming, but I lack the permissions to ban them!')
            }
        }
    },
    ban: {
        autoUnban: t<{ duration?: moment.Duration; }>('Automatically unbanned after {duration#duration(F)=some time}.')
    },
    documentation: {
        loading: 'Loading...',
        name: {
            flat: t<{ parent: IFormattable<string>; child: IFormattable<string>; }>('{parent} - {child}')
        },
        query: {
        },
        paging: {
            parent: t<{ parent: IFormattable<string>; }>('Back to {parent}'),
            select: {
                placeholder: t<{ text: IFormattable<string>; page: number; pageCount: number; }>('{text} - Page {page}/{pageCount}')
            }
        },
        command: {
            unknown: '❌ Oops, I couldn\'t find that command! Try using `b!help` for a list of all commands',
            invalid: '❌ This help page isn\'t valid any more!',
            prompt: t<{ term: string; }>('Multiple help pages match `{term}`'),
            index: {
                name: 'Help',
                footer: t<{ commandsLink: string; donateLink: string; }>('For more information about commands, do `b!help <commandname>` or visit <{commandsLink}>.\nWant to support the bot? Donation links are available at <{donateLink}> - all donations go directly towards recouping hosting costs.'),
                prompt: 'Pick a command category'
            },
            list: {
                none: 'No commands',
                excess: t<{ items: Iterable<IFormattable<string>>; excess: number; }>('```\n{items#join(, )}\n```+ {excess} more'),
                count: t<{ count: number; }>('{count} {count#plural(1:command|commands)}'),
                default: t<{ items: Iterable<IFormattable<string>>; }>('```\n{items#join(, )}\n```')
            },
            categories: {
                prompt: 'Pick a command',
                displayName: t<{ category: IFormattable<string>; }>('{category} commands'),
                custom: {
                    noHelp: '_No help set_'
                }
            },
            command: {
                prompt: 'Pick a command signature',
                noPerms: t<{ name: string; description?: IFormattable<string>; }>('```\n❌ You cannot use b!{name}\n```{description}'),
                aliases: {
                    name: '**Aliases**',
                    value: t<{ aliases: Iterable<string>; }>('{aliases#join(, )}')
                },
                flags: {
                    name: '**Flags**',
                    value: t<{ flags: Iterable<FlagDefinition<string | IFormattable<string>>>; }>('{flags#map(`-{flag}`/`--{word}`: {description})#join(\n)}')
                },
                usage: {
                    name: t<{ usage: string; }>('ℹ️  {usage}'),
                    value: t<{ notes: Iterable<IFormattable<string>>; description: IFormattable<string>; }>('{notes#plural(0:|{#map(> {})#join(\n)}\n\n)}{description}')
                },
                notes: {
                    alias: t<{ parameter: string; aliases: Iterable<string>; }>('`{parameter}` can be replaced with {aliases#map(`{}`)#join(, | or )}'),
                    type: {
                        string: {
                            single: t<{ name: string; default: string; }>('`{name}` defaults to `{default}`')
                        },
                        literal: {
                            single: t<{ name: string; choices: Iterable<string>; default?: string; }>('`{name}` should be {choices#map(`{}`)#join(, | or )}{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; choices: Iterable<string>; min: number; }>('`{name}` are {min#plural(0:|1:|{} or more of )}{choices#map(`{}`)#join(, | or )}')
                        },
                        boolean: {
                            single: t<{ name: string; default?: string; }>('`{name}` should be true or false{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; min: number; }>('`{name}` are {min#plural(0:|1:|{} or more )}true or false')
                        },
                        channel: {
                            single: t<{ name: string; default?: string; }>('`{name}` should be a channel id, mention or name{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; min: number; }>('`{name}` are {min#plural(0:|1:|{} or more )}channel ids, mentions or names')
                        },
                        duration: {
                            single: t<{ name: string; default?: string; }>('`{name}` should be a duration{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; min: number; }>('`{name}` are {min#plural(0:|1:|{} or more )}durations')
                        },
                        bigint: {
                            single: t<{ name: string; default?: string; }>('`{name}` should be a whole number{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; min: number; }>('`{name}` are {min#plural(0:|1:|{} or more )}whole numbers')
                        },
                        integer: {
                            single: t<{ name: string; default?: string; }>('`{name}` should be a whole number{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; min: number; }>('`{name}` are {min#plural(0:|1:|{} or more )}whole numbers')
                        },
                        member: {
                            single: t<{ name: string; default?: string; }>('`{name}` should be a user id, mention or name{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; min: number; }>('`{name}` are {min#plural(0:|1:|{} or more )}user ids, mentions or names')
                        },
                        number: {
                            single: t<{ name: string; default?: string; }>('`{name}` should be a number{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; min: number; }>('`{name}` are {min#plural(0:|1:|{} or more )}numbers')
                        },
                        role: {
                            single: t<{ name: string; default?: string; }>('`{name}` should be a role id, mention or name{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; min: number; }>('`{name}` are {min#plural(0:|1:|{} or more )}role ids, mentions or names')
                        },
                        sender: {
                            single: t<{ name: string; default?: string; }>('`{name}` should be a user id, mention or name, or a webhook id{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; min: number; }>('`{name}` are {min#plural(0:|1:|{} or more )}user ids, mentions or names, or webhook ids')
                        },
                        user: {
                            single: t<{ name: string; default?: string; }>('`{name}` should be a user id, mention or name{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; min: number; }>('`{name}` are {min#plural(0:|1:|{} or more )}user ids, mentions or names')
                        }
                    }
                }
            }
        },
        bbtag: {
            invalid: '❌ This bbtag documentation page isn\'t valid any more!',
            unknown: t<{ commandName: string; }>('❌ Oops, I didn\'t recognise that topic! Try using `b!{commandName} docs` for a list of all topics'),
            prompt: t<{ term: string; }>('Multiple bbtag documentation pages match `{term}`'),
            index: {
                name: 'BBTag',
                description: t<{ editorLink: string; }>('Blargbot is equipped with a system of tags called BBTag, designed to mimic a programming language while still remaining simple. You can use this system as the building-blocks to create your own advanced command system, whether it be through public tags or guild-specific custom commands.\n\nCustomizing can prove difficult via discord, fortunately there is an online [BBTag IDE]({editorLink}) which should make developing a little easier.'),
                prompt: 'Pick a topic',
                topics: {
                    name: 'Topics',
                    value: t<{ commandName: string; }>('For specific information about a topic, please use `b!{commandName} docs <topic>` (like `b!{commandName} docs subtags`\n- `terminology`, for more information about terms like \'subtags\', \'tags\', etc.  \n- `variables`, for more information about variables and the different variable scopes.\n- `argTypes`, for more information about the syntax of parameters\n- `dynamic`, for information about dynamic subtags\n- `subtags`, arguably the most important topic on this list. `b!{commandName} docs subtags` displays a list of subtag categories.')
                }
            },
            subtags: {
                name: 'Subtags',
                description: t<{ categories: Iterable<{ name: IFormattable<string>; description: IFormattable<string>; }>; }>('Subtags are the building blocks of BBTag, and fall into {categories#count} categories:\n\n{categories#map(**{name}** - {description})#join(\n)}'),
                prompt: 'Pick a category'
            },
            subtag: {
                name: t<{ name: string; }>('\\{{name}\\}'),
                prompt: 'Pick a call signature',
                description: {
                    deprecated: t<{ replacement?: string; }>('**This subtag is deprecated{replacement#bool( and has been replaced by \\{{}\\}|)}**'),
                    aliases: t<{ aliases: Iterable<string>; }>('{aliases#plural(0:|**Aliases:** ```\n{#join(, )}\n```)}'),
                    template: t<{ parts: Iterable<IFormattable<string>>; }>('{parts#join(\n)}')
                },
                pages: {
                    signature: {
                        name: t<{ parameters: string; }>('Usage: {parameters}'),
                        usage: {
                            name: '**Usage**',
                            value: {
                                parameters: t<{ parameters: string; }>('```\n{parameters}\n```'),
                                modifier: {
                                    maxLength: t<{ name: string; maxLength: number; }>('`{name}` can at most be {maxLength} characters long'),
                                    defaulted: t<{ name: string; defaultValue: string; required: boolean; }>('`{name}` defaults to `{defaultValue}` if{required#bool(| omitted or)} left blank.'),
                                    defaultedMaxLength: t<{ name: string; defaultValue: string; required: boolean; maxLength: number; }>('`{name}` can at most be {maxLength} characters long and defaults to `{defaultValue}` if{required#bool(| omitted or)} left blank.')
                                },
                                template: t<{ parts: Iterable<IFormattable<string>>; }>('{parts#join(\n)}')
                            }
                        },
                        exampleCode: {
                            name: '**Example code**',
                            value: t<{ code: IFormattable<string>; }>('```\n{code}\n```')
                        },
                        exampleIn: {
                            name: '**Example user input**',
                            value: t<{ text: IFormattable<string>; }>('{text#bool(\n{#split(\n)#map(> {})#join(\n)}|_no input_)}\n')
                        },
                        exampleOut: {
                            name: '**Example output**',
                            value: t<{ text: IFormattable<string>; }>('{text#bool(\n{#split(\n)#map(> {})#join(\n)}|_no output_)}\n')
                        },
                        limit: {
                            name: {
                                customCommandLimit: '**Limits for custom commands:**',
                                everythingAutoResponseLimit: '**Limits for everything autoresponses:**',
                                generalAutoResponseLimit: '**Limits for general autoresponses:**',
                                tagLimit: '**Limits for tags:**'
                            },
                            value: t<{ rules: Iterable<IFormattable<string>>; }>('```\n{rules#join(\n)}\n```')
                        }
                    }
                }
            },
            subtagCategory: {
                description: t<{ description: IFormattable<string>; subtags: Iterable<string>; }>('{description}\n\n```\n{subtags#join(, )}\n```'),
                prompt: 'Pick a subtag'
            },
            variables: {
                name: 'Variables',
                description: t<{ scopeCount: number; }>('In BBTag there are {scopeCount} different scopes that can be used for storing your data. These scopes are determined by the first character of your variable name, so choose carefully!'),
                prompt: 'Pick a variable scope',
                pages: {
                    variableType: {
                        name: t<{ name: IFormattable<string>; prefix: string; }>('{name} (prefix: {prefix})')
                    },
                    commitRollback: {
                        name: '\\{commit\\} and \\{rollback\\}',
                        value: 'For performance reasons, when a value is `\\{set\\}` it wont be immediately populated to the database. `\\{commit\\}` and `\\{rollback\\}` can be used to manipulate when variables are sent to the database, if at all. `\\{commit\\}` will force the given variables to be sent to the database immediately. `\\{rollback\\}` will revert the given variables to their original value (start of tag or most recent `\\{commit\\}`).\nThere is also an additional prefix for \\{set\\} and \\{get\\} which is `!`. This prefix can be combined with other prefixes and will act the same as if you have called `\\{set\\}` and then `\\{commit\\}` immediately after. e.g. ```\\{set;!@varname;value\\}``` is identical to ```\\{set;@varname;value\\}\\{commit;@varname\\}```'
                    }
                }
            },
            arguments: {
                name: 'Arguments',
                description: 'As you may have noticed, the various help documentation for subtags will have a usage that often look like this: ```\n\\{subtag;<arg1>;[arg2];<arg3...>\\}```This way of formatting arguments is designed to easily be able to tell you what is and is not required.\nAll arguments are separated by `;`\'s and each will be displayed in a way that tells you what kind of argument it is.\nNOTE: Simple subtags do not accept any arguments and so should not be supplied any.',
                prompt: 'Pick a argument type',
                pages: {
                    required: {
                        name: 'Required arguments <>',
                        value: 'Example:```\n<arg>```Required arguments must be supplied for a subtag to work. If they are not then you will normally be given a `Not enough args` error\n\u200B'
                    },
                    optional: {
                        name: 'Optional arguments []',
                        value: t<{ commandName: string; }>('Example:```\n[arg]```Optional arguments may or may not be provided. If supplied, optional arguments may either change the functionality of the tag (e.g. `b!{commandName} docs shuffle`) or simply replace a default value (e.g. `b!{commandName} docs username`).\n\u200B')
                    },
                    multiple: {
                        name: 'Multiple arguments ...',
                        value: t<{ commandName: string; }>('Example:```\n<arg...>```Some arguments can accept multiple values, meaning you are able to list additional values, still separated by `;`, which will be included in the execution. (e.g. `b!{commandName} docs randchoose`)')
                    },
                    nested: {
                        name: 'Nested arguments <<> <>>',
                        value: t<{ commandName: string; }>('Example:```\n<<arg1>, [arg2]>```Some subtags may have special rules for how their arguments are grouped (e.g. `b!{commandName} docs switch`) and will use nested arguments to show that grouping. When actually calling the subtag, you provide the arguments as normal, however you must obey the grouping rules.\nIn the example of `switch`, you may optionally supply `<case>` and `<then>` as many times as you like but they must always be in pairs. e.g. `\\{switch;value;case1;then1\\}` or `\\{switch;value;case1;then1;case2;then2\\}` etc')
                    }
                }
            },
            terminology: {
                name: 'Terminology',
                description: 'There are various terms used in BBTag that might not be intuitive, so here is a list of definitions for some of the most important ones:',
                prompt: 'Pick a term',
                pages: {
                    bbtag: {
                        name: 'BBTag',
                        value: 'BBTag is a text replacement language. Any text between a `\\{` and `\\}` pair (called a subtag) will be taken as code and run, with the output of that replacing the whole subtag. Each subtag does something different, and each accepts its own list of arguments.'
                    },
                    subtag: {
                        name: 'Subtag',
                        value: 'A subtag is a pre-defined function that accepts some arguments and returns a single output. Subtags can be called by placing their name between a pair of `\\{` and `\\}`, with any arguments to be passed to the subtag being separated by `;`.\nAs an example:```\\{math;+;1;2\\}```Subtag: `math`\nArguments: `+`, `1`, `2`\nResult: `3`'
                    },
                    tag: {
                        name: 'Tag',
                        value: 'A tag is a user-made block of text which may or may not contain subtags. Any subtags that it does contain will be executed and be replaced by their output.'
                    },
                    argument: {
                        name: 'Argument',
                        value: 'An argument is a single value which gets given to a subtag. Arguments can be numbers, text, arrays, anything you can type really. Each subtag will require a different argument pattern, so be sure to check what pattern your subtag needs!'
                    },
                    variable: {
                        name: 'Variable',
                        value: t<{ commandName: string; }>('A variable is a value that is stored in the bots memory ready to access it later on. For more in-depth details about variables, please use `b!{commandName} docs variable`.')
                    },
                    array: {
                        name: 'Array',
                        value: 'An array is a collection of values all grouped together, commonly done so by enclosing them inside `[]`. In BBTag, arrays can be assigned to a variable to store them for later use. In this situation, you might see an array displayed like this `\\{"v":["1","2","3"],"n":"varname"\\}`. If you do, don\'t worry, nothing is broken! That is just there to allow you to modify the array in place within certain subtags.'
                    }
                }
            },
            dynamic: {
                name: 'Dynamic',
                description: 'In bbtag, even the names of subtags can be dynamic. This can be achieved simply by placing subtags before the first `;` of a subtag. \n e.g. ```\\{user\\{get;~action\\};\\{userid\\}\\}``` If `~action` is set to `name`, then this will run the `username` subtag, if it is set to `avatar` then it will run the `useravatar` subtag, and so on. Because dynamic subtags are by definition not set in stone, it is recommended not to use them, and as such you will receive warnings when editing/creating a tag/cc which contains a dynamic subtag. Your tag will function correctly, however some optimizations employed by bbtag will be unable to run on any such tag.'
            }
        }
    },
    tableflip: {
        flip: '{#rand(Whoops! Let me get that for you ┬──┬ ¯\\\\_(ツ)|(ヘ･_･)ヘ┳━┳ What are you, an animal?|Can you not? ヘ(´° □°)ヘ┳━┳|Tables are not meant to be flipped ┬──┬ ノ( ゜-゜ノ)|(ﾉ´･ω･)ﾉ ﾐ ┸━┸ Wheee!|┻━┻ ︵ヽ(`Д´)ﾉ︵ ┻━┻ Get these tables out of my face!|┻━┻ミ＼(≧ﾛ≦＼) Hey, catch!|Flipping tables with elegance! (/¯◡ ‿ ◡)/¯ ~ ┻━┻)}',
        unflip: '{#rand(┬──┬ ¯\\\\_(ツ) A table unflipped is a table saved!|┣ﾍ(≧∇≦ﾍ)… (≧∇≦)/┳━┳ Unflip that table!|Yay! Cleaning up! ┣ﾍ(^▽^ﾍ)Ξ(ﾟ▽ﾟ*)ﾉ┳━┳|ヘ(´° □°)ヘ┳━┳ Was that so hard?|(ﾉ´･ω･)ﾉ ﾐ ┸━┸ Here comes the entropy!|I\'m sorry, did you just pick that up? ༼ﾉຈل͜ຈ༽ﾉ︵┻━┻|Get back on the ground! (╯ರ ~ ರ)╯︵ ┻━┻|No need to be so serious! (ﾉ≧∇≦)ﾉ ﾐ ┸━┸)}'
    },
    cleverbot: {
        unavailable: '❌ It seems that my clever brain isn\'t working right now, try again later'
    },
    settings: {
        makelogs: {
            name: 'Make ChatLogs',
            description: 'Whether to record chat logs or not.'
        },
        cahnsfw: {
            name: 'Is CAH NSFW',
            description: 'Whether \'cah\' can only be done in nsfw channels or not.'
        },
        deletenotif: {
            name: 'Delete notifications',
            description: 'If enabled, notifies you if a user deleted their command.'
        },
        modlog: {
            name: 'Modlog channel',
            description: 'The id of the modlog channel. You can also use the <code>modlog</code> command'
        },
        mutedrole: {
            name: 'Muted role',
            description: 'The id of the muted role.'
        },
        tableflip: {
            name: 'Tableflips',
            description: 'Whether the bot should respond to tableflips/unflips.'
        },
        antimention: {
            name: 'Anti-mention',
            description: 'The number of unique mentions required to warrant a ban (for anti-mention spam). Set to \'0\' to disable. Recommended: 25'
        },
        dmhelp: {
            name: 'DM help',
            description: 'Whether or not to dm help messages or output them in channels'
        },
        staffperms: {
            name: 'Staff permissions',
            description: 'The numeric value of permissions that designate a staff member. If a user has any of the permissions and permoverride is enabled, allows them to execute any command regardless of role. See <a href=https://discordapi.com/permissions.html>here</a> for a permission calculator.'
        },
        timeoutoverride: {
            name: 'Timeout override',
            description: 'Same as staffperms, but allows users to use the timeout command regardless of permissions'
        },
        kickoverride: {
            name: 'Kick override',
            description: 'Same as staffperms, but allows users to use the kick command regardless of permissions'
        },
        banoverride: {
            name: 'Ban override',
            description: 'Same as staffperms, but allows users to use the ban/hackban/unban commands regardless of permissions'
        },
        banat: {
            name: 'Ban at',
            description: 'The number of warnings before a ban. Set to 0 or below to disable.'
        },
        kickat: {
            name: 'Kick at',
            description: 'The number of warnings before a kick. Set to 0 or below to disable.'
        },
        timeoutat: {
            name: 'Time Out at',
            description: 'The number of warnings before a timeout. Set to 0 or below to disable.'
        },
        actonlimitsonly: {
            name: 'Act on Limits Only',
            description: 'Whether to kick/ban on a warning count that is in between the kickat and banat values.'
        },
        adminrole: {
            name: 'Admin role',
            description: 'The Admin role.'
        },
        nocleverbot: {
            name: 'No cleverbot',
            description: 'Disables cleverbot functionality'
        },
        disableeveryone: {
            name: 'Disable everyone pings',
            description: 'Disables everyone pings in custom commands.'
        },
        disablenoperms: {
            name: 'Disable no perms',
            description: 'Disables the \'You need the role to use this command\' message.'
        },
        social: {
            name: 'Social commands',
            description: 'Enables social commands.'
        },
        farewellchan: {
            name: 'Farewell channel',
            description: 'Sets the channel for the farewell message to be sent in'
        },
        greetchan: {
            name: 'Greeting channel',
            description: 'Sets the channel for the greeting message to be sent in'
        },
        language: {
            name: 'Blargbot language',
            description: 'Sets the language blargbot should respond in'
        }
    },
    contributors: {
        notFound: t<{ userId: string; }>('A user I cant find! (ID: {userId})')
    },
    commands: {
        $errors: {
            generic: t<{ token: string; }>('❌ Something went wrong while handling your command!\nError id: `{token}`'),
            alreadyRunning: '❌ Sorry, this command is already running! Please wait and try again.',
            guildOnly: t<{ prefix: string; commandName: string; }>('❌ `{prefix}{commandName}` can only be used on guilds.'),
            privateOnly: t<{ prefix: string; commandName: string; }>('❌ `{prefix}{commandName}` can only be used in private messages.'),
            rateLimited: {
                local: t<{ duration: moment.Duration; }>('❌ Sorry, you ran this command too recently! Please try again in {duration#duration(S)} seconds.'),
                global: t<{ duration: moment.Duration; penalty: moment.Duration; }>('❌ Sorry, you\'ve been running too many commands. To prevent abuse, I\'m going to have to time you out for `{duration#duration(S)}s`.\n\nContinuing to spam commands will lengthen your timeout by `{penalty#duration(S)}s`!')
            },
            missingPermission: {
                generic: '❌ Oops, I don\'t seem to have permission to do that!',
                guild: t<{ channel: Eris.GuildChannel; commandText: string; prefix: string; }>('❌ Hi! You asked me to do something, but I didn\'t have permission to do it! Please make sure I have permissions to do what you asked.\nGuild: {channel.guild.name}\nChannel: {channel#tag}\nCommand: {commandText}\n\nIf you wish to stop seeing these messages, do the command `{prefix}dmerrors`.')
            },
            arguments: {
                invalid: t<{ value: string; types: Iterable<string>; }>('❌ Invalid arguments! `{value}` isn\'t {types#map(`{}`)#join(, | or )}'),
                missing: t<{ missing: Iterable<string>; }>('❌ Not enough arguments! You need to provide {missing#map(`{}`)#join(, | or )}'),
                unknown: '❌ I couldn\'t understand those arguments!',
                noneNeeded: t<{ command: Command; }>('❌ Too many arguments! `{command.name}` doesn\'t need any arguments'),
                tooMany: t<{ max: number; given: number; }>('❌ Too many arguments! Expected at most {max} {max#plural(1:argument|arguments)}, but you gave {given}')
            },
            renderFailed: '❌ Something went wrong while trying to render that!',
            messageDeleted: t<{ user: UserTag; }>('**{user.username}#{user.discriminator}** deleted their command message.'),
            blacklisted: t<{ reason: string; }>('❌ You have been blacklisted from the bot for the following reason: {reason}'),
            roleMissing: t<{ roleIds: Iterable<string>; }>('❌ You need the role {roleIds#map(<@&{}>)#join(, | or )} in order to use this command!'),
            permMissing: t<{ permissions: Iterable<IFormattable<string>>; }>('❌ You need {permissions#plural(1:the following permission|any of the following permissions)} to use this command:\n{permissions#join(\n)}')
        },
        categories: {
            custom: {
                name: 'Custom',
                description: 'Custom commands.'
            },
            general: {
                name: 'General',
                description: 'General commands.'
            },
            nsfw: {
                name: 'NSFW',
                description: 'Commands that can only be executed in NSFW channels.'
            },
            image: {
                name: 'Image',
                description: 'Commands that generate or display images.'
            },
            admin: {
                name: 'Admin',
                description: 'Powerful commands that require an `admin` role or special permissions.'
            },
            social: {
                name: 'Social',
                description: 'Social commands for interacting with other people.'
            },
            owner: {
                name: 'Blargbot Owner',
                description: 'MREOW MEOWWWOW! **purr**'
            },
            developer: {
                name: 'Blargbot Developer',
                description: 'Commands that can only be executed by blargbot developers.'
            },
            staff: {
                name: 'Blargbot Staff',
                description: 'Commands that can only be executed by staff on the official support server.'
            },
            support: {
                name: 'Blargbot Support',
                description: 'Commands that can only be executed by support members on the official support server.'
            }
        },
        i18n: {
            export: {
                description: 'Generates a JSON file containing all the keys blargbot currently uses for translation'
            },
            reload: {
                description: 'Loads the latest translations from crowdin',
                success: '✅ Translation update requested!'
            }
        },
        announce: {
            default: {
                description: 'Resets the current configuration for announcements',
                embed: {
                    author: {
                        name: 'Announcement'
                    }
                },
                failed: '❌ I wasn\'t able to send that message for some reason!',
                success: '✅ I\'ve sent the announcement!'
            },
            reset: {
                description: 'Resets the current configuration for announcements',
                success: t<{ prefix: string; }>('✅ Announcement configuration reset! Do `{prefix}announce configure` to reconfigure it.')
            },
            configure: {
                description: 'Resets the current configuration for announcements',
                state: {
                    ChannelInvalid: '❌ The announcement channel must be a text channel!',
                    ChannelNotFound: '❌ No channel is set up for announcements',
                    ChannelNotInGuild: '❌ The announcement channel must be on this server!',
                    NotAllowed: '❌ You cannot send announcements',
                    RoleNotFound: '❌ No role is set up for announcements',
                    TimedOut: '❌ You must configure a role and channel to use announcements!',
                    Success: '✅ Your announcements have been configured!'
                }
            },
            info: {
                description: 'Displays the current configuration for announcements on this server',
                unconfigured: t<{ prefix: string; }>('ℹ️ Announcements are not yet configured for this server. Please use `{prefix}announce configure` to set them up'),
                details: t<{ channel?: Eris.Channel; role?: Eris.Role; }>('ℹ️ Announcements will be sent in {channel#tag=`<unconfigured>`} and will mention {role#tag=`<unconfigured>`}')
            }
        },
        autoResponse: {
            notWhitelisted: '❌ Sorry, autoresponses are currently whitelisted. To request access, do `b!ar whitelist [reason]`',
            notFoundId: t<{ id: string; }>('❌ There isn\'t an autoresponse with id `{id}` here!'),
            notFoundEverything: '❌ There isn\'t an everything autoresponse here!',
            flags: {
                regex: 'If specified, parse as /regex/ rather than plaintext. Unsafe and very long (more than 2000 characters) regexes will not parse successfully.',
                everything: 'Makes the added autoresponse respond to everything. Only one is allowed.'
            },
            whitelist: {
                description: 'Requests for the current server to have autoresponses whitelisted',
                alreadyApproved: '❌ This server is already whitelisted!',
                requested: '✅ Your request has been sent. Please don\'t spam this command.\n\nYou will hear back in this channel if you were accepted or rejected.'
            },
            list: {
                description: 'Displays information about autoresponses',
                noAutoresponses: '❌ There are no autoresponses configured for this server!',
                embed: {
                    title: 'Autoresponses',
                    field: {
                        name: t<{ id: string; }>('Autoresponse `{id}`'),
                        value: {
                            regex: t<{ trigger: string; }>('**Trigger regex:**\n`{trigger}`'),
                            text: t<{ trigger: string; }>('**Trigger text:**\n`{trigger}`'),
                            any: '**Trigger:**\neverything'
                        }
                    }
                }
            },
            info: {
                description: 'Displays information about an autoresponse',
                embed: {
                    title: {
                        id: t<{ id: string; }>('Autoresponse #{id}'),
                        everything: 'Everything Autoresponse'
                    },
                    field: {
                        trigger: {
                            name: {
                                regex: 'Trigger regex',
                                text: 'Trigger text'
                            }
                        },
                        author: {
                            name: 'Author',
                            value: t<{ authorId: string; }>('<@{authorId}> ({authorId})')
                        },
                        authorizer: {
                            name: 'Authorizer',
                            value: t<{ authorizerId: string; }>('<@{authorizerId}> ({authorizerId})')
                        }
                    }
                }
            },
            create: {
                description: 'Adds a autoresponse which matches the given pattern',
                everythingAlreadyExists: '❌ An autoresponse that responds to everything already exists!',
                everythingCannotHavePattern: '❌ Autoresponses that respond to everything cannot have a pattern',
                tooMany: t<{ max: number; }>('❌ You already have {max} autoresponses!'),
                missingEFlag: '❌ If you want to respond to everything, you need to use the `-e` flag.',
                success: t<{ prefix: string; id: 'everything' | number; }>('✅ Your autoresponse has been added! Use `{prefix}autoresponse set {id} <bbtag>` to change the code that it runs')
            },
            delete: {
                description: 'Deletes an autoresponse. Ids can be seen when using the `list` subcommand',
                success: {
                    regex: t<{ id: number; term: string; }>('✅ Autoresponse {id} (Regex: `{term}`) has been deleted'),
                    text: t<{ id: number; term: string; }>('✅ Autoresponse {id} (Pattern: `{term}`) has been deleted'),
                    everything: '✅ The everything autoresponse has been deleted!'
                }
            },
            setPattern: {
                description: 'Sets the pattern of an autoresponse',
                notEmpty: '❌ The pattern cannot be empty',
                notEverything: '❌ Cannot set the pattern for the everything autoresponse',
                success: {
                    regex: t<{ id: number; term: string; }>('✅ The pattern for autoresponse {id} has been set to (regex) `{term}`!'),
                    text: t<{ id: number; term: string; }>('✅ The pattern for autoresponse {id} has been set to `{term}`!')
                }
            },
            set: {
                description: 'Sets the bbtag code to run when the autoresponse is triggered',
                success: {
                    id: t<{ id: number; }>('✅ Updated the code for autoresponse {id}'),
                    everything: '✅ Updated the code for the everything autoresponse'
                }
            },
            raw: {
                description: 'Gets the bbtag that is executed when the autoresponse is triggered',
                inline: {
                    id: t<{ id: number; content: string; }>('✅ The raw code for autoresponse {id} is: ```\n{content}\n```'),
                    everything: t<{ content: string; }>('✅ The raw code for the everything autoresponse is: ```\n{content}\n```')
                },
                attached: {
                    id: t<{ id: number; }>('✅ The raw code for autoresponse {id} is attached'),
                    everything: '✅ The raw code for the everything autoresponse is attached'
                }
            },
            setAuthorizer: {
                description: 'Sets the autoresponse to use your permissions for the bbtag when it is triggered',
                success: {
                    id: t<{ id: number; }>('✅ You are now the authorizer for autoresponse {id}'),
                    everything: '✅ You are now the authorizer for the everything autoresponse'
                }
            },
            debug: {
                description: 'Sets the autoresponse to send you the debug output when it is next triggered by one of your messages',
                success: {
                    id: t<{ id: number; }>('✅ The next message that you send that triggers autoresponse {id} will send the debug output here'),
                    everything: '✅ The next message that you send that triggers the everything autoresponse will send the debug output here'
                }
            }
        },
        ban: {
            flags: {
                reason: 'The reason for the (un)ban.',
                time: 'If provided, the user will be unbanned after the period of time. (softban)'
            },
            default: {
                description: 'Bans a user, where `days` is the number of days to delete messages for.\nIf mod-logging is enabled, the ban will be logged.',
                state: {
                    alreadyBanned: t<{ user: Eris.User; }>('❌ **{user#tag}** is already banned!'),
                    memberTooHigh: t<{ user: Eris.User; }>('❌ I don\'t have permission to ban **{user#tag}**! Their highest role is above my highest role.'),
                    moderatorTooLow: t<{ user: Eris.User; }>('❌ You don\'t have permission to ban **{user#tag}**! Their highest role is above your highest role.'),
                    noPerms: t<{ user: Eris.User; }>('❌ I don\'t have permission to ban **{user#tag}**! Make sure I have the `ban members` permission and try again.'),
                    moderatorNoPerms: t<{ user: Eris.User; }>('❌ You don\'t have permission to ban **{user#tag}**! Make sure you have the `ban members` permission or one of the permissions specified in the `ban override` setting and try again.'),
                    success: t<{ user: Eris.User; }>('✅ **{user#tag}** has been banned.')
                },
                unbanSchedule: {
                    success: t<{ user: Eris.User; unban: moment.Duration; }>('✅ **{user#tag}** has been banned and will be unbanned **{unban#tag}**'),
                    invalid: t<{ user: Eris.User; }>('⚠️ **{user#tag}** has been banned, but the duration was either 0 seconds or improperly formatted so they won\'t automatically be unbanned.')
                }
            },
            clear: {
                description: 'Unbans a user.\nIf mod-logging is enabled, the ban will be logged.',
                userNotFound: '❌ I couldn\'t find that user!',
                state: {
                    notBanned: t<{ user: Eris.User; }>('❌ **{user#tag}** is not currently banned!'),
                    noPerms: t<{ user: Eris.User; }>('❌ I don\'t have permission to unban **{user#tag}**! Make sure I have the `ban members` permission and try again.'),
                    moderatorNoPerms: t<{ user: Eris.User; }>('❌ You don\'t have permission to unban **{user#tag}**! Make sure you have the `ban members` permission or one of the permissions specified in the `ban override` setting and try again.'),
                    success: t<{ user: Eris.User; }>('✅ **{user#tag}** has been unbanned.')
                }
            }
        },
        blacklist: {
            default: {
                description: 'Blacklists the current channel, or the channel that you mention. The bot will not respond until you do `blacklist` again.',
                notInServer: '❌ You cannot blacklist a channel outside of this server',
                success: {
                    added: t<{ channel: Eris.Channel; }>('✅ {channel#tag} is no longer blacklisted.'),
                    removed: t<{ channel: Eris.Channel; }>('✅ {channel#tag} is now blacklisted')
                }
            }
        },
        bot: {
            reset: {
                description: 'Deletes all persistent information that the bot holds. If used in a guild, this includes settings, custom commands and guild variables. If used in a DM this includes user settings, tags and author variables. You can preview exactly what will be deleted by doing `bot dump` first!',
                unavailable: 'The bot cannot be reset here',
                guild: {
                    cancelled: '❌ Reset cancelled',
                    success: '✅ I have been reset back to my initial configuration',
                    confirm: {
                        prompt: '⚠️ Are you sure you want to reset the bot to its initial state?\nThis will:\n- Reset all settings back to their defaults\n- Delete all custom commands, autoresponses, rolemes, censors, etc\n- Delete all tag guild variables',
                        cancel: 'No',
                        continue: 'Yes'
                    }
                },
                user: {
                    cancelled: '❌ Reset cancelled',
                    success: '✅ I have been reset back to my initial configuration',
                    confirm: {
                        prompt: '⚠️ Are you sure you want to reset the bot to its initial state?\nThis will:\n- Reset all your user settings back to their defaults\n- Delete all tags you have made\n- Delete all author variables',
                        cancel: 'No',
                        continue: 'Yes'
                    }
                }
            },
            dump: {
                description: 'Dumps all persistent information that the bot holds. If used',
                unavailable: 'The bot cannot be reset here',
                success: '✅ I have attached the data you requested!',
                cancelled: '❌ Dump cancelled',
                confirm: {
                    prompt: '⚠️ Are you sure you want to dump all the information blargbot is holding? This could include some sensitive information, so ensure that it is ok for everyone here to see it.',
                    cancel: 'Cancel',
                    continue: 'Show me that data'
                }
            }
        },
        ccommand: {
            description: t<{ subtags: string; tos: string; }>('Creates a custom command, using the BBTag language.\n\nCustom commands take precedent over all other commands. As such, you can use it to overwrite commands, or disable them entirely. If the command content is "null" (without the quotations), blargbot will have no output whatsoever, allowing you to disable any built-in command you wish. You cannot overwrite the \'ccommand\' command. For more in-depth command customization, see the `editcommand` command.\nFor more information about BBTag, visit <{subtags}>.\nBy creating a custom command, you acknowledge that you agree to the Terms of Service (<{tos}>)'),
            request: {
                name: 'Enter the name of the custom command:',
                content: 'Enter the custom command\'s contents:'
            },
            errors: {
                isAlias: t<{ commandName: string; tagName: string; }>('❌ The command `{commandName}` is an alias to the tag `{tagName}`'),
                alreadyExists: t<{ name: string; }>('❌ The `{name}` custom command already exists!'),
                doesNotExist: t<{ name: string; }>('❌ The `{name}` custom command doesn\'t exist!'),
                isHidden: t<{ name: string; }>('❌ The `{name}` custom command is a hidden command!'),
                invalidBBTag: t<{ errors: Iterable<IFormattable<string>>; }>('❌ There were errors with the bbtag you provided!\n{errors#join(\n)}'),
                bbtagError: t<AnalysisResult>('❌ [{location.line},{location.column}]: {message}'),
                bbtagWarning: t<AnalysisResult>('⚠️ [{location.line},{location.column}]: {message}'),
                nameReserved: t<{ name: string; }>('❌ The command name `{name}` is reserved and cannot be overwritten'),
                tooLong: t<{ max: number; }>('❌ Command names cannot be longer than {max} characters'),
                importDeleted: t<{ commandName: string; tagName: string; author?: UserTag; authorId: string; }>('❌ When the command `{commandName}` was imported, the tag `{tagName}` was owned by **{author.username=UNKNOWN}#{author.discriminator=????}** ({authorId}) but it no longer exists. To continue using this command, please re-create the tag and re-import it.'),
                importChanged: t<{ commandName: string; tagName: string; oldAuthor?: UserTag; oldAuthorId: string; newAuthor?: UserTag; newAuthorId: string; }>('❌ When the command `{commandName}` was imported, the tag `{tagName}` was owned by **{oldAuthor.username=UNKNOWN}#{oldAuthor.discriminator=????}** ({oldAuthorId}) but it is now owned by **{newAuthor.username=UNKNOWN}#{newAuthor.discriminator=????}** ({newAuthorId}). If this is acceptable, please re-import the tag to continue using this command.')
            },
            test: {
                default: {
                    description: 'Uses the BBTag engine to execute the content as if it was a custom command'
                },
                debug: {
                    description: 'Uses the BBTag engine to execute the content as if it was a custom command and will return the debug output'
                }
            },
            docs: {
                description: 'Returns helpful information about the specified topic.'
            },
            debug: {
                description: 'Runs a custom command with some arguments. A debug file will be sent in a DM after the command has finished.',
                notOwner: '❌ You cannot debug someone else\'s custom command.',
                success: 'ℹ️ Ive sent the debug output in a DM'
            },
            create: {
                description: 'Creates a new custom command with the content you give',
                success: t<{ name: string; errors: Iterable<IFormattable<string>>; }>('✅ Custom command `{name}` created.\n{errors#join(\n)}')
            },
            edit: {
                description: 'Edits an existing custom command to have the content you specify',
                success: t<{ name: string; errors: Iterable<IFormattable<string>>; }>('✅ Custom command `{name}` edited.\n{errors#join(\n)}')
            },
            set: {
                description: 'Sets the custom command to have the content you specify. If the custom command doesn\'t exist it will be created.',
                success: t<{ name: string; errors: Iterable<IFormattable<string>>; }>('✅ Custom command `{name}` set.\n{errors#join(\n)}')
            },
            delete: {
                description: 'Deletes an existing custom command',
                success: t<{ name: string; }>('✅ The `{name}` custom command is gone forever!')
            },
            rename: {
                description: 'Renames the custom command',
                enterOldName: 'Enter the name of the custom command to rename:',
                enterNewName: 'Enter the new name of the custom command:',
                success: t<{ oldName: string; newName: string; }>('✅ The `{oldName}` custom command has been renamed to `{newName}`.')
            },
            raw: {
                description: 'Gets the raw content of the custom command',
                inline: t<{ name: string; content: string; }>('ℹ️ The raw code for {name} is: ```\n{content}\n```'),
                attached: t<{ name: string; }>('ℹ️ The raw code for {name} is attached')
            },
            list: {
                description: 'Lists all custom commands on this server',
                embed: {
                    title: 'List of custom commands',
                    field: {
                        anyRole: {
                            name: 'Any role'
                        }
                    }
                }
            },
            cooldown: {
                description: 'Sets the cooldown of a custom command, in milliseconds',
                mustBePositive: '❌ The cooldown must be greater than 0ms',
                success: t<{ name: string; cooldown: moment.Duration; }>('✅ The custom command `{name}` now has a cooldown of `{cooldown#duration(MS)}ms`.')
            },
            author: {
                description: 'Displays the name of the custom command\'s author',
                noAuthorizer: t<{ name: string; author?: UserTag; }>('✅ The custom command `{name}` was made by **{author.username=UNKNOWN}#{author.discriminator=????}**'),
                withAuthorizer: t<{ name: string; author?: UserTag; authorizer?: UserTag; }>('✅ The custom command `{name}` was made by **{author.username=UNKNOWN}#{author.discriminator=????}** and is authorized by **{authorizer.username=UNKNOWN}#{authorizer.discriminator=????}**')
            },
            flag: {
                updated: t<{ name: string; }>('✅ The flags for `{name}` have been updated.'),
                get: {
                    description: 'Lists the flags the custom command accepts',
                    none: t<{ name: string; }>('❌ The `{name}` custom command has no flags.'),
                    success: t<{ name: string; flags: Iterable<FlagDefinition<string>>; }>('✅ The `{name}` custom command has the following flags:\n\n{flags#map(`-{flag}`/`--{word}`: {description})#join(\n)}')
                },
                create: {
                    description: 'Adds multiple flags to your custom command. Flags should be of the form `-<f> <flag> [flag description]`\ne.g. `b!cc flags add myCommand -c category The category you want to use -n name Your name`',
                    wordMissing: t<{ flag: string; }>('❌ No word was specified for the `{flag}` flag'),
                    flagExists: t<{ flag: string; }>('❌ The flag `{flag}` already exists!'),
                    wordExists: t<{ word: string; }>('❌ A flag with the word `{word}` already exists!')
                },
                delete: {
                    description: 'Removes multiple flags from your custom command. Flags should be of the form `-<f>`\ne.g. `b!cc flags remove myCommand -c -n`'
                }
            },
            setHelp: {
                description: 'Sets the help text to show for the command',
                success: t<{ name: string; }>('✅ Help text for custom command `{name}` set.')
            },
            hide: {
                description: 'Toggles whether the command is hidden from the command list or not',
                success: t<{ name: string; hidden: boolean; }>('✅ Custom command `{name}` is now {hidden#bool(hidden|visible)}.')
            },
            setRole: {
                description: 'Sets the roles that are allowed to use the command',
                success: t<{ name: string; roles: Iterable<Eris.Role>; }>('✅ Roles for custom command `{name}` set to {roles#map({#tag})#join(, | and )}.')
            },
            shrinkwrap: {
                description: 'Bundles up the given commands into a single file that you can download and install into another server',
                confirm: {
                    prompt: t<{ steps: Iterable<IFormattable<string>>; }>('Salutations! You have discovered the super handy ShrinkWrapper9000!\n\nIf you decide to proceed, this will:\n{steps#join(\n)}\nThis will not:\n - Export variables\n - Export authors or authorizers\n - Export dependencies'),
                    export: t<{ name: string; }>(' - Export the custom command `{name}`'),
                    continue: 'Confirm',
                    cancel: 'Cancel'
                },
                cancelled: '✅ Maybe next time then.',
                success: '✅ No problem, my job here is done.'
            },
            install: {
                description: 'Bundles up the given commands into a single file that you can download and install into another server',
                fileMissing: '❌ You have to upload the installation file, or give me a URL to one.',
                malformed: '❌ Your installation file was malformed.',
                confirm: {
                    unsigned: '⚠️ **Warning**: This installation file is **unsigned**. It did not come from me. Please double check to make sure you want to go through with this.',
                    tampered: '⚠️ **Warning**: This installation file\'s signature is **incorrect**. There is a 100% chance that it has been tampered with. Please double check to make sure you want to go through with this.',
                    prompt: t<{ warning?: IFormattable<string>; steps: Iterable<IFormattable<string>>; }>('{warning#bool({}\n\n|)}Salutations! You have discovered the super handy CommandInstaller9000!\n\nIf you decide to proceed, this will:\n{steps#join(\n)}\nThis will also:\n - Set you as the author for all imported commands'),
                    import: t<{ name: string; }>('✅ Import the command `{name}`'),
                    skip: t<{ name: string; }>('❌ Ignore the command `{name}` as a command with that name already exists'),
                    continue: 'Confirm',
                    cancel: 'Cancel'
                },
                cancelled: '✅ Maybe next time then.',
                success: '✅ No problem, my job here is done.'
            },
            import: {
                description: 'Imports a tag as a ccommand, retaining all data such as author variables',
                tagMissing: t<{ name: string; }>('❌ The `{name}` tag doesn\'t exist!'),
                success: t<{ tagName: string; commandName: string; author?: UserTag; authorizer?: UserTag; }>('✅ The tag `{tagName}` by **{author.username=UNKNOWN}#{author.discriminator=????}** has been imported as `{commandName}` and is authorized by **{authorizer.username=UNKNOWN}#{authorizer.discriminator=????}**')
            }
        },
        censor: {
            flags: {
                regex: 'If specified, parse as /regex/ rather than plaintext. Unsafe and very long (more than 2000 characters) regexes will not parse successfully.',
                decancer: 'If specified, perform the censor check against the decancered version of the message.',
                weight: 'How many incidents the censor is worth.',
                reason: 'A custom modlog reason. NOT BBTag compatible.'
            },
            errors: {
                doesNotExist: t<{ id: number; }>('❌ Censor `{id}` doesn\'t exist'),
                weightNotNumber: t<{ value: string; }>('❌ The censor weight must be a number but `{value}` is not'),
                invalidType: t<{ type: string; }>('❌ `{type}` is not a valid type'),
                messageNotSet: {
                    default: t<{ type: string; }>('❌ A custom default {type} message has not been set yet'),
                    id: t<{ type: string; id: number; }>('❌ A custom {type} message for censor {id} has not been set yet')
                }
            },
            add: {
                description: 'Creates a censor using the given phrase',
                success: t<{ id: number; }>('✅ Censor `{id}` has been created')
            },
            edit: {
                description: 'Updates a censor',
                success: t<{ id: number; }>('✅ Censor `{id}` has been updated')
            },
            delete: {
                description: 'Deletes a censor',
                success: t<{ id: number; }>('✅ Censor `{id}` has been deleted')
            },
            exception: {
                user: {
                    description: 'Adds or removes a user from the list of users which all censors ignore',
                    success: t<{ user: Eris.User; }>('✅ {user#tag} is now exempt from all censors')
                },
                role: {
                    description: 'Adds or removes a role from the list of roles which all censors ignore',
                    success: t<{ role: Eris.Role; }>('✅ Anyone with the role {role#tag} is now exempt from all censors')
                },
                channel: {
                    description: 'Adds or removes a channel from the list of channels which all censors ignore',
                    notOnServer: '❌ The channel must be on this server!',
                    success: t<{ channel: Eris.Channel; }>('✅ Messages sent in {channel#tag} are now exempt from all censors')
                }
            },
            setMessage: {
                description: 'Sets the message so show when the given censor causes a user to be granted a `timeout`, or to be `kick`ed or `ban`ned, or the message is `delete`d\nIf `id` is not provided, the message will be the default message that gets shown if one isn\'t set for the censor that is triggered',
                success: {
                    default: t<{ type: string; }>('✅ The default {type} message has been set'),
                    id: t<{ type: string; id: number; }>('✅ The {type} message for censor {id} has been set')
                }
            },
            setAuthorizer: {
                description: 'Sets the custom censor message to use your permissions when executing.',
                success: {
                    default: t<{ type: string; }>('✅ The default {type} message authorizer has been set'),
                    id: t<{ type: string; id: number; }>('✅ The {type} message authorizer for censor {id} has been set')
                }
            },
            rawMessage: {
                description: 'Gets the raw code for the given censor',
                inline: {
                    default: t<{ type: string; content: string; }>('ℹ️ The raw code for the default {type} message is: ```\n{content}\n```'),
                    id: t<{ type: string; id: number; content: string; }>('ℹ️ The raw code for the {type} message for censor `{id}` is: ```\n{content}\n```')
                },
                attached: {
                    default: t<{ type: string; }>('ℹ️ The raw code for the default {type} message is attached'),
                    id: t<{ type: string; id: number; }>('ℹ️ The raw code for the {type} message for censor `{id}` is attached')
                }
            },
            debug: {
                description: 'Sets the censor to send you the debug output when it is next triggered by one of your messages. Make sure you aren\'t exempt from censors!',
                success: t<{ id: number; }>('✅ The next message that you send that triggers censor `{id}` will send the debug output here')
            },
            list: {
                description: 'Lists all the details about the censors that are currently set up on this server',
                embed: {
                    title: 'ℹ️ Censors',
                    description: {
                        value: t<{ censors: Iterable<IFormattable<string>>; }>('{censors#join(\n)}'),
                        censor: {
                            regex: t<{ id: number; term: string; }>('**Censor** `{id}` (Regex): {term}'),
                            text: t<{ id: number; term: string; }>('**Censor** `{id}`: {term}')
                        },
                        none: 'No censors configured'
                    },
                    field: {
                        users: {
                            name: 'Excluded users',
                            value: t<{ users: Iterable<string>; }>('{users#plural(0:None|{#map(<@{}>)#join( )})}')
                        },
                        roles: {
                            name: 'Excluded roles',
                            value: t<{ roles: Iterable<string>; }>('{roles#plural(0:None|{#map(<@&{}>)#join( )})}')
                        },
                        channels: {
                            name: 'Excluded channels',
                            value: t<{ channels: Iterable<string>; }>('{channels#plural(0:None|{#map(<#{}>)#join( )})}')
                        }
                    }
                }
            },
            info: {
                description: 'Gets detailed information about the given censor',
                messageFieldValue: {
                    notSet: 'Not set',
                    set: t<{ authorId: string; authorizerId: string; }>('Author: <@{authorId}>\nAuthorizer: <@{authorizerId}>')
                },
                embed: {
                    title: t<{ id: number; }>('ℹ️ Censor `{id}`'),
                    field: {
                        trigger: {
                            name: {
                                regex: 'Trigger (Regex)',
                                text: 'Trigger'
                            }
                        },
                        weight: {
                            name: 'Weight',
                            value: t<{ weight: number; }>('{weight}')
                        },
                        reason: {
                            name: 'Reason',
                            value: t<{ reason?: string; }>('{reason=Not set}')
                        },
                        deleteMessage: {
                            name: 'Delete message'
                        },
                        timeoutMessage: {
                            name: 'Timeout message'
                        },
                        kickMessage: {
                            name: 'Kick message'
                        },
                        banMessage: {
                            name: 'Ban message'
                        }
                    }
                }
            }
        },
        changeLog: {
            errors: {
                missingPermissions: '❌ I need the manage webhooks permission to subscribe this channel to changelogs!'
            },
            subscribe: {
                description: 'Subscribes this channel to my changelog updates. I require the `manage webhooks` permission for this.',
                alreadySubscribed: 'ℹ️ This channel is already subscribed to my changelog updates!',
                success: '✅ This channel will now get my changelog updates!'
            },
            unsubscribe: {
                description: 'Unsubscribes this channel from my changelog updates. I require the `manage webhooks` permission for this.',
                notSubscribed: 'ℹ️ This channel is not subscribed to my changelog updates!',
                success: '✅ This channel will no longer get my changelog updates!'
            }
        },
        editCommand: {
            list: {
                description: 'Shows a list of modified commands',
                none: 'ℹ️ You haven\'t modified any commands',
                embed: {
                    title: 'ℹ️ Edited commands',
                    description: {
                        name: t<{ name: string; }>('**{name}**\n'),
                        roles: t<{ roles: Iterable<Eris.Role>; }>('- Roles: {roles#map({#tag})#join(, )}\n'),
                        permissions: t<{ permission: string; }>('- Permission: {permission}\n'),
                        disabled: '- Disabled\n',
                        hidden: '- Hidden\n',
                        template: t<{ commands: Iterable<{ name: IFormattable<string>; roles?: IFormattable<string>; permissions?: IFormattable<string>; disabled?: IFormattable<string>; hidden?: IFormattable<string>; }>; }>('{commands#map({name}{roles}{permissions}{disabled}{hidden})#join(\n)}')
                    }
                }
            },
            setRole: {
                description: 'Sets the role required to run the listed commands',
                removed: t<{ commands: Iterable<string>; }>('✅ Removed the role requirement for the following commands:```fix\n{commands#join(, )}\n```'),
                set: t<{ commands: Iterable<string>; }>('✅ Set the role requirement for the following commands:```fix\n{commands#join(, )}\n```')
            },
            setPermissions: {
                description: 'Sets the permissions required to run the listed commands. If a user has any of the permissions, they will be able to use the command.',
                removed: t<{ commands: Iterable<string>; }>('✅ Removed the permissions for the following commands:```fix\n{commands#join(, )}\n```'),
                set: t<{ commands: Iterable<string>; }>('✅ Set the permissions for the following commands:```fix\n{commands#join(, )}\n```')
            },
            disable: {
                description: 'Disables the listed commands, so no one but the owner can use them',
                success: t<{ commands: Iterable<string>; }>('✅ Disabled the following commands:```fix\n{commands#join(, )}\n```')
            },
            enable: {
                description: 'Enables the listed commands, allowing anyone with the correct permissions or roles to use them',
                success: t<{ commands: Iterable<string>; }>('✅ Enabled the following commands:```fix\n{commands#join(, )}\n```')
            },
            hide: {
                description: 'Hides the listed commands. They can still be executed, but wont show up in help',
                success: t<{ commands: Iterable<string>; }>('✅ The following commands are now hidden:```fix\n{commands#join(, )}\n```')
            },
            show: {
                description: 'Reveals the listed commands in help',
                success: t<{ commands: Iterable<string>; }>('✅ The following commands are no longer hidden:```fix\n{commands#join(, )}\n```')
            }
        },
        farewell: {
            errors: {
                notSet: '❌ No farewell message has been set yet!'
            },
            set: {
                description: 'Sets the bbtag to send when someone leaves the server',
                success: '✅ The farewell message has been set'
            },
            raw: {
                description: 'Gets the current message that will be sent when someone leaves the server',
                inline: t<{ content: string; }>('ℹ️ The raw code for the farewell message is: ```\n{content}\n```'),
                attached: 'ℹ️ The raw code for the farewell message is attached'
            },
            setAuthorizer: {
                description: 'Sets the farewell message to use your permissions when running',
                success: '✅ The farewell message will now run using your permissions'
            },
            setChannel: {
                description: 'Sets the channel the farewell message will be sent in.',
                notOnGuild: '❌ The farewell channel must be on this server!',
                notTextChannel: '❌ The farewell channel must be a text channel!',
                success: t<{ channel: Eris.Channel; }>('✅ Farewell messages will now be sent in {channel#tag}')
            },
            debug: {
                description: 'Executes the farewell message as if you left the server and provides the debug output.',
                channelMissing: '❌ I wasn\'t able to locate a channel to sent the message in!',
                success: 'ℹ️ Ive sent the debug output in a DM'
            },
            delete: {
                description: 'Deletes the current farewell message.',
                success: '✅ Farewell messages will no longer be sent'
            },
            info: {
                description: 'Shows information about the current farewell message',
                success: t<{ authorId: string; authorizerId: string; }>('ℹ️ The current farewell was last edited by <@{authorId}> ({authorId}) and is authorized by <@{authorizerId}> ({authorizerId})')
            }
        },
        greeting: {
            errors: {
                notSet: '❌ No greeting message has been set yet!'
            },
            set: {
                description: 'Sets the message to send when someone joins the server',
                success: '✅ The greeting message has been set'
            },
            raw: {
                description: 'Gets the current message that will be sent when someone joins the server',
                inline: t<{ content: string; }>('ℹ️ The raw code for the greeting message is: \n{content}\n```'),
                attached: 'ℹ️ The raw code for the greeting message is attached'
            },
            setAuthorizer: {
                description: 'Sets the greeting message to use your permissions when running',
                success: '✅ The greeting message will now run using your permissions'
            },
            setChannel: {
                description: 'Sets the channel the greeting message will be sent in.',
                notOnGuild: '❌ The greeting channel must be on this server!',
                notTextChannel: '❌ The greeting channel must be a text channel!',
                success: t<{ channel: Eris.Channel; }>('✅ Greeting messages will now be sent in {channel#tag}')
            },
            debug: {
                description: 'Executes the greeting message as if you left the server and provides the debug output.',
                channelMissing: '❌ I wasn\'t able to locate a channel to sent the message in!',
                success: 'ℹ️ Ive sent the debug output in a DM'
            },
            delete: {
                description: 'Deletes the current greeting message.',
                success: '✅ Greeting messages will no longer be sent'
            },
            info: {
                description: 'Shows information about the current greeting message',
                success: t<{ authorId: string; authorizerId: string; }>('ℹ️ The current greeting was last edited by <@{authorId}> ({authorId}) and is authorized by <@{authorizerId}> ({authorizerId})')
            }
        },
        interval: {
            errors: {
                notSet: '❌ No interval has been set yet!'
            },
            set: {
                description: 'Sets the bbtag to run every 15 minutes',
                success: '✅ The interval has been set'
            },
            raw: {
                description: 'Gets the current code that the interval is running',
                inline: t<{ content: string; }>('ℹ️ The raw code for the interval is: ```\n{content}\n```'),
                attached: 'ℹ️ The raw code for the interval is attached'
            },
            delete: {
                description: 'Deletes the current interval',
                success: '✅ The interval has been deleted'
            },
            setAuthorizer: {
                description: 'Sets the interval to run using your permissions',
                success: '✅ Your permissions will now be used when the interval runs'
            },
            debug: {
                description: 'Runs the interval now and sends the debug output',
                failed: '❌ There was an error while running the interval!',
                authorizerMissing: '❌ I couldn\'t find the user who authorizes the interval!',
                channelMissing: '❌ I wasn\'t able to figure out which channel to run the interval in!',
                timedOut: t<{ max: moment.Duration; }>('❌ The interval took longer than the max allowed time ({max#duration(S)}s)'),
                success: 'ℹ️ Ive sent the debug output in a DM'
            },
            info: {
                description: 'Shows information about the current interval',
                success: t<{ authorId: string; authorizerId: string; }>('ℹ️ The current interval was last edited by <@{authorId}> ({authorId}) and is authorized by <@{authorizerId}> ({authorizerId})')
            }
        },
        kick: {
            flags: {
                reason: 'The reason for the kick.'
            },
            default: {
                description: 'Kicks a user.\nIf mod-logging is enabled, the kick will be logged.',
                state: {
                    memberTooHigh: t<{ user: Eris.User; }>('❌ I don\'t have permission to kick **{user#tag}**! Their highest role is above my highest role.'),
                    moderatorTooLow: t<{ user: Eris.User; }>('❌ You don\'t have permission to kick **{user#tag}**! Their highest role is above your highest role.'),
                    noPerms: t<{ user: Eris.User; }>('❌ I don\'t have permission to kick **{user#tag}**! Make sure I have the `kick members` permission and try again.'),
                    moderatorNoPerms: t<{ user: Eris.User; }>('❌ You don\'t have permission to kick **{user#tag}**! Make sure you have the `kick members` permission or one of the permissions specified in the `kick override` setting and try again.'),
                    success: t<{ user: Eris.User; }>('✅ **{user#tag}** has been kicked.')
                }
            }
        },
        log: {
            common: {
                events: {
                    avatarupdate: 'Triggered when someone changes their username',
                    kick: 'Triggered when a member is kicked',
                    memberban: 'Triggered when a member is banned',
                    memberjoin: 'Triggered when someone joins',
                    memberleave: 'Triggered when someone leaves',
                    membertimeout: 'Triggered when someone is timed out',
                    membertimeoutclear: 'Triggered when someone\'s timeout is removed',
                    memberunban: 'Triggered when someone is unbanned',
                    messagedelete: 'Triggered when someone deletes a message they sent',
                    messageupdate: 'Triggered when someone updates a message they sent',
                    nameupdate: 'Triggered when someone changes their username or discriminator',
                    nickupdate: 'Triggered when someone changes their nickname'
                }
            },
            list: {
                description: 'Lists all the events currently being logged',
                embed: {
                    field: {
                        ignore: {
                            name: 'Ignored users',
                            value: t<{ userIds: Iterable<string>; }>('{userIds#plural(0:No ignored users|{#map(<@{}> ({}))#join(\n)})}')
                        },
                        current: {
                            name: 'Currently logged events',
                            value: {
                                event: t<{ event: string; channelId: string; }>('**{event}** - <#{channelId}>}'),
                                role: t<{ roleId: string; channelId: string; }>('**{roleId}** - <#{channelId}>}'),
                                template: t<{ entries: Iterable<IFormattable<string>>; }>('{entries#plural(0:No logged events|{#join(\n)})}')
                            }
                        }
                    }
                }
            },
            enable: {
                description: {
                    default: t<{ events: Iterable<{ key: string; desc: IFormattable<string>; }>; }>('Sets the channel to log the given events to. Available events are:\n{events#map(`{key}` - {desc})#join(\n)}'),
                    all: 'Sets the channel to log all events to, except role related events.',
                    role: 'Sets the channel to log when someone gets or loses a role.'
                },
                notOnGuild: '❌ The log channel must be on this server!',
                notTextChannel: '❌ The log channel must be a text channel!',
                eventInvalid: t<{ events: Iterable<string>; }>('❌ {events#join(, | and )} {events#plural(1:is not a valid event|are not valid events)}'),
                success: t<{ channel: Eris.Channel; events: Iterable<string>; }>('✅ I will now log the following events in {channel#tag}:\n{events#join(\n)}')
            },
            disable: {
                description: {
                    default: t<{ events: Iterable<{ key: string; desc: IFormattable<string>; }>; }>('Disables logging of the given events. Available events are:\n{events#map(`{key}` - {desc})#join(\n)}'),
                    all: 'Disables logging of all events except role related events.',
                    role: 'Stops logging when someone gets or loses a role.'
                },
                success: t<{ events: Iterable<string>; }>('✅ I will no longer log the following events:\n{events#join(\n)}')
            },
            ignore: {
                description: 'Ignores any tracked events concerning the users',
                success: t<{ senderIds: Iterable<string>; }>('✅ I will now ignore events from {senderIds#map(<@{}>)#join(, | and )}')
            },
            track: {
                description: 'Removes the users from the list of ignored users and begins tracking events from them again',
                success: t<{ senderIds: Iterable<string>; }>('✅ I will no longer ignore events from {senderIds#map(<@{}>)#join(, | and )}')
            }
        },
        logs: {
            flags: {
                type: 'The type(s) of message. Value can be CREATE, UPDATE, and/or DELETE, separated by commas.',
                channel: 'The channel to retrieve logs from. Value can be a channel ID or a channel mention.',
                user: 'The user(s) to retrieve logs from. Value can be a username, nickname, mention, or ID. This uses the user lookup system.',
                create: 'Get message creates.',
                update: 'Get message updates.',
                delete: 'Get message deletes.',
                json: 'Returns the logs in a json file rather than on a webpage.'
            },
            default: {
                description: 'Creates a chatlog page for a specified channel, where `number` is the amount of lines to get. You can retrieve a maximum of 1000 logs. For more specific logs, you can specify flags.\nFor example, if you wanted to get 100 messages `stupid cat` deleted, you would do this:\n`logs 100 --type delete --user stupid cat`\nIf you want to use multiple of the same type, separate parameters with commas or chain them together. For example:\n`logs 100 -CU -u stupid cat, dumb cat`',
                chatlogsDisabled: t<{ prefix: string; }>('❌ This guild has not opted into chatlogs. Please do `{prefix}settings set makelogs true` to allow me to start creating chatlogs.'),
                tooManyLogs: '❌ You cant get more than 1000 logs at a time',
                notEnoughLogs: '❌ A minimum of 1 chatlog entry must be requested',
                channelMissing: t<{ channel: string; }>('❌ I couldn\'t find the channel `{channel}`'),
                notOnGuild: '❌ The channel must be on this guild!',
                noPermissions: '❌ You do not have permissions to look at that channels message history!',
                userMissing: t<{ user: string; }>('❌ I couldn\'t find the user `{user}`'),
                generating: 'ℹ️ Generating your logs...',
                sendFailed: '❌ I wasn\'t able to send the message containing the logs!',
                pleaseWait: 'ℹ️ Generating your logs...\nThis seems to be taking longer than usual. I\'ll ping you when I\'m finished.',
                generated: {
                    link: {
                        quick: t<{ link: string; }>('✅ Your logs are available here: {link}'),
                        slow: t<{ user: Eris.User; link: string; }>('✅ Sorry that took so long, {user#tag}.\nYour logs are available here: {link}')
                    },
                    json: {
                        quick: '✅ Here are your logs, in a JSON file!',
                        slow: t<{ user: Eris.User; }>('✅ Sorry that took so long, {user#tag}.\nHere are your logs, in a JSON file!')
                    }
                }
            }
        },
        massBan: {
            flags: {
                reason: 'The reason for the ban.'
            },
            default: {
                description: 'Bans a user who isn\'t currently on your guild, where `<userIds...>` is a list of user IDs or mentions (separated by spaces) and `days` is the number of days to delete messages for.\nIf mod-logging is enabled, the ban will be logged.',
                state: {
                    alreadyBanned: '❌ All those users are already banned!',
                    memberTooHigh: '❌ I don\'t have permission to ban any of those users! Their highest roles are above my highest role.',
                    moderatorTooLow: '❌ You don\'t have permission to ban any of those users! Their highest roles are above your highest role.',
                    noPerms: '❌ I don\'t have permission to ban anyone! Make sure I have the `ban members` permission and try again.',
                    moderatorNoPerms: '❌ You don\'t have permission to ban anyone! Make sure you have the `ban members` permission or one of the permissions specified in the `ban override` setting and try again.',
                    noUsers: '❌ None of the user ids you gave were valid users!'
                },
                success: t<{ users: Iterable<Eris.User>; }>('✅ The following user(s) have been banned:\n{users#map({#tag})#join(\n)}')
            }
        },
        modLog: {
            setChannel: {
                description: 'Sets the channel to use as the modlog channel',
                notOnGuild: '❌ The modlog channel must be on this server!',
                notTextChannel: '❌ The modlog channel must be a text channel!',
                success: t<{ channel: Eris.Channel; }>('✅ Modlog entries will now be sent in {channel#tag}')
            },
            disable: {
                description: 'Disables the modlog',
                success: '✅ The modlog is disabled'
            },
            clear: {
                description: 'Deletes specific modlog entries. If you don\'t provide any, all the entries will be removed',
                notFound: '❌ No modlogs were found!',
                channelMissing: t<{ modlogs: Iterable<number>; }>('⛔ I couldn\'t find the modlog channel for cases {modlogs#map(`{}`)#join(, | and )}'),
                messageMissing: t<{ modlogs: Iterable<number>; }>('⛔ I couldn\'t find the modlog message for cases {modlogs#map(`{}`)#join(, | and )}'),
                permissionMissing: t<{ modlogs: Iterable<number>; }>('⛔ I didn\'t have permission to delete the modlog for cases {modlogs#map(`{}`)#join(, | and )}'),
                success: t<{ count: number; errors: Iterable<IFormattable<string>>; }>('✅ I successfully deleted {count} {count#plural(1:modlog|modlogs)} from my database.{errors#map(\n{})#join()}')
            }
        },
        mute: {
            flags: {
                reason: 'The reason for the (un)mute.',
                time: 'The amount of time to mute for, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d2h3m4s\', or some other combination.'
            },
            default: {
                description: 'Gives the user a special muted role. On first run, this role will be created. The bot needs to be able to `manage roles` to create and assign the role, and `manage channels` to configure the role. You are able to manually configure the role without the bot, but the bot has to make it. Deleting the muted role causes it to be regenerated.\nIf the bot has permissions for it, this command will also voice-mute the user.\nIf mod-logging is enabled, the mute will be logged.\nYou can also specify a length of time the user should be muted for, using formats such as `1 hour 2 minutes` or `1h2m`.',
                createPermsMissing: '❌ I don\'t have enough permissions to create a `muted` role! Make sure I have the `manage roles` permission and try again.',
                configurePermsMissing: '❌ I created a `muted` role, but don\'t have permissions to configure it! Either configure it yourself, or make sure I have the `manage channel` permission, delete the `muted` role, and try again.',
                state: {
                    alreadyMuted: t<{ user: Eris.User; }>('❌ {user#tag} is already muted'),
                    noPerms: '❌ I don\'t have permission to mute users! Make sure I have the `manage roles` permission and try again.',
                    moderatorNoPerms: '❌ You don\'t have permission to mute users! Make sure you have the `manage roles` permission and try again.',
                    roleMissing: '❌ The muted role has been deleted! Please re-run this command to create a new one.',
                    roleTooHigh: '❌ I can\'t assign the muted role! (it\'s higher than or equal to my top role)',
                    moderatorTooLow: '❌ You can\'t assign the muted role! (it\'s higher than or equal to your top role)'

                },
                success: {
                    default: t<{ user: Eris.User; }>('✅ **{user#tag}** has been muted'),
                    durationInvalid: t<{ user: Eris.User; }>('⚠️ **{user#tag}** has been muted, but the duration was either 0 seconds or improperly formatted so they won\'t automatically be unmuted.'),
                    temporary: t<{ user: Eris.User; unmute: moment.Duration; }>('✅ **{user#tag}** has been muted and will be unmuted **{unmute#tag}**')
                }
            },
            clear: {
                description: 'Removes the special muted role from the user. \nIf mod-logging is enabled, the mute will be logged.',
                state: {
                    notMuted: t<{ user: Eris.User; }>('❌ {user#tag} is not currently muted'),
                    noPerms: '❌ I don\'t have permission to unmute users! Make sure I have the `manage roles` permission and try again.',
                    moderatorNoPerms: '❌ You don\'t have permission to unmute users! Make sure you have the `manage roles` permission and try again.',
                    roleTooHigh: '❌ I can\'t revoke the muted role! (it\'s higher than or equal to my top role)',
                    moderatorTooLow: '❌ You can\'t revoke the muted role! (it\'s higher than or equal to your top role)',
                    success: t<{ user: Eris.User; }>('✅ **{user#tag}** has been unmuted')
                }
            }
        },
        pardon: {
            flags: {
                reason: 'The reason for the pardon.',
                count: 'The number of warnings that will be removed.'
            },
            default: {
                description: 'Pardons a user.\nIf mod-logging is enabled, the pardon will be logged.\nThis will not unban users.',
                state: {
                    countNaN: t<{ text: string; }>('❌ {text} isn\'t a number!'),
                    countNegative: '❌ I cant give a negative amount of pardons!',
                    countZero: '❌ I cant give zero pardons!',
                    success: t<{ user: Eris.User; count: number; warnings: number; }>('✅ **{user#tag}** has been given {count#plural(1:a warning|{} warnings)}. They now have {warnings#plural(1:1 warning|{} warnings)}.')
                }
            }
        },
        prefix: {
            list: {
                description: 'Lists all the current prefixes on this server',
                success: t<{ guild: Eris.Guild; prefixes: Iterable<string>; }>('ℹ️ {guild.name} has {prefixes#plural(0:no custom prefixes|the following prefixes:\n{#map( - {})#join(\n)})}')
            },
            add: {
                description: 'Adds a command prefix to this server',
                success: '✅ The prefix has been added!'
            },
            remove: {
                description: 'Removes a command prefix from this server',
                success: '✅ The prefix has been removed!'
            }
        },
        reason: {
            default: {
                description: 'Sets the reason for an action on the modlog.',
                none: '❌ There aren\'t any modlog entries yet!',
                unknownCase: t<{ caseId: number; }>('❌ I couldn\'t find a modlog entry with a case id of {caseId}'),
                success: {
                    messageMissing: '⚠️ The modlog has been updated! I couldn\'t find the message to update however.',
                    default: '✅ The modlog has been updated!'
                }
            }
        },
        roleMe: {
            errors: {
                missing: t<{ id: number; }>('❌ Roleme {id} doesn\'t exist'),
                noMessage: t<{ id: number; }>('❌ Roleme {id} doesn\'t have a custom message'),
                missingChannels: '❌ I couldn\'t locate any of the channels you provided',
                missingRoles: '❌ I couldn\'t locate any of the roles you provided',
                noRoles: '❌ You must provide at least 1 role to add or remove',
                noTrigger: '❌ You must provide a trigger phrase for the roleme'
            },
            common: {
                triggerQuery: '❓ What should users type for this roleme to trigger?',
                caseSensitiveQuery: {
                    prompt: '❓ Is the trigger case sensitive?',
                    continue: 'Yes',
                    cancel: 'No'
                },
                channelsQuery: {
                    prompt: '❓ Please mention all the channels you want the roleme to be available in',
                    cancel: 'All channels'
                },
                rolesQuery: {
                    prompt: {
                        add: '❓ Please type the roles you want the roleme to add, 1 per line. Mentions, ids or names can be used.',
                        remove: '❓ Please type the roles you want the roleme to remove, 1 per line. Mentions, ids or names can be used.'
                    },
                    fail: '❌ I couldn\'t find any of the roles from your message, please try again.',
                    cancel: 'No roles'
                }
            },
            flags: {
                add: 'A list of roles to add in the roleme',
                remove: 'A list of roles to remove in the roleme',
                case: 'Whether the phrase is case sensitive',
                channels: 'The channels the roleme should be in'
            },
            add: {
                description: 'Adds a new roleme with the given phrase',
                unexpectedError: '❌ Something went wrong while I was trying to create that roleme',
                success: t<{ id: number; }>('✅ Roleme `{id}` has been created!')
            },
            remove: {
                description: 'Deletes the given roleme',
                success: t<{ id: number; }>('✅ Roleme `{id}` has been deleted')
            },
            edit: {
                description: 'Edits the given roleme',
                unexpectedError: '❌ Something went wrong while I was trying to edit that roleme',
                success: t<{ id: number; }>('✅ Roleme `{id}` has been updated!')
            },
            setMessage: {
                description: 'Sets the bbtag compatible message to show when the roleme is triggered',
                success: t<{ id: number; }>('✅ Roleme `{id}` has now had its message set')
            },
            rawMessage: {
                description: 'Gets the current message that will be sent when the roleme is triggered',
                inline: t<{ id: number; content: string; }>('ℹ️ The raw code for roleme `{id}` is: ```\n{content}\n```'),
                attached: t<{ id: number; }>('ℹ️ The raw code for roleme `{id}` is attached')
            },
            debugMessage: {
                description: 'Executes the roleme message as if you triggered the roleme',
                success: 'ℹ️ Ive sent the debug output in a DM'
            },
            setAuthorizer: {
                description: 'Sets the roleme message to run using your permissions',
                success: t<{ id: number; }>('✅ Your permissions will now be used for roleme `{id}`')
            },
            info: {
                description: 'Shows information about a roleme',
                embed: {
                    title: t<{ id: number; }>('Roleme #{id}'),
                    field: {
                        phrase: {
                            name: t<{ caseSensitive: boolean; }>('Phrase (case {caseSensitive#bool(sensitive|insensitive)})')
                        },
                        rolesAdded: {
                            name: 'Roles added',
                            value: t<{ roleIds: Iterable<string>; }>('{roleIds#plural(0:None|{#map(<@&{}>)#join(\n)})}')
                        },
                        rolesRemoved: {
                            name: 'Roles removed',
                            value: t<{ roleIds: Iterable<string>; }>('{roleIds#plural(0:None|{#map(<@&{}>)#join(\n)})}')
                        },
                        channels: {
                            name: 'Channels',
                            value: t<{ channelIds: Iterable<string>; }>('{channelIds#plural(0:Anywhere|{#map(<#{}>)#join(\n)})}')
                        },
                        message: {
                            name: 'Message',
                            value: t<{ authorId: string; authorizerId: string; }>('**Author:** <@{authorId}>\n**Authorizer:** <@{authorizerId}>')
                        }
                    }
                }
            },
            list: {
                description: 'Lists the rolemes currently active on this server',
                none: '❌ You have no rolemes created!',
                embed: {
                    title: 'Rolemes',
                    description: {
                        channel: t<{ channelId?: string; }>('{channelId#bool(<#{}>|All channels)}'),
                        roleme: t<{ id: number; message: string; }>('**Roleme** `{id}`: {message}'),
                        layout: t<{ groups: Iterable<{ name: IFormattable<string>; entries: Iterable<IFormattable<string>>; }>; }>('{groups#map({name}\n{entries#join(\n)})#join(\n\n)}')
                    }
                }
            }
        },
        removeVoteBan: {
            user: {
                description: 'Deletes all the vote bans against the given user',
                success: t<{ user: Eris.User; }>('✅ Votebans for {user#tag} have been cleared')
            },
            all: {
                description: 'Deletes all vote bans against all users',
                success: '✅ Votebans for all users have been cleared'
            }
        },
        settings: {
            description: t<{ website: string; }>('Gets or sets the settings for the current guild. Visit {website} for key documentation.'),
            types: {
                string: 'string',
                channel: 'channel',
                bool: 'bool',
                role: 'role',
                int: 'int',
                float: 'float',
                permission: 'permission',
                locale: 'language'
            },
            list: {
                description: 'Gets the current settings for this guild',
                notConfigured: '❌ Your guild is not correctly configured yet! Please try again later',
                channelValue: {
                    default: t<{ channel: Eris.GuildChannel; }>('{channel.name} ({channel.id})'),
                    unknown: t<{ channelId: string; }>('Unknown channel ({channelId})'),
                    none: 'Default Channel'
                },
                roleValue: {
                    default: t<{ role: Eris.Role; }>('{role.name} ({role.id})'),
                    unknown: t<{ roleId: string; }>('Unknown role ({roleId})')
                },
                localeValue: t<{ name: string; completion: number; }>('{name}{completion#plural(1:| - {#percent} complete)}'),
                notSet: 'Not set',
                groups: {
                    general: 'General',
                    messages: 'Messages',
                    channels: 'Channels',
                    permission: 'Permission',
                    warnings: 'Warnings',
                    moderation: 'Moderation'
                }
            },
            keys: {
                description: 'Lists all the setting keys and their types',
                success: t<{ settings: Iterable<{ name: IFormattable<string>; key: string; type: IFormattable<string>; }>; }>('ℹ️ You can use `settings set <key> [value]` to set the following settings. All settings are case insensitive.\n{settings#map( - **{name}:** `{key#upper}` ({type}))#join(\n)}')
            },
            languages: {
                description: 'Lists all the languages supported and their completion',
                success: t<{ locales: Iterable<{ name: string; key: string; completion: number; }>; }>('✅ The following locales are supported:\n{locales#plural(0:- None yet 😦|{#map(`{key}`: {name} - {completion#percent} complete)#join(\n)})}\n\nTo set a language, use `b!settings set language <languageId>`\n> If you want to help contribute a new langauge, or improve an existing one, you can contribute here: <https://translate.blargbot.xyz/>')
            },
            set: {
                description: 'Sets the given setting key to have a certain value. If `value` is omitted, the setting is reverted to its default value',
                keyInvalid: '❌ Invalid key!',
                valueInvalid: t<{ value: string; type: IFormattable<string>; }>('❌ `{value}` is not a {type}'),
                alreadySet: t<{ value: string; key: string; }>('❌ `{value}` is already set for {key}'),
                success: t<{ key: string; value?: string; }>('✅ {key} is set to {value=nothing}')
            }
        },
        slowMode: {
            errors: {
                notTextChannel: '❌ You can only set slowmode on text channels!',
                notInGuild: '❌ You cant set slowmode on channels outside of a server',
                botNoPerms: t<{ channel: Eris.Channel; }>('❌ I don\'t have permission to set slowmode in {channel#tag}!')
            },
            on: {
                description: 'Sets the channel\'s slowmode to 1 message every `time` seconds, with a max of 6 hours',
                timeTooLong: t<{ duration: moment.Duration; }>('❌ `time` must be less than {duration#duration(S)}s'),
                success: t<{ duration: moment.Duration; channel: Eris.Channel; }>('✅ Slowmode has been set to 1 message every {duration#duration(S)}s in {channel#tag}')
            },
            off: {
                description: 'Turns off the channel\'s slowmode',
                success: t<{ channel: Eris.Channel; }>('✅ Slowmode has been disabled in {channel#tag}')
            }
        },
        tidy: {
            flags: {
                bots: 'Remove messages from bots.',
                invites: 'Remove messages containing invites.',
                links: 'Remove messages containing links.',
                embeds: 'Remove messages containing embeds.',
                attachments: 'Remove messages containing attachments.',
                user: 'Removes messages from the users specified. Separate users by commas',
                query: 'Removes messages that match the provided query as a regex.',
                invert: 'Reverses the effects of all the flag filters.',
                yes: 'Bypasses the confirmation'
            },
            default: {
                description: 'Clears messages from chat',
                notNegative: t<{ count: number; }>('❌ I cannot delete {count} messages!'),
                unsafeRegex: '❌ That regex is not safe!',
                invalidUsers: '❌ I couldn\'t find some of the users you gave!',
                noMessages: '❌ I couldn\'t find any matching messages!',
                confirmQuery: {
                    prompt: {
                        foundAll: t<{ total: number; breakdown: Iterable<{ user: Eris.User; count: number; }>; }>('ℹ️ I am about to attempt to delete {total} {total#plural(1:message|messages)}. Are you sure you wish to continue?\n{breakdown#map({user#tag} - {count} {count#plural(1:message|messages)})#join(\n)}'),
                        foundSome: t<{ total: number; searched: number; breakdown: Iterable<{ user: Eris.User; count: number; }>; }>('ℹ️ I am about to attempt to delete {total} {total#plural(1:message|messages)} after searching through {searched} {searched#plural(1:message|messages)}. Are you sure you wish to continue?\n{breakdown#map({user#tag} - {count} {count#plural(1:message|messages)})#join(\n)}')
                    },
                    cancel: 'Cancel',
                    continue: 'Continue'
                },
                cancelled: '✅ Tidy cancelled, No messages will be deleted',
                deleteFailed: '❌ I wasn\'t able to delete any of the messages! Please make sure I have permission to manage messages',
                success: {
                    default: t<{ deleted: number; success: Iterable<{ user: Eris.User; count: number; }>; }>('✅ Deleted {deleted} {deleted#plural(1:message|messages)}:\n{success#map({user#tag} - {count} {count#plural(1:message|messages)})#join(\n)}'),
                    partial: t<{ deleted: number; success: Iterable<{ user: Eris.User; count: number; }>; failed: Iterable<{ user: Eris.User; count: number; }>; }>('⚠️ I managed to delete {deleted} of the messages I attempted to delete.\n{success#map({user#tag} - {count} {count#plural(1:message|messages)})#join(\n)}\n\nFailed:\n{failed#map({user#tag} - {count} {count#plural(1:message|messages)})#join(\n)}')
                }
            }
        },
        timeout: {
            flags: {
                reason: 'The reason for the timeout (removal).',
                time: 'The amount of time to mute for, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d2h3m4s\', or some other combination.\nMaximum allowed time is 28 days. Default is 1 day.'
            },
            user: {
                description: 'Timeouts a user.\nIf mod-logging is enabled, the timeout will be logged.',
                state: {
                    memberTooHigh: t<{ user: Eris.User; }>('❌ I don\'t have permission to timeout **{user#tag}**! Their highest role is above my highest role.'),
                    moderatorTooLow: t<{ user: Eris.User; }>('❌ You don\'t have permission to timeout **{user#tag}**! Their highest role is above your highest role.'),
                    noPerms: t<{ user: Eris.User; }>('❌ I don\'t have permission to timeout **{user#tag}**! Make sure I have the `moderate members` permission and try again.'),
                    moderatorNoPerms: t<{ user: Eris.User; }>('❌ You don\'t have permission to timeout **{user#tag}**! Make sure you have the `moderate members` permission or one of the permissions specified in the `timeout override` setting and try again.'),
                    alreadyTimedOut: t<{ user: Eris.User; }>('❌ **{user#tag}** has already been timed out.'),
                    success: t<{ user: Eris.User; }>('✅ **{user#tag}** has been timed out.')
                }
            },
            clear: {
                description: 'Removes the timeout of a user.\nIf mod-logging is enabled, the timeout removal will be logged.',
                state: {
                    notTimedOut: t<{ user: Eris.User; }>('❌ **{user#tag}** is not currently timed out.'),
                    noPerms: t<{ user: Eris.User; }>('❌ I don\'t have permission to timeout **{user#tag}**! Make sure I have the `moderate members` permission and try again.'),
                    moderatorNoPerms: t<{ user: Eris.User; }>('❌ You don\'t have permission to timeout **{user#tag}**! Make sure you have the `moderate members` permission or one of the permissions specified in the `timeout override` setting and try again.'),
                    success: t<{ user: Eris.User; }>('✅ **{user#tag}** timeout has been removed.')
                }
            }
        },
        timers: {
            list: {
                description: 'Lists all the currently active timers here',
                none: '✅ There are no active timers!',
                paged: t<{ start: number; end: number; total: number; page: number; pageCount: number; }>('Showing timers {start} - {end} of {total}. Page {page}/{pageCount}'),
                success: t<{ table: IFormattable<string>; paging?: IFormattable<string>; }>('ℹ️ Here are the currently active timers:```prolog\n{table}\n```{paging}'),
                table: {
                    id: {
                        header: 'Id',
                        cell: t<{ id: string; }>('{id}')
                    },
                    elapsed: {
                        header: 'Elapsed',
                        cell: t<{ startTime: moment.Moment; }>('{startTime#duration(H)}')
                    },
                    remain: {
                        header: 'Remain',
                        cell: t<{ endTime: moment.Moment; }>('{endTime#duration(H)}')
                    },
                    user: {
                        header: 'User',
                        cell: t<{ user?: Eris.User; }>('{user#bool({username}#{discriminator}|)}')
                    },
                    type: {
                        header: 'Type',
                        cell: t<{ type: string; }>('{type}')
                    },
                    content: {
                        header: 'Content',
                        cell: t<{ content: string; }>('{content}')
                    }
                }
            },
            info: {
                description: 'Shows detailed information about a given timer',
                notFound: '❌ I couldn\'t find the timer you gave.',
                embed: {
                    title: t<{ id: string; }>('Timer #{id}'),
                    field: {
                        type: {
                            name: 'Type'
                        },
                        user: {
                            name: 'Started by',
                            value: t<{ userId: string; }>('<@{userId}>')
                        },
                        duration: {
                            name: 'Duration',
                            value: t<{ start: moment.Moment; end: moment.Moment; }>('Started {start#tag}\nEnds {end#tag}')
                        }
                    }
                }
            },
            cancel: {
                description: 'Cancels currently active timers',
                timersMissing: t<{ count: number; }>('❌ I couldn\'t find {count#plural(1:the timer|any of the timers)} you specified!'),
                success: {
                    default: t<{ success: Iterable<string>; }>('✅ Cancelled {success#count#plural(1:{} timer|{} timers)}:\n{success#map(`{}`)#join(\n)}'),
                    partial: t<{ success: Iterable<string>; fail: Iterable<string>; }>('⚠️ Cancelled {success#count#plural(1:{} timer|{} timers)}:\n{success#map(`{}`)#join(\n)}\nCould not find {fail#count#plural(1:{} timer|{} timers)}:\n{fail#map(`{}`)#join(\n)}')
                }
            },
            clear: {
                description: 'Clears all currently active timers',
                confirm: {
                    prompt: '⚠️ Are you sure you want to clear all timers?',
                    continue: 'Yes',
                    cancel: 'No'
                },
                cancelled: 'ℹ️ Cancelled clearing of timers',
                success: '✅ All timers cleared'
            }
        },
        unban: {
            flags: {
                reason: 'The reason for the ban.'
            },
            default: {
                description: 'Unbans a user.\nIf mod-logging is enabled, the ban will be logged.',
                userNotFound: '❌ I couldn\'t find that user!',
                state: {
                    notBanned: t<{ user: Eris.User; }>('❌ **{user#tag}** is not currently banned!'),
                    noPerms: t<{ user: Eris.User; }>('❌ I don\'t have permission to unban **{user#tag}**! Make sure I have the `ban members` permission and try again.'),
                    moderatorNoPerms: t<{ user: Eris.User; }>('❌ You don\'t have permission to unban **{user#tag}**! Make sure you have the `ban members` permission or one of the permissions specified in the `ban override` setting and try again.'),
                    success: t<{ user: Eris.User; }>('✅ **{user#tag}** has been unbanned.')
                }
            }
        },
        unmute: {
            flags: {
                reason: 'The reason for the unmute.'
            },
            default: {
                description: 'Removes the special muted role from the user. \nIf mod-logging is enabled, the mute will be logged.',
                state: {
                    notMuted: t<{ user: Eris.User; }>('❌ {user#tag} is not currently muted'),
                    noPerms: '❌ I don\'t have permission to unmute users! Make sure I have the `manage roles` permission and try again.',
                    moderatorNoPerms: '❌ You don\'t have permission to unmute users! Make sure you have the `manage roles` permission and try again.',
                    roleTooHigh: '❌ I can\'t revoke the muted role! (it\'s higher than or equal to my top role)',
                    moderatorTooLow: '❌ You can\'t revoke the muted role! (it\'s higher than or equal to your top role)',
                    success: t<{ user: Eris.User; }>('✅ **{user#tag}** has been unmuted')
                }
            }
        },
        warn: {
            actions: {
                ban: 'ban',
                kick: 'kick',
                timeout: 'timeout',
                delete: 'warn'
            },
            flags: {
                reason: 'The reason for the warning.',
                count: 'The number of warnings that will be issued.'
            },
            default: {
                description: 'Issues a warning.\nIf mod-logging is enabled, the warning will be logged.\nIf `kickat` and `banat` have been set using the `settings` command, the target could potentially get banned or kicked.',
                state: {
                    countNaN: t<{ value: string; }>('❌ {value} isn\'t a number!'),
                    countNegative: '❌ I cant give a negative amount of warnings!',
                    countZero: '❌ I cant give zero warnings!',
                    memberTooHigh: t<{ user: Eris.User; count: number; action: IFormattable<string>; }>('⚠️ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}.\n⛔ They went over the limit for {action}s but they are above me so I couldn\'t {action} them.'),
                    moderatorTooLow: t<{ user: Eris.User; count: number; action: IFormattable<string>; }>('⚠️ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}.\n⛔ They went over the limit for {action}s but they are above you so I didn\'t {action} them.'),
                    noPerms: t<{ user: Eris.User; count: number; action: IFormattable<string>; }>('⚠️ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}.\n⛔ They went over the limit for {action}s but I don\'t have permission to {action} them.'),
                    moderatorNoPerms: t<{ user: Eris.User; count: number; action: IFormattable<string>; }>('⚠️ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}.\n⛔ They went over the limit for {action}s but you don\'t have permission to {action} them.'),
                    alreadyBanned: t<{ user: Eris.User; count: number; }>('⚠️ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}.\n⛔ They went over the limit for bans, but they were already banned.'),
                    alreadyTimedOut: t<{ user: Eris.User; count: number; }>('⚠️ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}.\n⛔ They went over the limit for timeouts, but they were already timed out.'),
                    success: {
                        delete: t<{ user: Eris.User; count: number; warnings: number; }>('✅ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}. They now have {warnings} {warnings#plural(1:warning|warnings)}.'),
                        timeout: t<{ user: Eris.User; count: number; }>('✅ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}. They want over the limit for timeouts and so have been timed out.'),
                        ban: t<{ user: Eris.User; count: number; }>('✅ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}. They went over the limit for bans and so have been banned.'),
                        kick: t<{ user: Eris.User; count: number; }>('✅ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}. They went over the limit for kicks and so have been kicked.')
                    }
                }
            }
        },
        addDomain: {
            default: {
                description: 'Toggles multiple domains to the domain whitelist for use with the \\{request\\} subtag',
                success: t<{ added: Iterable<string>; removed: Iterable<string>; }>('✅ Boy howdy, thanks for the domains!{added#plural(0:|\nThese ones are great!```\n{#join(\n)}\n```)}{removed#plural(0:|\nI always hated these ones anyway.```\n{#join(\n)}\n```)}\nJust remember: it might take up to 15 minutes for these to go live.')
            }
        },
        patch: {
            flags: {
                fixes: 'The bug fixes of the patch.',
                notes: 'Other notes.'
            },
            default: {
                description: 'Makes a patch note',
                changelogMissing: '❌ I cant find the changelog channel!',
                messageEmpty: '❌ I cant send out an empty patch note!',
                embed: {
                    author: {
                        name: t<{ version: string; }>('Version {version}')
                    },
                    title: 'New Features and Changes',
                    field: {
                        bugFixes: {
                            name: 'Bug fixes'
                        },
                        otherNotes: {
                            name: 'Other notes'
                        }
                    }
                },
                confirm: {
                    prompt: 'This is a preview of what the patch will look like',
                    continue: 'Looks good, post it!',
                    cancel: 'Nah let me change something'
                },
                cancelled: 'ℹ️ Patch cancelled',
                failed: '❌ I wasn\'t able to send the patch notes!',
                success: '✅ Done!'
            }
        },
        reload: {
            commands: {
                description: 'Reloads the given commands, or all commands if none were given',
                success: t<{ count: number; }>('✅ Successfully reloaded {count} {count#plural(1:command|commands)}')
            },
            events: {
                description: 'Reloads the given events, or all events if none were given',
                success: t<{ count: number; }>('✅ Successfully reloaded {count} {count#plural(1:event|events)}')
            },
            services: {
                description: 'Reloads the given services, or all services if none were given',
                success: t<{ count: number; }>('✅ Successfully reloaded {count} {count#plural(1:service|services)}')
            }
        },
        restart: {
            description: 'Restarts blargbot, or one of its components',
            default: {
                description: 'Restarts all the clusters',
                success: 'Ah! You\'ve killed me but in a way that minimizes downtime! D:'
            },
            kill: {
                description: 'Kills the master process, ready for pm2 to restart it',
                success: 'Ah! You\'ve killed me! D:'
            },
            api: {
                description: 'Restarts the api process',
                success: '✅ Api has been respawned.'
            }
        },
        update: {
            default: {
                description: 'Updates the codebase to the latest commit.',
                noUpdate: '✅ No update required!',
                command: {
                    pending: t<{ command: string; }>('ℹ️ Command: `{command}`\nRunning...'),
                    success: t<{ command: string; }>('✅ Command: `{command}`'),
                    error: t<{ command: string; }>('❌ Command: `{command}`')
                },
                packageIssue: '❌ Failed to update due to a package issue',
                buildIssue: t<{ commit: string; }>('❌ Failed to update due to a build issue, but successfully rolled back to commit `{commit}`'),
                rollbackIssue: '❌ A fatal error has occurred while rolling back the latest commit! Manual intervention is required ASAP.',
                success: t<{ version: string; prefix: string; commit: string; }>('✅ Updated to version {version} commit `{commit}`!\nRun `{prefix}restart` to gracefully start all the clusters on this new version.')
            }
        },
        avatar: {
            common: {
                formatInvalid: t<{ format: string; allowedFormats: Iterable<string>; }>('❌ {format} is not a valid format! Supported formats are {allowedFormats#join(, | and )}'),
                sizeInvalid: t<{ size: string; allowedSizes: Iterable<number>; }>('❌ {size} is not a valid image size! Supported sizes are {allowedSizes#join(, | and )}'),
                success: t<{ user: Eris.User; }>('✅ {user#tag}\'s avatar')
            },
            flags: {
                format: t<{ formats: Iterable<string>; }>('The file format. Can be {formats#join(, | or )}.'),
                size: t<{ sizes: Iterable<number>; }>('The file size. Can be {sizes#join(, | or )}.')
            },
            self: {
                description: 'Gets your avatar'
            },
            user: {
                description: 'Gets the avatar of the user you chose'
            }
        },
        beeMovie: {
            flags: {
                name: 'Shows the name of the character the quote is from, if applicable.',
                characters: 'Only give quotes from actual characters (no stage directions).'
            },
            default: {
                description: 'Gives a quote from the Bee Movie.'
            }
        },
        brainfuck: {
            common: {
                queryInput: {
                    prompt: 'This brainfuck code requires user input. Please say what you want to use:'
                },
                noInput: '❌ No input was provided!',
                unexpectedError: '❌ Something went wrong...',
                success: {
                    empty: t<{ state?: { memory: Iterable<number>; pointer: number; }; }>('ℹ️ No output...{state#bool(\n\n[{memory#join(,)}]\nPointer: {pointer}|)}'),
                    default: t<{ output: string; state?: { memory: Iterable<number>; pointer: number; }; }>('✅ Output:{output#split(\n)#map(\n> {})#join()}{state#bool(\n\n[{memory#join(,)}]\nPointer: {pointer}|)}')
                }
            },
            default: {
                description: 'Executes brainfuck code.'
            },
            debug: {
                description: 'Executes brainfuck code and returns the pointers.'
            }
        },
        commit: {
            default: {
                description: 'Gets a random or specified blargbot commit.',
                noCommits: '❌ I cant find any commits at the moment, please try again later!',
                unknownCommit: '❌ I couldn\'t find the commit!',
                embed: {
                    title: t<{ commit: string; index: number; }>('{commit} - commit #{index}')
                }
            }
        },
        decancer: {
            user: {
                description: 'Decancers a users display name. If you have permissions, this will also change their nickname',
                success: t<{ user: Eris.User; result: string; }>('✅ Successfully decancered **{user#tag}**\'s name to: `{result}`')
            },
            text: {
                description: 'Decancers some text to plain ASCII',
                success: t<{ text: string; result: string; }>('✅ The decancered version of **{text}** is: `{result}`')
            }
        },
        define: {
            default: {
                description: 'Gets the definition for the specified word. The word must be in english.',
                unavailable: '❌ It seems I cant find the definition for that word at the moment!',
                embed: {
                    title: t<{ word: string; }>('Definition for {word}'),
                    description: t<{ phonetic: string; pronunciation: string; }>('**Pronunciation**: [🔈 {phonetic}]({pronunciation})'),
                    field: {
                        name: t<{ index: number; type: string; }>('{index}. {type}'),
                        value: {
                            synonyms: t<{ synonyms: Iterable<string>; }>('**Synonyms:** {synonyms#join(, | and )}\n'),
                            pronunciation: t<{ phonetic: string; pronunciation: string; }>('**Pronunciation**: [🔈 {phonetic}]({pronunciation})\n'),
                            default: t<{ pronunciation?: IFormattable<string>; synonyms?: IFormattable<string>; definition: string; }>('{pronunciation}{synonyms}{definition}')
                        }
                    }
                }
            }
        },
        dmErrors: {
            default: {
                description: 'Toggles whether to DM you errors.',
                enabled: '✅ I will now DM you if I have an issue running a command.',
                disabled: '✅ I won\'t DM you if I have an issue running a command.'
            }
        },
        donate: {
            default: {
                description: 'Gets my donation information',
                success: '✅ Thanks for the interest! Ive sent you a DM with information about donations.',
                embed: {
                    description: 'Hi! This is stupid cat, creator of blargbot. I hope you\'re enjoying it!\n\nI don\'t like to beg, but right now I\'m a student. Tuition is expensive, and maintaining this project isn\'t exactly free. I have to pay for services such as web servers and domains, not to mention invest time into developing code to make this bot as good as it can be. I don\'t expect to be paid for what I\'m doing; the most important thing to me is that people enjoy what I make, that my product is making people happy. But still, money doesn\'t grow on trees. If you want to support me and what I\'m doing, I have a patreon available for donations. Prefer something with less commitment? I also have a paypal available.\n\nThank you for your time. I really appreciate all of my users! :3',
                    field: {
                        paypal: {
                            name: 'Paypal'
                        },
                        patreon: {
                            name: 'Patreon'
                        }
                    }
                }
            }
        },
        feedback: {
            errors: {
                titleTooLong: t<{ max: number; }>('❌ The first line of your suggestion cannot be more than {max} characters!'),
                noType: '❌ You need to provide at least 1 feedback type.',
                blacklisted: {
                    guild: t<{ prefix: string; }>('❌ Sorry, your guild has been blacklisted from the use of the `{prefix}feedback` command. If you wish to appeal this, please join my support guild. You can find a link by doing `{prefix}invite`.'),
                    user: t<{ prefix: string; }>('❌ Sorry, you have been blacklisted from the use of the `{prefix}feedback` command. If you wish to appeal this, please join my support guild. You can find a link by doing `{prefix}invite`.')
                }
            },
            types: {
                feedback: 'Feedback',
                bugReport: 'Bug Report',
                suggestion: 'Suggestion'
            },
            blacklist: {
                unknownType: t<{ type: string; }>('❌ I don\'t know how to blacklist a {type}! only `guild` and `user`'),
                alreadyBlacklisted: {
                    guild: '❌ That guild id is already blacklisted!',
                    user: '❌ That user id is already blacklisted!'
                },
                notBlacklisted: {
                    guild: '❌ That guild id is not blacklisted!',
                    user: '❌ That user id is not blacklisted!'
                },
                success: {
                    guild: t<{ id: string; added: boolean; }>('✅ The guild {id} has been {added#bool(blacklisted|removed from the blacklist)}'),
                    user: t<{ id: string; added: boolean; }>('✅ The user {id} has been {added#bool(blacklisted|removed from the blacklist)}')
                }
            },
            flags: {
                command: 'Signify your feedback is for a command',
                bbtag: 'Signify your feedback is for BBTag',
                docs: 'Signify your feedback is for documentation',
                other: 'Signify your feedback is for other functionality'
            },
            general: {
                description: 'Give me general feedback about the bot',
                unexpectedError: '❌ Something went wrong while trying to submit that! Please try again',
                success: t<{ type: IFormattable<string>; caseId: number; link: string; }>('✅ {type} has been sent with the ID {caseId}! 👌\n\nYou can view your {type#lower} here: <{link}>'),
                queryType: {
                    prompt: 'ℹ️ Please select the types that apply to your suggestion',
                    placeholder: 'Select your suggestion type'
                },
                types: {
                    command: 'Command',
                    bbtag: 'BBTag',
                    documentation: 'Documentation',
                    other: 'Other Functionality'
                },
                dm: 'DM',
                embed: {
                    description: t<{ title: string; description: string; }>('**{title}**\n\n{description}'),
                    field: {
                        types: {
                            name: 'Types',
                            value: t<{ types: Iterable<string>; }>('{types#join(\n)}')
                        }
                    },
                    footer: {
                        text: t<{ caseId: number; messageId: string; }>('Case {caseId} | {messageId}')
                    }
                }
            },
            suggest: {
                description: 'Tell me something you want to be added or changed'
            },
            report: {
                description: 'Let me know about a bug you found'
            },
            edit: {
                description: 'Edit some feedback you have previously sent',
                unknownCase: t<{ caseNumber: number; }>('❌ I couldn\'t find any feedback with the case number {caseNumber}!'),
                notOwner: '❌ You cant edit someone else\'s suggestion.',
                success: '✅ Your case has been updated.'
            }

        },
        help: {
            self: {
                description: 'Gets the help message for this command'
            },
            list: {
                description: 'Shows a list of all the available commands'
            },
            command: {
                description: 'Shows the help text for the given command'
            }
        },
        info: {
            default: {
                description: 'Returns some info about me.',
                notReady: '⚠️ Im still waking up! Try again in a minute or two',
                embed: {
                    title: 'About me!',
                    description: t<{ age: moment.Duration; }>('I am a multi-purpose bot with new features implemented regularly, written in typescript using [Eris](https://abal.moe/Eris/).\n\n🎂 I am currently {age#duration(F)} old!'),
                    field: {
                        patron: {
                            name: '️️️️️️️️❤️ Special thanks to my patrons! ❤️',
                            value: t<{ patrons: Iterable<IFormattable<string>>; }>('{patrons#join(\n)}')
                        },
                        donator: {
                            name: '️️️️️️️️❤️ Special thanks to all my other donators! ❤️',
                            value: t<{ donators: Iterable<IFormattable<string>>; }>('{donators#join(\n)}')
                        },
                        other: {
                            name: '❤️ Special huge thanks to: ❤️',
                            value: {
                                decorators: {
                                    awesome: t<{ user: IFormattable<string>; reason: IFormattable<string>; }>('The awesome {user} for {reason}'),
                                    incredible: t<{ user: IFormattable<string>; reason: IFormattable<string>; }>('The incredible {user} for {reason}'),
                                    amazing: t<{ user: IFormattable<string>; reason: IFormattable<string>; }>('The amazing {user} for {reason}'),
                                    inspirational: t<{ user: IFormattable<string>; reason: IFormattable<string>; }>('The inspirational {user} for {reason}')
                                },
                                reasons: {
                                    rewrite: 'rewriting me into typescript',
                                    donations1k: 'huge financial contributions ($1000)',
                                    unknown: 'something but I don\'t remember'
                                },
                                layout: t<{ details: Iterable<IFormattable<string>>; }>('{details#join(\n)}')
                            }
                        },
                        details: {
                            value: t<{ prefix: string; }>('For commands, do `{prefix}help`. For information about supporting me, do `{prefix}donate`.\nFor any additional information, such as command documentation, please visit my website: <https://blargbot.xyz>')
                        }
                    }
                }

            }
        },
        insult: {
            someone: {
                description: 'Generates a random insult directed at the name supplied.',
                success: t<{ name: string; }>('{name}\'s {#rand(mother|mom|father|dad|goat|cheese|dick|boob|eye|mouth|nose|ear|sister|sis|brother|bro|seagull|tea|mother-in-law|rabbit|dog|cat|left foot|body|brain|face|favourite thing)} {#rand(smells like|looks like|is|sounds like|appears to be|wants to be|looks just like|smells oddly similar to|is jealous of|is as stupid as|laughs like)} {#rand(a piece of cheese|a smelly fish|jam|tea|a skunk|a fart|a piece of toast|my mom|your mom|my dad|your dad|my sister|your sister|my brother|your brother|my cat|my dog|my lizard|my seagull|gross|farts|ugly|Captain America|javascript|C#|LUA|python3.5|a furry|an anthropomorphic horse|a tentacle monster|fuck|meow|mississippi|the entire UK|Japan|anime|dickgirls|a really stupid cat|a sentient robot|teaching a robot to love|anime girls with really large boobs who want to eat all of your cream|salty|smegma|mouldy cheese|obesity|Donald Trump|stupid people|crabcakes|firepoles|blue waffle|a really bad random insult generators|a terrible AI|cleverbot|b1nzy|a drunken goblin|poorly censored porn|an egg left in the sun for too long|#BREXIT|leaving the EU)}')
            },
            default: {
                description: 'Generates a random insult.',
                success: 'Your {#rand(mother|mom|father|dad|goat|cheese|dick|boob|eye|mouth|nose|ear|sister|sis|brother|bro|seagull|tea|mother-in-law|rabbit|dog|cat|left foot|body|brain|face|favourite thing)} {#rand(smells like|looks like|is|sounds like|appears to be|wants to be|looks just like|smells oddly similar to|is jealous of|is as stupid as|laughs like)} {#rand(a piece of cheese|a smelly fish|jam|tea|a skunk|a fart|a piece of toast|my mom|your mom|my dad|your dad|my sister|your sister|my brother|your brother|my cat|my dog|my lizard|my seagull|gross|farts|ugly|Captain America|javascript|C#|LUA|python3.5|a furry|an anthropomorphic horse|a tentacle monster|fuck|meow|mississippi|the entire UK|Japan|anime|dickgirls|a really stupid cat|a sentient robot|teaching a robot to love|anime girls with really large boobs who want to eat all of your cream|salty|smegma|mouldy cheese|obesity|Donald Trump|stupid people|crabcakes|firepoles|blue waffle|a really bad random insult generators|a terrible AI|cleverbot|b1nzy|a drunken goblin|poorly censored porn|an egg left in the sun for too long|#BREXIT|leaving the EU)}'
            }
        },
        invite: {
            default: {
                description: 'Gets you invite information.',
                success: t<{ inviteLink: string; guildLink: string; }>('Invite me to your guild!\n<{inviteLink}>\nJoin my support guild!\n{guildLink}')
            }
        },
        mods: {
            common: {
                embed: {
                    title: 'Moderators',
                    description: {
                        none: 'There are no mods with that status!'
                    },
                    field: {
                        online: {
                            name: t<{ emote: string; }>('{emote} Online'),
                            value: t<{ users: Iterable<Eris.User>; }>('{users#map({#tag})#join(\n)}')
                        },
                        away: {
                            name: t<{ emote: string; }>('{emote} Away'),
                            value: t<{ users: Iterable<Eris.User>; }>('{users#map({#tag})#join(\n)}')
                        },
                        busy: {
                            name: t<{ emote: string; }>('{emote} Do not disturb'),
                            value: t<{ users: Iterable<Eris.User>; }>('{users#map({#tag})#join(\n)}')
                        },
                        offline: {
                            name: t<{ emote: string; }>('{emote} Offline'),
                            value: t<{ users: Iterable<Eris.User>; }>('{users#map({#tag})#join(\n)}')
                        }
                    }
                }
            },
            all: {
                description: 'Gets a list of all mods.'
            },
            online: {
                description: 'Gets a list of all currently online mods.'
            },
            away: {
                description: 'Gets a list of all currently away mods.'
            },
            busy: {
                description: 'Gets a list of all mods currently set to do not disturb.'
            },
            offline: {
                description: 'Gets a list of all currently offline mods.'
            }
        },
        names: {
            flags: {
                all: 'Gets all the names.',
                verbose: 'Gets more information about the retrieved names.'
            },
            list: {
                description: 'Returns the names that I\'ve seen the specified user have in the past 30 days.',
                none: {
                    ever: t<{ user: Eris.User; }>('ℹ️ I haven\'t seen any usernames for {user#tag} yet!'),
                    since: t<{ user: Eris.User; from: moment.Moment; }>('ℹ️ I haven\'t seen {user#tag} change their username since {from#tag}!')
                },
                embed: {
                    title: 'Historical usernames',
                    description: {
                        since: {
                            detailed: t<{ from: moment.Moment; usernames: Iterable<{ name: string; time: moment.Moment; }>; }>('Since {from#tag}\n{usernames#map({name} - {time#tag(R)})#join(\n)}'),
                            simple: t<{ from: moment.Moment; usernames: Iterable<{ name: string; }>; }>('Since {from#tag}\n{usernames#map({name})#join(\n)}')
                        },
                        ever: {
                            detailed: t<{ usernames: Iterable<{ name: string; time: moment.Moment; }>; }>('{usernames#map({name} - {time#tag(R)})#join(\n)}'),
                            simple: t<{ usernames: Iterable<{ name: string; }>; }>('{usernames#map({name})#join(\n)}')
                        }
                    }
                }
            },
            remove: {
                description: 'Removes the names ive seen you use in the past 30 days',
                none: 'ℹ️ You don\'t have any usernames to remove!',
                notFound: '❌ I couldn\'t find any of the usernames you gave!',
                confirm: {
                    prompt: {
                        some: t<{ count: number; }>('⚠️ Are you sure you want to remove {count} usernames'),
                        all: '⚠️ Are you sure you want to remove **all usernames**'
                    },
                    continue: 'Yes',
                    cancel: 'No'
                },
                cancelled: '✅ I wont remove any usernames then!',
                success: {
                    some: t<{ count: number; }>('✅ Successfully removed {count}!'),
                    all: '✅ Successfully removed **all usernames**!'
                }
            }
        },
        nato: {
            default: {
                description: 'Translates the given text into the NATO phonetic alphabet.'
            }
        },
        personalPrefix: {
            add: {
                description: 'Adds a command prefix just for you!',
                alreadyAdded: '❌ You already have that as a command prefix.',
                success: '✅ Your personal command prefix has been added.'
            },
            remove: {
                description: 'Removes one of your personal command prefixes',
                notAdded: '❌ That isn\'t one of your prefixes.',
                success: '✅ Your personal command prefix has been removed.'
            },
            list: {
                description: 'Lists the your personal command prefixes',
                none: 'ℹ️ You don\'t have any personal command prefixes set!',
                embed: {
                    title: 'Personal prefixes',
                    description: t<{ prefixes: Iterable<string>; }>('{prefixes#map(- {})#join(\n)}')
                }
            }
        },
        ping: {
            description: 'Pong!\nFind the command latency.',
            default: {
                description: 'Gets the current latency.',
                pending: 'ℹ️ {#rand(Existence is a lie.|You\'re going to die some day, perhaps soon.|Nothing matters.|Where do you get off?|There is nothing out there.|You are all alone in an infinite void.|Truth is false.|Forsake everything.|Your existence is pitiful.|We are all already dead.)}',
                success: t<{ ping: moment.Duration; }>('✅ Pong! ({ping#duration(MS)}ms)')
            }
        },
        poll: {
            flags: {
                time: 'How long before the poll expires, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d2h3m4s\', or some other combination.',
                emojis: 'The emojis to apply to the poll.',
                description: 'The description of the poll.',
                colour: 'The color of the poll (in HEX).',
                announce: 'If specified, it will make an announcement. Requires the proper permissions.'
            },
            default: {
                description: 'Creates a poll for the given question and duration. If no duration is given, defaults to 60 seconds. If emojis are given, they will be used as options for the poll.',
                invalidDuration: t<{ duration: string; }>('❌ `{duration}` is not a valid duration for a poll.'),
                invalidColor: t<{ color: string; }>('❌ `{color}` is not a valid color!'),
                sendFailed: '❌ I wasn\'t able to send the poll! Please make sure I have the right permissions and try again.',
                noAnnouncePerms: '❌ Sorry, you don\'t have permissions to send announcements!',
                announceNotSetUp: '❌ Announcements on this server aren\'t set up correctly. Please fix them before trying again.',
                emojisMissing: '❌ You must provide some emojis to use in the poll.',
                emojisInaccessible: '❌ I don\'t have access to some of the emojis you used! Please use different emojis or add me to the server that the emojis are from.',
                tooShort: t<{ duration: moment.Duration; }>('❌ {duration#duration(S)}s is too short for a poll! Use a longer time'),
                someEmojisMissing: '⚠️ I managed to create the poll, but wasn\'t able to add some of the emojis to it. Please add them manually (they will still be counted in the results)'
            }
        },
        remind: {
            flags: {
                channel: 'Sets the reminder to appear in the current channel rather than a DM',
                time: 'The time before the user is to be reminded, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d 2h 3m 4s\', or some other combination'
            },
            default: {
                description: 'Reminds you about something after a period of time in a DM.',
                durationRequired: '❌ The `-t` flag is required to set the duration of the reminder!',
                durationZero: '❌ I cant set a timer for 0 seconds!',
                reminderMissing: '❌ You need to say what you need reminding of!',
                event: t<{ userId: string; start: moment.Moment; content: string; }>('⏰ Hi, <@{userId}>! You asked me to remind you about this {start#tag(R)}:\n{content}'),
                success: {
                    here: t<{ duration: moment.Duration; }>('✅ Ok, ill ping you here {duration#tag}'),
                    dm: t<{ duration: moment.Duration; }>('✅ Ok, ill ping you in a DM {duration#tag}')
                }
            }
        },
        roles: {
            default: {
                description: 'Displays a list of roles and their IDs.',
                embed: {
                    title: 'Roles',
                    description: t<{ roles: Iterable<Eris.Role>; }>('{roles#map({#tag} - ({id}))#join(\n)}')
                }
            }
        },
        roll: {
            default: {
                description: 'Rolls the dice you tell it to, and adds the modifier',
                diceInvalid: t<{ dice: string; }>('❌ `{dice}` is not a valid dice!'),
                tooBig: t<{ maxRolls: number; maxFaces: number; }>('❌ You\'re limited to {maxRolls} rolls of a d{maxFaces}'),
                character: {
                    embed: {
                        description: t<{ stats: Iterable<{ id: number; rolls: Iterable<number>; total: number; min: number; result: number; }>; }>('```xl\n{stats#map(Stat #{id} - [{rolls#join(, )}] > {total} - {min} > {result})#join(\n)}\n```')
                    }
                },
                embed: {
                    title: t<{ rolls: number; faces: number; }>('🎲 {rolls} {rolls#plural(1:roll|rolls)} of a {faces} sided dice:'),
                    description: {
                        modifier: t<{ total: number; sign: '+' | '-'; modifier: number; }>('**Modifier**: {total} {sign} {modifier}'),
                        natural1: ' - Natural 1...',
                        natural20: ' - Natural 20',
                        layout: t<{ details?: string; rolls: Iterable<number>; modifier?: IFormattable<string>; total: number; natural?: IFormattable<string>; }>('{details#bool({}\n|)}{rolls#join(, )}\n{modifier#bool({}\n|)}**Total**: {total}{natural}')
                    }
                }
            }

        },
        rr: {
            default: {
                description: 'Plays russian roulette with a specified number of bullets. If `emote` is specified, uses that specific emote.',
                notEnoughBullets: '❌ Wimp! You need to load at least one bullet.',
                guaranteedDeath: '⚠️ Do you have a death wish or something? Your revolver can only hold 6 bullets, that\'s guaranteed death!',
                tooManyBullets: '⚠️ That\'s gutsy, but your revolver can only hold 6 bullets!',
                jammed: '❌ Your revolver jams when you try to close the barrel. Maybe you should try somewhere else...',
                confirm: {
                    prompt: t<{ bullets: number; }>('You load {bullets} {bullets#plural(1:bullet|bullets)} into your revolver, give it a spin, and place it against your head'),
                    continue: 'Put the gun down',
                    cancel: 'Pull the trigger'
                },
                chicken: 'You chicken out and put the gun down.\n{#rand(Maybe try again when you\'re not feeling so wimpy.|Its ok, fun isn\'t for everyone!)}',
                died: '***BOOM!*** {#rand(The gun goes off, splattering your brains across the wall. Unlucky!|☠️💥⚰️😵💀💀☠️|Before you know it, it\'s all over.|At least you had chicken!|I\'m ***not*** cleaning that up.|Guns are not toys!|Well, you can\'t win them all!|W-well... If every porkchop were perfect, we wouldn\'t have hotdogs? Too bad you\'re dead either way.|Blame it on the lag!|Today just wasn\'t your lucky day.|Pssh, foresight is for losers.)}',
                lived: '*Click!* {#rand(The gun clicks, empty. You get to live another day.|You breath a sign of relief as you realize that you aren\'t going to die today.|As if it would ever go off! Luck is on your side.|You thank RNGesus as you lower the gun.|👼🙏🚫⚰️👌👍👼|You smirk as you realize you survived.)}'
            }
        },
        shard: {
            common: {
                embed: {
                    title: t<{ shardId: number; }>('Shard {shardId}'),
                    field: {
                        shard: {
                            name: t<{ shardId: number; }>('Shard {shardId}'),
                            value: t<{ statusEmote: string; latency: number; guildCount: number; clusterId: number; lastUpdate: moment.Moment; }>('```\nStatus: {statusEmote}\nLatency: {latency}ms\nGuilds: {guildCount}\nCluster: {clusterId}\nLast update: {lastUpdate#time(LT)}\n```')
                        },
                        cluster: {
                            name: t<{ clusterId: number; }>('Cluster {clusterId}'),
                            value: t<{ cpu: number; guildCount: number; ram: number; startTime: moment.Moment; }>('CPU usage: {cpu#percent(1)}\nGuilds: {guildCount}\nRam used: {ram#bytes}\nStarted {startTime#tag(R)}')
                        },
                        shards: {
                            name: 'Shards',
                            value: t<{ shards: Iterable<{ id: number; statusEmote: string; latency: number; }>; }>('```\n{shards#map({id} {statusEmote} {latency}ms)#join(\n)}\n```')
                        }
                    }
                }
            },
            current: {
                description: 'Returns information about the shard the current guild is in, along with cluster stats.',
                dm: {
                    embed: {
                        description: t<{ clusterId: number; }>('Discord DMs are on shard `0` in cluster `{clusterId}`')
                    }
                }
            },
            guild: {
                description: 'Returns information about the shard `guildID` is in, along with cluster stats.',
                invalidGuild: t<{ id: string; }>('❌ `{id}` is not a valid guild id'),
                embed: {
                    description: {
                        here: t<{ shardId: number; clusterId: number; }>('This guild is on shard `{shardId}` and cluster `{clusterId}`'),
                        other: t<{ shardId: number; clusterId: number; guildId: string; }>('Guild `{guildId}` is on shard `{shardId}` and cluster `{clusterId}`')
                    }
                }
            }
        },
        shards: {
            common: {
                invalidCluster: '❌ Cluster does not exist',
                noStats: t<{ clusterId: number; }>('❌ Cluster {clusterId} is not online at the moment'),
                embed: {
                    field: {
                        shard: {
                            name: t<{ shardId: number; }>('Shard {shardId}'),
                            value: t<{ statusEmote: string; latency: number; guildCount: number; clusterId: number; lastUpdate: moment.Moment; }>('```\nStatus: {statusEmote}\nLatency: {latency}ms\nGuilds: {guildCount}\nCluster: {clusterId}\nLast update: {lastUpdate#time(LT)}\n```')
                        },
                        cluster: {
                            name: t<{ clusterId: number; }>('Cluster {clusterId}'),
                            value: t<{ cpu: number; guildCount: number; ram: number; startTime: moment.Moment; }>('CPU usage: {cpu#percent(1)}\nGuilds: {guildCount}\nRam used: {ram#bytes}\nStarted {startTime#tag(R)}')
                        },
                        shards: {
                            name: 'Shards',
                            value: t<{ shards: Iterable<{ id: number; statusEmote: string; latency: number; }>; }>('```\n{shards#map({id} {statusEmote} {latency}ms)#join(\n)}\n```')
                        }
                    }
                }
            },
            flags: {
                down: 'If provided, only shows downed shards for `b!shards`'
            },
            all: {
                description: 'Shows a list of all shards.',
                noneDown: 'ℹ️ No shards are currently down!',
                noStats: '❌ No cluster stats yet!',
                embed: {
                    title: 'Shards',
                    description: t<{ clusterCount: number; shardCount: number; }>('I\'m running on `{clusterCount}` {clusterCount#plural(1:cluster|clusters)} and `{shardCount}` {shardCount#plural(1:shard|shards)}\n'),
                    field: {
                        name: t<{ clusterId: number; }>('Cluster {clusterId}'),
                        value: t<{ startTime: moment.Moment; ram: number; shards: Iterable<{ id: number; statusEmote: string; latency: number; }>; }>('Ready since: {startTime#tag(R)}\nRam: {ram#bytes}\n**Shards**:\n```\n{shards#map({id} {statusEmote} {latency}ms)#join(\n)}\n```')
                    }
                }
            },
            guild: {
                description: 'Shows information about the shard and cluster `guildID` is in ',
                invalidGuild: t<{ guildId: string; }>('❌ `{guildId}` is not a valid guildID'),
                embed: {
                    description: {
                        here: t<{ clusterId: number; shardId: number; }>('This guild is on shard `{shardId}` and cluster `{clusterId}`'),
                        other: t<{ guildId: string; clusterId: number; shardId: number; }>('Guild `{guildId}` is on shard `{shardId}` and cluster `{clusterId}`')
                    }
                }
            },
            cluster: {
                description: 'Show information about `cluster`'
            }
        },
        ship: {
            default: {
                description: 'Gives you the ship name for two users.',
                success: t<{ name: string; }>('❤️ Your ship name is **{name}**!')
            }
        },
        spell: {
            default: {
                description: 'Gives you a description for a D&D 5e spell.',
                notFound: '❌ I couldn\'t find that spell!',
                components: {
                    v: 'Verbal',
                    s: 'Somatic',
                    m: 'Material',
                    f: 'Focus',
                    df: 'Divine Focus',
                    xp: 'XP Cost'
                },
                query: {
                    prompt: '🪄 Multiple spells found! Please pick the right one',
                    placeholder: 'Pick a spell',
                    choice: {
                        description: t<{ level: IFormattable<string>; school: IFormattable<string>; }>('Level {level} {school}')
                    }
                },
                embed: {
                    description: t<{ level: IFormattable<string>; school: IFormattable<string>; description: IFormattable<string>; }>('*Level {level} {school}*\n\n{description}'),
                    field: {
                        duration: {
                            name: 'Duration'
                        },
                        range: {
                            name: 'Range'
                        },
                        castingTime: {
                            name: 'Casting Time'
                        },
                        components: {
                            name: 'Components'
                        }
                    }
                }
            }
        },
        stats: {
            default: {
                description: 'Gives you some information about me',
                embed: {
                    title: 'Bot Statistics',
                    footer: {
                        text: 'blargbot'
                    },
                    field: {
                        guilds: {
                            name: 'Guilds',
                            value: t<{ guildCount: number; }>('{guildCount}')
                        },
                        users: {
                            name: 'Users',
                            value: t<{ userCount: number; }>('{userCount}')
                        },
                        channels: {
                            name: 'Channels',
                            value: t<{ channelCount: number; }>('{channelCount}')
                        },
                        shards: {
                            name: 'Shards',
                            value: t<{ shardCount: number; }>('{shardCount}')
                        },
                        clusters: {
                            name: 'Clusters',
                            value: t<{ clusterCount: number; }>('{clusterCount}')
                        },
                        ram: {
                            name: 'RAM',
                            value: t<{ ram: number; }>('{ram#bytes}')
                        },
                        version: {
                            name: 'Version'
                        },
                        uptime: {
                            name: 'Uptime',
                            value: t<{ startTime: moment.Moment; }>('{startTime#tag(R)}')
                        },
                        eris: {
                            name: 'Eris'
                        },
                        nodeJS: {
                            name: 'Node.js'
                        }
                    }
                }
            }
        },
        status: {
            default: {
                description: 'Gets you an image of an HTTP status code.',
                notFound: '❌ Something terrible has happened! 404 is not found!'
            }
        },
        syntax: {
            default: {
                description: 'Gives you the \'syntax\' for a command 😉',
                success: t<{ prefix: string; name: string; tokens: Iterable<string>; }>('❌ Invalid usage!\nProper usage: `{prefix}syntax {name} {tokens#join( )}`')
            }
        },
        tag: {
            description: t<{ subtags: string; tos: string; }>('Tags are a system of public commands that anyone can create or run, using the BBTag language.\n\nFor more information about BBTag, visit <{subtags}>.\nBy creating a tag, you acknowledge that you agree to the Terms of Service (<{tos}>)'),
            request: {
                name: 'Enter the name of the tag:',
                content: 'Enter the tag\'s contents:'
            },
            common: {
                debugInDm: 'ℹ️ Ive sent the debug output in a DM',
                done: '✅ I hope you found what you were looking for!'
            },
            errors: {
                noneFound: '❌ No results found!',
                tagMissing: t<{ name: string; }>('❌ The `{name}` tag doesn\'t exist!'),
                invalidBBTag: t<{ errors: Iterable<IFormattable<string>>; }>('❌ There were errors with the bbtag you provided!\n{errors#join(\n)}'),
                bbtagError: t<AnalysisResult>('❌ [{location.line},{location.column}]: {message}'),
                bbtagWarning: t<AnalysisResult>('⚠️ [{location.line},{location.column}]: {message}'),
                notOwner: t<{ name: string; }>('❌ You don\'t own the `{name}` tag!'),
                alreadyExists: t<{ name: string; }>('❌ The `{name}` tag already exists!'),
                deleted: t<{ name: string; reason?: string; user?: UserTag; }>('❌ The `{name}` tag has been permanently deleted{user#bool( by **{username=UNKNOWN}#{discriminator=????}**|)}{reason#bool(\n\nReason: {}|)}')

            },
            run: {
                description: 'Runs a user created tag with some arguments'
            },
            test: {
                default: {
                    description: 'Uses the BBTag engine to execute the content as if it was a tag'
                },
                debug: {
                    description: 'Uses the BBTag engine to execute the content as if it was a tag and will return the debug output',
                    tagNotOwned: '❌ You cannot debug someone else\'s tag.'
                }
            },
            docs: {
                description: 'Returns helpful information about the specified topic.'
            },
            debug: {
                description: 'Runs a user created tag with some arguments. A debug file will be sent in a DM after the tag has finished.'
            },
            create: {
                description: 'Creates a new tag with the content you give',
                success: t<{ name: string; errors: Iterable<IFormattable<string>>; }>('✅ Tag `{name}` created.\n{errors#join(\n)}')
            },
            edit: {
                description: 'Edits an existing tag to have the content you specify',
                success: t<{ name: string; errors: Iterable<IFormattable<string>>; }>('✅ Tag `{name}` edited.\n{errors#join(\n)}')
            },
            set: {
                description: 'Sets the tag to have the content you specify. If the tag doesn\'t exist it will be created.',
                success: t<{ name: string; errors: Iterable<IFormattable<string>>; }>('✅ Tag `{name}` set.\n{errors#join(\n)}')
            },
            delete: {
                description: 'Deletes an existing tag',
                success: t<{ name: string; }>('✅ The `{name}` tag is gone forever!')
            },
            rename: {
                description: 'Renames the tag',
                success: t<{ oldName: string; newName: string; }>('✅ The `{oldName}` tag has been renamed to `{newName}`.')
            },
            raw: {
                description: 'Gets the raw contents of the tag',
                inline: t<{ name: string; content: string; }>('ℹ️ The raw code for {name} is: ```\n{content}\n```'),
                attached: t<{ name: string; }>('ℹ️ The raw code for {name} is attached')
            },
            list: {
                description: 'Lists all tags, or tags made by a specific author',
                page: {
                    content: t<{ tags: Iterable<string>; }>('```fix\n{tags#join(, )}\n```'),
                    header: {
                        all: t<{ count: number; total: number; }>('Found {count}/{total} tags'),
                        byUser: t<{ count: number; total: number; user: Eris.User; }>('Found {count}/{total} tags made by {user#tag}')
                    }
                }
            },
            search: {
                description: 'Searches for a tag based on the provided name',
                query: {
                    prompt: 'What would you like to search for?'
                },
                page: {
                    content: t<{ tags: Iterable<string>; }>('```fix\n{tags#join(, )}\n```'),
                    header: t<{ count: number; total: number; query: string; }>('Found {count}/{total} tags matching `{query}`')
                }
            },
            permDelete: {
                description: 'Marks the tag name as deleted forever, so no one can ever use it',
                notStaff: '❌ You cannot disable tags',
                success: t<{ name: string; }>('✅ The `{name}` tag has been deleted'),
                confirm: {
                    prompt: t<{ name: string; }>('You are not the owner of the `{name}`, are you sure you want to modify it?'),
                    continue: 'Yes',
                    cancel: 'No'
                }
            },
            cooldown: {
                description: 'Sets the cooldown of a tag, in milliseconds',
                cooldownZero: '❌ The cooldown must be greater than 0ms',
                success: t<{ name: string; cooldown: moment.Duration; }>('✅ The tag `{name}` now has a cooldown of `{cooldown#duration(MS)}ms`.')
            },
            author: {
                description: 'Displays the name of the tag\'s author',
                success: t<{ name: string; author?: UserTag; }>('✅ The tag `{name}` was made by **{author.username=UNKNOWN}#{author.discriminator=????}**')
            },
            info: {
                description: 'Displays information about a tag',
                embed: {
                    title: t<{ name: string; }>('__**Tag | {name}**__'),
                    footer: {
                        text: t<{ user: Eris.User; }>('{user.username}#{user.discriminator}')
                    },
                    field: {
                        author: {
                            name: 'Author',
                            value: t<{ user: UserTag; id: string; }>('{user.username=UNKNOWN}#{user.discriminator=????} ({id})')
                        },
                        cooldown: {
                            name: 'Cooldown',
                            value: t<{ cooldown: moment.Duration; }>('{cooldown#duration(F)}')
                        },
                        lastModified: {
                            name: 'Last Modified',
                            value: t<{ lastModified: moment.Moment; }>('{lastModified#tag}')
                        },
                        usage: {
                            name: 'Used',
                            value: t<{ count: number; }>('{count} {count#plural(1:time|times)}')
                        },
                        favourited: {
                            name: 'Favourited',
                            value: t<{ count: number; }>('{count} {count#plural(1:time|times)}')
                        },
                        reported: {
                            name: '⚠️ Reported',
                            value: t<{ count: number; }>('{count} {count#plural(1:time|times)}')
                        },
                        flags: {
                            name: 'Flags',
                            value: t<{ flags: Iterable<FlagDefinition<string>>; }>('{flags#map(`-{flag}`/`--{word}`: {description})#join(\n)}')
                        }
                    }
                }
            },
            top: {
                description: 'Displays the top 5 tags',
                success: t<{ tags: Iterable<{ index: number; name: string; author: UserTag; count: number; }>; }>('__Here are the top 10 tags:__\n{tags#map(**{index}.** **{name}** \\(**{author.username=UNKNOWN}#{author.discriminator=????}**\\) - used **{count} {count#plural(1:time|times)}**)#join(\n)}')
            },
            report: {
                description: 'Reports a tag as violating the ToS',
                blocked: t<{ reason: string; }>('❌ Sorry, you cannot report tags.\n{reason}'),
                unavailable: '❌ Sorry, you cannot report tags at this time. Please try again later!',
                deleted: t<{ name: string; }>('✅ The `{name}` tag is no longer being reported by you.'),
                added: t<{ name: string; }>('✅ The `{name}` tag has been reported.'),
                notification: t<{ name: string; reason: string; user: Eris.User; }>('**{user.username}#{user.discriminator}** has reported the tag: {name}\n\n{reason}'),
                query: {
                    prompt: 'Please provide a reason for your report:'
                }
            },
            setLang: {
                description: 'Sets the language to use when returning the raw text of your tag',
                success: t<{ name: string; }>('✅ Lang for tag `{name}` set.')
            },
            favourite: {
                list: {
                    description: 'Displays a list of the tags you have favourited',
                    success: t<{ tags: Iterable<string>; }>('{tags#count#plural(0:You have no favourite tags!|You have {} favourite {#plural(1:tag|tags)}. ```fix\n{~tags#join(, )}\n```)}')
                },
                toggle: {
                    description: 'Adds or removes a tag from your list of favourites',
                    added: t<{ name: string; }>('✅ The `{name}` tag is now on your favourites list!\n\nNote: there is no way for a tag to tell if you\'ve favourited it, and thus it\'s impossible to give rewards for favouriting.\nAny tag that claims otherwise is lying, and should be reported.'),
                    removed: t<{ name: string; }>('✅ The `{name}` tag is no longer on your favourites list!')
                }
            },
            flag: {
                updated: t<{ name: string; }>('✅ The flags for `{name}` have been updated.'),
                list: {
                    description: 'Lists the flags the tag accepts',
                    none: t<{ name: string; }>('✅ The `{name}` tag has no flags.'),
                    success: t<{ name: string; flags: Iterable<FlagDefinition<string>>; }>('✅ The `{name}` tag has the following flags:\n\n{flags#map(`-{flag}`/`--{word}`: {description})#join(\n)}')
                },
                create: {
                    description: 'Adds multiple flags to your tag. Flags should be of the form `-<f> <flag> [flag description]`\ne.g. `b!t flags add mytag -c category The category you want to use -n name Your name`',
                    wordMissing: t<{ flag: string; }>('❌ No word was specified for the `{flag}` flag'),
                    flagExists: t<{ flag: string; }>('❌ The flag `{flag}` already exists!'),
                    wordExists: t<{ word: string; }>('❌ A flag with the word `{word}` already exists!')
                },
                delete: {
                    description: 'Removes multiple flags from your tag. Flags should be of the form `-<f>`\ne.g. `b!t flags remove mytag -c -n`'
                }
            }
        },
        time: {
            errors: {
                timezoneInvalid: t<{ timezone: string; }>('❌ `{timezone}` is not a valid timezone! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.')
            },
            self: {
                description: 'Gets the time in your timezone'
            },
            user: {
                description: 'Gets the current time for the user',
                timezoneNotSet: t<{ user: Eris.User; prefix: string; }>('❌ {user#tag} has not set their timezone with the `{prefix}timezone` command yet.'),
                timezoneInvalid: t<{ user: Eris.User; prefix: string; }>('❌ {user#tag} doesn\'t have a valid timezone set. They need to update it with the `{prefix}timezone` command'),
                success: t<{ now: moment.Moment; user: Eris.User; }>('ℹ️ It is currently **{now#time(LT)}** for **{user#tag}**.')
            },
            timezone: {
                description: 'Gets the current time in the timezone',
                success: t<{ now: moment.Moment; timezone: string; }>('ℹ️ In **{timezone}**, it is currently **{now#time(LT)}**')
            },
            convert: {
                description: 'Converts a `time` from `timezone1` to `timezone2`',
                invalidTime: t<{ time: string; }>('❌ `{time}` is not a valid time! Please use the 12 or 24 hour format, e.g. 1:32pm or 13:32'),
                success: t<{ source: moment.Moment; dest: moment.Moment; sourceTimezone: string; destTimezone: string; }>('ℹ️ When it\'s **{source#time(LT)}** in **{sourceTimezone}**, it\'s **{dest#time(LT)}** in **{destTimezone}**.')
            }
        },
        timer: {
            flags: {
                channel: 'Sets the reminder to appear in the current channel rather than a DM'
            },
            default: {
                description: 'Sets a timer for the provided duration, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d2h3m4s\', or some other combination.',
                durationZero: '❌ I cant set a timer for 0 seconds!',
                event: t<{ userId: string; start: moment.Moment; }>('⏰ *Bzzt!* <@{userId}>, the timer you set {start#tag(R)} has gone off! *Bzzt!* ⏰'),
                success: {
                    here: t<{ duration: moment.Duration; }>('✅ Ok, ill ping you here {duration#tag}'),
                    dm: t<{ duration: moment.Duration; }>('✅ Ok, ill ping you in a DM {duration#tag}')
                }
            }
        },
        timeZone: {
            get: {
                description: 'Gets your current timezone',
                notSet: 'ℹ️ You haven\'t set a timezone yet.',
                timezoneInvalid: t<{ timezone: string; }>('⚠️ Your stored timezone code is `{timezone}`, which isn\'t valid! Please update it when possible.'),
                success: t<{ timezone: string; now: moment.Moment; }>('ℹ️ Your stored timezone code is `{timezone}`, which is equivalent to {now#time(z \\(Z\\))}.')
            },
            set: {
                description: 'Sets your current timezone. A list of [allowed time zones can be found on wikipedia](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List) under the `TZ database name` column',
                timezoneInvalid: t<{ timezone: string; }>('❌ `{timezone}` is not a valid timezone! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.'),
                success: t<{ timezone: string; now: moment.Moment; }>('✅ Ok, your timezone code is now set to `{timezone}`, which is equivalent to {now#time(z \\(Z\\))}.')
            }
        },
        todo: {
            list: {
                description: 'Shows you your todo list',
                embed: {
                    title: 'Todo list',
                    description: t<{ items: Iterable<{ id: number; value: string; }>; }>('{items#plural(0:You have nothing on your list!|{#map(**{id}.** {value})#join(\n)})}')
                }
            },
            remove: {
                description: 'Removes an item from your todo list by id',
                unknownId: t<{ id: number; }>('❌ Your todo list doesn\'t have an item {id}!'),
                success: '✅ Done!'
            },
            add: {
                description: 'Adds an item to your todo list',
                success: '✅ Done!'
            }
        },
        tokenify: {
            default: {
                description: 'Converts the given input into a token.'
            }
        },
        uptime: {
            default: {
                description: 'Gets how long ive been online for',
                success: t<{ startTime: moment.Moment; }>('ℹ️ I came online {startTime#tag(R)} at {startTime#tag}')
            }
        },
        user: {
            default: {
                description: 'Gets information about a user',
                activity: {
                    default: 'Not doing anything',
                    5: t<Eris.Activity>('Competing in {name}'),
                    4: t<Eris.Activity>('{emoji#bool({#emoji} |)}{name}'),
                    2: t<Eris.Activity>('Listening to {name}'),
                    0: t<Eris.Activity>('Playing {name}'),
                    1: t<Eris.Activity>('Streaming {details}'),
                    3: t<Eris.Activity>('Watching {name}')
                },
                embed: {
                    author: {
                        name: {
                            user: t<{ user: Eris.User; }>('{user.bot#bool(🤖 |)}{user.username}#{user.discriminator}'),
                            member: t<{ user: Eris.Member; }>('{user.bot#bool(🤖 |)}{user.username}#{user.discriminator}{user.nick#bool( \\({}\\)|)}')
                        }
                    },
                    description: {
                        user: t<{ user: Eris.User; }>('**User Id**: {user.id}\n**Created**: {user.createdAt#bool({#tag(t)}|-)}'),
                        member: t<{ user: Eris.Member; }>('**User Id**: {user.id}\n**Created**: {user.createdAt#bool({#tag(t)}|-)}\n**Joined** {user.joinedAt#bool({#tag(t)}|-)}')
                    },
                    field: {
                        roles: {
                            name: 'Roles',
                            value: t<{ roles: Iterable<Eris.Role>; }>('{roles#plural(0:None|{#map({#tag})#join( )})}')
                        }
                    }
                }
            }
        },
        version: {
            default: {
                description: 'Tells you what version I am on',
                success: t<{ version: string; }>('ℹ️ I am running blargbot version {version}')
            }
        },
        voteBan: {
            description: 'Its a meme, don\'t worry',
            errors: {
                failed: '❌ Seems the petitions office didn\'t like that one! Please try again'
            },
            list: {
                description: 'Gets the people with the most votes to be banned.',
                embed: {
                    title: 'ℹ️ Top 10 Vote bans',
                    description: t<{ items: Iterable<{ index: number; userId: string; count: number; }>; }>('{items#plural(0:No petitions have been signed yet!|{#map(**{index}.** <@{userId}> - {count} {count#plural(1:signature|signatures)})#join(\n)})}')
                }
            },
            info: {
                description: 'Checks the status of the petition to ban someone.',
                embed: {
                    title: 'ℹ️ Vote ban signatures',
                    description: t<{ user: Eris.User; votes: Iterable<{ userId: string; reason?: string; }>; excess: number; }>('{votes#plural(0:No one has voted to ban {~user#tag} yet.|{#map(<@{userId}>{reason#bool( - {}|)})#join(\n)})}{excess#bool(\n... and {} more|)}')
                }
            },
            sign: {
                description: 'Signs a petition to ban a someone',
                alreadySigned: t<{ user: Eris.User; }>('❌ I know you\'re eager, but you have already signed the petition to ban {user#tag}!'),
                success: t<{ user: Eris.User; target: Eris.User; total: number; reason?: string; }>('✅ {user#tag} has signed to ban {target#tag}! A total of **{total} {total#plural(1:person** has|people** have)} signed the petition now.{reason#bool(\n**Reason:** {}|)}')
            },
            forgive: {
                description: 'Removes your signature to ban someone',
                notSigned: t<{ user: Eris.User; }>('❌ That\'s very kind of you, but you haven\'t even signed to ban {user#tag} yet!'),
                success: t<{ user: Eris.User; target: Eris.User; total: number; }>('✅ {user#tag} reconsidered and forgiven {target#tag}! A total of **{total} {total#plural(1:person** has|people** have)} signed the petition now.')
            }
        },
        warnings: {
            common: {
                count: t<{ user: Eris.User; count: number; }>('{count#plural(0:🎉|⚠️)} **{user#tag}** {count#plural(0:doesn\'t have any warnings!|1:has accumulated 1 warning.|has accumulated {} warnings.)}'),
                untilTimeout: t<{ remaining: number; }>('- {remaining} more {remaining#plural(1:warning|warnings)} before being timed out.'),
                untilKick: t<{ remaining: number; }>('- {remaining} more {remaining#plural(1:warning|warnings)} before being kicked.'),
                untilBan: t<{ remaining: number; }>('- {remaining} more {remaining#plural(1:warning|warnings)} before being banned.'),
                success: t<{ parts: Iterable<IFormattable<string>>; }>('{parts#join(\n)}')
            },
            self: {
                description: 'Gets how many warnings you have'
            },
            user: {
                description: 'Gets how many warnings the user has'
            }
        },
        xkcd: {
            default: {
                description: 'Gets an xkcd comic. If a number is not specified, gets a random one.',
                down: '❌ Seems like xkcd is down 😟',
                embed: {
                    title: t<{ id: number; title: string; }>('xkcd #{id}: {title}'),
                    footer: {
                        text: t<{ year: string; }>('xkcd {year}')
                    }
                }
            }
        },
        art: {
            flags: {
                image: 'A custom image.'
            },
            user: {
                description: 'Shows everyone a work of art.'
            },
            default: {
                description: 'Shows everyone a work of art.',
                invalidUrl: t<{ url: string; }>('❌ {url} is not a valid url!')
            }
        },
        cah: {
            flags: {
                unofficial: 'Also show unofficial cards.'
            },
            default: {
                description: 'Generates a set of Cards Against Humanity cards.'
            },
            packs: {
                description: 'Lists all the Cards against packs I know about',
                success: 'ℹ️ These are the packs I know about:'
            }
        },
        caption: {
            errors: {
                imageMissing: '❌ You didn\'t tell me what image I should caption!',
                captionMissing: '❌ You must give at least 1 caption!',
                fontInvalid: t<{ font: string; prefix: string; }>('❌ {font} is not a supported font! Use `{prefix}caption list` to see all available fonts')
            },
            flags: {
                top: 'The top caption.',
                bottom: 'The bottom caption.',
                font: 'The font to use (case insensitive). Use the command with the -l flag to view the available fonts. Defaults to impact.'
            },
            fonts: {
                description: 'Lists the fonts that are supported',
                success: t<{ fonts: Iterable<string>; }>('ℹ️ The supported fonts are: {fonts#join(, | and )}')
            },
            attached: {
                description: 'Puts captions on an attached image.'
            },
            linked: {
                description: 'Puts captions on the image in the URL.',
                invalidUrl: t<{ url: string; }>('❌ {url} is not a valid url!')
            }
        },
        cat: {
            default: {
                description: 'Gets a picture of a cat.'
            }
        },
        clint: {
            flags: {
                image: 'A custom image.'
            },
            user: {
                description: 'I don\'t even know, to be honest.'
            },
            default: {
                description: 'I don\'t even know, to be honest.',
                invalidUrl: t<{ url: string; }>('❌ {url} is not a valid url!')
            }
        },
        clippy: {
            default: {
                description: 'Clippy the paper clip is here to save the day!'
            }
        },
        clyde: {
            default: {
                description: 'Give everyone a message from Clyde.'
            }
        },
        color: {
            default: {
                description: 'Returns the provided colors.'
            }
        },
        delete: {
            default: {
                description: 'Shows that you\'re about to delete something.'
            }
        },
        distort: {
            flags: {
                image: 'A custom image.'
            },
            user: {
                description: 'Turns an avatar into modern art.'
            },
            default: {
                description: 'Turns an image into modern art.',
                invalidUrl: t<{ url: string; }>('❌ {url} is not a valid url!')
            }
        },
        emoji: {
            description: 'Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.',
            flags: {
                svg: 'Get the emote as an svg instead of a png.'
            },
            default: {
                description: 'Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.',
                invalidEmoji: '❌ No emoji found!'
            }
        },
        free: {
            flags: {
                bottom: 'The bottom caption.'
            },
            default: {
                description: 'Tells everyone what you got for free'
            }
        },
        linus: {
            flags: {
                image: 'A custom image.'
            },
            user: {
                description: 'Shows a picture of Linus pointing at something on his monitor.'
            },
            default: {
                description: 'Shows a picture of Linus pointing at something on his monitor.',
                invalidUrl: t<{ url: string; }>('❌ {url} is not a valid url!')
            }
        },
        pcCheck: {
            default: {
                description: 'Tells everyone a reason why they should get their PC checked. Template credits go to Ghosty#8204.'
            }
        },
        pixelate: {
            flags: {
                image: 'A custom image.',
                scale: 'The amount to pixelate by (defaults to 64)'
            },
            user: {
                description: 'Pixelates an image.'
            },
            default: {
                description: 'Pixelates an image.',
                invalidUrl: t<{ url: string; }>('❌ {url} is not a valid url!')
            }
        },
        shit: {
            flags: {
                plural: 'Whether or not the text is plural (use ARE instead of IS).'
            },
            default: {
                description: 'Tells everyone what\'s shit.'
            }
        },
        sonicSays: {
            default: {
                description: 'Sonic wants to share some words of wisdom.'
            }
        },
        starVsTheForcesOf: {
            flags: {
                image: 'A custom image.'
            },
            user: {
                description: 'WHO IS STAR BATTLING THIS EPISODE?'
            },
            default: {
                description: 'WHO IS STAR BATTLING THIS EPISODE?',
                invalidUrl: t<{ url: string; }>('❌ {url} is not a valid url!')
            }
        },
        stupid: {
            flags: {
                user: 'The person who is stupid.',
                image: 'A custom image.'
            },
            default: {
                description: 'Tells everyone who is stupid.',
                invalidUser: t<{ user: string; }>('❌ I could not find the user `{user}`')
            }
        },
        theSearch: {
            default: {
                description: 'Tells everyone about the progress of the search for intelligent life.'
            }
        },
        truth: {
            default: {
                description: 'Shows everyone what is written in the Scroll of Truth.'
            }
        },
        danbooru: {
            default: {
                description: 'Gets three pictures from \'<https://danbooru.donmai.us/>\' using given tags.',
                noTags: '❌ You need to provide some tags',
                unsafeTags: '❌ None of the tags you provided were safe!',
                noResults: '❌ No results were found!',
                success: t<{ count: number; total: number; tags: Iterable<string>; }>('Found **{count}/{total}** posts for tags {tags#map(`{}`)#join(, | and )}'),
                embed: {
                    author: {
                        name: t<{ author?: string; }>('By {author=UNKNOWN}')
                    }
                }
            }
        },
        rule34: {
            default: {
                description: 'Gets three pictures from \'<https://rule34.xxx/>\' using given tags.',
                noTags: '❌ You need to provide some tags',
                unsafeTags: '❌ None of the tags you provided were safe!',
                noResults: '❌ No results were found!',
                success: t<{ count: number; total: number; tags: Iterable<string>; }>('Found **{count}/{total}** posts for tags {tags#map(`{}`)#join(, | and )}'),
                embed: {
                    author: {
                        name: t<{ author?: string; }>('By {author=UNKNOWN}')
                    }
                }
            }
        },
        eval: {
            errors: {
                error: t<{ result: string; }>('❌ An error occurred!```\n{result}\n```')
            },
            here: {
                description: 'Runs the code you enter on the current cluster',
                success: t<{ code: string; result: string; }>('✅ Input:```js\n{code}\n```Output:```\n{result}\n```')
            },
            master: {
                description: 'Runs the code you enter on the master process',
                success: t<{ code: string; result: string; }>('✅ Master eval input:```js\n{code}\n```Output:```\n{result}\n```')
            },
            global: {
                description: 'Runs the code you enter on all the clusters and aggregates the result',
                results: {
                    template: t<{ code: string; results: Iterable<IFormattable<string>>; }>('Global eval input:```js\n{code}\n```{results#join(\n)}'),
                    success: t<{ clusterId: number; result: string; }>('✅ Cluster {clusterId} output:```\n{result}\n```'),
                    failed: t<{ clusterId: number; result: string; }>('❌ Cluster {clusterId}: An error occurred!```\n{result}\n```')
                }
            },
            cluster: {
                description: 'Runs the code you enter on all the clusters and aggregates the result',
                success: t<{ clusterId: number; code: string; result: string; }>('✅ Cluster {clusterId} eval input:```js\n{code}\n```Output:```\n{result}\n```')
            }
        },
        exec: {
            default: {
                description: 'Executes a command on the current shell',
                pm2Bad: '❌ No! That\'s dangerous! Do `b!restart` instead.\n\nIt\'s not that I don\'t trust you, it\'s just...\n\nI don\'t trust you.',
                confirm: {
                    prompt: t<{ command: string; }>('⚠️ You are about to execute the following on the command line:```bash\n{command}\n```'),
                    continue: 'Continue',
                    cancel: 'Cancel'
                },
                cancelled: '✅ Execution cancelled',
                command: {
                    pending: t<{ command: string; }>('ℹ️ Command: `{command}`\nRunning...'),
                    success: t<{ command: string; }>('✅ Command: `{command}`'),
                    error: t<{ command: string; }>('❌ Command: `{command}`')
                }
            }
        },
        logLevel: {
            default: {
                description: 'Sets the current log level',
                success: t<{ logLevel: string; }>('✅ Log level set to `{logLevel}`')
            }
        },
        awoo: {
            description: 'Awoooooooooo!',
            action: t<{ self: Eris.User; }>('**{self#tag}** awoos!')
        },
        bang: {
            description: 'Bang bang!',
            action: t<{ self: Eris.User; }>('**{self#tag}** bangs!')
        },
        bite: {
            description: 'Give someone a bite!',
            action: t<{ self: Eris.User; target?: Eris.User; }>('**{self#tag}** bites **{target#tag=themselves}**')
        },
        blush: {
            description: 'Show everyone that you\'re blushing.',
            action: t<{ self: Eris.User; }>('**{self#tag}** blushes!')
        },
        cry: {
            description: 'Show everyone that you\'re crying.',
            action: t<{ self: Eris.User; }>('**{self#tag}** cries!')
        },
        cuddles: {
            description: 'Cuddle with someone.',
            action: t<{ self: Eris.User; target?: Eris.User; }>('**{self#tag}** cuddles with **{target#tag=themselves}**')
        },
        dance: {
            description: 'Break out some sweet, sweet dance moves.',
            action: t<{ self: Eris.User; }>('**{self#tag}** dances!')
        },
        hug: {
            description: 'Give somebody a hug.',
            action: t<{ self: Eris.User; target?: Eris.User; }>('**{self#tag}** hugs **{target#tag=themselves}**')
        },
        jojo: {
            description: 'This must be the work of an enemy stand!'
        },
        kiss: {
            description: 'Give somebody a kiss.',
            action: t<{ self: Eris.User; target?: Eris.User; }>('**{self#tag}** kisses **{target#tag=themselves}**')
        },
        lewd: {
            description: 'T-that\'s lewd...',
            action: t<{ self: Eris.User; }>('**{self#tag}** is lewd 😳!')
        },
        lick: {
            description: 'Give someone a lick. Sluurrpppp!',
            action: t<{ self: Eris.User; target?: Eris.User; }>('**{self#tag}** licks **{target#tag=themselves}**')
        },
        megumin: {
            description: 'Darkness blacker than black and darker than dark, I beseech thee, combine with my deep crimson. The time of awakening cometh. Justice, fallen upon the infallible boundary, appear now as an intangible distortion! Dance, Dance, Dance! I desire for my torrent of power a destructive force: a destructive force without equal! Return all creation to cinders, and come from the abyss!'
        },
        nom: {
            description: 'Nom on somebody.',
            action: t<{ self: Eris.User; target?: Eris.User; }>('**{self#tag}** noms on **{target#tag=themselves}**')
        },
        owo: {
            description: 'owo whats this?',
            action: t<{ self: Eris.User; }>('**{self#tag}** owos!')
        },
        pat: {
            description: 'Give somebody a lovely pat.',
            action: t<{ self: Eris.User; target?: Eris.User; }>('**{self#tag}** pats **{target#tag=themselves}**')
        },
        poke: {
            description: 'Gives somebody a poke.',
            action: t<{ self: Eris.User; target?: Eris.User; }>('**{self#tag}** pokes **{target#tag=themselves}**')
        },
        pout: {
            description: 'Let everyone know that you\'re being pouty.',
            action: t<{ self: Eris.User; }>('**{self#tag}** pouts!')
        },
        punch: {
            description: 'Punch someone. They probably deserved it.',
            action: t<{ self: Eris.User; target?: Eris.User; }>('**{self#tag}** punches **{target#tag=themselves}**')
        },
        rem: {
            description: 'Worst girl'
        },
        shrug: {
            description: 'Let everyone know that you\'re a bit indifferent.',
            action: t<{ self: Eris.User; }>('**{self#tag}** shrugs!')
        },
        slap: {
            description: 'Slaps someone.',
            action: t<{ self: Eris.User; target?: Eris.User; }>('**{self#tag}** slaps **{target#tag=themselves}**')
        },
        sleepy: {
            description: 'Let everyone know that you\'re feeling tired.',
            action: t<{ self: Eris.User; }>('**{self#tag}** is sleepy!')
        },
        smile: {
            description: 'Smile!',
            action: t<{ self: Eris.User; }>('**{self#tag}** smiles!')
        },
        smug: {
            description: 'Let out your inner smugness.',
            action: t<{ self: Eris.User; }>('**{self#tag}** is smug!')
        },
        stare: {
            description: 'Staaaaaaaaare',
            action: t<{ self: Eris.User; }>('**{self#tag}** stares!')
        },
        thumbsUp: {
            description: 'Give a thumbs up!',
            action: t<{ self: Eris.User; }>('**{self#tag}** gives a thumbs up!')
        },
        wag: {
            description: 'Wagwagwagwag',
            action: t<{ self: Eris.User; }>('**{self#tag}** wags!')
        },
        respawn: {
            description: 'Cluster respawning only for staff.',
            default: {
                description: 'Respawns the cluster specified',
                requested: t<{ user: Eris.User; clusterId: number; }>('**{user#tag}** has called for a respawn of cluster {clusterId}.'),
                success: t<{ clusterId: number; }>('✅ Cluster {clusterId} is being respawned and stuff now')
            }
        },
        respond: {
            default: {
                description: 'Responds to a suggestion, bug report or feature request',
                notFound: '❌ I couldn\'t find that feedback!',
                userNotFound: '⚠️ Feedback successfully updated\n⛔ I couldn\'t find the user who submitted that feedback',
                alertFailed: '⚠️ Feedback successfully updated\n⛔ I wasn\'t able to send the response in the channel where the feedback was initially sent',
                success: '✅ Feedback successfully updated and response has been sent.',
                alert: t<{ submitterId: string; title: string; description: string; respondent: Eris.User; response: string; link: string; }>('**Hi, <@{submitterId}>!**  You recently made this suggestion:\n\n**{title}**{description#bool(\n\n{}|)}\n\n**{respondent#tag}** has responded to your feedback with this:\n\n{response}\n\nIf you have any further questions or concerns, please join my support guild so that they can talk to you directly. You can get a link by doing `b!invite`. Thanks for your time!\n\nYour card has been updated here: <{link}>')
            }
        }
    }
}));

export default templates;
