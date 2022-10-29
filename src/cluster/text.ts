import { AnalysisResult } from '@blargbot/bbtag';
import { FlagDefinition } from '@blargbot/domain/models/index';
import { FormatString, IFormattable } from '@blargbot/formatting';
import * as Eris from 'eris';
import { Duration, Moment } from 'moment-timezone';

import { Command } from './command/Command';

interface UserTag {
    readonly username?: string;
    readonly discriminator?: string;
}

export const templates = FormatString.defineTree('cluster', t => ({
    common: {
        query: {
            cancel: t('Cancel'),
            cantUse: t('❌ This isn\'t for you to use!'),
            choose: {
                paged: t<{ content?: IFormattable<string>; page: number; pageCount: number; }>()('{content#bool({}\n|)}Page {page}/{pageCount}')
            },
            user: {
                prompt: {
                    default: t('ℹ️ Please select a user from the drop down'),
                    filtered: t<{ filter: string; }>()('ℹ️ Multiple users matching `{filter}` found! Please select one from the drop down.')
                },
                placeholder: t('Select a user'),
                choice: {
                    label: t<{ user: Eris.User; }>()('{user.username}#{user.discriminator}'),
                    description: t<{ user: Eris.User; }>()('Id: {user.id}')
                }
            },
            member: {
                prompt: {
                    default: t('ℹ️ Please select a user from the drop down'),
                    filtered: t<{ filter: string; }>()('ℹ️ Multiple users matching `{filter}` found! Please select one from the drop down.')
                },
                placeholder: t('Select a user'),
                choice: {
                    label: t<{ member: Eris.Member; }>()('{member.nick#bool({}|{~member.username})} ({member.username}#{member.discriminator})'),
                    description: t<{ member: Eris.Member; }>()('Id: {member.id}')
                }
            },
            sender: {
                prompt: {
                    default: t('ℹ️ Please select a user or webhook from the drop down'),
                    filtered: t<{ filter: string; }>()('ℹ️ Multiple users or webhooks matching `{filter}` found! Please select one from the drop down.')
                },
                placeholder: t('Select a user or webhook'),
                choice: {
                    label: {
                        user: t<{ user: Eris.User; }>()('{user.username}#{user.discriminator}'),
                        webhook: t<{ webhook: Eris.Webhook; }>()('{webhook.name}')
                    },
                    description: t<{ sender: Eris.User | Eris.Webhook; }>()('Id: {sender.id}')
                }
            },
            role: {
                prompt: {
                    default: t('ℹ️ Please select a role from the drop down'),
                    filtered: t<{ filter: string; }>()('ℹ️ Multiple roles matching `{filter}` found! Please select one from the drop down.')
                },
                placeholder: t('Select a role'),
                choice: {
                    label: t<{ role: Eris.Role; }>()('{role.name}'),
                    description: t<{ role: Eris.Role; }>()('Id: {role.id} Color: {role.color#color}')
                }
            },
            channel: {
                prompt: {
                    default: t('ℹ️ Please select a channel from the drop down'),
                    filtered: t<{ filter: string; }>()('ℹ️ Multiple channel matching `{filter}` found! Please select one from the drop down.')
                },
                placeholder: t('Select a channel'),
                choice: {
                    label: {
                        guild: t<{ channel: Eris.GuildChannel; }>()('{channel.name}'),
                        dm: t('DM')
                    },
                    description: t<{ channel: Eris.Channel; parent?: { label: IFormattable<string>; emoji: string; }; }>()('Id: {channel.id}{parent#bool({emoji} {label}|)}')
                }
            },
            paged: {
                prompt: t<{ header?: IFormattable<string>; page: number; pageCount: number; content: IFormattable<string>; }>()('{header#bool({}\n|)}Page **#{page}/{pageCount}**\n{content}\nType a number between **1 and {pageCount}** to view that page.')
            }
        }
    },
    regex: {
        tooLong: t('❌ Regex is too long!'),
        invalid: t('❌ Regex is invalid!'),
        unsafe: t('❌ Regex is unsafe!\nIf you are 100% sure your regex is valid, it has likely been blocked due to how I detect catastrophic backtracking.\nYou can find more info about catastrophic backtracking here: <https://www.regular-expressions.info/catastrophic.html>'),
        matchesEverything: t('❌ Your regex cannot match everything!')
    },
    respawn: {
        success: t<{ duration: Duration; }>()('Ok I\'m back. It took me {duration#duration(F)}')
    },
    roleme: {
        failed: t('A roleme was triggered, but I don\'t have the permissions required to give you your role!')
    },
    poll: {
        embed: {
            footer: {
                text: t('The poll will end')
            }
        },
        success: {
            noVotes: t('The votes are in! A total of **0** votes were collected!\n\n No one voted, how sad 😦'),
            tie: t<{ total: number; count: number; winners: Iterable<string>; }>()('The votes are in! A total of **{total}** {total#plural(1:vote was|votes were)} collected!\n\n It was a tie between these choices at **{count}** {count#plural(1:vote|votes)} each:\n\n{winners#join(, | and )}'),
            single: t<{ total: number; count: number; winner: string; }>()('The votes are in! A total of **{total}** {total#plural(1:vote was|votes were)} collected!\n\n At **{count}** {count#plural(1:vote|votes)}, the winner is:\n\n{winner}')
        }
    },
    guild: {
        blacklisted: t<{ guild: Eris.Guild; }>()('Greetings! I regret to inform you that your guild, **{guild.name}** ({guild.id}), is on my blacklist. Sorry about that! I\'ll be leaving now. I hope you have a nice day.'),
        joined: t<{ guild: Eris.Guild; botGuild: boolean; size: number; userCount: number; botCount: number; botFraction: number; }>()('☑️ Guild: `{guild.name}` (`{guild.id}`)! {botGuild#bool(- ***BOT GUILD***|)}\n    Total: **{size}** | Users: **{userCount}** | Bots: **{botCount}** | Percent: **{botFraction#percent}**')
    },
    autoresponse: {
        prompt: t<{ guild: Eris.Guild; channelId: string; reason: string; code: string; user: Eris.User; }>()('New AR request from **{user.username}#{user.discriminator}** ({user#tag}):\n**Guild**: {guild.name} ({guild.id})\n**Channel**: {channelId}\n**Members**: {guild.members.size}\n\n{reason}\n\n```js\n{code}\n```'),
        whitelist: {
            approved: t('✅ Congratz, your guild has been whitelisted for autoresponses! 🎉\n*It may take up to 15 minutes for them to become available*'),
            rejected: t('❌ Sorry, your guild has been rejected for autoresponses. 😿')
        }
    },
    announcements: {
        prompt: {
            channel: t('ℹ️ Please select the channel that announcements should be put in.'),
            role: t('ℹ️ Please select the role to mention when announcing.')
        }
    },
    modlog: {
        defaultReason: t<{ prefix: string; caseId: number; }>()('Responsible moderator, please do `{prefix}reason {caseId}` to set.'),
        types: {
            generic: t('Generic'),
            pardon: t('Pardon'),
            timeout: t('Timeout'),
            timeoutClear: t('Timeout Clear'),
            softBan: t('Soft Ban'),
            ban: t('Ban'),
            massBan: t('Mass Ban'),
            unban: t('Unban'),
            kick: t('Kick'),
            unmute: t('Unmute'),
            mute: t('Mute'),
            temporaryMute: t('Temporary Mute'),
            warning: t('Warning')
        },
        embed: {
            title: t<{ caseId: number; }>()('Case {caseId}'),
            description: t<{ users: Iterable<Eris.User>; }>()('{users#map({username}#{discriminator} \\({id}\\))#join(\n)}'),
            footer: {
                text: t<{ user: Eris.User; }>()('{user.username}#{user.discriminator} ({user.id})')
            },
            field: {
                type: {
                    name: t('Type')
                },
                reason: {
                    name: t('Reason'),
                    value: t<{ reason: IFormattable<string>; }>()('{reason}')
                },
                pardons: {
                    name: t('Pardons'),
                    value: t<{ count: number; warnings: number; }>()('Assigned: {count}\nNew Total: {warnings}')
                },
                warnings: {
                    name: t('Warnings'),
                    value: t<{ count: number; warnings: number; }>()('Assigned: {count}\nNew Total: {warnings}')
                },
                duration: {
                    name: t('Duration'),
                    value: t<{ duration: Duration; }>()('{duration#duration(F)}')
                },
                user: {
                    name: t('User'),
                    value: t<{ user: Eris.User; }>()('{user.username}#{user.discriminator} ({user.id})')
                }
            }
        }
    },
    eventLog: {
        disabled: t<{ event: string; channel: Eris.Channel; }>()('❌ Disabled logging of the `{event}` event because the channel {channel#tag} doesn\'t exist or I don\'t have permission to post messages in it!'),
        events: {
            timeoutAdded: t('ℹ️ User Was Timed Out'),
            timeoutRemoved: t('ℹ️ User Timeout Was Removed'),
            banned: t('ℹ️ User was banned'),
            unbanned: t('ℹ️ User Was Unbanned'),
            joined: t('ℹ️ User Joined'),
            left: t('ℹ️ User Left'),
            messageDeleted: t('ℹ️ Message Deleted'),
            messageUpdated: t('ℹ️ Message Updated'),
            roleRemoved: t('ℹ️ Special Role Removed'),
            roleAdded: t('ℹ️ Special Role Added'),
            nicknameUpdated: t('ℹ️ Nickname Updated'),
            usernameUpdated: t('ℹ️ Username Updated'),
            avatarUpdated: t('ℹ️ Avatar Updated')
        },
        embed: {
            description: {
                avatarUpdated: t('➡️ Old avatar\n⬇️ New avatar'),
                bulkDelete: t('Bulk Message Delete'),
                userUpdated: {
                    username: t('Username changed.'),
                    discriminator: t('Discriminator changed.'),
                    both: t('Username changed.\nDiscriminator changed.')
                }
            },
            field: {
                reason: {
                    name: t('Reason'),
                    value: t<{ reason: string; }>()('{reason}')
                },
                message: {
                    name: t('Message Id'),
                    value: t<{ messageId: string; }>()('{messageId}')
                },
                channel: {
                    name: t('Channel'),
                    value: t<{ channelIds: Iterable<string>; }>()('{channelIds#map(<#{}>)#join(\n)}')
                },
                oldUsername: {
                    name: t('Old Name'),
                    value: t<{ user: Eris.User; }>()('{user.username}#{user.discriminator}')
                },
                newUsername: {
                    name: t('New Name'),
                    value: t<{ user: Eris.User; }>()('{user.username}#{user.discriminator}')
                },
                oldNickname: {
                    name: t('Old Nickname'),
                    value: t<{ nickname: string; }>()('{nickname}')
                },
                newNickname: {
                    name: t('New Nickname'),
                    value: t<{ nickname: string; }>()('{nickname}')
                },
                role: {
                    name: t('Role'),
                    value: t<{ roleId: string; }>()('<@&{roleId}> ({roleId})')
                },
                updatedBy: {
                    name: t('Updated By'),
                    value: t<{ userId: string; }>()('<@{userId}> ({userId})')
                },
                created: {
                    name: t('Created'),
                    value: t<{ time: Moment; }>()('{time#tag}')
                },
                until: {
                    name: t('Until'),
                    value: t<{ time: Moment; }>()('{time#tag}')
                },
                count: {
                    name: t('Count'),
                    value: t<{ count: number; }>()('{count}')
                },
                content: {
                    name: {
                        old: {
                            unavailable: t('Old Message (Unavailable)'),
                            empty: t('Old Message (Empty)'),
                            default: t('Old Message')
                        },
                        new: {
                            unavailable: t('New Message (Unavailable)'),
                            empty: t('New Message (Empty)'),
                            default: t('New Message')
                        },
                        current: {
                            unavailable: t('Content (Unavailable)'),
                            empty: t('Content (Empty)'),
                            default: t('Content')
                        }
                    },
                    value: {
                        chatLogsOff: t('This message wasn\'t logged. ChatLogging is currently turned off'),
                        unknown: t('This message wasn\'t logged. ChatLogging was off when it was sent, or it is older than 2 weeks'),
                        expired: t('This message is no longer logged as it is older than 2 weeks'),
                        notLogged: t('This message wasn\'t logged. ChatLogging was off when it was sent.'),
                        empty: t('This message has no content. It had either an attachment or an embed'),
                        default: t<{ content: string; }>()('{content#overflow(1024|... (too long to display))}')
                    }
                }
            }

        }
    },
    warning: {
        autoBan: t<{ warnings: number; limit: number; }>()('[ Auto-Ban ] Exceeded ban limit ({warnings}/{limit})'),
        autoKick: t<{ warnings: number; limit: number; }>()('[ Auto-Ban ] Exceeded ban limit ({warnings}/{limit})'),
        autoTimeout: t<{ warnings: number; limit: number; }>()('[ Auto-Ban ] Exceeded ban limit ({warnings}/{limit})')
    },
    mute: {
        autoUnmute: t<{ duration?: Duration; }>()('Automatically unmuted after {duration#duration(F)=some time}.'),
        createReason: t('Automatic muted role configuration')
    },
    moderation: {
        auditLog: t<{ moderator: Eris.User; reason?: IFormattable<string>; }>()('[{moderator.username}#{moderator.discriminator}]{reason#bool( {}|)}')
    },
    censor: {
        warnReason: t('Said a blacklisted phrase.'),
        mentionSpam: {
            ban: {
                reason: t('Mention Spam'),
                failed: t<{ user: Eris.User; }>()('{user#tag} is mention spamming, but I lack the permissions to ban them!')
            }
        }
    },
    ban: {
        autoUnban: t<{ duration?: Duration; }>()('Automatically unbanned after {duration#duration(F)=some time}.')
    },
    documentation: {
        loading: t('Loading...'),
        name: {
            flat: t<{ parent: IFormattable<string>; child: IFormattable<string>; }>()('{parent} - {child}')
        },
        query: {
        },
        paging: {
            parent: t<{ parent: IFormattable<string>; }>()('Back to {parent}'),
            select: {
                placeholder: t<{ text: IFormattable<string>; page: number; pageCount: number; }>()('{text} - Page {page}/{pageCount}')
            }
        },
        command: {
            unknown: t('❌ Oops, I couldn\'t find that command! Try using `b!help` for a list of all commands'),
            invalid: t('❌ This help page isn\'t valid any more!'),
            prompt: t<{ term: string; }>()('Multiple help pages match `{term}`'),
            index: {
                name: t('Help'),
                footer: t<{ commandsLink: string; donateLink: string; }>()('For more information about commands, do `b!help <commandname>` or visit <{commandsLink}>.\nWant to support the bot? Donation links are available at <{donateLink}> - all donations go directly towards recouping hosting costs.'),
                prompt: t('Pick a command category')
            },
            list: {
                none: t('No commands'),
                excess: t<{ items: Iterable<IFormattable<string>>; excess: number; }>()('```\n{items#join(, )}\n```+ {excess} more'),
                count: t<{ count: number; }>()('{count} {count#plural(1:command|commands)}'),
                default: t<{ items: Iterable<IFormattable<string>>; }>()('```\n{items#join(, )}\n```')
            },
            categories: {
                prompt: t('Pick a command'),
                displayName: t<{ category: IFormattable<string>; }>()('{category} commands'),
                custom: {
                    noHelp: t('_No help set_')
                }
            },
            command: {
                prompt: t('Pick a command signature'),
                noPerms: t<{ name: string; description?: IFormattable<string>; }>()('```\n❌ You cannot use b!{name}\n```{description}'),
                aliases: {
                    name: t('**Aliases**'),
                    value: t<{ aliases: Iterable<string>; }>()('{aliases#join(, )}')
                },
                flags: {
                    name: t('**Flags**'),
                    value: t<{ flags: Iterable<FlagDefinition<string | IFormattable<string>>>; }>()('{flags#map(`-{flag}`/`--{word}`: {description})#join(\n)}')
                },
                usage: {
                    name: t<{ usage: string; }>()('ℹ️  {usage}'),
                    value: t<{ notes: Iterable<IFormattable<string>>; description: IFormattable<string>; }>()('{notes#plural(0:|{#map(> {})#join(\n)}\n\n)}{description}')
                },
                notes: {
                    alias: t<{ parameter: string; aliases: Iterable<string>; }>()('`{parameter}` can be replaced with {aliases#map(`{}`)#join(, | or )}'),
                    type: {
                        string: {
                            single: t<{ name: string; default: string; }>()('`{name}` defaults to `{default}`')
                        },
                        literal: {
                            single: t<{ name: string; choices: Iterable<string>; default?: string; }>()('`{name}` should be {choices#map(`{}`)#join(, | or )}{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; choices: Iterable<string>; min: number; }>()('`{name}` are {min#plural(0:|1:|{} or more of )}{choices#map(`{}`)#join(, | or )}')
                        },
                        boolean: {
                            single: t<{ name: string; default?: string; }>()('`{name}` should be true or false{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; min: number; }>()('`{name}` are {min#plural(0:|1:|{} or more )}true or false')
                        },
                        channel: {
                            single: t<{ name: string; default?: string; }>()('`{name}` should be a channel id, mention or name{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; min: number; }>()('`{name}` are {min#plural(0:|1:|{} or more )}channel ids, mentions or names')
                        },
                        duration: {
                            single: t<{ name: string; default?: string; }>()('`{name}` should be a duration{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; min: number; }>()('`{name}` are {min#plural(0:|1:|{} or more )}durations')
                        },
                        bigint: {
                            single: t<{ name: string; default?: string; }>()('`{name}` should be a whole number{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; min: number; }>()('`{name}` are {min#plural(0:|1:|{} or more )}whole numbers')
                        },
                        integer: {
                            single: t<{ name: string; default?: string; }>()('`{name}` should be a whole number{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; min: number; }>()('`{name}` are {min#plural(0:|1:|{} or more )}whole numbers')
                        },
                        member: {
                            single: t<{ name: string; default?: string; }>()('`{name}` should be a user id, mention or name{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; min: number; }>()('`{name}` are {min#plural(0:|1:|{} or more )}user ids, mentions or names')
                        },
                        number: {
                            single: t<{ name: string; default?: string; }>()('`{name}` should be a number{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; min: number; }>()('`{name}` are {min#plural(0:|1:|{} or more )}numbers')
                        },
                        role: {
                            single: t<{ name: string; default?: string; }>()('`{name}` should be a role id, mention or name{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; min: number; }>()('`{name}` are {min#plural(0:|1:|{} or more )}role ids, mentions or names')
                        },
                        sender: {
                            single: t<{ name: string; default?: string; }>()('`{name}` should be a user id, mention or name, or a webhook id{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; min: number; }>()('`{name}` are {min#plural(0:|1:|{} or more )}user ids, mentions or names, or webhook ids')
                        },
                        user: {
                            single: t<{ name: string; default?: string; }>()('`{name}` should be a user id, mention or name{default#bool( and defaults to `{}`|)}'),
                            greedy: t<{ name: string; min: number; }>()('`{name}` are {min#plural(0:|1:|{} or more )}user ids, mentions or names')
                        }
                    }
                }
            }
        },
        bbtag: {
            invalid: t('❌ This bbtag documentation page isn\'t valid any more!'),
            unknown: t<{ commandName: string; }>()('❌ Oops, I didn\'t recognise that topic! Try using `b!{commandName} docs` for a list of all topics'),
            prompt: t<{ term: string; }>()('Multiple bbtag documentation pages match `{term}`'),
            index: {
                name: t('BBTag'),
                description: t<{ editorLink: string; }>()('Blargbot is equipped with a system of tags called BBTag, designed to mimic a programming language while still remaining simple. You can use this system as the building-blocks to create your own advanced command system, whether it be through public tags or guild-specific custom commands.\n\nCustomizing can prove difficult via discord, fortunately there is an online [BBTag IDE]({editorLink}) which should make developing a little easier.'),
                prompt: t('Pick a topic'),
                topics: {
                    name: t('Topics'),
                    value: t<{ commandName: string; }>()('For specific information about a topic, please use `b!{commandName} docs <topic>` (like `b!{commandName} docs subtags`\n- `terminology`, for more information about terms like \'subtags\', \'tags\', etc.  \n- `variables`, for more information about variables and the different variable scopes.\n- `argTypes`, for more information about the syntax of parameters\n- `dynamic`, for information about dynamic subtags\n- `subtags`, arguably the most important topic on this list. `b!{commandName} docs subtags` displays a list of subtag categories.')
                }
            },
            subtags: {
                name: t('Subtags'),
                description: t<{ categories: Iterable<{ name: IFormattable<string>; description: IFormattable<string>; }>; }>()('Subtags are the building blocks of BBTag, and fall into {categories#count} categories:\n\n{categories#map(**{name}** - {description})#join(\n)}'),
                prompt: t('Pick a category')
            },
            subtag: {
                name: t<{ name: string; }>()('\\{{name}\\}'),
                prompt: t('Pick a call signature'),
                description: {
                    deprecated: t<{ replacement?: string; }>()('**This subtag is deprecated{replacement#bool( and has been replaced by \\{{}\\}|)}**'),
                    aliases: t<{ aliases: Iterable<string>; }>()('{aliases#plural(0:|**Aliases:** ```\n{#join(, )}\n```)}'),
                    template: t<{ parts: Iterable<IFormattable<string>>; }>()('{parts#join(\n)}')
                },
                pages: {
                    signature: {
                        name: t<{ parameters: string; }>()('Usage: {parameters}'),
                        usage: {
                            name: t('**Usage**'),
                            value: {
                                parameters: t<{ parameters: string; }>()('```\n{parameters}\n```'),
                                modifier: {
                                    maxLength: t<{ name: string; maxLength: number; }>()('`{name}` can at most be {maxLength} characters long'),
                                    defaulted: t<{ name: string; defaultValue: string; required: boolean; }>()('`{name}` defaults to `{defaultValue}` if{required#bool(| omitted or)} left blank.'),
                                    defaultedMaxLength: t<{ name: string; defaultValue: string; required: boolean; maxLength: number; }>()('`{name}` can at most be {maxLength} characters long and defaults to `{defaultValue}` if{required#bool(| omitted or)} left blank.')
                                },
                                template: t<{ parts: Iterable<IFormattable<string>>; }>()('{parts#join(\n)}')
                            }
                        },
                        exampleCode: {
                            name: t('**Example code**'),
                            value: t<{ code: IFormattable<string>; }>()('```\n{code}\n```')
                        },
                        exampleIn: {
                            name: t('**Example user input**'),
                            value: t<{ text: IFormattable<string>; }>()('{text#bool(\n{#split(\n)#map(> {})#join(\n)}|_no input_)}\n')
                        },
                        exampleOut: {
                            name: t('**Example output**'),
                            value: t<{ text: IFormattable<string>; }>()('{text#bool(\n{#split(\n)#map(> {})#join(\n)}|_no output_)}\n')
                        },
                        limit: {
                            name: {
                                customCommandLimit: t('**Limits for custom commands:**'),
                                everythingAutoResponseLimit: t('**Limits for custom commands:**'),
                                generalAutoResponseLimit: t('**Limits for custom commands:**'),
                                tagLimit: t('**Limits for custom commands:**')
                            },
                            value: t<{ rules: Iterable<IFormattable<string>>; }>()('```\n{rules#join(\n)}\n```')
                        }
                    }
                }
            },
            subtagCategory: {
                description: t<{ description: IFormattable<string>; subtags: Iterable<string>; }>()('{description}\n\n```\n{subtags#join(, )}\n```'),
                prompt: t('Pick a subtag')
            },
            variables: {
                name: t('Variables'),
                description: t<{ scopeCount: number; }>()('In BBTag there are {scopeCount} different scopes that can be used for storing your data. These scopes are determined by the first character of your variable name, so choose carefully!'),
                prompt: t('Pick a variable scope'),
                pages: {
                    variableType: {
                        name: t<{ name: IFormattable<string>; prefix: string; }>()('{name} variables (prefix: {prefix})')
                    },
                    commitRollback: {
                        name: t('\\{commit\\} and \\{rollback\\}'),
                        value: t('For performance reasons, when a value is `\\{set\\}` it wont be immediately populated to the database. `\\{commit\\}` and `\\{rollback\\}` can be used to manipulate when variables are sent to the database, if at all. `\\{commit\\}` will force the given variables to be sent to the database immediately. `\\{rollback\\}` will revert the given variables to their original value (start of tag or most recent `\\{commit\\}`).\nThere is also an additional prefix for \\{set\\} and \\{get\\} which is `!`. This prefix can be combined with other prefixes and will act the same as if you have called `\\{set\\}` and then `\\{commit\\}` immediately after. e.g. ```\\{set;!@varname;value\\}``` is identical to ```\\{set;@varname;value\\}\\{commit;@varname\\}```')
                    }
                }
            },
            arguments: {
                name: t('Arguments'),
                description: t('As you may have noticed, the various help documentation for subtags will have a usage that often look like this: ```\n\\{subtag;<arg1>;[arg2];<arg3...>\\}```This way of formatting arguments is designed to easily be able to tell you what is and is not required.\nAll arguments are separated by `;`\'s and each will be displayed in a way that tells you what kind of argument it is.\nNOTE: Simple subtags do not accept any arguments and so should not be supplied any.'),
                prompt: t('Pick a argument type'),
                pages: {
                    required: {
                        name: t('Required arguments <>'),
                        value: t('Example:```\n<arg>```Required arguments must be supplied for a subtag to work. If they are not then you will normally be given a `Not enough args` error\n\u200B')
                    },
                    optional: {
                        name: t('Optional arguments []'),
                        value: t<{ commandName: string; }>()('Example:```\n[arg]```Optional arguments may or may not be provided. If supplied, optional arguments may either change the functionality of the tag (e.g. `b!{commandName} docs shuffle`) or simply replace a default value (e.g. `b!{commandName} docs username`).\n\u200B')
                    },
                    multiple: {
                        name: t('Multiple arguments ...'),
                        value: t<{ commandName: string; }>()('Example:```\n<arg...>```Some arguments can accept multiple values, meaning you are able to list additional values, still separated by `;`, which will be included in the execution. (e.g. `b!{commandName} docs randchoose`)')
                    },
                    nested: {
                        name: t('Nested arguments <<> <>>'),
                        value: t<{ commandName: string; }>()('Example:```\n<<arg1>, [arg2]>```Some subtags may have special rules for how their arguments are grouped (e.g. `b!{commandName} docs switch`) and will use nested arguments to show that grouping. When actually calling the subtag, you provide the arguments as normal, however you must obey the grouping rules.\nIn the example of `switch`, you may optionally supply `<case>` and `<then>` as many times as you like but they must always be in pairs. e.g. `\\{switch;value;case1;then1\\}` or `\\{switch;value;case1;then1;case2;then2\\}` etc')
                    }
                }
            },
            terminology: {
                name: t('Terminology'),
                description: t('There are various terms used in BBTag that might not be intuitive, so here is a list of definitions for some of the most important ones:'),
                prompt: t('Pick a term'),
                pages: {
                    bbtag: {
                        name: t('BBTag'),
                        value: t('BBTag is a text replacement language. Any text between a `\\{` and `\\}` pair (called a subtag) will be taken as code and run, with the output of that replacing the whole subtag. Each subtag does something different, and each accepts its own list of arguments.')
                    },
                    subtag: {
                        name: t('Subtag'),
                        value: t('A subtag is a pre-defined function that accepts some arguments and returns a single output. Subtags can be called by placing their name between a pair of `\\{` and `\\}`, with any arguments to be passed to the subtag being separated by `;`.\nAs an example:```\\{math;+;1;2\\}```Subtag: `math`\nArguments: `+`, `1`, `2`\nResult: `3`')
                    },
                    tag: {
                        name: t('Tag'),
                        value: t('A tag is a user-made block of text which may or may not contain subtags. Any subtags that it does contain will be executed and be replaced by their output.')
                    },
                    argument: {
                        name: t('Argument'),
                        value: t('An argument is a single value which gets given to a subtag. Arguments can be numbers, text, arrays, anything you can type really. Each subtag will require a different argument pattern, so be sure to check what pattern your subtag needs!')
                    },
                    variable: {
                        name: t('Variable'),
                        value: t<{ commandName: string; }>()('A variable is a value that is stored in the bots memory ready to access it later on. For more in-depth details about variables, please use `b!{commandName} docs variable`.')
                    },
                    array: {
                        name: t('Array'),
                        value: t('An array is a collection of values all grouped together, commonly done so by enclosing them inside `[]`. In BBTag, arrays can be assigned to a variable to store them for later use. In this situation, you might see an array displayed like this `\\{"v":["1","2","3"],"n":"varname"\\}`. If you do, don\'t worry, nothing is broken! That is just there to allow you to modify the array in place within certain subtags.')
                    }
                }
            },
            dynamic: {
                name: t('Dynamic'),
                description: t('In bbtag, even the names of subtags can be dynamic. This can be achieved simply by placing subtags before the first `;` of a subtag. \n e.g. ```\\{user\\{get;~action\\};\\{userid\\}\\}``` If `~action` is set to `name`, then this will run the `username` subtag, if it is set to `avatar` then it will run the `useravatar` subtag, and so on. Because dynamic subtags are by definition not set in stone, it is recommended not to use them, and as such you will receive warnings when editing/creating a tag/cc which contains a dynamic subtag. Your tag will function correctly, however some optimizations employed by bbtag will be unable to run on any such tag.')
            }
        }
    },
    tableflip: {
        flip: t('{#rand(Whoops! Let me get that for you ┬──┬ ¯\\\\_(ツ)|(ヘ･_･)ヘ┳━┳ What are you, an animal?|Can you not? ヘ(´° □°)ヘ┳━┳|Tables are not meant to be flipped ┬──┬ ノ( ゜-゜ノ)|(ﾉ´･ω･)ﾉ ﾐ ┸━┸ Wheee!|┻━┻ ︵ヽ(`Д´)ﾉ︵ ┻━┻ Get these tables out of my face!|┻━┻ミ＼(≧ﾛ≦＼) Hey, catch!|Flipping tables with elegance! (/¯◡ ‿ ◡)/¯ ~ ┻━┻)}'),
        unflip: t('{#rand(┬──┬ ¯\\\\_(ツ) A table unflipped is a table saved!|┣ﾍ(≧∇≦ﾍ)… (≧∇≦)/┳━┳ Unflip that table!|Yay! Cleaning up! ┣ﾍ(^▽^ﾍ)Ξ(ﾟ▽ﾟ*)ﾉ┳━┳|ヘ(´° □°)ヘ┳━┳ Was that so hard?|(ﾉ´･ω･)ﾉ ﾐ ┸━┸ Here comes the entropy!|I\'m sorry, did you just pick that up? ༼ﾉຈل͜ຈ༽ﾉ︵┻━┻|Get back on the ground! (╯ರ ~ ರ)╯︵ ┻━┻|No need to be so serious! (ﾉ≧∇≦)ﾉ ﾐ ┸━┸)}')
    },
    cleverbot: {
        unavailable: t('❌ It seems that my clever brain isn\'t working right now, try again later')
    },
    settings: {
        makelogs: {
            name: t('Make ChatLogs'),
            description: t('Whether to record chat logs or not.')
        },
        cahnsfw: {
            name: t('Is CAH NSFW'),
            description: t('Whether \'cah\' can only be done in nsfw channels or not.')
        },
        deletenotif: {
            name: t('Delete notifications'),
            description: t('If enabled, notifies you if a user deleted their command.')
        },
        modlog: {
            name: t('Modlog channel'),
            description: t('The id of the modlog channel. You can also use the <code>modlog</code> command')
        },
        mutedrole: {
            name: t('Muted role'),
            description: t('The id of the muted role.')
        },
        tableflip: {
            name: t('Tableflips'),
            description: t('Whether the bot should respond to tableflips/unflips.')
        },
        antimention: {
            name: t('Anti-mention'),
            description: t('The number of unique mentions required to warrant a ban (for anti-mention spam). Set to \'0\' to disable. Recommended: 25')
        },
        dmhelp: {
            name: t('DM help'),
            description: t('Whether or not to dm help messages or output them in channels')
        },
        staffperms: {
            name: t('Staff permissions'),
            description: t('The numeric value of permissions that designate a staff member. If a user has any of the permissions and permoverride is enabled, allows them to execute any command regardless of role. See <a href=https://discordapi.com/permissions.html>here</a> for a permission calculator.')
        },
        timeoutoverride: {
            name: t('Timeout override'),
            description: t('Same as staffperms, but allows users to use the timeout command regardless of permissions')
        },
        kickoverride: {
            name: t('Kick override'),
            description: t('Same as staffperms, but allows users to use the kick command regardless of permissions')
        },
        banoverride: {
            name: t('Ban override'),
            description: t('Same as staffperms, but allows users to use the ban/hackban/unban commands regardless of permissions')
        },
        banat: {
            name: t('Ban at'),
            description: t('The number of warnings before a ban. Set to 0 or below to disable.')
        },
        kickat: {
            name: t('Kick at'),
            description: t('The number of warnings before a kick. Set to 0 or below to disable.')
        },
        timeoutat: {
            name: t('Time Out at'),
            description: t('The number of warnings before a timeout. Set to 0 or below to disable.')
        },
        actonlimitsonly: {
            name: t('Act on Limits Only'),
            description: t('Whether to kick/ban on a warning count that is in between the kickat and banat values.')
        },
        adminrole: {
            name: t('Admin role'),
            description: t('The Admin role.')
        },
        nocleverbot: {
            name: t('No cleverbot'),
            description: t('Disables cleverbot functionality')
        },
        disableeveryone: {
            name: t('Disable everyone pings'),
            description: t('Disables everyone pings in custom commands.')
        },
        disablenoperms: {
            name: t('Disable no perms'),
            description: t('Disables the \'You need the role to use this command\' message.')
        },
        social: {
            name: t('Social commands'),
            description: t('Enables social commands.')
        },
        farewellchan: {
            name: t('Farewell channel'),
            description: t('Sets the channel for the farewell message to be sent in')
        },
        greetchan: {
            name: t('Greeting channel'),
            description: t('Sets the channel for the greeting message to be sent in')
        },
        language: {
            name: t('Blargbot language'),
            description: t('Sets the language blargbot should respond in')
        }
    },
    contributors: {
        notFound: t<{ userId: string; }>()('A user I cant find! (ID: {userId})')
    },
    commands: {
        $errors: {
            generic: t<{ token: string; }>()('❌ Something went wrong while handling your command!\nError id: `{token}`'),
            alreadyRunning: t('❌ Sorry, this command is already running! Please wait and try again.'),
            guildOnly: t<{ prefix: string; commandName: string; }>()('❌ `{prefix}{commandName}` can only be used on guilds.'),
            privateOnly: t<{ prefix: string; commandName: string; }>()('❌ `{prefix}{commandName}` can only be used in private messages.'),
            rateLimited: {
                local: t<{ duration: Duration; }>()('❌ Sorry, you ran this command too recently! Please try again in {duration#duration(S)} seconds.'),
                global: t<{ duration: Duration; penalty: Duration; }>()('❌ Sorry, you\'ve been running too many commands. To prevent abuse, I\'m going to have to time you out for `{duration#duration(S)}s`.\n\nContinuing to spam commands will lengthen your timeout by `{penalty#duration(S)}s`!')
            },
            missingPermission: {
                generic: t('❌ Oops, I don\'t seem to have permission to do that!'),
                guild: t<{ channel: Eris.GuildChannel; commandText: string; prefix: string; }>()('❌ Hi! You asked me to do something, but I didn\'t have permission to do it! Please make sure I have permissions to do what you asked.\nGuild: {channel.guild.name}\nChannel: {channel#tag}\nCommand: {commandText}\n\nIf you wish to stop seeing these messages, do the command `{prefix}dmerrors`.')
            },
            arguments: {
                invalid: t<{ value: string; types: Iterable<string>; }>()('❌ Invalid arguments! `{value}` isn\'t {types#map(`{}`)#join(, | or )}'),
                missing: t<{ missing: Iterable<string>; }>()('❌ Not enough arguments! You need to provide {missing#map(`{}`)#join(, | or )}'),
                unknown: t('❌ I couldn\'t understand those arguments!'),
                noneNeeded: t<{ command: Command; }>()('❌ Too many arguments! `{command.name}` doesn\'t need any arguments'),
                tooMany: t<{ max: number; given: number; }>()('❌ Too many arguments! Expected at most {max} {max#plural(1:argument|arguments)}, but you gave {given}')
            },
            renderFailed: t('❌ Something went wrong while trying to render that!'),
            messageDeleted: t<{ user: UserTag; }>()('**{user.username}#{user.discriminator}** deleted their command message.'),
            blacklisted: t<{ reason: string; }>()('❌ You have been blacklisted from the bot for the following reason: {reason}'),
            roleMissing: t<{ roleIds: Iterable<string>; }>()('❌ You need the role {roleIds#map(<@&{}>)#join(, | or )} in order to use this command!'),
            permMissing: t<{ permissions: Iterable<IFormattable<string>>; }>()('❌ You need {permissions#plural(1:the following permission|any of the following permissions)} to use this command:\n{permissions#join(\n)}')
        },
        categories: {
            custom: {
                name: t('Custom'),
                description: t('Custom commands.')
            },
            general: {
                name: t('General'),
                description: t('General commands.')
            },
            nsfw: {
                name: t('NSFW'),
                description: t('Commands that can only be executed in NSFW channels.')
            },
            image: {
                name: t('Image'),
                description: t('Commands that generate or display images.')
            },
            admin: {
                name: t('Admin'),
                description: t('Powerful commands that require an `admin` role or special permissions.')
            },
            social: {
                name: t('Social'),
                description: t('Social commands for interacting with other people.')
            },
            owner: {
                name: t('Blargbot Owner'),
                description: t('MREOW MEOWWWOW! **purr**')
            },
            developer: {
                name: t('Blargbot Developer'),
                description: t('Commands that can only be executed by blargbot developers.')
            },
            staff: {
                name: t('Blargbot Staff'),
                description: t('Commands that can only be executed by staff on the official support server.')
            },
            support: {
                name: t('Blargbot Support'),
                description: t('Commands that can only be executed by support members on the official support server.')
            }
        },
        i18n: {
            exports: {
                description: t('Generates a JSON file containing all the keys blargbot currently uses for translation')
            }
        },
        announce: {
            default: {
                description: t('Resets the current configuration for announcements'),
                embed: {
                    author: {
                        name: t('Announcement')
                    }
                },
                failed: t('❌ I wasn\'t able to send that message for some reason!'),
                success: t('✅ I\'ve sent the announcement!')
            },
            reset: {
                description: t('Resets the current configuration for announcements'),
                success: t<{ prefix: string; }>()('✅ Announcement configuration reset! Do `{prefix}announce configure` to reconfigure it.')
            },
            configure: {
                description: t('Resets the current configuration for announcements'),
                state: {
                    ChannelInvalid: t('❌ The announcement channel must be a text channel!'),
                    ChannelNotFound: t('❌ No channel is set up for announcements'),
                    ChannelNotInGuild: t('❌ The announcement channel must be on this server!'),
                    NotAllowed: t('❌ You cannot send announcements'),
                    RoleNotFound: t('❌ No role is set up for announcements'),
                    TimedOut: t('❌ You must configure a role and channel to use announcements!'),
                    Success: t('✅ Your announcements have been configured!')
                }
            },
            info: {
                description: t('Displays the current configuration for announcements on this server'),
                unconfigured: t<{ prefix: string; }>()('ℹ️ Announcements are not yet configured for this server. Please use `{prefix}announce configure` to set them up'),
                details: t<{ channel?: Eris.Channel; role?: Eris.Role; }>()('ℹ️ Announcements will be sent in {channel#tag=`<unconfigured>`} and will mention {role#tag=`<unconfigured>`}')
            }
        },
        autoResponse: {
            notWhitelisted: t('❌ Sorry, autoresponses are currently whitelisted. To request access, do `b!ar whitelist [reason]`'),
            notFoundId: t<{ id: string; }>()('❌ There isn\'t an autoresponse with id `{id}` here!'),
            notFoundEverything: t('❌ There isn\'t an everything autoresponse here!'),
            flags: {
                regex: t('If specified, parse as /regex/ rather than plaintext. Unsafe and very long (more than 2000 characters) regexes will not parse successfully.'),
                everything: t('Makes the added autoresponse respond to everything. Only one is allowed.')
            },
            whitelist: {
                description: t('Requests for the current server to have autoresponses whitelisted'),
                alreadyApproved: t('❌ This server is already whitelisted!'),
                requested: t('✅ Your request has been sent. Please don\'t spam this command.\n\nYou will hear back in this channel if you were accepted or rejected.')
            },
            list: {
                description: t('Displays information about autoresponses'),
                noAutoresponses: t('❌ There are no autoresponses configured for this server!'),
                embed: {
                    title: t('Autoresponses'),
                    field: {
                        name: t<{ id: string; }>()('Autoresponse `{id}`'),
                        value: {
                            regex: t<{ trigger: string; }>()('**Trigger regex:**\n`{trigger}`'),
                            text: t<{ trigger: string; }>()('**Trigger text:**\n`{trigger}`'),
                            any: t('**Trigger:**\neverything')
                        }
                    }
                }
            },
            info: {
                description: t('Displays information about an autoresponse'),
                embed: {
                    title: {
                        id: t<{ id: string; }>()('Autoresponse #{id}'),
                        everything: t('Everything Autoresponse')
                    },
                    field: {
                        trigger: {
                            name: {
                                regex: t('Trigger regex'),
                                text: t('Trigger text')
                            }
                        },
                        author: {
                            name: t('Author'),
                            value: t<{ authorId: string; }>()('<@{authorId}> ({authorId})')
                        },
                        authorizer: {
                            name: t('Authorizer'),
                            value: t<{ authorizerId: string; }>()('<@{authorizerId}> ({authorizerId})')
                        }
                    }
                }
            },
            create: {
                description: t('Adds a autoresponse which matches the given pattern'),
                everythingAlreadyExists: t('❌ An autoresponse that responds to everything already exists!'),
                everythingCannotHavePattern: t('❌ Autoresponses that respond to everything cannot have a pattern'),
                tooMany: t<{ max: number; }>()('❌ You already have {max} autoresponses!'),
                missingEFlag: t('❌ If you want to respond to everything, you need to use the `-e` flag.'),
                success: t<{ prefix: string; id: 'everything' | number; }>()('✅ Your autoresponse has been added! Use `{prefix}autoresponse set {id} <bbtag>` to change the code that it runs')
            },
            delete: {
                description: t('Deletes an autoresponse. Ids can be seen when using the `list` subcommand'),
                success: {
                    regex: t<{ id: number; term: string; }>()('✅ Autoresponse {id} (Regex: `{term}`) has been deleted'),
                    text: t<{ id: number; term: string; }>()('✅ Autoresponse {id} (Pattern: `{term}`) has been deleted'),
                    everything: t('✅ The everything autoresponse has been deleted!')
                }
            },
            setPattern: {
                description: t('Sets the pattern of an autoresponse'),
                notEmpty: t('❌ The pattern cannot be empty'),
                notEverything: t('❌ Cannot set the pattern for the everything autoresponse'),
                success: {
                    regex: t<{ id: number; term: string; }>()('✅ The pattern for autoresponse {id} has been set to (regex) `{term}`!'),
                    text: t<{ id: number; term: string; }>()('✅ The pattern for autoresponse {id} has been set to `{term}`!')
                }
            },
            set: {
                description: t('Sets the bbtag code to run when the autoresponse is triggered'),
                success: {
                    id: t<{ id: number; }>()('✅ Updated the code for autoresponse {id}'),
                    everything: t('✅ Updated the code for the everything autoresponse')
                }
            },
            raw: {
                description: t('Gets the bbtag that is executed when the autoresponse is triggered'),
                inline: {
                    id: t<{ id: number; content: string; }>()('✅ The raw code for autoresponse {id} is: ```\n{content}\n```'),
                    everything: t<{ content: string; }>()('✅ The raw code for the everything autoresponse is: ```\n{content}\n```')
                },
                attached: {
                    id: t<{ id: number; }>()('✅ The raw code for autoresponse {id} is attached'),
                    everything: t('✅ The raw code for the everything autoresponse is attached')
                }
            },
            setAuthorizer: {
                description: t('Sets the autoresponse to use your permissions for the bbtag when it is triggered'),
                success: {
                    id: t<{ id: number; }>()('✅ You are now the authorizer for autoresponse {id}'),
                    everything: t('✅ You are now the authorizer for the everything autoresponse')
                }
            },
            debug: {
                description: t('Sets the autoresponse to send you the debug output when it is next triggered by one of your messages'),
                success: {
                    id: t<{ id: number; }>()('✅ The next message that you send that triggers autoresponse {id} will send the debug output here'),
                    everything: t('✅ The next message that you send that triggers the everything autoresponse will send the debug output here')
                }
            }
        },
        ban: {
            flags: {
                reason: t('The reason for the (un)ban.'),
                time: t('If provided, the user will be unbanned after the period of time. (softban)')
            },
            default: {
                description: t('Bans a user, where `days` is the number of days to delete messages for.\nIf mod-logging is enabled, the ban will be logged.'),
                state: {
                    alreadyBanned: t<{ user: Eris.User; }>()('❌ **{user#tag}** is already banned!'),
                    memberTooHigh: t<{ user: Eris.User; }>()('❌ I don\'t have permission to ban **{user#tag}**! Their highest role is above my highest role.'),
                    moderatorTooLow: t<{ user: Eris.User; }>()('❌ You don\'t have permission to ban **{user#tag}**! Their highest role is above your highest role.'),
                    noPerms: t<{ user: Eris.User; }>()('❌ I don\'t have permission to ban **{user#tag}**! Make sure I have the `ban members` permission and try again.'),
                    moderatorNoPerms: t<{ user: Eris.User; }>()('❌ You don\'t have permission to ban **{user#tag}**! Make sure you have the `ban members` permission or one of the permissions specified in the `ban override` setting and try again.'),
                    success: t<{ user: Eris.User; }>()('✅ **{user#tag}** has been banned.')
                },
                unbanSchedule: {
                    success: t<{ user: Eris.User; unban: Duration; }>()('✅ **{user#tag}** has been banned and will be unbanned **{unban#tag}**'),
                    invalid: t<{ user: Eris.User; }>()('⚠️ **{user#tag}** has been banned, but the duration was either 0 seconds or improperly formatted so they won\'t automatically be unbanned.')
                }
            },
            clear: {
                description: t('Unbans a user.\nIf mod-logging is enabled, the ban will be logged.'),
                userNotFound: t('❌ I couldn\'t find that user!'),
                state: {
                    notBanned: t<{ user: Eris.User; }>()('❌ **{user#tag}** is not currently banned!'),
                    noPerms: t<{ user: Eris.User; }>()('❌ I don\'t have permission to unban **{user#tag}**! Make sure I have the `ban members` permission and try again.'),
                    moderatorNoPerms: t<{ user: Eris.User; }>()('❌ You don\'t have permission to unban **{user#tag}**! Make sure you have the `ban members` permission or one of the permissions specified in the `ban override` setting and try again.'),
                    success: t<{ user: Eris.User; }>()('✅ **{user#tag}** has been unbanned.')
                }
            }
        },
        blacklist: {
            default: {
                description: t('Blacklists the current channel, or the channel that you mention. The bot will not respond until you do `blacklist` again.'),
                notInServer: t('❌ You cannot blacklist a channel outside of this server'),
                success: {
                    added: t<{ channel: Eris.Channel; }>()('✅ {channel#tag} is no longer blacklisted.'),
                    removed: t<{ channel: Eris.Channel; }>()('✅ {channel#tag} is now blacklisted')
                }
            }
        },
        bot: {
            reset: {
                description: t('Resets the bot to the state it is in when joining a guild for the first time.'),
                cancelled: t('❌ Reset cancelled'),
                success: t('✅ I have been reset back to my initial configuration'),
                confirm: {
                    prompt: t('⚠️ Are you sure you want to reset the bot to its initial state?\nThis will:\n- Reset all settings back to their defaults\n- Delete all custom commands, autoresponses, rolemes, censors, etc\n- Delete all tag guild variables'),
                    cancel: t('No'),
                    continue: t('Yes')
                }
            }
        },
        ccommand: {
            description: t<{ subtags: string; tos: string; }>()('Creates a custom command, using the BBTag language.\n\nCustom commands take precedent over all other commands. As such, you can use it to overwrite commands, or disable them entirely. If the command content is "null" (without the quotations), blargbot will have no output whatsoever, allowing you to disable any built-in command you wish. You cannot overwrite the \'ccommand\' command. For more in-depth command customization, see the `editcommand` command.\nFor more information about BBTag, visit <{subtags}>.\nBy creating a custom command, you acknowledge that you agree to the Terms of Service (<{tos}>)'),
            request: {
                name: t('Enter the name of the custom command:'),
                content: t('Enter the custom command\'s contents:')
            },
            errors: {
                isAlias: t<{ commandName: string; tagName: string; }>()('❌ The command `{commandName}` is an alias to the tag `{tagName}`'),
                alreadyExists: t<{ name: string; }>()('❌ The `{name}` custom command already exists!'),
                doesNotExist: t<{ name: string; }>()('❌ The `{name}` custom command doesn\'t exist!'),
                isHidden: t<{ name: string; }>()('❌ The `{name}` custom command is a hidden command!'),
                invalidBBTag: t<{ errors: Iterable<IFormattable<string>>; }>()('❌ There were errors with the bbtag you provided!\n{errors#join(\n)}'),
                bbtagError: t<AnalysisResult>()('❌ [{location.line},{location.column}]: {message}'),
                bbtagWarning: t<AnalysisResult>()('⚠️ [{location.line},{location.column}]: {message}'),
                nameReserved: t<{ name: string; }>()('❌ The command name `{name}` is reserved and cannot be overwritten'),
                tooLong: t<{ max: number; }>()('❌ Command names cannot be longer than {max} characters'),
                importDeleted: t<{ commandName: string; tagName: string; author?: UserTag; authorId: string; }>()('❌ When the command `{commandName}` was imported, the tag `{tagName}` was owned by **{author.username=UNKNOWN}#{author.discriminator=????}** ({authorId}) but it no longer exists. To continue using this command, please re-create the tag and re-import it.'),
                importChanged: t<{ commandName: string; tagName: string; oldAuthor?: UserTag; oldAuthorId: string; newAuthor?: UserTag; newAuthorId: string; }>()('❌ When the command `{commandName}` was imported, the tag `{tagName}` was owned by **{oldAuthor.username=UNKNOWN}#{oldAuthor.discriminator=????}** ({oldAuthorId}) but it is now owned by **{newAuthor.username=UNKNOWN}#{newAuthor.discriminator=????}** ({newAuthorId}). If this is acceptable, please re-import the tag to continue using this command.')
            },
            test: {
                default: {
                    description: t('Uses the BBTag engine to execute the content as if it was a custom command')
                },
                debug: {
                    description: t('Uses the BBTag engine to execute the content as if it was a custom command and will return the debug output')
                }
            },
            docs: {
                description: t('Returns helpful information about the specified topic.')
            },
            debug: {
                description: t('Runs a custom command with some arguments. A debug file will be sent in a DM after the command has finished.'),
                notOwner: t('❌ You cannot debug someone else\'s custom command.'),
                success: t('ℹ️ Ive sent the debug output in a DM')
            },
            create: {
                description: t('Creates a new custom command with the content you give'),
                success: t<{ name: string; errors: Iterable<IFormattable<string>>; }>()('✅ Custom command `{name}` created.\n{errors#join(\n)}')
            },
            edit: {
                description: t('Edits an existing custom command to have the content you specify'),
                success: t<{ name: string; errors: Iterable<IFormattable<string>>; }>()('✅ Custom command `{name}` edited.\n{errors#join(\n)}')
            },
            set: {
                description: t('Sets the custom command to have the content you specify. If the custom command doesn\'t exist it will be created.'),
                success: t<{ name: string; errors: Iterable<IFormattable<string>>; }>()('✅ Custom command `{name}` set.\n{errors#join(\n)}')
            },
            delete: {
                description: t('Deletes an existing custom command'),
                success: t<{ name: string; }>()('✅ The `{name}` custom command is gone forever!')
            },
            rename: {
                description: t('Renames the custom command'),
                enterOldName: t('Enter the name of the custom command to rename:'),
                enterNewName: t('Enter the new name of the custom command:'),
                success: t<{ oldName: string; newName: string; }>()('✅ The `{oldName}` custom command has been renamed to `{newName}`.')
            },
            raw: {
                description: t('Gets the raw content of the custom command'),
                inline: t<{ name: string; content: string; }>()('ℹ️ The raw code for {name} is: ```\n{content}\n```'),
                attached: t<{ name: string; }>()('ℹ️ The raw code for {name} is attached')
            },
            list: {
                description: t('Lists all custom commands on this server'),
                embed: {
                    title: t('List of custom commands'),
                    field: {
                        anyRole: {
                            name: t('Any role')
                        }
                    }
                }
            },
            cooldown: {
                description: t('Sets the cooldown of a custom command, in milliseconds'),
                mustBePositive: t('❌ The cooldown must be greater than 0ms'),
                success: t<{ name: string; cooldown: Duration; }>()('✅ The custom command `{name}` now has a cooldown of `{cooldown#duration(MS)}ms`.')
            },
            author: {
                description: t('Displays the name of the custom command\'s author'),
                noAuthorizer: t<{ name: string; author?: UserTag; }>()('✅ The custom command `{name}` was made by **{author.username=UNKNOWN}#{author.discriminator=????}**'),
                withAuthorizer: t<{ name: string; author?: UserTag; authorizer?: UserTag; }>()('✅ The custom command `{name}` was made by **{author.username=UNKNOWN}#{author.discriminator=????}** and is authorized by **{authorizer.username=UNKNOWN}#{authorizer.discriminator=????}**')
            },
            flag: {
                updated: t<{ name: string; }>()('✅ The flags for `{name}` have been updated.'),
                get: {
                    description: t('Lists the flags the custom command accepts'),
                    none: t<{ name: string; }>()('❌ The `{name}` custom command has no flags.'),
                    success: t<{ name: string; flags: Iterable<FlagDefinition<string>>; }>()('✅ The `{name}` custom command has the following flags:\n\n{flags#map(`-{flag}`/`--{word}`: {description})#join(\n)}')
                },
                create: {
                    description: t('Adds multiple flags to your custom command. Flags should be of the form `-<f> <flag> [flag description]`\ne.g. `b!cc flags add myCommand -c category The category you want to use -n name Your name`'),
                    wordMissing: t<{ flag: string; }>()('❌ No word was specified for the `{flag}` flag'),
                    flagExists: t<{ flag: string; }>()('❌ The flag `{flag}` already exists!'),
                    wordExists: t<{ word: string; }>()('❌ A flag with the word `{word}` already exists!')
                },
                delete: {
                    description: t('Removes multiple flags from your custom command. Flags should be of the form `-<f>`\ne.g. `b!cc flags remove myCommand -c -n`')
                }
            },
            setHelp: {
                description: t('Sets the help text to show for the command'),
                success: t<{ name: string; }>()('✅ Help text for custom command `{name}` set.')
            },
            hide: {
                description: t('Toggles whether the command is hidden from the command list or not'),
                success: t<{ name: string; hidden: boolean; }>()('✅ Custom command `{name}` is now {hidden#bool(hidden|visible)}.')
            },
            setRole: {
                description: t('Sets the roles that are allowed to use the command'),
                success: t<{ name: string; roles: Iterable<Eris.Role>; }>()('✅ Roles for custom command `{name}` set to {roles#map({#tag})#join(, | and )}.')
            },
            shrinkwrap: {
                description: t('Bundles up the given commands into a single file that you can download and install into another server'),
                confirm: {
                    prompt: t<{ steps: Iterable<IFormattable<string>>; }>()('Salutations! You have discovered the super handy ShrinkWrapper9000!\n\nIf you decide to proceed, this will:\n{steps#join(\n)}\nThis will not:\n - Export variables\n - Export authors or authorizers\n - Export dependencies'),
                    export: t<{ name: string; }>()(' - Export the custom command `{name}`'),
                    continue: t('Confirm'),
                    cancel: t('Cancel')
                },
                cancelled: t('✅ Maybe next time then.'),
                success: t('✅ No problem, my job here is done.')
            },
            install: {
                description: t('Bundles up the given commands into a single file that you can download and install into another server'),
                fileMissing: t('❌ You have to upload the installation file, or give me a URL to one.'),
                malformed: t('❌ Your installation file was malformed.'),
                confirm: {
                    unsigned: t('⚠️ **Warning**: This installation file is **unsigned**. It did not come from me. Please double check to make sure you want to go through with this.'),
                    tampered: t('⚠️ **Warning**: This installation file\'s signature is **incorrect**. There is a 100% chance that it has been tampered with. Please double check to make sure you want to go through with this.'),
                    prompt: t<{ warning?: IFormattable<string>; steps: Iterable<IFormattable<string>>; }>()('{warning#bool({}\n\n|)}Salutations! You have discovered the super handy CommandInstaller9000!\n\nIf you decide to proceed, this will:\n{steps#join(\n)}\nThis will also:\n - Set you as the author for all imported commands'),
                    import: t<{ name: string; }>()('✅ Import the command `{name}`'),
                    skip: t<{ name: string; }>()('❌ Ignore the command `{name}` as a command with that name already exists'),
                    continue: t('Confirm'),
                    cancel: t('Cancel')
                },
                cancelled: t('✅ Maybe next time then.'),
                success: t('✅ No problem, my job here is done.')
            },
            import: {
                description: t('Imports a tag as a ccommand, retaining all data such as author variables'),
                tagMissing: t<{ name: string; }>()('❌ The `{name}` tag doesn\'t exist!'),
                success: t<{ tagName: string; commandName: string; author?: UserTag; authorizer?: UserTag; }>()('✅ The tag `{tagName}` by **{author.username=UNKNOWN}#{author.discriminator=????}** has been imported as `{commandName}` and is authorized by **{authorizer.username=UNKNOWN}#{authorizer.discriminator=????}**')
            }
        },
        censor: {
            flags: {
                regex: t('If specified, parse as /regex/ rather than plaintext. Unsafe and very long (more than 2000 characters) regexes will not parse successfully.'),
                decancer: t('If specified, perform the censor check against the decancered version of the message.'),
                weight: t('How many incidents the censor is worth.'),
                reason: t('A custom modlog reason. NOT BBTag compatible.')
            },
            errors: {
                doesNotExist: t<{ id: number; }>()('❌ Censor `{id}` doesn\'t exist'),
                weightNotNumber: t<{ value: string; }>()('❌ The censor weight must be a number but `{value}` is not'),
                invalidType: t<{ type: string; }>()('❌ `{type}` is not a valid type'),
                messageNotSet: {
                    default: t<{ type: string; }>()('❌ A custom default {type} message has not been set yet'),
                    id: t<{ type: string; id: number; }>()('❌ A custom {type} message for censor {id} has not been set yet')
                }
            },
            add: {
                description: t('Creates a censor using the given phrase'),
                success: t<{ id: number; }>()('✅ Censor `{id}` has been created')
            },
            edit: {
                description: t('Updates a censor'),
                success: t<{ id: number; }>()('✅ Censor `{id}` has been updated')
            },
            delete: {
                description: t('Deletes a censor'),
                success: t<{ id: number; }>()('✅ Censor `{id}` has been deleted')
            },
            exception: {
                user: {
                    description: t('Adds or removes a user from the list of users which all censors ignore'),
                    success: t<{ user: Eris.User; }>()('✅ {user#tag} is now exempt from all censors')
                },
                role: {
                    description: t('Adds or removes a role from the list of roles which all censors ignore'),
                    success: t<{ role: Eris.Role; }>()('✅ Anyone with the role {role#tag} is now exempt from all censors')
                },
                channel: {
                    description: t('Adds or removes a channel from the list of channels which all censors ignore'),
                    notOnServer: t('❌ The channel must be on this server!'),
                    success: t<{ channel: Eris.Channel; }>()('✅ Messages sent in {channel#tag} are now exempt from all censors')
                }
            },
            setMessage: {
                description: t('Sets the message so show when the given censor causes a user to be granted a `timeout`, or to be `kick`ed or `ban`ned, or the message is `delete`d\nIf `id` is not provided, the message will be the default message that gets shown if one isn\'t set for the censor that is triggered'),
                success: {
                    default: t<{ type: string; }>()('✅ The default {type} message has been set'),
                    id: t<{ type: string; id: number; }>()('✅ The {type} message for censor {id} has been set')
                }
            },
            setAuthorizer: {
                description: t('Sets the custom censor message to use your permissions when executing.'),
                success: {
                    default: t<{ type: string; }>()('✅ The default {type} message authorizer has been set'),
                    id: t<{ type: string; id: number; }>()('✅ The {type} message authorizer for censor {id} has been set')
                }
            },
            rawMessage: {
                description: t('Gets the raw code for the given censor'),
                inline: {
                    default: t<{ type: string; content: string; }>()('ℹ️ The raw code for the default {type} message is: ```\n{content}\n```'),
                    id: t<{ type: string; id: number; content: string; }>()('ℹ️ The raw code for the {type} message for censor `{id}` is: ```\n{content}\n```')
                },
                attached: {
                    default: t<{ type: string; }>()('ℹ️ The raw code for the default {type} message is attached'),
                    id: t<{ type: string; id: number; }>()('ℹ️ The raw code for the {type} message for censor `{id}` is attached')
                }
            },
            debug: {
                description: t('Sets the censor to send you the debug output when it is next triggered by one of your messages. Make sure you aren\'t exempt from censors!'),
                success: t<{ id: number; }>()('✅ The next message that you send that triggers censor `{id}` will send the debug output here')
            },
            list: {
                description: t('Lists all the details about the censors that are currently set up on this server'),
                embed: {
                    title: t('ℹ️ Censors'),
                    description: {
                        value: t<{ censors: Iterable<IFormattable<string>>; }>()('{censors#join(\n)}'),
                        censor: {
                            regex: t<{ id: number; term: string; }>()('**Censor** `{id}` (Regex): {term}'),
                            text: t<{ id: number; term: string; }>()('**Censor** `{id}`: {term}')
                        },
                        none: t('No censors configured')
                    },
                    field: {
                        users: {
                            name: t('Excluded users'),
                            value: t<{ users: Iterable<string>; }>()('{users#plural(0:None|{#map(<@{}>)#join( )})}')
                        },
                        roles: {
                            name: t('Excluded roles'),
                            value: t<{ roles: Iterable<string>; }>()('{roles#plural(0:None|{#map(<@&{}>)#join( )})}')
                        },
                        channels: {
                            name: t('Excluded channels'),
                            value: t<{ channels: Iterable<string>; }>()('{channels#plural(0:None|{#map(<#{}>)#join( )})}')
                        }
                    }
                }
            },
            info: {
                description: t('Gets detailed information about the given censor'),
                messageFieldValue: {
                    notSet: t('Not set'),
                    set: t<{ authorId: string; authorizerId: string; }>()('Author: <@{authorId}>\nAuthorizer: <@{authorizerId}>')
                },
                embed: {
                    title: t<{ id: number; }>()('ℹ️ Censor `{id}`'),
                    field: {
                        trigger: {
                            name: {
                                regex: t('Trigger (Regex)'),
                                text: t('Trigger')
                            }
                        },
                        weight: {
                            name: t('Weight'),
                            value: t<{ weight: number; }>()('{weight}')
                        },
                        reason: {
                            name: t('Reason'),
                            value: t<{ reason?: string; }>()('{reason=Not set}')
                        },
                        deleteMessage: {
                            name: t('Delete message')
                        },
                        timeoutMessage: {
                            name: t('Timeout message')
                        },
                        kickMessage: {
                            name: t('Kick message')
                        },
                        banMessage: {
                            name: t('Ban message')
                        }
                    }
                }
            }
        },
        changeLog: {
            errors: {
                missingPermissions: t('❌ I need the manage webhooks permission to subscribe this channel to changelogs!')
            },
            subscribe: {
                description: t('Subscribes this channel to my changelog updates. I require the `manage webhooks` permission for this.'),
                alreadySubscribed: t('ℹ️ This channel is already subscribed to my changelog updates!'),
                success: t('✅ This channel will now get my changelog updates!')
            },
            unsubscribe: {
                description: t('Unsubscribes this channel from my changelog updates. I require the `manage webhooks` permission for this.'),
                notSubscribed: t('ℹ️ This channel is not subscribed to my changelog updates!'),
                success: t('✅ This channel will no longer get my changelog updates!')
            }
        },
        editCommand: {
            list: {
                description: t('Shows a list of modified commands'),
                none: t('ℹ️ You haven\'t modified any commands'),
                embed: {
                    title: t('ℹ️ Edited commands'),
                    description: {
                        name: t<{ name: string; }>()('**{name}**\n'),
                        roles: t<{ roles: Iterable<Eris.Role>; }>()('- Roles: {roles#map({#tag})#join(, )}\n'),
                        permissions: t<{ permission: string; }>()('- Permission: {permission}\n'),
                        disabled: t('- Disabled\n'),
                        hidden: t('- Hidden\n'),
                        template: t<{ commands: Iterable<{ name: IFormattable<string>; roles?: IFormattable<string>; permissions?: IFormattable<string>; disabled?: IFormattable<string>; hidden?: IFormattable<string>; }>; }>()('{commands#map({name}{roles}{permissions}{disabled}{hidden})#join(\n)}')
                    }
                }
            },
            setRole: {
                description: t('Sets the role required to run the listed commands'),
                removed: t<{ commands: Iterable<string>; }>()('✅ Removed the role requirement for the following commands:```fix\n{commands#join(, )}\n```'),
                set: t<{ commands: Iterable<string>; }>()('✅ Set the role requirement for the following commands:```fix\n{commands#join(, )}\n```')
            },
            setPermissions: {
                description: t('Sets the permissions required to run the listed commands. If a user has any of the permissions, they will be able to use the command.'),
                removed: t<{ commands: Iterable<string>; }>()('✅ Removed the permissions for the following commands:```fix\n{commands#join(, )}\n```'),
                set: t<{ commands: Iterable<string>; }>()('✅ Set the permissions for the following commands:```fix\n{commands#join(, )}\n```')
            },
            disable: {
                description: t('Disables the listed commands, so no one but the owner can use them'),
                success: t<{ commands: Iterable<string>; }>()('✅ Disabled the following commands:```fix\n{commands#join(, )}\n```')
            },
            enable: {
                description: t('Enables the listed commands, allowing anyone with the correct permissions or roles to use them'),
                success: t<{ commands: Iterable<string>; }>()('✅ Enabled the following commands:```fix\n{commands#join(, )}\n```')
            },
            hide: {
                description: t('Hides the listed commands. They can still be executed, but wont show up in help'),
                success: t<{ commands: Iterable<string>; }>()('✅ The following commands are now hidden:```fix\n{commands#join(, )}\n```')
            },
            show: {
                description: t('Reveals the listed commands in help'),
                success: t<{ commands: Iterable<string>; }>()('✅ The following commands are no longer hidden:```fix\n{commands#join(, )}\n```')
            }
        },
        farewell: {
            errors: {
                notSet: t('❌ No farewell message has been set yet!')
            },
            set: {
                description: t('Sets the bbtag to send when someone leaves the server'),
                success: t('✅ The farewell message has been set')
            },
            raw: {
                description: t('Gets the current message that will be sent when someone leaves the server'),
                inline: t<{ content: string; }>()('ℹ️ The raw code for the farewell message is: ```\n{content}\n```'),
                attached: t('ℹ️ The raw code for the farewell message is attached')
            },
            setAuthorizer: {
                description: t('Sets the farewell message to use your permissions when running'),
                success: t('✅ The farewell message will now run using your permissions')
            },
            setChannel: {
                description: t('Sets the channel the farewell message will be sent in.'),
                notOnGuild: t('❌ The farewell channel must be on this server!'),
                notTextChannel: t('❌ The farewell channel must be a text channel!'),
                success: t<{ channel: Eris.Channel; }>()('✅ Farewell messages will now be sent in {channel#tag}')
            },
            debug: {
                description: t('Executes the farewell message as if you left the server and provides the debug output.'),
                channelMissing: t('❌ I wasn\'t able to locate a channel to sent the message in!'),
                success: t('ℹ️ Ive sent the debug output in a DM')
            },
            delete: {
                description: t('Deletes the current farewell message.'),
                success: t('✅ Farewell messages will no longer be sent')
            },
            info: {
                description: t('Shows information about the current farewell message'),
                success: t<{ authorId: string; authorizerId: string; }>()('ℹ️ The current farewell was last edited by <@{authorId}> ({authorId}) and is authorized by <@{authorizerId}> ({authorizerId})')
            }
        },
        greeting: {
            errors: {
                notSet: t('❌ No greeting message has been set yet!')
            },
            set: {
                description: t('Sets the message to send when someone joins the server'),
                success: t('✅ The greeting message has been set')
            },
            raw: {
                description: t('Gets the current message that will be sent when someone joins the server'),
                inline: t<{ content: string; }>()('ℹ️ The raw code for the greeting message is: \n{content}\n```'),
                attached: t('ℹ️ The raw code for the greeting message is attached')
            },
            setAuthorizer: {
                description: t('Sets the greeting message to use your permissions when running'),
                success: t('✅ The greeting message will now run using your permissions')
            },
            setChannel: {
                description: t('Sets the channel the greeting message will be sent in.'),
                notOnGuild: t('❌ The greeting channel must be on this server!'),
                notTextChannel: t('❌ The greeting channel must be a text channel!'),
                success: t<{ channel: Eris.Channel; }>()('✅ Greeting messages will now be sent in {channel#tag}')
            },
            debug: {
                description: t('Executes the greeting message as if you left the server and provides the debug output.'),
                channelMissing: t('❌ I wasn\'t able to locate a channel to sent the message in!'),
                success: t('ℹ️ Ive sent the debug output in a DM')
            },
            delete: {
                description: t('Deletes the current greeting message.'),
                success: t('✅ Greeting messages will no longer be sent')
            },
            info: {
                description: t('Shows information about the current greeting message'),
                success: t<{ authorId: string; authorizerId: string; }>()('ℹ️ The current greeting was last edited by <@{authorId}> ({authorId}) and is authorized by <@{authorizerId}> ({authorizerId})')
            }
        },
        interval: {
            errors: {
                notSet: t('❌ No interval has been set yet!')
            },
            set: {
                description: t('Sets the bbtag to run every 15 minutes'),
                success: t('✅ The interval has been set')
            },
            raw: {
                description: t('Gets the current code that the interval is running'),
                inline: t<{ content: string; }>()('ℹ️ The raw code for the interval is: ```\n{content}\n```'),
                attached: t('ℹ️ The raw code for the interval is attached')
            },
            delete: {
                description: t('Deletes the current interval'),
                success: t('✅ The interval has been deleted')
            },
            setAuthorizer: {
                description: t('Sets the interval to run using your permissions'),
                success: t('✅ Your permissions will now be used when the interval runs')
            },
            debug: {
                description: t('Runs the interval now and sends the debug output'),
                failed: t('❌ There was an error while running the interval!'),
                authorizerMissing: t('❌ I couldn\'t find the user who authorizes the interval!'),
                channelMissing: t('❌ I wasn\'t able to figure out which channel to run the interval in!'),
                timedOut: t<{ max: Duration; }>()('❌ The interval took longer than the max allowed time ({max#duration(S)}s)'),
                success: t('ℹ️ Ive sent the debug output in a DM')
            },
            info: {
                description: t('Shows information about the current interval'),
                success: t<{ authorId: string; authorizerId: string; }>()('ℹ️ The current interval was last edited by <@{authorId}> ({authorId}) and is authorized by <@{authorizerId}> ({authorizerId})')
            }
        },
        kick: {
            flags: {
                reason: t('The reason for the kick.')
            },
            default: {
                description: t('Kicks a user.\nIf mod-logging is enabled, the kick will be logged.'),
                state: {
                    memberTooHigh: t<{ user: Eris.User; }>()('❌ I don\'t have permission to kick **{user#tag}**! Their highest role is above my highest role.'),
                    moderatorTooLow: t<{ user: Eris.User; }>()('❌ You don\'t have permission to kick **{user#tag}**! Their highest role is above your highest role.'),
                    noPerms: t<{ user: Eris.User; }>()('❌ I don\'t have permission to kick **{user#tag}**! Make sure I have the `kick members` permission and try again.'),
                    moderatorNoPerms: t<{ user: Eris.User; }>()('❌ You don\'t have permission to kick **{user#tag}**! Make sure you have the `kick members` permission or one of the permissions specified in the `kick override` setting and try again.'),
                    success: t<{ user: Eris.User; }>()('✅ **{user#tag}** has been kicked.')
                }
            }
        },
        log: {
            common: {
                events: {
                    avatarupdate: t('Triggered when someone changes their username'),
                    kick: t('Triggered when a member is kicked'),
                    memberban: t('Triggered when a member is banned'),
                    memberjoin: t('Triggered when someone joins'),
                    memberleave: t('Triggered when someone leaves'),
                    membertimeout: t('Triggered when someone is timed out'),
                    membertimeoutclear: t('Triggered when someone\'s timeout is removed'),
                    memberunban: t('Triggered when someone is unbanned'),
                    messagedelete: t('Triggered when someone deletes a message they sent'),
                    messageupdate: t('Triggered when someone updates a message they sent'),
                    nameupdate: t('Triggered when someone changes their username or discriminator'),
                    nickupdate: t('Triggered when someone changes their nickname')
                }
            },
            list: {
                description: t('Lists all the events currently being logged'),
                embed: {
                    field: {
                        ignore: {
                            name: t('Ignored users'),
                            value: t<{ userIds: Iterable<string>; }>()('{userIds#plural(0:No ignored users|{#map(<@{}> ({}))#join(\n)})}')
                        },
                        current: {
                            name: t('Currently logged events'),
                            value: {
                                event: t<{ event: string; channelId: string; }>()('**{event}** - <#{channelId}>}'),
                                role: t<{ roleId: string; channelId: string; }>()('**{roleId}** - <#{channelId}>}'),
                                template: t<{ entries: Iterable<IFormattable<string>>; }>()('{entries#plural(0:No logged events|{#join(\n)})}')
                            }
                        }
                    }
                }
            },
            enable: {
                description: {
                    default: t<{ events: Iterable<{ key: string; desc: IFormattable<string>; }>; }>()('Sets the channel to log the given events to. Available events are:\n{events#map(`{key}` - {desc})#join(\n)}'),
                    all: t('Sets the channel to log all events to, except role related events.'),
                    role: t('Sets the channel to log when someone gets or loses a role.')
                },
                notOnGuild: t('❌ The log channel must be on this server!'),
                notTextChannel: t('❌ The log channel must be a text channel!'),
                eventInvalid: t<{ events: Iterable<string>; }>()('❌ {events#join(, | and )} {events#plural(1:is not a valid event|are not valid events)}'),
                success: t<{ channel: Eris.Channel; events: Iterable<string>; }>()('✅ I will now log the following events in {channel#tag}:\n{events#join(\n)}')
            },
            disable: {
                description: {
                    default: t<{ events: Iterable<{ key: string; desc: IFormattable<string>; }>; }>()('Disables logging of the given events. Available events are:\n{events#map(`{key}` - {desc})#join(\n)}'),
                    all: t('Disables logging of all events except role related events.'),
                    role: t('Stops logging when someone gets or loses a role.')
                },
                success: t<{ events: Iterable<string>; }>()('✅ I will no longer log the following events:\n{events#join(\n)}')
            },
            ignore: {
                description: t('Ignores any tracked events concerning the users'),
                success: t<{ senderIds: Iterable<string>; }>()('✅ I will now ignore events from {senderIds#map(<@{}>)#join(, | and )}')
            },
            track: {
                description: t('Removes the users from the list of ignored users and begins tracking events from them again'),
                success: t<{ senderIds: Iterable<string>; }>()('✅ I will no longer ignore events from {senderIds#map(<@{}>)#join(, | and )}')
            }
        },
        logs: {
            flags: {
                type: t('The type(s) of message. Value can be CREATE, UPDATE, and/or DELETE, separated by commas.'),
                channel: t('The channel to retrieve logs from. Value can be a channel ID or a channel mention.'),
                user: t('The user(s) to retrieve logs from. Value can be a username, nickname, mention, or ID. This uses the user lookup system.'),
                create: t('Get message creates.'),
                update: t('Get message updates.'),
                delete: t('Get message deletes.'),
                json: t('Returns the logs in a json file rather than on a webpage.')
            },
            default: {
                description: t('Creates a chatlog page for a specified channel, where `number` is the amount of lines to get. You can retrieve a maximum of 1000 logs. For more specific logs, you can specify flags.\nFor example, if you wanted to get 100 messages `stupid cat` deleted, you would do this:\n`logs 100 --type delete --user stupid cat`\nIf you want to use multiple of the same type, separate parameters with commas or chain them together. For example:\n`logs 100 -CU -u stupid cat, dumb cat`'),
                chatlogsDisabled: t<{ prefix: string; }>()('❌ This guild has not opted into chatlogs. Please do `{prefix}settings set makelogs true` to allow me to start creating chatlogs.'),
                tooManyLogs: t('❌ You cant get more than 1000 logs at a time'),
                notEnoughLogs: t('❌ A minimum of 1 chatlog entry must be requested'),
                channelMissing: t<{ channel: string; }>()('❌ I couldn\'t find the channel `{channel}`'),
                notOnGuild: t('❌ The channel must be on this guild!'),
                noPermissions: t('❌ You do not have permissions to look at that channels message history!'),
                userMissing: t<{ user: string; }>()('❌ I couldn\'t find the user `{user}`'),
                generating: t('ℹ️ Generating your logs...'),
                sendFailed: t('❌ I wasn\'t able to send the message containing the logs!'),
                pleaseWait: t('ℹ️ Generating your logs...\nThis seems to be taking longer than usual. I\'ll ping you when I\'m finished.'),
                generated: {
                    link: {
                        quick: t<{ link: string; }>()('✅ Your logs are available here: {link}'),
                        slow: t<{ user: Eris.User; link: string; }>()('✅ Sorry that took so long, {user#tag}.\nYour logs are available here: {link}')
                    },
                    json: {
                        quick: t('✅ Here are your logs, in a JSON file!'),
                        slow: t<{ user: Eris.User; }>()('✅ Sorry that took so long, {user#tag}.\nHere are your logs, in a JSON file!')
                    }
                }
            }
        },
        massBan: {
            flags: {
                reason: t('The reason for the ban.')
            },
            default: {
                description: t('Bans a user who isn\'t currently on your guild, where `<userIds...>` is a list of user IDs or mentions (separated by spaces) and `days` is the number of days to delete messages for.\nIf mod-logging is enabled, the ban will be logged.'),
                state: {
                    alreadyBanned: t('❌ All those users are already banned!'),
                    memberTooHigh: t('❌ I don\'t have permission to ban any of those users! Their highest roles are above my highest role.'),
                    moderatorTooLow: t('❌ You don\'t have permission to ban any of those users! Their highest roles are above your highest role.'),
                    noPerms: t('❌ I don\'t have permission to ban anyone! Make sure I have the `ban members` permission and try again.'),
                    moderatorNoPerms: t('❌ You don\'t have permission to ban anyone! Make sure you have the `ban members` permission or one of the permissions specified in the `ban override` setting and try again.'),
                    noUsers: t('❌ None of the user ids you gave were valid users!')
                },
                success: t<{ users: Iterable<Eris.User>; }>()('✅ The following user(s) have been banned:\n{users#map({#tag})#join(\n)}')
            }
        },
        modLog: {
            setChannel: {
                description: t('Sets the channel to use as the modlog channel'),
                notOnGuild: t('❌ The modlog channel must be on this server!'),
                notTextChannel: t('❌ The modlog channel must be a text channel!'),
                success: t<{ channel: Eris.Channel; }>()('✅ Modlog entries will now be sent in {channel#tag}')
            },
            disable: {
                description: t('Disables the modlog'),
                success: t('✅ The modlog is disabled')
            },
            clear: {
                description: t('Deletes specific modlog entries. If you don\'t provide any, all the entries will be removed'),
                notFound: t('❌ No modlogs were found!'),
                channelMissing: t<{ modlogs: Iterable<number>; }>()('⛔ I couldn\'t find the modlog channel for cases {modlogs#map(`{}`)#join(, | and )}'),
                messageMissing: t<{ modlogs: Iterable<number>; }>()('⛔ I couldn\'t find the modlog message for cases {modlogs#map(`{}`)#join(, | and )}'),
                permissionMissing: t<{ modlogs: Iterable<number>; }>()('⛔ I didn\'t have permission to delete the modlog for cases {modlogs#map(`{}`)#join(, | and )}'),
                success: t<{ count: number; errors: Iterable<IFormattable<string>>; }>()('✅ I successfully deleted {count} {count#plural(1:modlog|modlogs)} from my database.{errors#map(\n{})#join()}')
            }
        },
        mute: {
            flags: {
                reason: t('The reason for the (un)mute.'),
                time: t('The amount of time to mute for, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d2h3m4s\', or some other combination.')
            },
            default: {
                description: t('Gives the user a special muted role. On first run, this role will be created. The bot needs to be able to `manage roles` to create and assign the role, and `manage channels` to configure the role. You are able to manually configure the role without the bot, but the bot has to make it. Deleting the muted role causes it to be regenerated.\nIf the bot has permissions for it, this command will also voice-mute the user.\nIf mod-logging is enabled, the mute will be logged.\nYou can also specify a length of time the user should be muted for, using formats such as `1 hour 2 minutes` or `1h2m`.'),
                createPermsMissing: t('❌ I don\'t have enough permissions to create a `muted` role! Make sure I have the `manage roles` permission and try again.'),
                configurePermsMissing: t('❌ I created a `muted` role, but don\'t have permissions to configure it! Either configure it yourself, or make sure I have the `manage channel` permission, delete the `muted` role, and try again.'),
                state: {
                    alreadyMuted: t<{ user: Eris.User; }>()('❌ {user#tag} is already muted'),
                    noPerms: t('❌ I don\'t have permission to mute users! Make sure I have the `manage roles` permission and try again.'),
                    moderatorNoPerms: t('❌ You don\'t have permission to mute users! Make sure you have the `manage roles` permission and try again.'),
                    roleMissing: t('❌ The muted role has been deleted! Please re-run this command to create a new one.'),
                    roleTooHigh: t('❌ I can\'t assign the muted role! (it\'s higher than or equal to my top role)'),
                    moderatorTooLow: t('❌ You can\'t assign the muted role! (it\'s higher than or equal to your top role)')

                },
                success: {
                    default: t<{ user: Eris.User; }>()('✅ **{user#tag}** has been muted'),
                    durationInvalid: t<{ user: Eris.User; }>()('⚠️ **{user#tag}** has been muted, but the duration was either 0 seconds or improperly formatted so they won\'t automatically be unmuted.'),
                    temporary: t<{ user: Eris.User; unmute: Duration; }>()('✅ **{user#tag}** has been muted and will be unmuted **{unmute#tag}**')
                }
            },
            clear: {
                description: t('Removes the special muted role from the user. \nIf mod-logging is enabled, the mute will be logged.'),
                state: {
                    notMuted: t<{ user: Eris.User; }>()('❌ {user#tag} is not currently muted'),
                    noPerms: t('❌ I don\'t have permission to unmute users! Make sure I have the `manage roles` permission and try again.'),
                    moderatorNoPerms: t('❌ You don\'t have permission to unmute users! Make sure you have the `manage roles` permission and try again.'),
                    roleTooHigh: t('❌ I can\'t revoke the muted role! (it\'s higher than or equal to my top role)'),
                    moderatorTooLow: t('❌ You can\'t revoke the muted role! (it\'s higher than or equal to your top role)'),
                    success: t<{ user: Eris.User; }>()('✅ **{user#tag}** has been unmuted')
                }
            }
        },
        pardon: {
            flags: {
                reason: t('The reason for the pardon.'),
                count: t('The number of warnings that will be removed.')
            },
            default: {
                description: t('Pardons a user.\nIf mod-logging is enabled, the pardon will be logged.\nThis will not unban users.'),
                state: {
                    countNaN: t<{ text: string; }>()('❌ {text} isn\'t a number!'),
                    countNegative: t('❌ I cant give a negative amount of pardons!'),
                    countZero: t('❌ I cant give zero pardons!'),
                    success: t<{ user: Eris.User; count: number; warnings: number; }>()('✅ **{user#tag}** has been given {count#plural(1:a warning|{} warnings)}. They now have {warnings#plural(1:1 warning|{} warnings)}.')
                }
            }
        },
        prefix: {
            list: {
                description: t('Lists all the current prefixes on this server'),
                success: t<{ guild: Eris.Guild; prefixes: Iterable<string>; }>()('ℹ️ {guild.name} has {prefixes#plural(0:no custom prefixes|the following prefixes:\n{#map( - {})#join(\n)})}')
            },
            add: {
                description: t('Adds a command prefix to this server'),
                success: t('✅ The prefix has been added!')
            },
            remove: {
                description: t('Removes a command prefix from this server'),
                success: t('✅ The prefix has been removed!')
            }
        },
        reason: {
            default: {
                description: t('Sets the reason for an action on the modlog.'),
                none: t('❌ There aren\'t any modlog entries yet!'),
                unknownCase: t<{ caseId: number; }>()('❌ I couldn\'t find a modlog entry with a case id of {caseId}'),
                success: {
                    messageMissing: t('⚠️ The modlog has been updated! I couldn\'t find the message to update however.'),
                    default: t('✅ The modlog has been updated!')
                }
            }
        },
        roleMe: {
            errors: {
                missing: t<{ id: number; }>()('❌ Roleme {id} doesn\'t exist'),
                noMessage: t<{ id: number; }>()('❌ Roleme {id} doesn\'t have a custom message'),
                missingChannels: t('❌ I couldn\'t locate any of the channels you provided'),
                missingRoles: t('❌ I couldn\'t locate any of the roles you provided'),
                noRoles: t('❌ You must provide at least 1 role to add or remove'),
                noTrigger: t('❌ You must provide a trigger phrase for the roleme')
            },
            common: {
                triggerQuery: t('❓ What should users type for this roleme to trigger?'),
                caseSensitiveQuery: {
                    prompt: t('❓ Is the trigger case sensitive?'),
                    continue: t('Yes'),
                    cancel: t('No')
                },
                channelsQuery: {
                    prompt: t('❓ Please mention all the channels you want the roleme to be available in'),
                    cancel: t('All channels')
                },
                rolesQuery: {
                    prompt: {
                        add: t('❓ Please type the roles you want the roleme to add, 1 per line. Mentions, ids or names can be used.'),
                        remove: t('❓ Please type the roles you want the roleme to remove, 1 per line. Mentions, ids or names can be used.')
                    },
                    fail: t('❌ I couldn\'t find any of the roles from your message, please try again.'),
                    cancel: t('No roles')
                }
            },
            flags: {
                add: t('A list of roles to add in the roleme'),
                remove: t('A list of roles to remove in the roleme'),
                case: t('Whether the phrase is case sensitive'),
                channels: t('The channels the roleme should be in')
            },
            add: {
                description: t('Adds a new roleme with the given phrase'),
                unexpectedError: t('❌ Something went wrong while I was trying to create that roleme'),
                success: t<{ id: number; }>()('✅ Roleme `{id}` has been created!')
            },
            remove: {
                description: t('Deletes the given roleme'),
                success: t<{ id: number; }>()('✅ Roleme `{id}` has been deleted')
            },
            edit: {
                description: t('Edits the given roleme'),
                unexpectedError: t('❌ Something went wrong while I was trying to edit that roleme'),
                success: t<{ id: number; }>()('✅ Roleme `{id}` has been updated!')
            },
            setMessage: {
                description: t('Sets the bbtag compatible message to show when the roleme is triggered'),
                success: t<{ id: number; }>()('✅ Roleme `{id}` has now had its message set')
            },
            rawMessage: {
                description: t('Gets the current message that will be sent when the roleme is triggered'),
                inline: t<{ id: number; content: string; }>()('ℹ️ The raw code for roleme `{id}` is: ```\n{content}\n```'),
                attached: t<{ id: number; }>()('ℹ️ The raw code for roleme `{id}` is attached')
            },
            debugMessage: {
                description: t('Executes the roleme message as if you triggered the roleme'),
                success: t('ℹ️ Ive sent the debug output in a DM')
            },
            setAuthorizer: {
                description: t('Sets the roleme message to run using your permissions'),
                success: t<{ id: number; }>()('✅ Your permissions will now be used for roleme `{id}`')
            },
            info: {
                description: t('Shows information about a roleme'),
                embed: {
                    title: t<{ id: number; }>()('Roleme #{id}'),
                    field: {
                        phrase: {
                            name: t<{ caseSensitive: boolean; }>()('Phrase (case {caseSensitive#bool(sensitive|insensitive)})')
                        },
                        rolesAdded: {
                            name: t('Roles added'),
                            value: t<{ roleIds: Iterable<string>; }>()('{roleIds#plural(0:None|{#map(<@&{}>)#join(\n)})}')
                        },
                        rolesRemoved: {
                            name: t('Roles removed'),
                            value: t<{ roleIds: Iterable<string>; }>()('{roleIds#plural(0:None|{#map(<@&{}>)#join(\n)})}')
                        },
                        channels: {
                            name: t('Channels'),
                            value: t<{ channelIds: Iterable<string>; }>()('{channelIds#plural(0:Anywhere|{#map(<#{}>)#join(\n)})}')
                        },
                        message: {
                            name: t('Message'),
                            value: t<{ authorId: string; authorizerId: string; }>()('**Author:** <@{authorId}>\n**Authorizer:** <@{authorizerId}>')
                        }
                    }
                }
            },
            list: {
                description: t('Lists the rolemes currently active on this server'),
                none: t('❌ You have no rolemes created!'),
                embed: {
                    title: t('Rolemes'),
                    description: {
                        channel: t<{ channelId?: string; }>()('{channelId#bool(<#{}>|All channels)}'),
                        roleme: t<{ id: number; message: string; }>()('**Roleme** `{id}`: {message}'),
                        layout: t<{ groups: Iterable<{ name: IFormattable<string>; entries: Iterable<IFormattable<string>>; }>; }>()('{groups#map({name}\n{entries#join(\n)})#join(\n\n)}')
                    }
                }
            }
        },
        removeVoteBan: {
            user: {
                description: t('Deletes all the vote bans against the given user'),
                success: t<{ user: Eris.User; }>()('✅ Votebans for {user#tag} have been cleared')
            },
            all: {
                description: t('Deletes all vote bans against all users'),
                success: t('✅ Votebans for all users have been cleared')
            }
        },
        settings: {
            description: t<{ website: string; }>()('Gets or sets the settings for the current guild. Visit {website} for key documentation.'),
            types: {
                string: t('string'),
                channel: t('channel'),
                bool: t('bool'),
                role: t('role'),
                int: t('int'),
                float: t('float'),
                permission: t('permission'),
                locale: t('language')
            },
            list: {
                description: t('Gets the current settings for this guild'),
                notConfigured: t('❌ Your guild is not correctly configured yet! Please try again later'),
                channelValue: {
                    default: t<{ channel: Eris.GuildChannel; }>()('{channel.name} ({channel.id})'),
                    unknown: t<{ channelId: string; }>()('Unknown channel ({channelId})'),
                    none: t('Default Channel')
                },
                roleValue: {
                    default: t<{ role: Eris.Role; }>()('{role.name} ({role.id})'),
                    unknown: t<{ roleId: string; }>()('Unknown role ({roleId})')
                },
                localeValue: t<{ locale: string; completion: number; }>()('{locale}{completion#plural(1:| - {#percent} complete)}'),
                notSet: t('Not set'),
                groups: {
                    general: t('General'),
                    messages: t('Messages'),
                    channels: t('Channels'),
                    permission: t('Permission'),
                    warnings: t('Warnings'),
                    moderation: t('Moderation')
                }
            },
            keys: {
                description: t('Lists all the setting keys and their types'),
                success: t<{ settings: Iterable<{ name: IFormattable<string>; key: string; type: IFormattable<string>; }>; }>()('ℹ️ You can use `settings set <key> [value]` to set the following settings. All settings are case insensitive.\n{settings#map( - **{name}:** `{key#upper}` ({type}))#join(\n)}')
            },
            languages: {
                description: t('Lists all the languages supported and their completion'),
                success: t<{ locales: Iterable<{ locale: string; completion: number; }>; }>()('✅ The following locales are supported:\n{locales#map(`{locale}` - {completion#percent} complete)#join(\n)}\n\nIf you want to help contribute a new langauge, or improve an existing one, contributions are being accepted!')
            },
            set: {
                description: t('Sets the given setting key to have a certain value. If `value` is omitted, the setting is reverted to its default value'),
                keyInvalid: t('❌ Invalid key!'),
                valueInvalid: t<{ value: string; type: IFormattable<string>; }>()('❌ `{value}` is not a {type}'),
                alreadySet: t<{ value: string; key: string; }>()('❌ `{value}` is already set for {key}'),
                success: t<{ key: string; value?: string; }>()('✅ {key} is set to {value=nothing}')
            }
        },
        slowMode: {
            errors: {
                notTextChannel: t('❌ You can only set slowmode on text channels!'),
                notInGuild: t('❌ You cant set slowmode on channels outside of a server'),
                botNoPerms: t<{ channel: Eris.Channel; }>()('❌ I don\'t have permission to set slowmode in {channel#tag}!')
            },
            on: {
                description: t('Sets the channel\'s slowmode to 1 message every `time` seconds, with a max of 6 hours'),
                timeTooLong: t<{ duration: Duration; }>()('❌ `time` must be less than {duration#duration(S)}s'),
                success: t<{ duration: Duration; channel: Eris.Channel; }>()('✅ Slowmode has been set to 1 message every {duration#duration(S)}s in {channel#tag}')
            },
            off: {
                description: t('Turns off the channel\'s slowmode'),
                success: t<{ channel: Eris.Channel; }>()('✅ Slowmode has been disabled in {channel#tag}')
            }
        },
        tidy: {
            flags: {
                bots: t('Remove messages from bots.'),
                invites: t('Remove messages containing invites.'),
                links: t('Remove messages containing links.'),
                embeds: t('Remove messages containing embeds.'),
                attachments: t('Remove messages containing attachments.'),
                user: t('Removes messages from the users specified. Separate users by commas'),
                query: t('Removes messages that match the provided query as a regex.'),
                invert: t('Reverses the effects of all the flag filters.'),
                yes: t('Bypasses the confirmation')
            },
            default: {
                description: t('Clears messages from chat'),
                notNegative: t<{ count: number; }>()('❌ I cannot delete {count} messages!'),
                unsafeRegex: t('❌ That regex is not safe!'),
                invalidUsers: t('❌ I couldn\'t find some of the users you gave!'),
                noMessages: t('❌ I couldn\'t find any matching messages!'),
                confirmQuery: {
                    prompt: {
                        foundAll: t<{ total: number; breakdown: Iterable<{ user: Eris.User; count: number; }>; }>()('ℹ️ I am about to attempt to delete {total} {total#plural(1:message|messages)}. Are you sure you wish to continue?\n{breakdown#map({user#tag} - {count} {count#plural(1:message|messages)})#join(\n)}'),
                        foundSome: t<{ total: number; searched: number; breakdown: Iterable<{ user: Eris.User; count: number; }>; }>()('ℹ️ I am about to attempt to delete {total} {total#plural(1:message|messages)} after searching through {searched} {searched#plural(1:message|messages)}. Are you sure you wish to continue?\n{breakdown#map({user#tag} - {count} {count#plural(1:message|messages)})#join(\n)}')
                    },
                    cancel: t('Cancel'),
                    continue: t('Continue')
                },
                cancelled: t('✅ Tidy cancelled, No messages will be deleted'),
                deleteFailed: t('❌ I wasn\'t able to delete any of the messages! Please make sure I have permission to manage messages'),
                success: {
                    default: t<{ deleted: number; success: Iterable<{ user: Eris.User; count: number; }>; }>()('✅ Deleted {deleted} {deleted#plural(1:message|messages)}:\n{success#map({user#tag} - {count} {count#plural(1:message|messages)})#join(\n)}'),
                    partial: t<{ deleted: number; success: Iterable<{ user: Eris.User; count: number; }>; failed: Iterable<{ user: Eris.User; count: number; }>; }>()('⚠️ I managed to delete {deleted} of the messages I attempted to delete.\n{success#map({user#tag} - {count} {count#plural(1:message|messages)})#join(\n)}\n\nFailed:\n{failed#map({user#tag} - {count} {count#plural(1:message|messages)})#join(\n)}')
                }
            }
        },
        timeout: {
            flags: {
                reason: t('The reason for the timeout (removal).'),
                time: t('The amount of time to mute for, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d2h3m4s\', or some other combination.\nMaximum allowed time is 28 days. Default is 1 day.')
            },
            user: {
                description: t('Timeouts a user.\nIf mod-logging is enabled, the timeout will be logged.'),
                state: {
                    memberTooHigh: t<{ user: Eris.User; }>()('❌ I don\'t have permission to timeout **{user#tag}**! Their highest role is above my highest role.'),
                    moderatorTooLow: t<{ user: Eris.User; }>()('❌ You don\'t have permission to timeout **{user#tag}**! Their highest role is above your highest role.'),
                    noPerms: t<{ user: Eris.User; }>()('❌ I don\'t have permission to timeout **{user#tag}**! Make sure I have the `moderate members` permission and try again.'),
                    moderatorNoPerms: t<{ user: Eris.User; }>()('❌ You don\'t have permission to timeout **{user#tag}**! Make sure you have the `moderate members` permission or one of the permissions specified in the `timeout override` setting and try again.'),
                    alreadyTimedOut: t<{ user: Eris.User; }>()('❌ **{user#tag}** has already been timed out.'),
                    success: t<{ user: Eris.User; }>()('✅ **{user#tag}** has been timed out.')
                }
            },
            clear: {
                description: t('Removes the timeout of a user.\nIf mod-logging is enabled, the timeout removal will be logged.'),
                state: {
                    notTimedOut: t<{ user: Eris.User; }>()('❌ **{user#tag}** is not currently timed out.'),
                    noPerms: t<{ user: Eris.User; }>()('❌ I don\'t have permission to timeout **{user#tag}**! Make sure I have the `moderate members` permission and try again.'),
                    moderatorNoPerms: t<{ user: Eris.User; }>()('❌ You don\'t have permission to timeout **{user#tag}**! Make sure you have the `moderate members` permission or one of the permissions specified in the `timeout override` setting and try again.'),
                    success: t<{ user: Eris.User; }>()('✅ **{user#tag}** timeout has been removed.')
                }
            }
        },
        timers: {
            list: {
                description: t('Lists all the currently active timers here'),
                none: t('✅ There are no active timers!'),
                paged: t<{ start: number; end: number; total: number; page: number; pageCount: number; }>()('Showing timers {start} - {end} of {total}. Page {page}/{pageCount}'),
                success: t<{ table: IFormattable<string>; paging?: IFormattable<string>; }>()('ℹ️ Here are the currently active timers:```prolog\n{table}\n```{paging}'),
                table: {
                    id: {
                        header: t('Id'),
                        cell: t<{ id: string; }>()('{id}')
                    },
                    elapsed: {
                        header: t('Elapsed'),
                        cell: t<{ startTime: Moment; }>()('{startTime#duration(H)}')
                    },
                    remain: {
                        header: t('Remain'),
                        cell: t<{ endTime: Moment; }>()('{endTime#duration(H)}')
                    },
                    user: {
                        header: t('User'),
                        cell: t<{ user?: Eris.User; }>()('{user#bool({username}#{discriminator}|)}')
                    },
                    type: {
                        header: t('Type'),
                        cell: t<{ type: string; }>()('{type}')
                    },
                    content: {
                        header: t('Content'),
                        cell: t<{ content: string; }>()('{content}')
                    }
                }
            },
            info: {
                description: t('Shows detailed information about a given timer'),
                notFound: t('❌ I couldn\'t find the timer you gave.'),
                embed: {
                    title: t<{ id: string; }>()('Timer #{id}'),
                    field: {
                        type: {
                            name: t('Type')
                        },
                        user: {
                            name: t('Started by'),
                            value: t<{ userId: string; }>()('<@{userId}>')
                        },
                        duration: {
                            name: t('Duration'),
                            value: t<{ start: Moment; end: Moment; }>()('Started {start#tag}\nEnds {end#tag}')
                        }
                    }
                }
            },
            cancel: {
                description: t('Cancels currently active timers'),
                timersMissing: t<{ count: number; }>()('❌ I couldn\'t find {count#plural(1:the timer|any of the timers)} you specified!'),
                success: {
                    default: t<{ success: Iterable<string>; }>()('✅ Cancelled {success#count#plural(1:{} timer|{} timers)}:\n{success#map(`{}`)#join(\n)}'),
                    partial: t<{ success: Iterable<string>; fail: Iterable<string>; }>()('⚠️ Cancelled {success#count#plural(1:{} timer|{} timers)}:\n{success#map(`{}`)#join(\n)}\nCould not find {fail#count#plural(1:{} timer|{} timers)}:\n{fail#map(`{}`)#join(\n)}')
                }
            },
            clear: {
                description: t('Clears all currently active timers'),
                confirm: {
                    prompt: t('⚠️ Are you sure you want to clear all timers?'),
                    continue: t('Yes'),
                    cancel: t('No')
                },
                cancelled: t('ℹ️ Cancelled clearing of timers'),
                success: t('✅ All timers cleared')
            }
        },
        unban: {
            flags: {
                reason: t('The reason for the ban.')
            },
            default: {
                description: t('Unbans a user.\nIf mod-logging is enabled, the ban will be logged.'),
                userNotFound: t('❌ I couldn\'t find that user!'),
                state: {
                    notBanned: t<{ user: Eris.User; }>()('❌ **{user#tag}** is not currently banned!'),
                    noPerms: t<{ user: Eris.User; }>()('❌ I don\'t have permission to unban **{user#tag}**! Make sure I have the `ban members` permission and try again.'),
                    moderatorNoPerms: t<{ user: Eris.User; }>()('❌ You don\'t have permission to unban **{user#tag}**! Make sure you have the `ban members` permission or one of the permissions specified in the `ban override` setting and try again.'),
                    success: t<{ user: Eris.User; }>()('✅ **{user#tag}** has been unbanned.')
                }
            }
        },
        unmute: {
            flags: {
                reason: t('The reason for the unmute.')
            },
            default: {
                description: t('Removes the special muted role from the user. \nIf mod-logging is enabled, the mute will be logged.'),
                state: {
                    notMuted: t<{ user: Eris.User; }>()('❌ {user#tag} is not currently muted'),
                    noPerms: t('❌ I don\'t have permission to unmute users! Make sure I have the `manage roles` permission and try again.'),
                    moderatorNoPerms: t('❌ You don\'t have permission to unmute users! Make sure you have the `manage roles` permission and try again.'),
                    roleTooHigh: t('❌ I can\'t revoke the muted role! (it\'s higher than or equal to my top role)'),
                    moderatorTooLow: t('❌ You can\'t revoke the muted role! (it\'s higher than or equal to your top role)'),
                    success: t<{ user: Eris.User; }>()('✅ **{user#tag}** has been unmuted')
                }
            }
        },
        warn: {
            actions: {
                ban: t('ban'),
                kick: t('kick'),
                timeout: t('timeout'),
                delete: t('warn')
            },
            flags: {
                reason: t('The reason for the warning.'),
                count: t('The number of warnings that will be issued.')
            },
            default: {
                description: t('Issues a warning.\nIf mod-logging is enabled, the warning will be logged.\nIf `kickat` and `banat` have been set using the `settings` command, the target could potentially get banned or kicked.'),
                state: {
                    countNaN: t<{ value: string; }>()('❌ {value} isn\'t a number!'),
                    countNegative: t('❌ I cant give a negative amount of warnings!'),
                    countZero: t('❌ I cant give zero warnings!'),
                    memberTooHigh: t<{ user: Eris.User; count: number; action: IFormattable<string>; }>()('⚠️ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}.\n⛔ They went over the limit for {action}s but they are above me so I couldn\'t {action} them.'),
                    moderatorTooLow: t<{ user: Eris.User; count: number; action: IFormattable<string>; }>()('⚠️ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}.\n⛔ They went over the limit for {action}s but they are above you so I didn\'t {action} them.'),
                    noPerms: t<{ user: Eris.User; count: number; action: IFormattable<string>; }>()('⚠️ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}.\n⛔ They went over the limit for {action}s but I don\'t have permission to {action} them.'),
                    moderatorNoPerms: t<{ user: Eris.User; count: number; action: IFormattable<string>; }>()('⚠️ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}.\n⛔ They went over the limit for {action}s but you don\'t have permission to {action} them.'),
                    alreadyBanned: t<{ user: Eris.User; count: number; }>()('⚠️ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}.\n⛔ They went over the limit for bans, but they were already banned.'),
                    alreadyTimedOut: t<{ user: Eris.User; count: number; }>()('⚠️ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}.\n⛔ They went over the limit for timeouts, but they were already timed out.'),
                    success: {
                        delete: t<{ user: Eris.User; count: number; warnings: number; }>()('✅ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}. They now have {warnings} {warnings#plural(1:warning|warnings)}.'),
                        timeout: t<{ user: Eris.User; count: number; }>()('✅ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}. They want over the limit for timeouts and so have been timed out.'),
                        ban: t<{ user: Eris.User; count: number; }>()('✅ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}. They went over the limit for bans and so have been banned.'),
                        kick: t<{ user: Eris.User; count: number; }>()('✅ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}. They went over the limit for kicks and so have been kicked.')
                    }
                }
            }
        },
        addDomain: {
            default: {
                description: t('Toggles multiple domains to the domain whitelist for use with the \\{request\\} subtag'),
                success: t<{ added: Iterable<string>; removed: Iterable<string>; }>()('✅ Boy howdy, thanks for the domains!{added#plural(0:|\nThese ones are great!```\n{#join(\n)}\n```)}{removed#plural(0:|\nI always hated these ones anyway.```\n{#join(\n)}\n```)}\nJust remember: it might take up to 15 minutes for these to go live.')
            }
        },
        patch: {
            flags: {
                fixes: t('The bug fixes of the patch.'),
                notes: t('Other notes.')
            },
            default: {
                description: t('Makes a patch note'),
                changelogMissing: t('❌ I cant find the changelog channel!'),
                messageEmpty: t('❌ I cant send out an empty patch note!'),
                embed: {
                    author: {
                        name: t<{ version: string; }>()('Version {version}')
                    },
                    title: t('New Features and Changes'),
                    field: {
                        bugFixes: {
                            name: t('Bug fixes')
                        },
                        otherNotes: {
                            name: t('Other notes')
                        }
                    }
                },
                confirm: {
                    prompt: t('This is a preview of what the patch will look like'),
                    continue: t('Looks good, post it!'),
                    cancel: t('Nah let me change something')
                },
                cancelled: t('ℹ️ Patch cancelled'),
                failed: t('❌ I wasn\'t able to send the patch notes!'),
                success: t('✅ Done!')
            }
        },
        reload: {
            commands: {
                description: t('Reloads the given commands, or all commands if none were given'),
                success: t<{ count: number; }>()('✅ Successfully reloaded {count} {count#plural(1:command|commands)}')
            },
            events: {
                description: t('Reloads the given events, or all events if none were given'),
                success: t<{ count: number; }>()('✅ Successfully reloaded {count} {count#plural(1:event|events)}')
            },
            services: {
                description: t('Reloads the given services, or all services if none were given'),
                success: t<{ count: number; }>()('✅ Successfully reloaded {count} {count#plural(1:service|services)}')
            }
        },
        restart: {
            description: t('Restarts blargbot, or one of its components'),
            default: {
                description: t('Restarts all the clusters'),
                success: t('Ah! You\'ve killed me but in a way that minimizes downtime! D:')
            },
            kill: {
                description: t('Kills the master process, ready for pm2 to restart it'),
                success: t('Ah! You\'ve killed me! D:')
            },
            api: {
                description: t('Restarts the api process'),
                success: t('✅ Api has been respawned.')
            }
        },
        update: {
            default: {
                description: t('Updates the codebase to the latest commit.'),
                noUpdate: t('✅ No update required!'),
                command: {
                    pending: t<{ command: string; }>()('ℹ️ Command: `{command}`\nRunning...'),
                    success: t<{ command: string; }>()('✅ Command: `{command}`'),
                    error: t<{ command: string; }>()('❌ Command: `{command}`')
                },
                packageIssue: t('❌ Failed to update due to a package issue'),
                buildIssue: t<{ commit: string; }>()('❌ Failed to update due to a build issue, but successfully rolled back to commit `{commit}`'),
                rollbackIssue: t('❌ A fatal error has occurred while rolling back the latest commit! Manual intervention is required ASAP.'),
                success: t<{ version: string; prefix: string; commit: string; }>()('✅ Updated to version {version} commit `{commit}`!\nRun `{prefix}restart` to gracefully start all the clusters on this new version.')
            }
        },
        avatar: {
            common: {
                formatInvalid: t<{ format: string; allowedFormats: Iterable<string>; }>()('❌ {format} is not a valid format! Supported formats are {allowedFormats#join(, | and )}'),
                sizeInvalid: t<{ size: string; allowedSizes: Iterable<number>; }>()('❌ {size} is not a valid image size! Supported sizes are {allowedSizes#join(, | and )}'),
                success: t<{ user: Eris.User; }>()('✅ {user#tag}\'s avatar')
            },
            flags: {
                format: t<{ formats: Iterable<string>; }>()('The file format. Can be {formats#join(, | or )}.'),
                size: t<{ sizes: Iterable<number>; }>()('The file size. Can be {sizes#join(, | or )}.')
            },
            self: {
                description: t('Gets your avatar')
            },
            user: {
                description: t('Gets the avatar of the user you chose')
            }
        },
        beeMovie: {
            flags: {
                name: t('Shows the name of the character the quote is from, if applicable.'),
                characters: t('Only give quotes from actual characters (no stage directions).')
            },
            default: {
                description: t('Gives a quote from the Bee Movie.')
            }
        },
        brainfuck: {
            common: {
                queryInput: {
                    prompt: t('This brainfuck code requires user input. Please say what you want to use:')
                },
                noInput: t('❌ No input was provided!'),
                unexpectedError: t('❌ Something went wrong...'),
                success: {
                    empty: t<{ state?: { memory: Iterable<number>; pointer: number; }; }>()('ℹ️ No output...{state#bool(\n\n[{memory#join(,)}]\nPointer: {pointer}|)}'),
                    default: t<{ output: string; state?: { memory: Iterable<number>; pointer: number; }; }>()('✅ Output:{output#split(\n)#map(\n> {})#join()}{state#bool(\n\n[{memory#join(,)}]\nPointer: {pointer}|)}')
                }
            },
            default: {
                description: t('Executes brainfuck code.')
            },
            debug: {
                description: t('Executes brainfuck code and returns the pointers.')
            }
        },
        commit: {
            default: {
                description: t('Gets a random or specified blargbot commit.'),
                noCommits: t('❌ I cant find any commits at the moment, please try again later!'),
                unknownCommit: t('❌ I couldn\'t find the commit!'),
                embed: {
                    title: t<{ commit: string; index: number; }>()('{commit} - commit #{index}')
                }
            }
        },
        decancer: {
            user: {
                description: t('Decancers a users display name. If you have permissions, this will also change their nickname'),
                success: t<{ user: Eris.User; result: string; }>()('✅ Successfully decancered **{user#tag}**\'s name to: `{result}`')
            },
            text: {
                description: t('Decancers some text to plain ASCII'),
                success: t<{ text: string; result: string; }>()('✅ The decancered version of **{text}** is: `{result}`')
            }
        },
        define: {
            default: {
                description: t('Gets the definition for the specified word. The word must be in english.'),
                unavailable: t('❌ It seems I cant find the definition for that word at the moment!'),
                embed: {
                    title: t<{ word: string; }>()('Definition for {word}'),
                    description: t<{ phonetic: string; pronunciation: string; }>()('**Pronunciation**: [🔈 {phonetic}]({pronunciation})'),
                    field: {
                        name: t<{ index: number; type: string; }>()('{index}. {type}'),
                        value: {
                            synonyms: t<{ synonyms: Iterable<string>; }>()('**Synonyms:** {synonyms#join(, | and )}\n'),
                            pronunciation: t<{ phonetic: string; pronunciation: string; }>()('**Pronunciation**: [🔈 {phonetic}]({pronunciation})\n'),
                            default: t<{ pronunciation?: IFormattable<string>; synonyms?: IFormattable<string>; definition: string; }>()('{pronunciation}{synonyms}{definition}')
                        }
                    }
                }
            }
        },
        dmErrors: {
            default: {
                description: t('Toggles whether to DM you errors.'),
                enabled: t('✅ I will now DM you if I have an issue running a command.'),
                disabled: t('✅ I won\'t DM you if I have an issue running a command.')
            }
        },
        donate: {
            default: {
                description: t('Gets my donation information'),
                success: t('✅ Thanks for the interest! Ive sent you a DM with information about donations.'),
                embed: {
                    description: t('Hi! This is stupid cat, creator of blargbot. I hope you\'re enjoying it!\n\nI don\'t like to beg, but right now I\'m a student. Tuition is expensive, and maintaining this project isn\'t exactly free. I have to pay for services such as web servers and domains, not to mention invest time into developing code to make this bot as good as it can be. I don\'t expect to be paid for what I\'m doing; the most important thing to me is that people enjoy what I make, that my product is making people happy. But still, money doesn\'t grow on trees. If you want to support me and what I\'m doing, I have a patreon available for donations. Prefer something with less commitment? I also have a paypal available.\n\nThank you for your time. I really appreciate all of my users! :3'),
                    field: {
                        paypal: {
                            name: t('Paypal')
                        },
                        patreon: {
                            name: t('Patreon')
                        }
                    }
                }
            }
        },
        feedback: {
            errors: {
                titleTooLong: t<{ max: number; }>()('❌ The first line of your suggestion cannot be more than {max} characters!'),
                noType: t('❌ You need to provide at least 1 feedback type.'),
                blacklisted: {
                    guild: t<{ prefix: string; }>()('❌ Sorry, your guild has been blacklisted from the use of the `{prefix}feedback` command. If you wish to appeal this, please join my support guild. You can find a link by doing `{prefix}invite`.'),
                    user: t<{ prefix: string; }>()('❌ Sorry, you have been blacklisted from the use of the `{prefix}feedback` command. If you wish to appeal this, please join my support guild. You can find a link by doing `{prefix}invite`.')
                }
            },
            types: {
                feedback: t('Feedback'),
                bugReport: t('Bug Report'),
                suggestion: t('Suggestion')
            },
            blacklist: {
                unknownType: t<{ type: string; }>()('❌ I don\'t know how to blacklist a {type}! only `guild` and `user`'),
                alreadyBlacklisted: {
                    guild: t('❌ That guild id is already blacklisted!'),
                    user: t('❌ That user id is already blacklisted!')
                },
                notBlacklisted: {
                    guild: t('❌ That guild id is not blacklisted!'),
                    user: t('❌ That user id is not blacklisted!')
                },
                success: {
                    guild: t<{ id: string; added: boolean; }>()('✅ The guild {id} has been {added#bool(blacklisted|removed from the blacklist)}'),
                    user: t<{ id: string; added: boolean; }>()('✅ The user {id} has been {added#bool(blacklisted|removed from the blacklist)}')
                }
            },
            flags: {
                command: t('Signify your feedback is for a command'),
                bbtag: t('Signify your feedback is for BBTag'),
                docs: t('Signify your feedback is for documentation'),
                other: t('Signify your feedback is for other functionality')
            },
            general: {
                description: t('Give me general feedback about the bot'),
                unexpectedError: t('❌ Something went wrong while trying to submit that! Please try again'),
                success: t<{ type: IFormattable<string>; caseId: number; link: string; }>()('✅ {type} has been sent with the ID {caseId}! 👌\n\nYou can view your {type#lower} here: <{link}>'),
                queryType: {
                    prompt: t('ℹ️ Please select the types that apply to your suggestion'),
                    placeholder: t('Select your suggestion type')
                },
                types: {
                    command: t('Command'),
                    bbtag: t('BBTag'),
                    documentation: t('Documentation'),
                    other: t('Other Functionality')
                },
                dm: t('DM'),
                embed: {
                    description: t<{ title: string; description: string; }>()('**{title}**\n\n{description}'),
                    field: {
                        types: {
                            name: t('Types'),
                            value: t<{ types: Iterable<string>; }>()('{types#join(\n)}')
                        }
                    },
                    footer: {
                        text: t<{ caseId: number; messageId: string; }>()('Case {caseId} | {messageId}')
                    }
                }
            },
            suggest: {
                description: t('Tell me something you want to be added or changed')
            },
            report: {
                description: t('Let me know about a bug you found')
            },
            edit: {
                description: t('Edit some feedback you have previously sent'),
                unknownCase: t<{ caseNumber: number; }>()('❌ I couldn\'t find any feedback with the case number {caseNumber}!'),
                notOwner: t('❌ You cant edit someone else\'s suggestion.'),
                success: t('✅ Your case has been updated.')
            }

        },
        help: {
            self: {
                description: t('Gets the help message for this command')
            },
            list: {
                description: t('Shows a list of all the available commands')
            },
            command: {
                description: t('Shows the help text for the given command')
            }
        },
        info: {
            default: {
                description: t('Returns some info about me.'),
                notReady: t('⚠️ Im still waking up! Try again in a minute or two'),
                embed: {
                    title: t('About me!'),
                    description: t<{ age: Duration; }>()('I am a multi-purpose bot with new features implemented regularly, written in typescript using [Eris](https://abal.moe/Eris/).\n\n🎂 I am currently {age#duration(F)} old!'),
                    field: {
                        patron: {
                            name: t('️️️️️️️️❤️ Special thanks to my patrons! ❤️'),
                            value: t<{ patrons: Iterable<IFormattable<string>>; }>()('{patrons#join(\n)}')
                        },
                        donator: {
                            name: t('️️️️️️️️❤️ Special thanks to all my other donators! ❤️'),
                            value: t<{ donators: Iterable<IFormattable<string>>; }>()('{donators#join(\n)}')
                        },
                        other: {
                            name: t('❤️ Special huge thanks to: ❤️'),
                            value: {
                                decorators: {
                                    awesome: t<{ user: IFormattable<string>; reason: IFormattable<string>; }>()('The awesome {user} for {reason}'),
                                    incredible: t<{ user: IFormattable<string>; reason: IFormattable<string>; }>()('The incredible {user} for {reason}'),
                                    amazing: t<{ user: IFormattable<string>; reason: IFormattable<string>; }>()('The amazing {user} for {reason}'),
                                    inspirational: t<{ user: IFormattable<string>; reason: IFormattable<string>; }>()('The inspirational {user} for {reason}')
                                },
                                reasons: {
                                    rewrite: t('rewriting me into typescript'),
                                    donations1k: t('huge financial contributions ($1000)'),
                                    unknown: t('something but I don\'t remember')
                                },
                                layout: t<{ details: Iterable<IFormattable<string>>; }>()('{details#join(\n)}')
                            }
                        },
                        details: {
                            value: t<{ prefix: string; }>()('For commands, do `{prefix}help`. For information about supporting me, do `{prefix}donate`.\nFor any additional information, such as command documentation, please visit my website: <https://blargbot.xyz>')
                        }
                    }
                }

            }
        },
        insult: {
            someone: {
                description: t('Generates a random insult directed at the name supplied.'),
                success: t<{ name: string; }>()('{name}\'s {#rand(mother|mom|father|dad|goat|cheese|dick|boob|eye|mouth|nose|ear|sister|sis|brother|bro|seagull|tea|mother-in-law|rabbit|dog|cat|left foot|body|brain|face|favourite thing)} {#rand(smells like|looks like|is|sounds like|appears to be|wants to be|looks just like|smells oddly similar to|is jealous of|is as stupid as|laughs like)} {#rand(a piece of cheese|a smelly fish|jam|tea|a skunk|a fart|a piece of toast|my mom|your mom|my dad|your dad|my sister|your sister|my brother|your brother|my cat|my dog|my lizard|my seagull|gross|farts|ugly|Captain America|javascript|C#|LUA|python3.5|a furry|an anthropomorphic horse|a tentacle monster|fuck|meow|mississippi|the entire UK|Japan|anime|dickgirls|a really stupid cat|a sentient robot|teaching a robot to love|anime girls with really large boobs who want to eat all of your cream|salty|smegma|mouldy cheese|obesity|Donald Trump|stupid people|crabcakes|firepoles|blue waffle|a really bad random insult generators|a terrible AI|cleverbot|b1nzy|a drunken goblin|poorly censored porn|an egg left in the sun for too long|#BREXIT|leaving the EU)}')
            },
            default: {
                description: t('Generates a random insult.'),
                success: t('Your {#rand(mother|mom|father|dad|goat|cheese|dick|boob|eye|mouth|nose|ear|sister|sis|brother|bro|seagull|tea|mother-in-law|rabbit|dog|cat|left foot|body|brain|face|favourite thing)} {#rand(smells like|looks like|is|sounds like|appears to be|wants to be|looks just like|smells oddly similar to|is jealous of|is as stupid as|laughs like)} {#rand(a piece of cheese|a smelly fish|jam|tea|a skunk|a fart|a piece of toast|my mom|your mom|my dad|your dad|my sister|your sister|my brother|your brother|my cat|my dog|my lizard|my seagull|gross|farts|ugly|Captain America|javascript|C#|LUA|python3.5|a furry|an anthropomorphic horse|a tentacle monster|fuck|meow|mississippi|the entire UK|Japan|anime|dickgirls|a really stupid cat|a sentient robot|teaching a robot to love|anime girls with really large boobs who want to eat all of your cream|salty|smegma|mouldy cheese|obesity|Donald Trump|stupid people|crabcakes|firepoles|blue waffle|a really bad random insult generators|a terrible AI|cleverbot|b1nzy|a drunken goblin|poorly censored porn|an egg left in the sun for too long|#BREXIT|leaving the EU)}')
            }
        },
        invite: {
            default: {
                description: t('Gets you invite information.'),
                success: t<{ inviteLink: string; guildLink: string; }>()('Invite me to your guild!\n<{inviteLink}>\nJoin my support guild!\n{guildLink}')
            }
        },
        mods: {
            common: {
                embed: {
                    title: t('Moderators'),
                    description: {
                        none: t('There are no mods with that status!')
                    },
                    field: {
                        online: {
                            name: t<{ emote: string; }>()('{emote} Online'),
                            value: t<{ users: Iterable<Eris.User>; }>()('{users#map({#tag})#join(\n)}')
                        },
                        away: {
                            name: t<{ emote: string; }>()('{emote} Away'),
                            value: t<{ users: Iterable<Eris.User>; }>()('{users#map({#tag})#join(\n)}')
                        },
                        busy: {
                            name: t<{ emote: string; }>()('{emote} Do not disturb'),
                            value: t<{ users: Iterable<Eris.User>; }>()('{users#map({#tag})#join(\n)}')
                        },
                        offline: {
                            name: t<{ emote: string; }>()('{emote} Offline'),
                            value: t<{ users: Iterable<Eris.User>; }>()('{users#map({#tag})#join(\n)}')
                        }
                    }
                }
            },
            all: {
                description: t('Gets a list of all mods.')
            },
            online: {
                description: t('Gets a list of all currently online mods.')
            },
            away: {
                description: t('Gets a list of all currently away mods.')
            },
            busy: {
                description: t('Gets a list of all mods currently set to do not disturb.')
            },
            offline: {
                description: t('Gets a list of all currently offline mods.')
            }
        },
        names: {
            flags: {
                all: t('Gets all the names.'),
                verbose: t('Gets more information about the retrieved names.')
            },
            list: {
                description: t('Returns the names that I\'ve seen the specified user have in the past 30 days.'),
                none: {
                    ever: t<{ user: Eris.User; }>()('ℹ️ I haven\'t seen any usernames for {user#tag} yet!'),
                    since: t<{ user: Eris.User; from: Moment; }>()('ℹ️ I haven\'t seen {user#tag} change their username since {from#tag}!')
                },
                embed: {
                    title: t('Historical usernames'),
                    description: {
                        since: {
                            detailed: t<{ from: Moment; usernames: Iterable<{ name: string; time: Moment; }>; }>()('Since {from#tag}\n{usernames#map({name} - {time#tag(R)})#join(\n)}'),
                            simple: t<{ from: Moment; usernames: Iterable<{ name: string; }>; }>()('Since {from#tag}\n{usernames#map({name})#join(\n)}')
                        },
                        ever: {
                            detailed: t<{ usernames: Iterable<{ name: string; time: Moment; }>; }>()('{usernames#map({name} - {time#tag(R)})#join(\n)}'),
                            simple: t<{ usernames: Iterable<{ name: string; }>; }>()('{usernames#map({name})#join(\n)}')
                        }
                    }
                }
            },
            remove: {
                description: t('Removes the names ive seen you use in the past 30 days'),
                none: t('ℹ️ You don\'t have any usernames to remove!'),
                notFound: t('❌ I couldn\'t find any of the usernames you gave!'),
                confirm: {
                    prompt: {
                        some: t<{ count: number; }>()('⚠️ Are you sure you want to remove {count} usernames'),
                        all: t('⚠️ Are you sure you want to remove **all usernames**')
                    },
                    continue: t('Yes'),
                    cancel: t('No')
                },
                cancelled: t('✅ I wont remove any usernames then!'),
                success: {
                    some: t<{ count: number; }>()('✅ Successfully removed {count}!'),
                    all: t('✅ Successfully removed **all usernames**!')
                }
            }
        },
        nato: {
            default: {
                description: t('Translates the given text into the NATO phonetic alphabet.')
            }
        },
        personalPrefix: {
            add: {
                description: t('Adds a command prefix just for you!'),
                alreadyAdded: t('❌ You already have that as a command prefix.'),
                success: t('✅ Your personal command prefix has been added.')
            },
            remove: {
                description: t('Removes one of your personal command prefixes'),
                notAdded: t('❌ That isn\'t one of your prefixes.'),
                success: t('✅ Your personal command prefix has been removed.')
            },
            list: {
                description: t('Lists the your personal command prefixes'),
                none: t('ℹ️ You don\'t have any personal command prefixes set!'),
                embed: {
                    title: t('Personal prefixes'),
                    description: t<{ prefixes: Iterable<string>; }>()('{prefixes#map(- {})#join(\n)}')
                }
            }
        },
        ping: {
            description: t('Pong!\nFind the command latency.'),
            default: {
                description: t('Gets the current latency.'),
                pending: t('ℹ️ {#rand(Existence is a lie.|You\'re going to die some day, perhaps soon.|Nothing matters.|Where do you get off?|There is nothing out there.|You are all alone in an infinite void.|Truth is false.|Forsake everything.|Your existence is pitiful.|We are all already dead.)}'),
                success: t<{ ping: Duration; }>()('✅ Pong! ({ping#duration(MS)}ms)')
            }
        },
        poll: {
            flags: {
                time: t('How long before the poll expires, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d2h3m4s\', or some other combination.'),
                emojis: t('The emojis to apply to the poll.'),
                description: t('The description of the poll.'),
                colour: t('The color of the poll (in HEX).'),
                announce: t('If specified, it will make an announcement. Requires the proper permissions.')
            },
            default: {
                description: t('Creates a poll for the given question and duration. If no duration is given, defaults to 60 seconds. If emojis are given, they will be used as options for the poll.'),
                invalidDuration: t<{ duration: string; }>()('❌ `{duration}` is not a valid duration for a poll.'),
                invalidColor: t<{ color: string; }>()('❌ `{color}` is not a valid color!'),
                sendFailed: t('❌ I wasn\'t able to send the poll! Please make sure I have the right permissions and try again.'),
                noAnnouncePerms: t('❌ Sorry, you don\'t have permissions to send announcements!'),
                announceNotSetUp: t('❌ Announcements on this server aren\'t set up correctly. Please fix them before trying again.'),
                emojisMissing: t('❌ You must provide some emojis to use in the poll.'),
                emojisInaccessible: t('❌ I don\'t have access to some of the emojis you used! Please use different emojis or add me to the server that the emojis are from.'),
                tooShort: t<{ duration: Duration; }>()('❌ {duration#duration(S)}s is too short for a poll! Use a longer time'),
                someEmojisMissing: t('⚠️ I managed to create the poll, but wasn\'t able to add some of the emojis to it. Please add them manually (they will still be counted in the results)')
            }
        },
        remind: {
            flags: {
                channel: t('Sets the reminder to appear in the current channel rather than a DM'),
                time: t('The time before the user is to be reminded, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d 2h 3m 4s\', or some other combination')
            },
            default: {
                description: t('Reminds you about something after a period of time in a DM.'),
                durationRequired: t('❌ The `-t` flag is required to set the duration of the reminder!'),
                durationZero: t('❌ I cant set a timer for 0 seconds!'),
                reminderMissing: t('❌ You need to say what you need reminding of!'),
                event: t<{ userId: string; start: Moment; content: string; }>()('⏰ Hi, <@{userId}>! You asked me to remind you about this {start#tag(R)}:\n{content}'),
                success: {
                    here: t<{ duration: Duration; }>()('✅ Ok, ill ping you here {duration#tag}'),
                    dm: t<{ duration: Duration; }>()('✅ Ok, ill ping you in a DM {duration#tag}')
                }
            }
        },
        roles: {
            default: {
                description: t('Displays a list of roles and their IDs.'),
                embed: {
                    title: t('Roles'),
                    description: t<{ roles: Iterable<Eris.Role>; }>()('{roles#map({#tag} - ({id}))#join(\n)}')
                }
            }
        },
        roll: {
            default: {
                description: t('Rolls the dice you tell it to, and adds the modifier'),
                diceInvalid: t<{ dice: string; }>()('❌ `{dice}` is not a valid dice!'),
                tooBig: t<{ maxRolls: number; maxFaces: number; }>()('❌ You\'re limited to {maxRolls} rolls of a d{maxFaces}'),
                character: {
                    embed: {
                        description: t<{ stats: Iterable<{ id: number; rolls: Iterable<number>; total: number; min: number; result: number; }>; }>()('```xl\n{stats#map(Stat #{id} - [{rolls#join(, )}] > {total} - {min} > {result})#join(\n)}\n```')
                    }
                },
                embed: {
                    title: t<{ rolls: number; faces: number; }>()('🎲 {rolls} {rolls#plural(1:roll|rolls)} of a {faces} sided dice:'),
                    description: {
                        modifier: t<{ total: number; sign: '+' | '-'; modifier: number; }>()('**Modifier**: {total} {sign} {modifier}'),
                        natural1: t(' - Natural 1...'),
                        natural20: t(' - Natural 20'),
                        layout: t<{ details?: string; rolls: Iterable<number>; modifier?: IFormattable<string>; total: number; natural?: IFormattable<string>; }>()('{details#bool({}\n|)}{rolls#join(, )}\n{modifier#bool({}\n|)}**Total**: {total}{natural}')
                    }
                }
            }

        },
        rr: {
            default: {
                description: t('Plays russian roulette with a specified number of bullets. If `emote` is specified, uses that specific emote.'),
                notEnoughBullets: t('❌ Wimp! You need to load at least one bullet.'),
                guaranteedDeath: t('⚠️ Do you have a death wish or something? Your revolver can only hold 6 bullets, that\'s guaranteed death!'),
                tooManyBullets: t('⚠️ That\'s gutsy, but your revolver can only hold 6 bullets!'),
                jammed: t('❌ Your revolver jams when you try to close the barrel. Maybe you should try somewhere else...'),
                confirm: {
                    prompt: t<{ bullets: number; }>()('You load {bullets} {bullets#plural(1:bullet|bullets)} into your revolver, give it a spin, and place it against your head'),
                    continue: t('Put the gun down'),
                    cancel: t('Pull the trigger')
                },
                chicken: t('You chicken out and put the gun down.\n{#rand(Maybe try again when you\'re not feeling so wimpy.|Its ok, fun isn\'t for everyone!)}'),
                died: t('***BOOM!*** {#rand(The gun goes off, splattering your brains across the wall. Unlucky!|☠️💥⚰️😵💀💀☠️|Before you know it, it\'s all over.|At least you had chicken!|I\'m ***not*** cleaning that up.|Guns are not toys!|Well, you can\'t win them all!|W-well... If every porkchop were perfect, we wouldn\'t have hotdogs? Too bad you\'re dead either way.|Blame it on the lag!|Today just wasn\'t your lucky day.|Pssh, foresight is for losers.)}'),
                lived: t('*Click!* {#rand(The gun clicks, empty. You get to live another day.|You breath a sign of relief as you realize that you aren\'t going to die today.|As if it would ever go off! Luck is on your side.|You thank RNGesus as you lower the gun.|👼🙏🚫⚰️👌👍👼|You smirk as you realize you survived.)}')
            }
        },
        shard: {
            common: {
                embed: {
                    title: t<{ shardId: number; }>()('Shard {shardId}'),
                    field: {
                        shard: {
                            name: t<{ shardId: number; }>()('Shard {shardId}'),
                            value: t<{ statusEmote: string; latency: number; guildCount: number; clusterId: number; lastUpdate: Moment; }>()('```\nStatus: {statusEmote}\nLatency: {latency}ms\nGuilds: {guildCount}\nCluster: {clusterId}\nLast update: {lastUpdate#time(LT)}\n```')
                        },
                        cluster: {
                            name: t<{ clusterId: number; }>()('Cluster {clusterId}'),
                            value: t<{ cpu: number; guildCount: number; ram: number; startTime: Moment; }>()('CPU usage: {cpu#percent(1)}\nGuilds: {guildCount}\nRam used: {ram#bytes}\nStarted {startTime#tag(R)}')
                        },
                        shards: {
                            name: t('Shards'),
                            value: t<{ shards: Iterable<{ id: number; statusEmote: string; latency: number; }>; }>()('```\n{shards#map({id} {statusEmote} {latency}ms)#join(\n)}\n```')
                        }
                    }
                }
            },
            current: {
                description: t('Returns information about the shard the current guild is in, along with cluster stats.'),
                dm: {
                    embed: {
                        description: t<{ clusterId: number; }>()('Discord DMs are on shard `0` in cluster `{clusterId}`')
                    }
                }
            },
            guild: {
                description: t('Returns information about the shard `guildID` is in, along with cluster stats.'),
                invalidGuild: t<{ id: string; }>()('❌ `{id}` is not a valid guild id'),
                embed: {
                    description: {
                        here: t<{ shardId: number; clusterId: number; }>()('This guild is on shard `{shardId}` and cluster `{clusterId}`'),
                        other: t<{ shardId: number; clusterId: number; guildId: string; }>()('Guild `{guildId}` is on shard `{shardId}` and cluster `{clusterId}`')
                    }
                }
            }
        },
        shards: {
            common: {
                invalidCluster: t('❌ Cluster does not exist'),
                noStats: t<{ clusterId: number; }>()('❌ Cluster {clusterId} is not online at the moment'),
                embed: {
                    field: {
                        shard: {
                            name: t<{ shardId: number; }>()('Shard {shardId}'),
                            value: t<{ statusEmote: string; latency: number; guildCount: number; clusterId: number; lastUpdate: Moment; }>()('```\nStatus: {statusEmote}\nLatency: {latency}ms\nGuilds: {guildCount}\nCluster: {clusterId}\nLast update: {lastUpdate#time(LT)}\n```')
                        },
                        cluster: {
                            name: t<{ clusterId: number; }>()('Cluster {clusterId}'),
                            value: t<{ cpu: number; guildCount: number; ram: number; startTime: Moment; }>()('CPU usage: {cpu#percent(1)}\nGuilds: {guildCount}\nRam used: {ram#bytes}\nStarted {startTime#tag(R)}')
                        },
                        shards: {
                            name: t('Shards'),
                            value: t<{ shards: Iterable<{ id: number; statusEmote: string; latency: number; }>; }>()('```\n{shards#map({id} {statusEmote} {latency}ms)#join(\n)}\n```')
                        }
                    }
                }
            },
            flags: {
                down: t('If provided, only shows downed shards for `b!shards`')
            },
            all: {
                description: t('Shows a list of all shards.'),
                noneDown: t('ℹ️ No shards are currently down!'),
                noStats: t('❌ No cluster stats yet!'),
                embed: {
                    title: t('Shards'),
                    description: t<{ clusterCount: number; shardCount: number; }>()('I\'m running on `{clusterCount}` {clusterCount#plural(1:cluster|clusters)} and `{shardCount}` {shardCount#plural(1:shard|shards)}\n'),
                    field: {
                        name: t<{ clusterId: number; }>()('Cluster {clusterId}'),
                        value: t<{ startTime: Moment; ram: number; shards: Iterable<{ id: number; statusEmote: string; latency: number; }>; }>()('Ready since: {startTime#tag(R)}\nRam: {ram#bytes}\n**Shards**:\n```\n{shards#map({id} {statusEmote} {latency}ms)#join(\n)}\n```')
                    }
                }
            },
            guild: {
                description: t('Shows information about the shard and cluster `guildID` is in '),
                invalidGuild: t<{ guildId: string; }>()('❌ `{guildId}` is not a valid guildID'),
                embed: {
                    description: {
                        here: t<{ clusterId: number; shardId: number; }>()('This guild is on shard `{shardId}` and cluster `{clusterId}`'),
                        other: t<{ guildId: string; clusterId: number; shardId: number; }>()('Guild `{guildId}` is on shard `{shardId}` and cluster `{clusterId}`')
                    }
                }
            },
            cluster: {
                description: t('Show information about `cluster`')
            }
        },
        ship: {
            default: {
                description: t('Gives you the ship name for two users.'),
                success: t<{ name: string; }>()('❤️ Your ship name is **{name}**!')
            }
        },
        spell: {
            default: {
                description: t('Gives you a description for a D&D 5e spell.'),
                notFound: t('❌ I couldn\'t find that spell!'),
                components: {
                    v: t('Verbal'),
                    s: t('Somatic'),
                    m: t('Material'),
                    f: t('Focus'),
                    df: t('Divine Focus'),
                    xp: t('XP Cost')
                },
                query: {
                    prompt: t('🪄 Multiple spells found! Please pick the right one'),
                    placeholder: t('Pick a spell'),
                    choice: {
                        description: t<{ level: IFormattable<string>; school: IFormattable<string>; }>()('Level {level} {school}')
                    }
                },
                embed: {
                    description: t<{ level: IFormattable<string>; school: IFormattable<string>; description: IFormattable<string>; }>()('*Level {level} {school}*\n\n{description}'),
                    field: {
                        duration: {
                            name: t('Duration')
                        },
                        range: {
                            name: t('Range')
                        },
                        castingTime: {
                            name: t('Casting Time')
                        },
                        components: {
                            name: t('Components')
                        }
                    }
                }
            }
        },
        stats: {
            default: {
                description: t('Gives you some information about me'),
                embed: {
                    title: t('Bot Statistics'),
                    footer: {
                        text: t('blargbot')
                    },
                    field: {
                        guilds: {
                            name: t('Guilds'),
                            value: t<{ guildCount: number; }>()('{guildCount}')
                        },
                        users: {
                            name: t('Users'),
                            value: t<{ userCount: number; }>()('{userCount}')
                        },
                        channels: {
                            name: t('Channels'),
                            value: t<{ channelCount: number; }>()('{channelCount}')
                        },
                        shards: {
                            name: t('Shards'),
                            value: t<{ shardCount: number; }>()('{shardCount}')
                        },
                        clusters: {
                            name: t('Clusters'),
                            value: t<{ clusterCount: number; }>()('{clusterCount}')
                        },
                        ram: {
                            name: t('RAM'),
                            value: t<{ ram: number; }>()('{ram#bytes}')
                        },
                        version: {
                            name: t('Version')
                        },
                        uptime: {
                            name: t('Uptime'),
                            value: t<{ startTime: Moment; }>()('{startTime#tag(R)}')
                        },
                        eris: {
                            name: t('Eris')
                        },
                        nodeJS: {
                            name: t('Node.js')
                        }
                    }
                }
            }
        },
        status: {
            default: {
                description: t('Gets you an image of an HTTP status code.'),
                notFound: t('❌ Something terrible has happened! 404 is not found!')
            }
        },
        syntax: {
            default: {
                description: t('Gives you the \'syntax\' for a command 😉'),
                success: t<{ prefix: string; name: string; tokens: Iterable<string>; }>()('❌ Invalid usage!\nProper usage: `{prefix}syntax {name} {tokens#join( )}`')
            }
        },
        tag: {
            description: t<{ subtags: string; tos: string; }>()('Tags are a system of public commands that anyone can create or run, using the BBTag language.\n\nFor more information about BBTag, visit <{subtags}>.\nBy creating a tag, you acknowledge that you agree to the Terms of Service (<{tos}>)'),
            request: {
                name: t('Enter the name of the tag:'),
                content: t('Enter the tag\'s contents:')
            },
            common: {
                debugInDm: t('ℹ️ Ive sent the debug output in a DM'),
                done: t('✅ I hope you found what you were looking for!')
            },
            errors: {
                noneFound: t('❌ No results found!'),
                tagMissing: t<{ name: string; }>()('❌ The `{name}` tag doesn\'t exist!'),
                invalidBBTag: t<{ errors: Iterable<IFormattable<string>>; }>()('❌ There were errors with the bbtag you provided!\n{errors#join(\n)}'),
                bbtagError: t<AnalysisResult>()('❌ [{location.line},{location.column}]: {message}'),
                bbtagWarning: t<AnalysisResult>()('⚠️ [{location.line},{location.column}]: {message}'),
                notOwner: t<{ name: string; }>()('❌ You don\'t own the `{name}` tag!'),
                alreadyExists: t<{ name: string; }>()('❌ The `{name}` tag already exists!'),
                deleted: t<{ name: string; reason?: string; user?: UserTag; }>()('❌ The `{name}` tag has been permanently deleted{user#bool( by **{username=UNKNOWN}#{discriminator=????}**|)}{reason#bool(\n\nReason: {}|)}')

            },
            run: {
                description: t('Runs a user created tag with some arguments')
            },
            test: {
                default: {
                    description: t('Uses the BBTag engine to execute the content as if it was a tag')
                },
                debug: {
                    description: t('Uses the BBTag engine to execute the content as if it was a tag and will return the debug output'),
                    tagNotOwned: t('❌ You cannot debug someone else\'s tag.')
                }
            },
            docs: {
                description: t('Returns helpful information about the specified topic.')
            },
            debug: {
                description: t('Runs a user created tag with some arguments. A debug file will be sent in a DM after the tag has finished.')
            },
            create: {
                description: t('Creates a new tag with the content you give'),
                success: t<{ name: string; errors: Iterable<IFormattable<string>>; }>()('✅ Tag `{name}` created.\n{errors#join(\n)}')
            },
            edit: {
                description: t('Edits an existing tag to have the content you specify'),
                success: t<{ name: string; errors: Iterable<IFormattable<string>>; }>()('✅ Tag `{name}` edited.\n{errors#join(\n)}')
            },
            set: {
                description: t('Sets the tag to have the content you specify. If the tag doesn\'t exist it will be created.'),
                success: t<{ name: string; errors: Iterable<IFormattable<string>>; }>()('✅ Tag `{name}` set.\n{errors#join(\n)}')
            },
            delete: {
                description: t('Deletes an existing tag'),
                success: t<{ name: string; }>()('✅ The `{name}` tag is gone forever!')
            },
            rename: {
                description: t('Renames the tag'),
                success: t<{ oldName: string; newName: string; }>()('✅ The `{oldName}` tag has been renamed to `{newName}`.')
            },
            raw: {
                description: t('Gets the raw contents of the tag'),
                inline: t<{ name: string; content: string; }>()('ℹ️ The raw code for {name} is: ```\n{content}\n```'),
                attached: t<{ name: string; }>()('ℹ️ The raw code for {name} is attached')
            },
            list: {
                description: t('Lists all tags, or tags made by a specific author'),
                page: {
                    content: t<{ tags: Iterable<string>; }>()('```fix\n{tags#join(, )}\n```'),
                    header: {
                        all: t<{ count: number; total: number; }>()('Found {count}/{total} tags'),
                        byUser: t<{ count: number; total: number; user: Eris.User; }>()('Found {count}/{total} tags made by {user#tag}')
                    }
                }
            },
            search: {
                description: t('Searches for a tag based on the provided name'),
                query: {
                    prompt: t('What would you like to search for?')
                },
                page: {
                    content: t<{ tags: Iterable<string>; }>()('```fix\n{tags#join(, )}\n```'),
                    header: t<{ count: number; total: number; query: string; }>()('Found {count}/{total} tags matching `{query}`')
                }
            },
            permDelete: {
                description: t('Marks the tag name as deleted forever, so no one can ever use it'),
                notStaff: t('❌ You cannot disable tags'),
                success: t<{ name: string; }>()('✅ The `{name}` tag has been deleted'),
                confirm: {
                    prompt: t<{ name: string; }>()('You are not the owner of the `{name}`, are you sure you want to modify it?'),
                    continue: t('Yes'),
                    cancel: t('No')
                }
            },
            cooldown: {
                description: t('Sets the cooldown of a tag, in milliseconds'),
                cooldownZero: t('❌ The cooldown must be greater than 0ms'),
                success: t<{ name: string; cooldown: Duration; }>()('✅ The tag `{name}` now has a cooldown of `{cooldown#duration(MS)}ms`.')
            },
            author: {
                description: t('Displays the name of the tag\'s author'),
                success: t<{ name: string; author?: UserTag; }>()('✅ The tag `{name}` was made by **{author.username=UNKNOWN}#{author.discriminator=????}**')
            },
            info: {
                description: t('Displays information about a tag'),
                embed: {
                    title: t<{ name: string; }>()('__**Tag | {name}**__'),
                    footer: {
                        text: t<{ user: Eris.User; }>()('{user.username}#{user.discriminator}')
                    },
                    field: {
                        author: {
                            name: t('Author'),
                            value: t<{ user: UserTag; id: string; }>()('{user.username=UNKNOWN}#{user.discriminator=????} ({id})')
                        },
                        cooldown: {
                            name: t('Cooldown'),
                            value: t<{ cooldown: Duration; }>()('{cooldown#duration(F)}')
                        },
                        lastModified: {
                            name: t('Last Modified'),
                            value: t<{ lastModified: Moment; }>()('{lastModified#tag}')
                        },
                        usage: {
                            name: t('Used'),
                            value: t<{ count: number; }>()('{count} {count#plural(1:time|times)}')
                        },
                        favourited: {
                            name: t('Favourited'),
                            value: t<{ count: number; }>()('{count} {count#plural(1:time|times)}')
                        },
                        reported: {
                            name: t('⚠️ Reported'),
                            value: t<{ count: number; }>()('{count} {count#plural(1:time|times)}')
                        },
                        flags: {
                            name: t('Flags'),
                            value: t<{ flags: Iterable<FlagDefinition<string>>; }>()('{flags#map(`-{flag}`/`--{word}`: {description})#join(\n)}')
                        }
                    }
                }
            },
            top: {
                description: t('Displays the top 5 tags'),
                success: t<{ tags: Iterable<{ index: number; name: string; author: UserTag; count: number; }>; }>()('__Here are the top 10 tags:__\n{tags#map(**{index}.** **{name}** \\(**{author.username=UNKNOWN}#{author.discriminator=????}**\\) - used **{count} {count#plural(1:time|times)}**)#join(\n)}')
            },
            report: {
                description: t('Reports a tag as violating the ToS'),
                blocked: t<{ reason: string; }>()('❌ Sorry, you cannot report tags.\n{reason}'),
                unavailable: t('❌ Sorry, you cannot report tags at this time. Please try again later!'),
                deleted: t<{ name: string; }>()('✅ The `{name}` tag is no longer being reported by you.'),
                added: t<{ name: string; }>()('✅ The `{name}` tag has been reported.'),
                notification: t<{ name: string; reason: string; user: Eris.User; }>()('**{user.username}#{user.discriminator}** has reported the tag: {name}\n\n{reason}'),
                query: {
                    prompt: t('Please provide a reason for your report:')
                }
            },
            setLang: {
                description: t('Sets the language to use when returning the raw text of your tag'),
                success: t<{ name: string; }>()('✅ Lang for tag `{name}` set.')
            },
            favourite: {
                list: {
                    description: t('Displays a list of the tags you have favourited'),
                    success: t<{ tags: Iterable<string>; }>()('{tags#count#plural(0:You have no favourite tags!|You have {} favourite {#plural(1:tag|tags)}. ```fix\n{~tags#join(, )}\n```)}')
                },
                toggle: {
                    description: t('Adds or removes a tag from your list of favourites'),
                    added: t<{ name: string; }>()('✅ The `{name}` tag is now on your favourites list!\n\nNote: there is no way for a tag to tell if you\'ve favourited it, and thus it\'s impossible to give rewards for favouriting.\nAny tag that claims otherwise is lying, and should be reported.'),
                    removed: t<{ name: string; }>()('✅ The `{name}` tag is no longer on your favourites list!')
                }
            },
            flag: {
                updated: t<{ name: string; }>()('✅ The flags for `{name}` have been updated.'),
                list: {
                    description: t('Lists the flags the tag accepts'),
                    none: t<{ name: string; }>()('✅ The `{name}` tag has no flags.'),
                    success: t<{ name: string; flags: Iterable<FlagDefinition<string>>; }>()('✅ The `{name}` tag has the following flags:\n\n{flags#map(`-{flag}`/`--{word}`: {description})#join(\n)}')
                },
                create: {
                    description: t('Adds multiple flags to your tag. Flags should be of the form `-<f> <flag> [flag description]`\ne.g. `b!t flags add mytag -c category The category you want to use -n name Your name`'),
                    wordMissing: t<{ flag: string; }>()('❌ No word was specified for the `{flag}` flag'),
                    flagExists: t<{ flag: string; }>()('❌ The flag `{flag}` already exists!'),
                    wordExists: t<{ word: string; }>()('❌ A flag with the word `{word}` already exists!')
                },
                delete: {
                    description: t('Removes multiple flags from your tag. Flags should be of the form `-<f>`\ne.g. `b!t flags remove mytag -c -n`')
                }
            }
        },
        time: {
            errors: {
                timezoneInvalid: t<{ timezone: string; }>()('❌ `{timezone}` is not a valid timezone! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.')
            },
            self: {
                description: t('Gets the time in your timezone')
            },
            user: {
                description: t('Gets the current time for the user'),
                timezoneNotSet: t<{ user: Eris.User; prefix: string; }>()('❌ {user#tag} has not set their timezone with the `{prefix}timezone` command yet.'),
                timezoneInvalid: t<{ user: Eris.User; prefix: string; }>()('❌ {user#tag} doesn\'t have a valid timezone set. They need to update it with the `{prefix}timezone` command'),
                success: t<{ now: Moment; user: Eris.User; }>()('ℹ️ It is currently **{now#time(LT)}** for **{user#tag}**.')
            },
            timezone: {
                description: t('Gets the current time in the timezone'),
                success: t<{ now: Moment; timezone: string; }>()('ℹ️ In **{timezone}**, it is currently **{now#time(LT)}**')
            },
            convert: {
                description: t('Converts a `time` from `timezone1` to `timezone2`'),
                invalidTime: t<{ time: string; }>()('❌ `{time}` is not a valid time! Please use the 12 or 24 hour format, e.g. 1:32pm or 13:32'),
                success: t<{ source: Moment; dest: Moment; sourceTimezone: string; destTimezone: string; }>()('ℹ️ When it\'s **{source#time(LT)}** in **{sourceTimezone}**, it\'s **{dest#time(LT)}** in **{destTimezone}**.')
            }
        },
        timer: {
            flags: {
                channel: t('Sets the reminder to appear in the current channel rather than a DM')
            },
            default: {
                description: t('Sets a timer for the provided duration, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d2h3m4s\', or some other combination.'),
                durationZero: t('❌ I cant set a timer for 0 seconds!'),
                event: t<{ userId: string; start: Moment; }>()('⏰ *Bzzt!* <@{userId}>, the timer you set {start#tag(R)} has gone off! *Bzzt!* ⏰'),
                success: {
                    here: t<{ duration: Duration; }>()('✅ Ok, ill ping you here {duration#tag}'),
                    dm: t<{ duration: Duration; }>()('✅ Ok, ill ping you in a DM {duration#tag}')
                }
            }
        },
        timeZone: {
            get: {
                description: t('Gets your current timezone'),
                notSet: t('ℹ️ You haven\'t set a timezone yet.'),
                timezoneInvalid: t<{ timezone: string; }>()('⚠️ Your stored timezone code is `{timezone}`, which isn\'t valid! Please update it when possible.'),
                success: t<{ timezone: string; now: Moment; }>()('ℹ️ Your stored timezone code is `{timezone}`, which is equivalent to {now#time(z \\(Z\\))}.')
            },
            set: {
                description: t('Sets your current timezone. A list of [allowed time zones can be found on wikipedia](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List) under the `TZ database name` column'),
                timezoneInvalid: t<{ timezone: string; }>()('❌ `{timezone}` is not a valid timezone! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.'),
                success: t<{ timezone: string; now: Moment; }>()('✅ Ok, your timezone code is now set to `{timezone}`, which is equivalent to {now#time(z \\(Z\\))}.')
            }
        },
        todo: {
            list: {
                description: t('Shows you your todo list'),
                embed: {
                    title: t('Todo list'),
                    description: t<{ items: Iterable<{ id: number; value: string; }>; }>()('{items#plural(0:You have nothing on your list!|{#map(**{id}.** {value})#join(\n)})}')
                }
            },
            remove: {
                description: t('Removes an item from your todo list by id'),
                unknownId: t<{ id: number; }>()('❌ Your todo list doesn\'t have an item {id}!'),
                success: t('✅ Done!')
            },
            add: {
                description: t('Adds an item to your todo list'),
                success: t('✅ Done!')
            }
        },
        tokenify: {
            default: {
                description: t('Converts the given input into a token.')
            }
        },
        uptime: {
            default: {
                description: t('Gets how long ive been online for'),
                success: t<{ startTime: Moment; }>()('ℹ️ I came online {startTime#tag(R)} at {startTime#tag}')
            }
        },
        user: {
            default: {
                description: t('Gets information about a user'),
                activity: {
                    default: t('Not doing anything'),
                    5: t<Eris.Activity>()('Competing in {name}'),
                    4: t<Eris.Activity>()('{emoji#bool({#emoji} |)}{name}'),
                    2: t<Eris.Activity>()('Listening to {name}'),
                    0: t<Eris.Activity>()('Playing {name}'),
                    1: t<Eris.Activity>()('Streaming {details}'),
                    3: t<Eris.Activity>()('Watching {name}')
                },
                embed: {
                    author: {
                        name: {
                            user: t<{ user: Eris.User; }>()('{user.bot#bool(🤖 |)}{user.username}#{user.discriminator}'),
                            member: t<{ user: Eris.Member; }>()('{user.bot#bool(🤖 |)}{user.username}#{user.discriminator}{user.nick#bool( \\({}\\)|)}')
                        }
                    },
                    description: {
                        user: t<{ user: Eris.User; }>()('**User Id**: {user.id}\n**Created**: {user.createdAt#bool(<t:{}:f>|-)}'),
                        member: t<{ user: Eris.Member; }>()('**User Id**: {user.id}\n**Created**: {user.createdAt#bool(<t:{}:f>|-)}\n**Joined** {user.joinedAt#bool(<t:{}:f>|-)}')
                    },
                    field: {
                        roles: {
                            name: t('Roles'),
                            value: t<{ roles: Iterable<Eris.Role>; }>()('{roles#plural(0:None|{#map({#tag})#join( )})}')
                        }
                    }
                }
            }
        },
        version: {
            default: {
                description: t('Tells you what version I am on'),
                success: t<{ version: string; }>()('ℹ️ I am running blargbot version {version}')
            }
        },
        voteBan: {
            description: t('Its a meme, don\'t worry'),
            errors: {
                failed: t('❌ Seems the petitions office didn\'t like that one! Please try again')
            },
            list: {
                description: t('Gets the people with the most votes to be banned.'),
                embed: {
                    title: t('ℹ️ Top 10 Vote bans'),
                    description: t<{ items: Iterable<{ index: number; userId: string; count: number; }>; }>()('{items#plural(0:No petitions have been signed yet!|{#map(**{index}.** <@{userId}> - {count} {count#plural(1:signature|signatures)})#join(\n)})}')
                }
            },
            info: {
                description: t('Checks the status of the petition to ban someone.'),
                embed: {
                    title: t('ℹ️ Vote ban signatures'),
                    description: t<{ user: Eris.User; votes: Iterable<{ userId: string; reason?: string; }>; excess: number; }>()('{votes#plural(0:No one has voted to ban {~user#tag} yet.|{#map(<@{userId}>{reason#bool( - {}|)})#join(\n)})}{excess#bool(\n... and {} more|)}')
                }
            },
            sign: {
                description: t('Signs a petition to ban a someone'),
                alreadySigned: t<{ user: Eris.User; }>()('❌ I know you\'re eager, but you have already signed the petition to ban {user#tag}!'),
                success: t<{ user: Eris.User; target: Eris.User; total: number; reason?: string; }>()('✅ {user#tag} has signed to ban {target#tag}! A total of **{total} {total#plural(1:person** has|people** have)} signed the petition now.{reason#bool(\n**Reason:** {}|)}')
            },
            forgive: {
                description: t('Removes your signature to ban someone'),
                notSigned: t<{ user: Eris.User; }>()('❌ That\'s very kind of you, but you haven\'t even signed to ban {user#tag} yet!'),
                success: t<{ user: Eris.User; target: Eris.User; total: number; }>()('✅ {user#tag} reconsidered and forgiven {target#tag}! A total of **{total} {total#plural(1:person** has|people** have)} signed the petition now.')
            }
        },
        warnings: {
            common: {
                count: t<{ user: Eris.User; count: number; }>()('{count#plural(0:🎉|⚠️)} **{user#tag}** {count#plural(0:doesn\'t have any warnings!|1:has accumulated 1 warning.|has accumulated {} warnings.)}'),
                untilTimeout: t<{ remaining: number; }>()('- {remaining} more warnings before being timed out.'),
                untilKick: t<{ remaining: number; }>()('- {remaining} more warnings before being kicked.'),
                untilBan: t<{ remaining: number; }>()('- {remaining} more warnings before being banned.'),
                success: t<{ parts: Iterable<IFormattable<string>>; }>()('{parts#join(\n)}')
            },
            self: {
                description: t('Gets how many warnings you have')
            },
            user: {
                description: t('Gets how many warnings the user has')
            }
        },
        xkcd: {
            default: {
                description: t('Gets an xkcd comic. If a number is not specified, gets a random one.'),
                down: t('❌ Seems like xkcd is down 😟'),
                embed: {
                    title: t<{ id: number; title: string; }>()('xkcd #{id}: {title}'),
                    footer: {
                        text: t<{ year: string; }>()('xkcd {year}')
                    }
                }
            }
        },
        art: {
            flags: {
                image: t('A custom image.')
            },
            user: {
                description: t('Shows everyone a work of art.')
            },
            default: {
                description: t('Shows everyone a work of art.'),
                invalidUrl: t<{ url: string; }>()('❌ {url} is not a valid url!')
            }
        },
        cah: {
            flags: {
                unofficial: t('Also show unofficial cards.')
            },
            default: {
                description: t('Generates a set of Cards Against Humanity cards.')
            },
            packs: {
                description: t('Lists all the Cards against packs I know about'),
                success: t('ℹ️ These are the packs I know about:')
            }
        },
        caption: {
            errors: {
                imageMissing: t('❌ You didn\'t tell me what image I should caption!'),
                captionMissing: t('❌ You must give at least 1 caption!'),
                fontInvalid: t<{ font: string; prefix: string; }>()('❌ {font} is not a supported font! Use `{prefix}caption list` to see all available fonts')
            },
            flags: {
                top: t('The top caption.'),
                bottom: t('The bottom caption.'),
                font: t('The font to use (case insensitive). Use the command with the -l flag to view the available fonts. Defaults to impact.')
            },
            fonts: {
                description: t('Lists the fonts that are supported'),
                success: t<{ fonts: Iterable<string>; }>()('ℹ️ The supported fonts are: {fonts#join(, | and )}')
            },
            attached: {
                description: t('Puts captions on an attached image.')
            },
            linked: {
                description: t('Puts captions on the image in the URL.'),
                invalidUrl: t<{ url: string; }>()('❌ {url} is not a valid url!')
            }
        },
        cat: {
            default: {
                description: t('Gets a picture of a cat.')
            }
        },
        clint: {
            flags: {
                image: t('A custom image.')
            },
            user: {
                description: t('I don\'t even know, to be honest.')
            },
            default: {
                description: t('I don\'t even know, to be honest.'),
                invalidUrl: t<{ url: string; }>()('❌ {url} is not a valid url!')
            }
        },
        clippy: {
            default: {
                description: t('Clippy the paper clip is here to save the day!')
            }
        },
        clyde: {
            default: {
                description: t('Give everyone a message from Clyde.')
            }
        },
        color: {
            default: {
                description: t('Returns the provided colors.')
            }
        },
        delete: {
            default: {
                description: t('Shows that you\'re about to delete something.')
            }
        },
        distort: {
            flags: {
                image: t('A custom image.')
            },
            user: {
                description: t('Turns an avatar into modern art.')
            },
            default: {
                description: t('Turns an image into modern art.'),
                invalidUrl: t<{ url: string; }>()('❌ {url} is not a valid url!')
            }
        },
        emoji: {
            description: t('Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.'),
            flags: {
                svg: t('Get the emote as an svg instead of a png.')
            },
            default: {
                description: t('Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.'),
                invalidEmoji: t('❌ No emoji found!')
            }
        },
        free: {
            flags: {
                bottom: t('The bottom caption.')
            },
            default: {
                description: t('Tells everyone what you got for free')
            }
        },
        linus: {
            flags: {
                image: t('A custom image.')
            },
            user: {
                description: t('Shows a picture of Linus pointing at something on his monitor.')
            },
            default: {
                description: t('Shows a picture of Linus pointing at something on his monitor.'),
                invalidUrl: t<{ url: string; }>()('❌ {url} is not a valid url!')
            }
        },
        pcCheck: {
            default: {
                description: t('Tells everyone a reason why they should get their PC checked. Template credits go to Ghosty#8204.')
            }
        },
        pixelate: {
            flags: {
                image: t('A custom image.'),
                scale: t('The amount to pixelate by (defaults to 64)')
            },
            user: {
                description: t('Pixelates an image.')
            },
            default: {
                description: t('Pixelates an image.'),
                invalidUrl: t<{ url: string; }>()('❌ {url} is not a valid url!')
            }
        },
        shit: {
            flags: {
                plural: t('Whether or not the text is plural (use ARE instead of IS).')
            },
            default: {
                description: t('Tells everyone what\'s shit.')
            }
        },
        sonicSays: {
            default: {
                description: t('Sonic wants to share some words of wisdom.')
            }
        },
        starVsTheForcesOf: {
            flags: {
                image: t('A custom image.')
            },
            user: {
                description: t('WHO IS STAR BATTLING THIS EPISODE?')
            },
            default: {
                description: t('WHO IS STAR BATTLING THIS EPISODE?'),
                invalidUrl: t<{ url: string; }>()('❌ {url} is not a valid url!')
            }
        },
        stupid: {
            flags: {
                user: t('The person who is stupid.'),
                image: t('A custom image.')
            },
            default: {
                description: t('Tells everyone who is stupid.'),
                invalidUser: t<{ user: string; }>()('❌ I could not find the user `{user}`')
            }
        },
        theSearch: {
            default: {
                description: t('Tells everyone about the progress of the search for intelligent life.')
            }
        },
        truth: {
            default: {
                description: t('Shows everyone what is written in the Scroll of Truth.')
            }
        },
        danbooru: {
            default: {
                description: t('Gets three pictures from \'<https://danbooru.donmai.us/>\' using given tags.'),
                noTags: t('❌ You need to provide some tags'),
                unsafeTags: t('❌ None of the tags you provided were safe!'),
                noResults: t('❌ No results were found!'),
                success: t<{ count: number; total: number; tags: Iterable<string>; }>()('Found **{count}/{total}** posts for tags {tags#map(`{}`)#join(, | and )}'),
                embed: {
                    author: {
                        name: t<{ author?: string; }>()('By {author=UNKNOWN}')
                    }
                }
            }
        },
        rule34: {
            default: {
                description: t('Gets three pictures from \'<https://rule34.xxx/>\' using given tags.'),
                noTags: t('❌ You need to provide some tags'),
                unsafeTags: t('❌ None of the tags you provided were safe!'),
                noResults: t('❌ No results were found!'),
                success: t<{ count: number; total: number; tags: Iterable<string>; }>()('Found **{count}/{total}** posts for tags {tags#map(`{}`)#join(, | and )}'),
                embed: {
                    author: {
                        name: t<{ author?: string; }>()('By {author=UNKNOWN}')
                    }
                }
            }
        },
        eval: {
            errors: {
                error: t<{ result: string; }>()('❌ An error occurred!```\n{result}\n```')
            },
            here: {
                description: t('Runs the code you enter on the current cluster'),
                success: t<{ code: string; result: string; }>()('✅ Input:```js\n{code}\n```Output:```\n{result}\n```')
            },
            master: {
                description: t('Runs the code you enter on the master process'),
                success: t<{ code: string; result: string; }>()('✅ Master eval input:```js\n{code}\n```Output:```\n{result}\n```')
            },
            global: {
                description: t('Runs the code you enter on all the clusters and aggregates the result'),
                results: {
                    template: t<{ code: string; results: Iterable<IFormattable<string>>; }>()('Global eval input:```js\n{code}\n```{results#join(\n)}'),
                    success: t<{ clusterId: number; result: string; }>()('✅ Cluster {clusterId} output:```\n{result}\n```'),
                    failed: t<{ clusterId: number; result: string; }>()('❌ Cluster {clusterId}: An error occurred!```\n{result}\n```')
                }
            },
            cluster: {
                description: t('Runs the code you enter on all the clusters and aggregates the result'),
                success: t<{ clusterId: number; code: string; result: string; }>()('✅ Cluster {clusterId} eval input:```js\n{code}\n```Output:```\n{result}\n```')
            }
        },
        exec: {
            default: {
                description: t('Executes a command on the current shell'),
                pm2Bad: t('❌ No! That\'s dangerous! Do `b!restart` instead.\n\nIt\'s not that I don\'t trust you, it\'s just...\n\nI don\'t trust you.'),
                confirm: {
                    prompt: t<{ command: string; }>()('⚠️ You are about to execute the following on the command line:```bash\n{command}\n```'),
                    continue: t('Continue'),
                    cancel: t('Cancel')
                },
                cancelled: t('✅ Execution cancelled'),
                command: {
                    pending: t<{ command: string; }>()('ℹ️ Command: `{command}`\nRunning...'),
                    success: t<{ command: string; }>()('✅ Command: `{command}`'),
                    error: t<{ command: string; }>()('❌ Command: `{command}`')
                }
            }
        },
        logLevel: {
            default: {
                description: t('Sets the current log level'),
                success: t<{ logLevel: string; }>()('✅ Log level set to `{logLevel}`')
            }
        },
        awoo: {
            description: t('Awoooooooooo!'),
            action: t<{ self: Eris.User; }>()('**{self#tag}** awoos!')
        },
        bang: {
            description: t('Bang bang!'),
            action: t<{ self: Eris.User; }>()('**{self#tag}** bangs!')
        },
        bite: {
            description: t('Give someone a bite!'),
            action: t<{ self: Eris.User; target?: Eris.User; }>()('**{self#tag}** bites **{target#tag=themselves}**')
        },
        blush: {
            description: t('Show everyone that you\'re blushing.'),
            action: t<{ self: Eris.User; }>()('**{self#tag}** blushes!')
        },
        cry: {
            description: t('Show everyone that you\'re crying.'),
            action: t<{ self: Eris.User; }>()('**{self#tag}** cries!')
        },
        cuddles: {
            description: t('Cuddle with someone.'),
            action: t<{ self: Eris.User; target?: Eris.User; }>()('**{self#tag}** cuddles with **{target#tag=themselves}**')
        },
        dance: {
            description: t('Break out some sweet, sweet dance moves.'),
            action: t<{ self: Eris.User; }>()('**{self#tag}** dances!')
        },
        hug: {
            description: t('Give somebody a hug.'),
            action: t<{ self: Eris.User; target?: Eris.User; }>()('**{self#tag}** hugs **{target#tag=themselves}**')
        },
        jojo: {
            description: t('This must be the work of an enemy stand!')
        },
        kiss: {
            description: t('Give somebody a kiss.'),
            action: t<{ self: Eris.User; target?: Eris.User; }>()('**{self#tag}** kisses **{target#tag=themselves}**')
        },
        lewd: {
            description: t('T-that\'s lewd...'),
            action: t<{ self: Eris.User; }>()('**{self#tag}** is lewd 😳!')
        },
        lick: {
            description: t('Give someone a lick. Sluurrpppp!'),
            action: t<{ self: Eris.User; target?: Eris.User; }>()('**{self#tag}** licks **{target#tag=themselves}**')
        },
        megumin: {
            description: t('Darkness blacker than black and darker than dark, I beseech thee, combine with my deep crimson. The time of awakening cometh. Justice, fallen upon the infallible boundary, appear now as an intangible distortion! Dance, Dance, Dance! I desire for my torrent of power a destructive force: a destructive force without equal! Return all creation to cinders, and come from the abyss!')
        },
        nom: {
            description: t('Nom on somebody.'),
            action: t<{ self: Eris.User; target?: Eris.User; }>()('**{self#tag}** noms on **{target#tag=themselves}**')
        },
        owo: {
            description: t('owo whats this?'),
            action: t<{ self: Eris.User; }>()('**{self#tag}** owos!')
        },
        pat: {
            description: t('Give somebody a lovely pat.'),
            action: t<{ self: Eris.User; target?: Eris.User; }>()('**{self#tag}** pats **{target#tag=themselves}**')
        },
        poke: {
            description: t('Gives somebody a poke.'),
            action: t<{ self: Eris.User; target?: Eris.User; }>()('**{self#tag}** pokes **{target#tag=themselves}**')
        },
        pout: {
            description: t('Let everyone know that you\'re being pouty.'),
            action: t<{ self: Eris.User; }>()('**{self#tag}** pouts!')
        },
        punch: {
            description: t('Punch someone. They probably deserved it.'),
            action: t<{ self: Eris.User; target?: Eris.User; }>()('**{self#tag}** punches **{target#tag=themselves}**')
        },
        rem: {
            description: t('Worst girl')
        },
        shrug: {
            description: t('Let everyone know that you\'re a bit indifferent.'),
            action: t<{ self: Eris.User; }>()('**{self#tag}** shrugs!')
        },
        slap: {
            description: t('Slaps someone.'),
            action: t<{ self: Eris.User; target?: Eris.User; }>()('**{self#tag}** slaps **{target#tag=themselves}**')
        },
        sleepy: {
            description: t('Let everyone know that you\'re feeling tired.'),
            action: t<{ self: Eris.User; }>()('**{self#tag}** is sleepy!')
        },
        smile: {
            description: t('Smile!'),
            action: t<{ self: Eris.User; }>()('**{self#tag}** smiles!')
        },
        smug: {
            description: t('Let out your inner smugness.'),
            action: t<{ self: Eris.User; }>()('**{self#tag}** is smug!')
        },
        stare: {
            description: t('Staaaaaaaaare'),
            action: t<{ self: Eris.User; }>()('**{self#tag}** stares!')
        },
        thumbsUp: {
            description: t('Give a thumbs up!'),
            action: t<{ self: Eris.User; }>()('**{self#tag}** gives a thumbs up!')
        },
        wag: {
            description: t('Wagwagwagwag'),
            action: t<{ self: Eris.User; }>()('**{self#tag}** wags!')
        },
        respawn: {
            description: t('Cluster respawning only for staff.'),
            default: {
                description: t('Respawns the cluster specified'),
                requested: t<{ user: Eris.User; clusterId: number; }>()('**{user#tag}** has called for a respawn of cluster {clusterId}.'),
                success: t<{ clusterId: number; }>()('✅ Cluster {clusterId} is being respawned and stuff now')
            }
        },
        respond: {
            default: {
                description: t('Responds to a suggestion, bug report or feature request'),
                notFound: t('❌ I couldn\'t find that feedback!'),
                userNotFound: t('⚠️ Feedback successfully updated\n⛔ I couldn\'t find the user who submitted that feedback'),
                alertFailed: t('⚠️ Feedback successfully updated\n⛔ I wasn\'t able to send the response in the channel where the feedback was initially sent'),
                success: t('✅ Feedback successfully updated and response has been sent.'),
                alert: t<{ submitterId: string; title: string; description: string; respondent: Eris.User; response: string; link: string; }>()('**Hi, <@{submitterId}>!**  You recently made this suggestion:\n\n**{title}**{description#bool(\n\n{}|)}\n\n**{respondent#tag}** has responded to your feedback with this:\n\n{response}\n\nIf you have any further questions or concerns, please join my support guild so that they can talk to you directly. You can get a link by doing `b!invite`. Thanks for your time!\n\nYour card has been updated here: <{link}>')
            }
        }
    }
}));

export default templates;
