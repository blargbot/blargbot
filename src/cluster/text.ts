import { AnalysisResult } from '@blargbot/bbtag';
import { IFormatString, IFormatStringDefinition, IFormattable, TranslatableString } from '@blargbot/domain/messages';
import { FlagDefinition } from '@blargbot/domain/models/index';
import * as Eris from 'eris';
import { Duration, Moment } from 'moment-timezone';

import { Command } from './command/Command';
import { CommandContext } from './command/CommandContext';
import { GuildCommandContext } from './types';

interface UserTag {
    readonly username?: string;
    readonly discriminator?: string;
}

export const templates = crunchTree('cluster', {
    common: {
        query: {
            cancel: translatable('Cancel'),
            cantUse: translatable('❌ This isn\'t for you to use!'),
            choose: {
                paged: translatable('{content#bool(\n{}|)}Page {page}/{pageCount}').withArgs<{ content?: IFormattable<string>; page: number; pageCount: number; }>()
            },
            user: {
                prompt: {
                    default: translatable('ℹ️ Please select a user from the drop down'),
                    filtered: translatable('ℹ️ Multiple users matching `{filter}` found! Please select one from the drop down.').withArgs<{ filter: string; }>()
                },
                placeholder: translatable('Select a user'),
                choice: {
                    label: translatable('{user.username}#{user.discriminator}').withArgs<{ user: Eris.User; }>(),
                    description: translatable('Id: {user.id}').withArgs<{ user: Eris.User; }>()
                }
            },
            member: {
                prompt: {
                    default: translatable('ℹ️ Please select a user from the drop down'),
                    filtered: translatable('ℹ️ Multiple users matching `{filter}` found! Please select one from the drop down.').withArgs<{ filter: string; }>()
                },
                placeholder: translatable('Select a user'),
                choice: {
                    label: translatable('{member.nick#bool({}|{~member.username})} ({member.username}#{member.discriminator})').withArgs<{ member: Eris.Member; }>(),
                    description: translatable('Id: {member.id}').withArgs<{ member: Eris.Member; }>()
                }
            },
            sender: {
                prompt: {
                    default: translatable('ℹ️ Please select a user or webhook from the drop down'),
                    filtered: translatable('ℹ️ Multiple users or webhooks matching `{filter}` found! Please select one from the drop down.').withArgs<{ filter: string; }>()
                },
                placeholder: translatable('Select a user or webhook'),
                choice: {
                    label: {
                        user: translatable('{user.username}#{user.discriminator}').withArgs<{ user: Eris.User; }>(),
                        webhook: translatable('{webhook.name}').withArgs<{ webhook: Eris.Webhook; }>()
                    },
                    description: translatable('Id: {sender.id}').withArgs<{ sender: Eris.User | Eris.Webhook; }>()
                }
            },
            role: {
                prompt: {
                    default: translatable('ℹ️ Please select a role from the drop down'),
                    filtered: translatable('ℹ️ Multiple roles matching `{filter}` found! Please select one from the drop down.').withArgs<{ filter: string; }>()
                },
                placeholder: translatable('Select a role'),
                choice: {
                    label: translatable('{role.name}').withArgs<{ role: Eris.Role; }>(),
                    description: translatable('Id: {role.id} Color: {role.color#color}').withArgs<{ role: Eris.Role; }>()
                }
            },
            channel: {
                prompt: {
                    default: translatable('ℹ️ Please select a channel from the drop down'),
                    filtered: translatable('ℹ️ Multiple channel matching `{filter}` found! Please select one from the drop down.').withArgs<{ filter: string; }>()
                },
                placeholder: translatable('Select a channel'),
                choice: {
                    label: {
                        guild: translatable('{channel.name}').withArgs<{ channel: Eris.GuildChannel; }>(),
                        dm: translatable('DM')
                    },
                    description: translatable('Id: {channel.id}{parent#bool({emoji} {label}|)}').withArgs<{ channel: Eris.Channel; parent?: { label: IFormattable<string>; emoji: string; }; }>()
                }
            },
            paged: {
                prompt: translatable('{header#bool({}\n|)}Page **#{page}/{pageCount}**\n{content}\nType a number between **1 and {pageCount}** to view that page.').withArgs<{ header: IFormattable<string>; page: number; pageCount: number; content: IFormattable<string>; }>()
            }
        }
    },
    regex: {
        tooLong: translatable('❌ Regex is too long!'),
        invalid: translatable('❌ Regex is invalid!'),
        unsafe: translatable('❌ Regex is unsafe!\nIf you are 100% sure your regex is valid, it has likely been blocked due to how I detect catastrophic backtracking.\nYou can find more info about catastrophic backtracking here: <https://www.regular-expressions.info/catastrophic.html>'),
        matchesEverything: translatable('❌ Your regex cannot match everything!')
    },
    roleme: {
        failed: translatable('A roleme was triggered, but I don\'t have the permissions required to give you your role!')
    },
    poll: {
        embed: {
            footer: {
                text: translatable('The poll will end')
            }
        },
        success: {
            noVotes: translatable('The votes are in! A total of **{total}** {total#plural(1:vote was|votes were)} collected!\n\n No one voted, how sad 😦').withArgs<{ total: number; }>(),
            tie: translatable('The votes are in! A total of **{total}** {total#plural(1:vote was|votes were)} collected!\n\n It was a tie between these choices at **{count}** {count#plural(1:vote|votes)} each:\n\n{winners#join(, | and )}').withArgs<{ total: number; count: number; winners: Iterable<string>; }>(),
            single: translatable('The votes are in! A total of **{total}** {total#plural(1:vote was|votes were)} collected!\n\n At **{count}** {count#plural(1:vote|votes)}, the winner is:\n\n{winner}').withArgs<{ total: number; count: number; winner: string; }>()
        }
    },
    guild: {
        blacklisted: translatable('Greetings! I regret to inform you that your guild, **{guild.name}** ({guild.id}), is on my blacklist. Sorry about that! I\'ll be leaving now. I hope you have a nice day.').withArgs<{ guild: Eris.Guild; }>(),
        joined: translatable('☑️ Guild: `{guild.name}` (`{guild.id}`)! {botGuild#bool(- ***BOT GUILD***|)}\n    Total: **{size}** | Users: **{userCount}** | Bots: **{botCount}** | Percent: **{botFraction#percent}**').withArgs<{ guild: Eris.Guild; botGuild: boolean; size: number; userCount: number; botCount: number; botFraction: number; }>()
    },
    autoresponse: {
        prompt: translatable('New AR request from **{user.username}#{user.discriminator}** ({user#tag}):\n**Guild**: {guild.name=UNKNOWN} ({guildId})\n**Channel**: {channelId}\n**Members**: {guild.members.size=??}\n\n{reason#bool({}|*No reason given*)}\n\n```js\n{code}\n```').withArgs<{ guild?: Eris.Guild; guildId: string; channelId: string; reason?: string; code: string; user: Eris.User; }>(),
        whitelist: {
            approved: translatable('✅ Congratz, your guild has been whitelisted for autoresponses! 🎉\n*It may take up to 15 minutes for them to become available*'),
            rejected: translatable('❌ Sorry, your guild has been rejected for autoresponses. 😿')
        }
    },
    announcements: {
        prompt: {
            channel: translatable('ℹ️ Please select the channel that announcements should be put in.'),
            role: translatable('ℹ️ Please select the role to mention when announcing.')
        }
    },
    modlog: {
        defaultReason: translatable('Responsible moderator, please do `{prefix}reason {caseId}` to set.').withArgs<{ prefix: string; caseId: number; }>(),
        types: {
            generic: translatable('Generic'),
            pardon: translatable('Pardon'),
            timeout: translatable('Timeout'),
            timeoutClear: translatable('Timeout Clear'),
            softBan: translatable('Soft Ban'),
            ban: translatable('Ban'),
            massBan: translatable('Mass Ban'),
            unban: translatable('Unban'),
            kick: translatable('Kick'),
            unmute: translatable('Unmute'),
            mute: translatable('Mute'),
            temporaryMute: translatable('Temporary Mute'),
            warning: translatable('Warning')
        },
        embed: {
            title: translatable('Case {caseId}').withArgs<{ caseId: number; }>(),
            description: translatable('{users#map({username}#{discriminator} \\({id}\\))#join(\n)}').withArgs<{ users: Iterable<Eris.User>; }>(),
            footer: {
                text: translatable('{user.username}#{user.discriminator} ({user.id})').withArgs<{ user: Eris.User; }>()
            },
            field: {
                type: {
                    name: translatable('Type')
                },
                reason: {
                    name: translatable('Reason'),
                    value: translatable('{reason}').withArgs<{ reason: IFormattable<string>; }>()
                },
                pardons: {
                    name: translatable('Pardons'),
                    value: translatable('Assigned: {count}\nNew Total: {warnings}').withArgs<{ count: number; warnings: number; }>()
                },
                warnings: {
                    name: translatable('Warnings'),
                    value: translatable('Assigned: {count}\nNew Total: {warnings}').withArgs<{ count: number; warnings: number; }>()
                },
                duration: {
                    name: translatable('Duration'),
                    value: translatable('{duration#duration(F)}').withArgs<{ duration: Duration; }>()
                },
                user: {
                    name: translatable('User'),
                    value: translatable('{user.username}#{user.discriminator} ({user.id})').withArgs<{ user: Eris.User; }>()
                }
            }
        }
    },
    eventLog: {
        disabled: translatable('❌ Disabled logging of the `{event}` event because the channel {channel#tag} doesn\'t exist or I don\'t have permission to post messages in it!').withArgs<{ event: string; channel: Eris.Channel; }>(),
        events: {
            timeoutAdded: translatable('ℹ️ User Was Timed Out'),
            timeoutRemoved: translatable('ℹ️ User Timeout Was Removed'),
            banned: translatable('ℹ️ User was banned'),
            unbanned: translatable('ℹ️ User Was Unbanned'),
            joined: translatable('ℹ️ User Joined'),
            left: translatable('ℹ️ User Left'),
            messageDeleted: translatable('ℹ️ Message Deleted'),
            messageUpdated: translatable('ℹ️ Message Updated'),
            roleRemoved: translatable('ℹ️ Special Role Removed'),
            roleAdded: translatable('ℹ️ Special Role Added'),
            nicknameUpdated: translatable('ℹ️ Nickname Updated'),
            usernameUpdated: translatable('ℹ️ Username Updated'),
            avatarUpdated: translatable('ℹ️ Avatar Updated')
        },
        embed: {
            description: {
                avatarUpdated: translatable('➡️ Old avatar\n⬇️ New avatar'),
                bulkDelete: translatable('Bulk Message Delete'),
                userUpdated: {
                    username: translatable('Username changed.'),
                    discriminator: translatable('Discriminator changed.'),
                    both: translatable('Username changed.\nDiscriminator changed.')
                }
            },
            field: {
                reason: {
                    name: translatable('Reason'),
                    value: translatable('{reason}').withArgs<{ reason: string; }>()
                },
                message: {
                    name: translatable('Message Id'),
                    value: translatable('{messageId}').withArgs<{ messageId: string; }>()
                },
                channel: {
                    name: translatable('Channel'),
                    value: translatable('{channelIds#map(<#{}>)#join(\n)}').withArgs<{ channelIds: Iterable<string>; }>()
                },
                oldUsername: {
                    name: translatable('Old Name'),
                    value: translatable('{user.username}#{user.discriminator}').withArgs<{ user: Eris.User; }>()
                },
                newUsername: {
                    name: translatable('New Name'),
                    value: translatable('{user.username}#{user.discriminator}').withArgs<{ user: Eris.User; }>()
                },
                oldNickname: {
                    name: translatable('Old Nickname'),
                    value: translatable('{nickname}').withArgs<{ nickname: string; }>()
                },
                newNickname: {
                    name: translatable('New Nickname'),
                    value: translatable('{nickname}').withArgs<{ nickname: string; }>()
                },
                role: {
                    name: translatable('Role'),
                    value: translatable('<@&{roleId}> ({roleId})').withArgs<{ roleId: string; }>()
                },
                updatedBy: {
                    name: translatable('Updated By'),
                    value: translatable('<@{userId}> ({userId})').withArgs<{ userId: string; }>()
                },
                created: {
                    name: translatable('Created'),
                    value: translatable('{time#tag}').withArgs<{ time: Moment; }>()
                },
                until: {
                    name: translatable('Until'),
                    value: translatable('{time#tag}').withArgs<{ time: Moment; }>()
                },
                count: {
                    name: translatable('Count'),
                    value: translatable('{count}').withArgs<{ count: number; }>()
                },
                content: {
                    name: {
                        old: {
                            unavailable: translatable('Old Message (Unavailable)'),
                            empty: translatable('Old Message (Empty)'),
                            default: translatable('Old Message')
                        },
                        new: {
                            unavailable: translatable('New Message (Unavailable)'),
                            empty: translatable('New Message (Empty)'),
                            default: translatable('New Message')
                        },
                        current: {
                            unavailable: translatable('Content (Unavailable)'),
                            empty: translatable('Content (Empty)'),
                            default: translatable('Content')
                        }
                    },
                    value: {
                        chatLogsOff: translatable('This message wasn\'t logged. ChatLogging is currently turned off'),
                        unknown: translatable('This message wasn\'t logged. ChatLogging was off when it was sent, or it is older than 2 weeks'),
                        expired: translatable('This message is no longer logged as it is older than 2 weeks'),
                        notLogged: translatable('This message wasn\'t logged. ChatLogging was off when it was sent.'),
                        empty: translatable('This message has no content. It had either an attachment or an embed'),
                        default: translatable('{content#overflow(1024|... (too long to display))}').withArgs<{ content: string; }>()
                    }
                }
            }

        }
    },
    warning: {
        autoBan: translatable('[ Auto-Ban ] Exceeded ban limit ({warnings}/{limit})').withArgs<{ warnings: number; limit: number; }>(),
        autoKick: translatable('[ Auto-Ban ] Exceeded ban limit ({warnings}/{limit})').withArgs<{ warnings: number; limit: number; }>(),
        autoTimeout: translatable('[ Auto-Ban ] Exceeded ban limit ({warnings}/{limit})').withArgs<{ warnings: number; limit: number; }>()
    },
    mute: {
        autoUnmute: translatable('Automatically unmuted after {duration#duration(F)=some time}.').withArgs<{ duration?: Duration; }>(),
        createReason: translatable('Automatic muted role configuration')
    },
    moderation: {
        auditLog: translatable('[{moderator.username}#{moderator.discriminator}] {reason}').withArgs<{ moderator: Eris.User; reason?: IFormattable<string>; }>()
    },
    censor: {
        warnReason: translatable('Said a blacklisted phrase.'),
        mentionSpam: {
            ban: {
                reason: translatable('Mention Spam'),
                failed: translatable('{user#tag} is mention spamming, but I lack the permissions to ban them!').withArgs<{ user: Eris.User; }>()
            }
        }
    },
    ban: {
        autoUnban: translatable('Automatically unbanned after {duration#duration(F)=some time}.').withArgs<{ duration?: Duration; }>()
    },
    documentation: {
        loading: translatable('Loading...'),
        name: {
            flat: translatable('{parent} - {child}').withArgs<{ parent: IFormattable<string>; child: IFormattable<string>; }>()
        },
        query: {
        },
        paging: {
            parent: translatable('Back to {parent}').withArgs<{ parent: IFormattable<string>; }>(),
            select: {
                placeholder: translatable('{text} - Page {page}/{pageCount}').withArgs<{ text: IFormattable<string>; page: number; pageCount: number; }>()
            }
        },
        command: {
            unknown: translatable('❌ Oops, I couldnt find that command! Try using `b!help` for a list of all commands'),
            invalid: translatable('❌ This help page isn\'t valid any more!'),
            prompt: translatable('Multiple help pages match `{term}`').withArgs<{ term: string; }>(),
            index: {
                name: translatable('Help'),
                footer: translatable('For more information about commands, do `b!help <commandname>` or visit <{commandsLink}>.\nWant to support the bot? Donation links are available at <{donateLink}> - all donations go directly towards recouping hosting costs.').withArgs<{ commandsLink: string; donateLink: string; }>(),
                prompt: translatable('Pick a command category')
            },
            list: {
                none: translatable('No commands'),
                excess: translatable('```\n{items#join(, )}\n```+ {excess} more').withArgs<{ items: Iterable<IFormattable<string>>; excess: number; }>(),
                count: translatable('{count} {count#plural(1:command|commands)}').withArgs<{ count: number; }>(),
                default: translatable('```\n{items#join(, )}\n```').withArgs<{ items: Iterable<IFormattable<string>>; }>()
            },
            categories: {
                prompt: translatable('Pick a command'),
                displayName: translatable('{category} commands').withArgs<{ category: IFormattable<string>; }>(),
                custom: {
                    noHelp: translatable('_No help set_')
                }
            },
            command: {
                prompt: translatable('Pick a command signature'),
                noPerms: translatable('```\n❌ You cannot use b!{name}\n```{description}').withArgs<{ name: string; description?: IFormattable<string>; }>(),
                aliases: {
                    name: translatable('**Aliases**'),
                    value: translatable('{aliases#join(, )}').withArgs<{ aliases: Iterable<string>; }>()
                },
                flags: {
                    name: translatable('**Flags**'),
                    value: translatable('{flags#map(`-{flag}`/`--{word}`: {description})#join(\n)}').withArgs<{ flags: Iterable<FlagDefinition<string | IFormattable<string>>>; }>()
                },
                usage: {
                    name: translatable('ℹ️  {usage}').withArgs<{ usage: string; }>(),
                    value: translatable('{notes#plural(0:|{#map(> {})#join(\n)}\n\n)}{description}').withArgs<{ notes: Iterable<IFormattable<string>>; description: IFormattable<string>; }>()
                },
                notes: {
                    alias: translatable('`{parameter}` can be replaced with {aliases#join(, | or )}').withArgs<{ parameter: string; aliases: Iterable<string>; }>(),
                    type: {
                        string: {
                            single: translatable('`{name}` defaults to `{default}`').withArgs<{ name: string; default: string; }>()
                        },
                        literal: {
                            single: translatable('`{name}` should be {choices#map(`{}`)#join(, | or )}{default#bool(and defaults to `{default}`|)}').withArgs<{ name: string; choices: Iterable<string>; default?: string; }>(),
                            greedy: translatable('`{name}` are {min#plural(0:|1:|{} or more of )}{choices#map(`{}`)#join(, | or )}').withArgs<{ name: string; choices: Iterable<string>; min: number; }>()
                        },
                        boolean: {
                            single: translatable('`{name}` should be true or false{default#bool(and defaults to `{default}`|)}').withArgs<{ name: string; default?: string; }>(),
                            greedy: translatable('`{name}` are {min#plural(0:|1:|{} or more )}true or false').withArgs<{ name: string; min: number; }>()
                        },
                        channel: {
                            single: translatable('`{name}` should be a channel id, mention or name{default#bool(and defaults to `{default}`|)}').withArgs<{ name: string; default?: string; }>(),
                            greedy: translatable('`{name}` are {min#plural(0:|1:|{} or more )}channel ids, mentions or names').withArgs<{ name: string; min: number; }>()
                        },
                        duration: {
                            single: translatable('`{name}` should be a duration{default#bool(and defaults to `{default}`|)}').withArgs<{ name: string; default?: string; }>(),
                            greedy: translatable('`{name}` are {min#plural(0:|1:|{} or more )}durations').withArgs<{ name: string; min: number; }>()
                        },
                        bigint: {
                            single: translatable('`{name}` should be a whole number{default#bool(and defaults to `{default}`|)}').withArgs<{ name: string; default?: string; }>(),
                            greedy: translatable('`{name}` are {min#plural(0:|1:|{} or more )}whole numbers').withArgs<{ name: string; min: number; }>()
                        },
                        integer: {
                            single: translatable('`{name}` should be a whole number{default#bool(and defaults to `{default}`|)}').withArgs<{ name: string; default?: string; }>(),
                            greedy: translatable('`{name}` are {min#plural(0:|1:|{} or more )}whole numbers').withArgs<{ name: string; min: number; }>()
                        },
                        member: {
                            single: translatable('`{name}` should be a user id, mention or name{default#bool(and defaults to `{default}`|)}').withArgs<{ name: string; default?: string; }>(),
                            greedy: translatable('`{name}` are {min#plural(0:|1:|{} or more )}user ids, mentions or names').withArgs<{ name: string; min: number; }>()
                        },
                        number: {
                            single: translatable('`{name}` should be a number{default#bool(and defaults to `{default}`|)}').withArgs<{ name: string; default?: string; }>(),
                            greedy: translatable('`{name}` are {min#plural(0:|1:|{} or more )}numbers').withArgs<{ name: string; min: number; }>()
                        },
                        role: {
                            single: translatable('`{name}` should be a role id, mention or name{default#bool(and defaults to `{default}`|)}').withArgs<{ name: string; default?: string; }>(),
                            greedy: translatable('`{name}` are {min#plural(0:|1:|{} or more )}role ids, mentions or names').withArgs<{ name: string; min: number; }>()
                        },
                        sender: {
                            single: translatable('`{name}` should be a user id, mention or name, or a webhook id{default#bool(and defaults to `{default}`|)}').withArgs<{ name: string; default?: string; }>(),
                            greedy: translatable('`{name}` are {min#plural(0:|1:|{} or more )}user ids, mentions or names, or webhook ids').withArgs<{ name: string; min: number; }>()
                        },
                        user: {
                            single: translatable('`{name}` should be a user id, mention or name{default#bool(and defaults to `{default}`|)}').withArgs<{ name: string; default?: string; }>(),
                            greedy: translatable('`{name}` are {min#plural(0:|1:|{} or more )}user ids, mentions or names').withArgs<{ name: string; min: number; }>()
                        }
                    }
                }
            }
        },
        bbtag: {
            invalid: translatable('❌ This bbtag documentation page isn\'t valid any more!'),
            unknown: translatable('❌ Oops, I didn\'t recognise that topic! Try using `b!{commandName} docs` for a list of all topics').withArgs<{ commandName: string; }>(),
            prompt: translatable('Multiple bbtag documentation pages match `{term}`').withArgs<{ term: string; }>(),
            index: {
                name: translatable('BBTag'),
                description: translatable('Blargbot is equipped with a system of tags called BBTag, designed to mimic a programming language while still remaining simple. You can use this system as the building-blocks to create your own advanced command system, whether it be through public tags or guild-specific custom commands.\n\nCustomizing can prove difficult via discord, fortunately there is an online [BBTag IDE]({editorLink}) which should make developing a little easier.').withArgs<{ editorLink: string; }>(),
                prompt: translatable('Pick a topic'),
                topics: {
                    name: translatable('Topics'),
                    value: translatable('For specific information about a topic, please use `b!{commandName} docs <topic>` (like `b!{commandName} docs subtags`\n- `terminology`, for more information about terms like \'subtags\', \'tags\', etc.  \n- `variables`, for more information about variables and the different variable scopes.\n- `argTypes`, for more information about the syntax of parameters\n- `dynamic`, for information about dynamic subtags\n- `subtags`, arguably the most important topic on this list. `b!{commandName} docs subtags` displays a list of subtag categories.').withArgs<{ commandName: string; }>()
                }
            },
            subtags: {
                name: translatable('Subtags'),
                description: translatable('Subtags are the building blocks of BBTag, and fall into {categories#count} categories:\n\n{categories#map(**{name}** - {description})#join(\n)}').withArgs<{ categories: Iterable<{ name: IFormattable<string>; description: IFormattable<string>; }>; }>(),
                prompt: translatable('Pick a category')
            },
            subtag: {
                name: translatable('\\{{name}\\}').withArgs<{ name: string; }>(),
                prompt: translatable('Pick a call signature'),
                description: {
                    deprecated: translatable('**This subtag is deprecated{replacement#bool( and has been replaced by \\{{}\\}|)}**').withArgs<{ replacement?: string; }>(),
                    aliases: translatable('{aliases#plural(0:|**Aliases:** ```\n{#join(, )}\n```)}').withArgs<{ aliases: Iterable<string>; }>(),
                    template: translatable('{parts#join(\n)}').withArgs<{ parts: Iterable<IFormattable<string>>; }>()
                },
                pages: {
                    signature: {
                        name: translatable('Usage: {parameters}').withArgs<{ parameters: string; }>(),
                        usage: {
                            name: translatable('**Usage**'),
                            value: {
                                parameters: translatable('```\n{parameters}\n```').withArgs<{ parameters: string; }>(),
                                modifier: {
                                    maxLength: translatable('`{name}` can at most be {maxLength} characters long').withArgs<{ name: string; maxLength: number; }>(),
                                    defaulted: translatable('`{name}` defaults to `{defaultValue}` if{required#bool(| omitted or)} left blank.').withArgs<{ name: string; defaultValue: string; required: boolean; }>(),
                                    defaultedMaxLength: translatable('`{name}` can at most be {maxLength} characters long and defaults to `{defaultValue}` if{required#bool(| omitted or)} left blank.').withArgs<{ name: string; defaultValue: string; required: boolean; maxLength: number; }>()
                                },
                                template: translatable('{parts#join(\n)}').withArgs<{ parts: Iterable<IFormattable<string>>; }>()
                            }
                        },
                        exampleCode: {
                            name: translatable('**Example code**'),
                            value: translatable('```\n{code}\n```').withArgs<{ code: IFormattable<string>; }>()
                        },
                        exampleIn: {
                            name: translatable('**Example user input**'),
                            value: translatable('{text#bool(\n{#split(\n)#map(> {})#join(\n)}|_no input_)}\n').withArgs<{ text: IFormattable<string>; }>()
                        },
                        exampleOut: {
                            name: translatable('**Example output**'),
                            value: translatable('{text#bool(\n{#split(\n)#map(> {})#join(\n)}|_no output)}\n').withArgs<{ text: IFormattable<string>; }>()
                        },
                        limit: {
                            name: {
                                customCommandLimit: translatable('**Limits for custom commands:**'),
                                everythingAutoResponseLimit: translatable('**Limits for custom commands:**'),
                                generalAutoResponseLimit: translatable('**Limits for custom commands:**'),
                                tagLimit: translatable('**Limits for custom commands:**')
                            },
                            value: translatable('```\n{rules#join(\n)}\n```').withArgs<{ rules: Iterable<IFormattable<string>>; }>()
                        }
                    }
                }
            },
            subtagCategory: {
                description: translatable('{description}\n\n```\n{subtags#map(, )}\n```').withArgs<{ description: IFormattable<string>; subtags: Iterable<string>; }>(),
                prompt: translatable('Pick a subtag')
            },
            variables: {
                name: translatable('Variables'),
                description: translatable('In BBTag there are {scopeCount} different scopes that can be used for storing your data. These scopes are determined by the first character of your variable name, so choose carefully!').withArgs<{ scopeCount: number; }>(),
                prompt: translatable('Pick a variable scope'),
                pages: {
                    variableType: {
                        name: translatable('{name} variables (prefix: {prefix})').withArgs<{ name: IFormattable<string>; prefix: string; }>()
                    },
                    commitRollback: {
                        name: translatable('\\{commit\\} and \\{rollback\\}'),
                        value: translatable('For performance reasons, when a value is `\\{set\\}` it wont be immediately populated to the database. `\\{commit\\}` and `\\{rollback\\}` can be used to manipulate when variables are sent to the database, if at all. `\\{commit\\}` will force the given variables to be sent to the database immediately. `\\{rollback\\}` will revert the given variables to their original value (start of tag or most recent `\\{commit\\}`).\nThere is also an additional prefix for \\{set\\} and \\{get\\} which is `!`. This prefix can be combined with other prefixes and will act the same as if you have called `\\{set\\}` and then `\\{commit\\}` immediately after. e.g. ```\\{set;!@varname;value\\}``` is identical to ```\\{set;@varname;value\\}\\{commit;@varname\\}```')
                    }
                }
            },
            arguments: {
                name: translatable('Arguments'),
                description: translatable('As you may have noticed, the various help documentation for subtags will have a usage that often look like this: ```\n\\{subtag;<arg1>;[arg2];<arg3...>\\}```This way of formatting arguments is designed to easily be able to tell you what is and is not required.\nAll arguments are separated by `;`\'s and each will be displayed in a way that tells you what kind of argument it is.\nNOTE: Simple subtags do not accept any arguments and so should not be supplied any.'),
                prompt: translatable('Pick a argument type'),
                pages: {
                    required: {
                        name: translatable('Required arguments <>'),
                        value: translatable('Example:```\n<arg>```Required arguments must be supplied for a subtag to work. If they are not then you will normally be given a `Not enough args` error\n\u200B')
                    },
                    optional: {
                        name: translatable('Optional arguments []'),
                        value: translatable('Example:```\n[arg]```Optional arguments may or may not be provided. If supplied, optional arguments may either change the functionality of the tag (e.g. `b!{commandName} docs shuffle`) or simply replace a default value (e.g. `b!{commandName} docs username`).\n\u200B').withArgs<{ commandName: string; }>()
                    },
                    multiple: {
                        name: translatable('Multiple arguments ...'),
                        value: translatable('Example:```\n<arg...>```Some arguments can accept multiple values, meaning you are able to list additional values, still separated by `;`, which will be included in the execution. (e.g. `b!{commandName} docs randchoose`)').withArgs<{ commandName: string; }>()
                    },
                    nested: {
                        name: translatable('Nested arguments <<> <>>'),
                        value: translatable('Example:```\n<<arg1>, [arg2]>```Some subtags may have special rules for how their arguments are grouped (e.g. `b!{commandName} docs switch`) and will use nested arguments to show that grouping. When actually calling the subtag, you provide the arguments as normal, however you must obey the grouping rules.\nIn the example of `switch`, you may optionally supply `<case>` and `<then>` as many times as you like but they must always be in pairs. e.g. `{switch;value;case1;then1}` or `{switch;value;case1;then1;case2;then2}` etc').withArgs<{ commandName: string; }>()
                    }
                }
            },
            terminology: {
                name: translatable('Terminology'),
                description: translatable('There are various terms used in BBTag that might not be intuitive, so here is a list of definitions for some of the most important ones:'),
                prompt: translatable('Pick a term'),
                pages: {
                    bbtag: {
                        name: translatable('BBTag'),
                        value: translatable('BBTag is a text replacement language. Any text between a `\\{` and `\\}` pair (called a subtag) will be taken as code and run, with the output of that replacing the whole subtag. Each subtag does something different, and each accepts its own list of arguments.')
                    },
                    subtag: {
                        name: translatable('Subtag'),
                        value: translatable('A subtag is a pre-defined function that accepts some arguments and returns a single output. Subtags can be called by placing their name between a pair of `\\{` and `\\}`, with any arguments to be passed to the subtag being separated by `;`.\nAs an example:```\\{math;+;1;2\\}```Subtag: `math`\nArguments: `+`, `1`, `2`\nResult: `3`')
                    },
                    tag: {
                        name: translatable('Tag'),
                        value: translatable('A tag is a user-made block of text which may or may not contain subtags. Any subtags that it does contain will be executed and be replaced by their output.')
                    },
                    argument: {
                        name: translatable('Argument'),
                        value: translatable('An argument is a single value which gets given to a subtag. Arguments can be numbers, text, arrays, anything you can type really. Each subtag will require a different argument pattern, so be sure to check what pattern your subtag needs!')
                    },
                    variable: {
                        name: translatable('Variable'),
                        value: translatable('A variable is a value that is stored in the bots memory ready to access it later on. For more in-depth details about variables, please use `b!{commandName} docs variable`.').withArgs<{ commandName: string; }>()
                    },
                    array: {
                        name: translatable('Array'),
                        value: translatable('An array is a collection of values all grouped together, commonly done so by enclosing them inside `[]`. In BBTag, arrays can be assigned to a variable to store them for later use. In this situation, you might see an array displayed like this `\\{"v":["1","2","3"],"n":"varname"\\}`. If you do, dont worry, nothing is broken! That is just there to allow you to modify the array in place within certain subtags.')
                    }
                }
            },
            dynamic: {
                name: translatable('Dynamic'),
                description: translatable('In bbtag, even the names of subtags can be dynamic. This can be achieved simply by placing subtags before the first `;` of a subtag. \n e.g. ```\\{user\\{get;~action\\};\\{userid\\}\\}``` If `~action` is set to `name`, then this will run the `username` subtag, if it is set to `avatar` then it will run the `useravatar` subtag, and so on. Because dynamic subtags are by definition not set in stone, it is recommended not to use them, and as such you will receive warnings when editing/creating a tag/cc which contains a dynamic subtag. Your tag will function correctly, however some optimizations employed by bbtag will be unable to run on any such tag.')
            }
        }
    },
    tableflip: {
        flip: translatable('{#rand(Whoops! Let me get that for you ┬──┬ ¯\\\\_(ツ)|(ヘ･_･)ヘ┳━┳ What are you, an animal?|Can you not? ヘ(´° □°)ヘ┳━┳|Tables are not meant to be flipped ┬──┬ ノ( ゜-゜ノ)|(ﾉ´･ω･)ﾉ ﾐ ┸━┸ Wheee!|┻━┻ ︵ヽ(`Д´)ﾉ︵ ┻━┻ Get these tables out of my face!|┻━┻ミ＼(≧ﾛ≦＼) Hey, catch!|Flipping tables with elegance! (/¯◡ ‿ ◡)/¯ ~ ┻━┻)}'),
        unflip: translatable('{#rand(┬──┬ ¯\\\\_(ツ) A table unflipped is a table saved!|┣ﾍ(≧∇≦ﾍ)… (≧∇≦)/┳━┳ Unflip that table!|Yay! Cleaning up! ┣ﾍ(^▽^ﾍ)Ξ(ﾟ▽ﾟ*)ﾉ┳━┳|ヘ(´° □°)ヘ┳━┳ Was that so hard?|(ﾉ´･ω･)ﾉ ﾐ ┸━┸ Here comes the entropy!|I\'m sorry, did you just pick that up? ༼ﾉຈل͜ຈ༽ﾉ︵┻━┻|Get back on the ground! (╯ರ ~ ರ)╯︵ ┻━┻|No need to be so serious! (ﾉ≧∇≦)ﾉ ﾐ ┸━┸)}')
    },
    cleverbot: {
        unavailable: translatable('❌ It seems that my clever brain isnt working right now, try again later')
    },
    commands: {
        $errors: {
            generic: translatable('❌ Something went wrong while handling your command!\nError id: `{token}`').withArgs<{ token: string; }>(),
            alreadyRunning: translatable('❌ Sorry, this command is already running! Please wait and try again.'),
            guildOnly: translatable('❌ `{prefix}{commandName}` can only be used on guilds.').withArgs<CommandContext>(),
            privateOnly: translatable('❌ `{prefix}{commandName}` can only be used in private messages.').withArgs<CommandContext>(),
            rateLimited: {
                local: translatable('❌ Sorry, you ran this command too recently! Please try again in {delay#duration(S)} seconds.').withArgs<{ duration: Duration; }>(),
                global: translatable('❌ Sorry, you\'ve been running too many commands. To prevent abuse, I\'m going to have to time you out for `{duration#duration(S)}s`.\n\nContinuing to spam commands will lengthen your timeout by `{penalty#duration(S)}s`!').withArgs<{ duration: Duration; penalty: Duration; }>()
            },
            missingPermission: {
                generic: translatable('❌ Oops, I don\'t seem to have permission to do that!'),
                guild: translatable('❌ Hi! You asked me to do something, but I didn\'t have permission to do it! Please make sure I have permissions to do what you asked.\nGuild: {channel.guild.name}\nChannel: {channel#tag}\nCommand: {commandText}\n\nIf you wish to stop seeing these messages, do the command `{prefix}dmerrors`.').withArgs<GuildCommandContext>()
            },
            arguments: {
                invalid: translatable('❌ Invalid arguments! `{value}` isn\'t {types#map(`{}`)#join(, | or )}').withArgs<{ value: string; types: string[]; }>(),
                missing: translatable('❌ Not enough arguments! You need to provide {missing#map(`{}`)#join(, | or )}').withArgs<{ missing: string[]; }>(),
                unknown: translatable('❌ I couldn\'t understand those arguments!'),
                noneNeeded: translatable('❌ Too many arguments! `{command.name}` doesn\'t need any arguments').withArgs<{ command: Command; }>(),
                tooMany: translatable('❌ Too many arguments! Expected at most {max} {max#plural(1:argument|arguments)}, but you gave {given}').withArgs<{ max: number; given: number; }>()
            },
            renderFailed: translatable('❌ Something went wrong while trying to render that!'),
            messageDeleted: translatable('**{user.username}#{user.discriminator}** deleted their command message.').withArgs<{ user: UserTag; }>(),
            blacklisted: translatable('❌ You have been blacklisted from the bot for the following reason: {reason}').withArgs<{ reason: string; }>(),
            roleMissing: translatable('❌ You need the role {roleIds#map(<@&{}>)#join(, | or )} in order to use this command!').withArgs<{ roleIds: Iterable<string>; }>(),
            permMissing: translatable('❌ You need {permissions#plural(1:the following permission|any of the following permissions)} to use this command:\n{permissions#join(\n)}').withArgs<{ permissions: Iterable<IFormattable<string>>; }>()
        },
        categories: {
            custom: {
                name: translatable('Custom'),
                description: translatable('Custom commands.')
            },
            general: {
                name: translatable('General'),
                description: translatable('General commands.')
            },
            nsfw: {
                name: translatable('NSFW'),
                description: translatable('Commands that can only be executed in NSFW channels.')
            },
            image: {
                name: translatable('Image'),
                description: translatable('Commands that generate or display images.')
            },
            admin: {
                name: translatable('Admin'),
                description: translatable('Powerful commands that require an `admin` role or special permissions.')
            },
            social: {
                name: translatable('Social'),
                description: translatable('Social commands for interacting with other people.')
            },
            owner: {
                name: translatable('Blargbot Owner'),
                description: translatable('MREOW MEOWWWOW! **purr**')
            },
            developer: {
                name: translatable('Blargbot Developer'),
                description: translatable('Commands that can only be executed by blargbot developers.')
            },
            staff: {
                name: translatable('Blargbot Staff'),
                description: translatable('Commands that can only be executed by staff on the official support server.')
            },
            support: {
                name: translatable('Blargbot Support'),
                description: translatable('Commands that can only be executed by support members on the official support server.')
            }
        },
        announce: {
            default: {
                description: translatable('Resets the current configuration for announcements'),
                embed: {
                    author: {
                        name: translatable('Announcement')
                    }
                },
                failed: translatable('❌ I wasn\'t able to send that message for some reason!'),
                success: translatable('✅ I\'ve sent the announcement!')
            },
            reset: {
                description: translatable('Resets the current configuration for announcements'),
                success: translatable('✅ Announcement configuration reset! Do `{prefix}announce configure` to reconfigure it.').withArgs<CommandContext>()
            },
            configure: {
                description: translatable('Resets the current configuration for announcements'),
                state: {
                    ChannelInvalid: translatable('❌ The announcement channel must be a text channel!'),
                    ChannelNotFound: translatable('❌ No channel is set up for announcements'),
                    ChannelNotInGuild: translatable('❌ The announcement channel must be on this server!'),
                    NotAllowed: translatable('❌ You cannot send announcements'),
                    RoleNotFound: translatable('❌ No role is set up for announcements'),
                    TimedOut: translatable('❌ You must configure a role and channel to use announcements!'),
                    Success: translatable('✅ Your announcements have been configured!')
                }
            },
            info: {
                description: translatable('Displays the current configuration for announcements on this server'),
                unconfigured: translatable('ℹ️ Announcements are not yet configured for this server. Please use `{prefix}announce configure` to set them up').withArgs<CommandContext>(),
                details: translatable('ℹ️ Announcements will be sent in {channel#tag=`<unconfigured>`} and will mention {role#tag=`<unconfigured>`}').withArgs<{ channel?: Eris.Channel; role?: Eris.Role; }>()
            }
        },
        autoResponse: {
            notWhitelisted: translatable('❌ Sorry, autoresponses are currently whitelisted. To request access, do `b!ar whitelist [reason]`'),
            notFoundId: translatable('❌ There isn\'t an autoresponse with id `{id}` here!').withArgs<{ id: string; }>(),
            notFoundEverything: translatable('❌ There isn\'t an everything autoresponse here!'),
            flags: {
                regex: translatable('If specified, parse as /regex/ rather than plaintext. Unsafe and very long (more than 2000 characters) regexes will not parse successfully.'),
                everything: translatable('Makes the added autoresponse respond to everything. Only one is allowed.')
            },
            whitelist: {
                description: translatable('Requests for the current server to have autoresponses whitelisted'),
                alreadyApproved: translatable('❌ This server is already whitelisted!'),
                requested: translatable('✅ Your request has been sent. Please don\'t spam this command.\n\nYou will hear back in this channel if you were accepted or rejected.')
            },
            list: {
                description: translatable('Displays information about autoresponses'),
                noAutoresponses: translatable('❌ There are no autoresponses configured for this server!'),
                embed: {
                    title: translatable('Autoresponses'),
                    field: {
                        name: translatable('Autoresponse `{id}`').withArgs<{ id: string; }>(),
                        value: {
                            regex: translatable('**Trigger regex:**\n`{trigger}`').withArgs<{ trigger: string; }>(),
                            text: translatable('**Trigger text:**\n`{trigger}`').withArgs<{ trigger: string; }>(),
                            any: translatable('**Trigger:**\neverything')
                        }
                    }
                }
            },
            info: {
                description: translatable('Displays information about an autoresponse'),
                embed: {
                    title: {
                        id: translatable('Autoresponse #{id}').withArgs<{ id: string; }>(),
                        everything: translatable('Everything Autoresponse')
                    },
                    field: {
                        trigger: {
                            name: {
                                regex: translatable('Trigger regex'),
                                text: translatable('Trigger text')
                            }
                        },
                        author: {
                            name: translatable('Author'),
                            value: translatable('<@{authorId}> ({authorId})').withArgs<{ authorId: string; }>()
                        },
                        authorizer: {
                            name: translatable('Authorizer'),
                            value: translatable('<@{authorizerId}> ({authorizerId})').withArgs<{ authorizerId: string; }>()
                        }
                    }
                }
            },
            create: {
                description: translatable('Adds a autoresponse which matches the given pattern'),
                everythingAlreadyExists: translatable('❌ An autoresponse that responds to everything already exists!'),
                everythingCannotHavePattern: translatable('❌ Autoresponses that respond to everything cannot have a pattern'),
                tooMany: translatable('❌ You already have {max} autoresponses!').withArgs<{ max: number; }>(),
                missingEFlag: translatable('❌ If you want to respond to everything, you need to use the `-e` flag.'),
                success: translatable('✅ Your autoresponse has been added! Use `{prefix}autoresponse set {id} <bbtag>` to change the code that it runs').withArgs<{ context: CommandContext; id: 'everything' | number; }>()
            },
            delete: {
                description: translatable('Deletes an autoresponse. Ids can be seen when using the `list` subcommand'),
                success: {
                    regex: translatable('✅ Autoresponse {id} (Regex: `{term}`) has been deleted').withArgs<{ id: number; term: string; }>(),
                    text: translatable('✅ Autoresponse {id} (Pattern: `{term}`) has been deleted').withArgs<{ id: number; term: string; }>(),
                    everything: translatable('✅ The everything autoresponse has been deleted!')
                }
            },
            setPattern: {
                description: translatable('Sets the pattern of an autoresponse'),
                notEmpty: translatable('❌ The pattern cannot be empty'),
                notEverything: translatable('❌ Cannot set the pattern for the everything autoresponse'),
                success: {
                    regex: translatable('✅ The pattern for autoresponse {id} has been set to (regex) `{term}`!').withArgs<{ id: number; term: string; }>(),
                    text: translatable('✅ The pattern for autoresponse {id} has been set to `{term}`!').withArgs<{ id: number; term: string; }>()
                }
            },
            set: {
                description: translatable('Sets the bbtag code to run when the autoresponse is triggered'),
                success: {
                    id: translatable('✅ Updated the code for autoresponse {id}').withArgs<{ id: number; }>(),
                    everything: translatable('✅ Updated the code for the everything autoresponse')
                }
            },
            raw: {
                description: translatable('Gets the bbtag that is executed when the autoresponse is triggered'),
                inline: {
                    id: translatable('✅ The raw code for autoresponse {id} is: ```\n{content}\n```').withArgs<{ id: number; content: string; }>(),
                    everything: translatable('✅ The raw code for the everything autoresponse is: ```\n{content}\n```').withArgs<{ content: string; }>()
                },
                attached: {
                    id: translatable('✅ The raw code for autoresponse {id} is attached').withArgs<{ id: number; }>(),
                    everything: translatable('✅ The raw code for the everything autoresponse is attached')
                }
            },
            setAuthorizer: {
                description: translatable('Sets the autoresponse to use your permissions for the bbtag when it is triggered'),
                success: {
                    id: translatable('✅ You are now the authorizer for autoresponse {id}').withArgs<{ id: number; }>(),
                    everything: translatable('✅ You are now the authorizer for the everything autoresponse')
                }
            },
            debug: {
                description: translatable('Sets the autoresponse to send you the debug output when it is next triggered by one of your messages'),
                success: {
                    id: translatable('✅ The next message that you send that triggers autoresponse {id} will send the debug output here').withArgs<{ id: number; }>(),
                    everything: translatable('✅ The next message that you send that triggers the everything autoresponse will send the debug output here')
                }
            }
        },
        ban: {
            flags: {
                reason: translatable('The reason for the (un)ban.'),
                time: translatable('If provided, the user will be unbanned after the period of time. (softban)')
            },
            default: {
                description: translatable('Bans a user, where `days` is the number of days to delete messages for.\nIf mod-logging is enabled, the ban will be logged.'),
                state: {
                    alreadyBanned: translatable('❌ **{user#tag}** is already banned!').withArgs<{ user: Eris.User; }>(),
                    memberTooHigh: translatable('❌ I don\'t have permission to ban **{user#tag}**! Their highest role is above my highest role.').withArgs<{ user: Eris.User; }>(),
                    moderatorTooLow: translatable('❌ You don\'t have permission to ban **{user#tag}**! Their highest role is above your highest role.').withArgs<{ user: Eris.User; }>(),
                    noPerms: translatable('❌ I don\'t have permission to ban **{user#tag}**! Make sure I have the `ban members` permission and try again.').withArgs<{ user: Eris.User; }>(),
                    moderatorNoPerms: translatable('❌ You don\'t have permission to ban **{user#tag}**! Make sure you have the `ban members` permission or one of the permissions specified in the `ban override` setting and try again.').withArgs<{ user: Eris.User; }>(),
                    success: translatable('✅ **{user#tag}** has been banned.').withArgs<{ user: Eris.User; }>()
                },
                unbanSchedule: {
                    success: translatable('✅ **{user#tag}** has been banned and will be unbanned **{unban#tag}**').withArgs<{ user: Eris.User; unban: Duration; }>(),
                    invalid: translatable('⚠️ **{user#tag}** has been banned, but the duration was either 0 seconds or improperly formatted so they won\'t automatically be unbanned.').withArgs<{ user: Eris.User; }>()
                }
            },
            clear: {
                description: translatable('Unbans a user.\nIf mod-logging is enabled, the ban will be logged.'),
                userNotFound: translatable('❌ I couldn\'t find that user!'),
                state: {
                    notBanned: translatable('❌ **{user#tag}** is not currently banned!').withArgs<{ user: Eris.User; }>(),
                    noPerms: translatable('❌ I don\'t have permission to unban **{user#tag}**! Make sure I have the `ban members` permission and try again.').withArgs<{ user: Eris.User; }>(),
                    moderatorNoPerms: translatable('❌ You don\'t have permission to unban **{user#tag}**! Make sure you have the `ban members` permission or one of the permissions specified in the `ban override` setting and try again.').withArgs<{ user: Eris.User; }>(),
                    success: translatable('✅ **{user#tag}** has been unbanned.').withArgs<{ user: Eris.User; }>()
                }
            }
        },
        blacklist: {
            default: {
                description: translatable('Blacklists the current channel, or the channel that you mention. The bot will not respond until you do `blacklist` again.'),
                notInServer: translatable('❌ You cannot blacklist a channel outside of this server'),
                success: {
                    added: translatable('✅ {channel#tag} is no longer blacklisted.').withArgs<{ channel: Eris.Channel; }>(),
                    removed: translatable('✅ {channel#tag} is now blacklisted').withArgs<{ channel: Eris.Channel; }>()
                }
            }
        },
        bot: {
            reset: {
                description: translatable('Resets the bot to the state it is in when joining a guild for the first time.'),
                cancelled: translatable('❌ Reset cancelled'),
                success: translatable('✅ I have been reset back to my initial configuration'),
                confirm: {
                    prompt: translatable('⚠️ Are you sure you want to reset the bot to its initial state?\nThis will:\n- Reset all settings back to their defaults\n- Delete all custom commands, autoresponses, rolemes, censors, etc\n- Delete all tag guild variables'),
                    cancel: translatable('No'),
                    continue: translatable('Yes')
                }
            }
        },
        ccommand: {
            description: translatable('Creates a custom command, using the BBTag language.\n\nCustom commands take precedent over all other commands. As such, you can use it to overwrite commands, or disable them entirely. If the command content is "null" (without the quotations), blargbot will have no output whatsoever, allowing you to disable any built-in command you wish. You cannot overwrite the \'ccommand\' command. For more in-depth command customization, see the `editcommand` command.\nFor more information about BBTag, visit <{subtags}>.\nBy creating a custom command, you acknowledge that you agree to the Terms of Service (<{tos}>)').withArgs<{ subtags: string; tos: string; }>(),
            request: {
                name: translatable('Enter the name of the custom command:'),
                content: translatable('Enter the custom command\'s contents:')
            },
            errors: {
                isAlias: translatable('❌ The command `{commandName}` is an alias to the tag `{tagName}`').withArgs<{ commandName: string; tagName: string; }>(),
                alreadyExists: translatable('❌ The `{name}` custom command already exists!').withArgs<{ name: string; }>(),
                doesNotExist: translatable('❌ The `{name}` custom command doesn\'t exist!').withArgs<{ name: string; }>(),
                isHidden: translatable('❌ The `{name}` custom command is a hidden command!').withArgs<{ name: string; }>(),
                invalidBBTag: translatable('❌ There were errors with the bbtag you provided!\n{errors#join(\n)}').withArgs<{ errors: Iterable<IFormattable<string>>; }>(),
                bbtagError: translatable('❌ [{location.line},{location.column}]: {message}').withArgs<AnalysisResult>(),
                bbtagWarning: translatable('❌ [{location.line},{location.column}]: {message}').withArgs<AnalysisResult>(),
                nameReserved: translatable('❌ The command name `{name}` is reserved and cannot be overwritten').withArgs<{ name: string; }>(),
                tooLong: translatable('❌ Command names cannot be longer than {max} characters').withArgs<{ max: number; }>(),
                importDeleted: translatable('❌ When the command `{commandName}` was imported, the tag `{tagName}` was owned by **{author.username}#{author.discriminator}** ({authorId}) but it no longer exists. To continue using this command, please re-create the tag and re-import it.').withArgs<{ commandName: string; tagName: string; author?: UserTag; authorId: string; }>(),
                importChanged: translatable('❌ When the command `{commandName}` was imported, the tag `{tagName}` was owned by **{oldAuthor.username}#{oldAuthor.discriminator}** ({oldAuthorId}) but it is now owned by **{newAuthor.username}#{newAuthor.discriminator}** ({newAuthorId}). If this is acceptable, please re-import the tag to continue using this command.').withArgs<{ commandName: string; tagName: string; oldAuthor?: UserTag; oldAuthorId: string; newAuthor?: UserTag; newAuthorId: string; }>()
            },
            test: {
                default: {
                    description: translatable('Uses the BBTag engine to execute the content as if it was a custom command')
                },
                debug: {
                    description: translatable('Uses the BBTag engine to execute the content as if it was a custom command and will return the debug output')
                }
            },
            docs: {
                description: translatable('Returns helpful information about the specified topic.')
            },
            debug: {
                description: translatable('Runs a custom command with some arguments. A debug file will be sent in a DM after the command has finished.'),
                notOwner: translatable('❌ You cannot debug someone else\'s custom command.'),
                success: translatable('ℹ️ Ive sent the debug output in a DM')
            },
            create: {
                description: translatable('Creates a new custom command with the content you give'),
                success: translatable('✅ Custom command `{name}` created.\n{errors#join(\n)}').withArgs<{ name: string; errors: Iterable<IFormattable<string>>; }>()
            },
            edit: {
                description: translatable('Edits an existing custom command to have the content you specify'),
                success: translatable('✅ Custom command `{name}` edited.\n{errors#join(\n)}').withArgs<{ name: string; errors: Iterable<IFormattable<string>>; }>()
            },
            set: {
                description: translatable('Sets the custom command to have the content you specify. If the custom command doesn\'t exist it will be created.'),
                success: translatable('✅ Custom command `{name}` set.\n{errors#join(\n)}').withArgs<{ name: string; errors: Iterable<IFormattable<string>>; }>()
            },
            delete: {
                description: translatable('Deletes an existing custom command'),
                success: translatable('✅ The `{name}` custom command is gone forever!').withArgs<{ name: string; }>()
            },
            rename: {
                description: translatable('Renames the custom command'),
                enterOldName: translatable('Enter the name of the custom command to rename:'),
                enterNewName: translatable('Enter the new name of the custom command:'),
                success: translatable('✅ The `{oldName}` custom command has been renamed to `{newName}`.').withArgs<{ oldName: string; newName: string; }>()
            },
            raw: {
                description: translatable('Gets the raw content of the custom command'),
                inline: translatable('ℹ️ The raw code for {name} is: ```\n{content}\n```').withArgs<{ name: string; content: string; }>(),
                attached: translatable('ℹ️ The raw code for {name} is attached').withArgs<{ name: string; }>()
            },
            list: {
                description: translatable('Lists all custom commands on this server'),
                embed: {
                    title: translatable('List of custom commands'),
                    field: {
                        anyRole: {
                            name: translatable('Any role')
                        }
                    }
                }
            },
            cooldown: {
                description: translatable('Sets the cooldown of a custom command, in milliseconds'),
                mustBePositive: translatable('❌ The cooldown must be greater than 0ms'),
                success: translatable('✅ The custom command `{name}` now has a cooldown of `{cooldown#duration(MS)}ms`.').withArgs<{ name: string; cooldown: Duration; }>()
            },
            author: {
                description: translatable('Displays the name of the custom command\'s author'),
                noAuthorizer: translatable('✅ The custom command `{name}` was made by **{author#tag}**').withArgs<{ name: string; author?: UserTag; }>(),
                withAuthorizer: translatable('✅ The custom command `{name}` was made by **{author#tag}** and is authorized by **{authorizer#tag}**').withArgs<{ name: string; author?: UserTag; authorizer?: UserTag; }>()
            },
            flag: {
                updated: translatable('✅ The flags for `{name}` have been updated.').withArgs<{ name: string; }>(),
                get: {
                    description: translatable('Lists the flags the custom command accepts'),
                    none: translatable('❌ The `{name}` custom command has no flags.').withArgs<{ name: string; }>(),
                    success: translatable('✅ The `{name}` custom command has the following flags:\n\n{flags#map(`-{flag}`/`--{word}`: {description})#join(\n)}').withArgs<{ name: string; flags: Iterable<FlagDefinition<string>>; }>()
                },
                create: {
                    description: translatable('Adds multiple flags to your custom command. Flags should be of the form `-<f> <flag> [flag description]`\ne.g. `b!cc flags add myCommand -c category The category you want to use -n name Your name`'),
                    wordMissing: translatable('❌ No word was specified for the `{flag}` flag').withArgs<{ flag: string; }>(),
                    flagExists: translatable('❌ The flag `{flag}` already exists!').withArgs<{ flag: string; }>(),
                    wordExists: translatable('❌ A flag with the word `{word}` already exists!').withArgs<{ word: string; }>()
                },
                delete: {
                    description: translatable('Removes multiple flags from your custom command. Flags should be of the form `-<f>`\ne.g. `b!cc flags remove myCommand -c -n`')
                }
            },
            setHelp: {
                description: translatable('Sets the help text to show for the command'),
                success: translatable('✅ Help text for custom command `{name}` set.').withArgs<{ name: string; }>()
            },
            hide: {
                description: translatable('Toggles whether the command is hidden from the command list or not'),
                success: translatable('✅ Custom command `{name}` is now {hidden#bool(hidden|visible)}.').withArgs<{ name: string; hidden: boolean; }>()
            },
            setRole: {
                description: translatable('Sets the roles that are allowed to use the command'),
                success: translatable('✅ Roles for custom command `{name}` set to {roles#map({mention})#join(, | and )}.').withArgs<{ name: string; roles: Iterable<Eris.Role>; }>()
            },
            shrinkwrap: {
                description: translatable('Bundles up the given commands into a single file that you can download and install into another server'),
                confirm: {
                    prompt: translatable('Salutations! You have discovered the super handy ShrinkWrapper9000!\n\nIf you decide to proceed, this will:\n{steps#join(\n)}\nThis will not:\n - Export variables\n - Export authors or authorizers\n - Export dependencies').withArgs<{ steps: Iterable<IFormattable<string>>; }>(),
                    export: translatable(' - Export the custom command `{name}`').withArgs<{ name: string; }>(),
                    continue: translatable('Confirm'),
                    cancel: translatable('Cancel')
                },
                cancelled: translatable('✅ Maybe next time then.'),
                success: translatable('✅ No problem, my job here is done.')
            },
            install: {
                description: translatable('Bundles up the given commands into a single file that you can download and install into another server'),
                fileMissing: translatable('❌ You have to upload the installation file, or give me a URL to one.'),
                malformed: translatable('❌ Your installation file was malformed.'),
                confirm: {
                    unsigned: translatable('⚠️ **Warning**: This installation file is **unsigned**. It did not come from me. Please double check to make sure you want to go through with this.\n\n'),
                    tampered: translatable('⚠️ **Warning**: This installation file\'s signature is **incorrect**. There is a 100% chance that it has been tampered with. Please double check to make sure you want to go through with this.\n\n'),
                    prompt: translatable('{warning}Salutations! You have discovered the super handy CommandInstaller9000!\n\nIf you decide to proceed, this will:\n{steps#join(\n)}\nThis will also:\n - Set you as the author for all imported commands').withArgs<{ warning?: IFormattable<string>; steps: Iterable<IFormattable<string>>; }>(),
                    import: translatable('✅ Import the command `{name}`').withArgs<{ name: string; }>(),
                    skip: translatable('❌ Ignore the command `{name}` as a command with that name already exists').withArgs<{ name: string; }>(),
                    continue: translatable('Confirm'),
                    cancel: translatable('Cancel')
                },
                cancelled: translatable('✅ Maybe next time then.'),
                success: translatable('✅ No problem, my job here is done.')
            },
            import: {
                description: translatable('Imports a tag as a ccommand, retaining all data such as author variables'),
                tagMissing: translatable('❌ The `{name}` tag doesn\'t exist!').withArgs<{ name: string; }>(),
                success: translatable('✅ The tag `{tagName}` by **{author#tag}** has been imported as `{commandName}` and is authorized by **{authorizer#tag}**').withArgs<{ tagName: string; commandName: string; author?: UserTag; authorizer?: UserTag; }>()
            }
        },
        censor: {
            flags: {
                regex: translatable('If specified, parse as /regex/ rather than plaintext. Unsafe and very long (more than 2000 characters) regexes will not parse successfully.'),
                decancer: translatable('If specified, perform the censor check against the decancered version of the message.'),
                weight: translatable('How many incidents the censor is worth.'),
                reason: translatable('A custom modlog reason. NOT BBTag compatible.')
            },
            errors: {
                doesNotExist: translatable('❌ Censor `{id}` doesn\'t exist').withArgs<{ id: number; }>(),
                weightNotNumber: translatable('❌ The censor weight must be a number but `{value}` is not').withArgs<{ value: string; }>(),
                invalidType: translatable('❌ `{type}` is not a valid type').withArgs<{ type: string; }>(),
                messageNotSet: {
                    default: translatable('❌ A custom default {type} message has not been set yet').withArgs<{ type: string; }>(),
                    id: translatable('❌ A custom {type} message for censor {id} has not been set yet').withArgs<{ type: string; id: number; }>()
                }
            },
            add: {
                description: translatable('Creates a censor using the given phrase'),
                success: translatable('✅ Censor `{id}` has been created').withArgs<{ id: number; }>()
            },
            edit: {
                description: translatable('Updates a censor'),
                success: translatable('✅ Censor `{id}` has been updated').withArgs<{ id: number; }>()
            },
            delete: {
                description: translatable('Deletes a censor'),
                success: translatable('✅ Censor `{id}` has been deleted').withArgs<{ id: number; }>()
            },
            exception: {
                user: {
                    description: translatable('Adds or removes a user from the list of users which all censors ignore'),
                    success: translatable('✅ {user#tag} is now exempt from all censors').withArgs<{ user: Eris.User; }>()
                },
                role: {
                    description: translatable('Adds or removes a role from the list of roles which all censors ignore'),
                    success: translatable('✅ Anyone with the role {role#tag} is now exempt from all censors').withArgs<{ role: Eris.Role; }>()
                },
                channel: {
                    description: translatable('Adds or removes a channel from the list of channels which all censors ignore'),
                    notOnServer: translatable('❌ The channel must be on this server!'),
                    success: translatable('✅ Messages sent in {channel#tag} are now exempt from all censors').withArgs<{ channel: Eris.Channel; }>()
                }
            },
            setMessage: {
                description: translatable('Sets the message so show when the given censor causes a user to be granted a `timeout`, or to be `kick`ed or `ban`ned, or the message is `delete`d\nIf `id` is not provided, the message will be the default message that gets shown if one isn\'t set for the censor that is triggered'),
                success: {
                    default: translatable('✅ The default {type} message has been set').withArgs<{ type: string; }>(),
                    id: translatable('✅ The {type} message for censor {id} has been set').withArgs<{ type: string; id: number; }>()
                }
            },
            setAuthorizer: {
                description: translatable('Sets the custom censor message to use your permissions when executing.'),
                success: {
                    default: translatable('✅ The default {type} message authorizer has been set').withArgs<{ type: string; }>(),
                    id: translatable('✅ The {type} message authorizer for censor {id} has been set').withArgs<{ type: string; id: number; }>()
                }
            },
            rawMessage: {
                description: translatable('Gets the raw code for the given censor'),
                inline: {
                    default: translatable('ℹ️ The raw code for the default {type} message is: ```\n{content}\n```').withArgs<{ type: string; content: string; }>(),
                    id: translatable('ℹ️ The raw code for the {type} message for censor `{id}` is: ```\n{content}\n```').withArgs<{ type: string; id: number; content: string; }>()
                },
                attached: {
                    default: translatable('ℹ️ The raw code for the default {type} message is attached').withArgs<{ type: string; }>(),
                    id: translatable('ℹ️ The raw code for the {type} message for censor `{id}` is attached').withArgs<{ type: string; id: number; }>()
                }
            },
            debug: {
                description: translatable('Sets the censor to send you the debug output when it is next triggered by one of your messages. Make sure you aren\'t exempt from censors!'),
                success: translatable('✅ The next message that you send that triggers censor `{id}` will send the debug output here').withArgs<{ id: number; }>()
            },
            list: {
                description: translatable('Lists all the details about the censors that are currently set up on this server'),
                embed: {
                    title: translatable('ℹ️ Censors'),
                    description: {
                        value: translatable('{censors#join(\n)}').withArgs<{ censors: Iterable<IFormattable<string>>; }>(),
                        censor: {
                            regex: translatable('**Censor** `{id}` (Regex): {term}').withArgs<{ id: number; term: string; }>(),
                            text: translatable('**Censor** `{id}`: {term}').withArgs<{ id: number; term: string; }>()
                        },
                        none: translatable('No censors configured')
                    },
                    field: {
                        users: {
                            name: translatable('Excluded users'),
                            value: translatable('{users#plural(0:None|{#map(<@{}>)#join( )})}').withArgs<{ users: Iterable<string>; }>()
                        },
                        roles: {
                            name: translatable('Excluded roles'),
                            value: translatable('{roles#plural(0:None|{#map(<@&{}>)#join( )})}').withArgs<{ roles: Iterable<string>; }>()
                        },
                        channels: {
                            name: translatable('Excluded channels'),
                            value: translatable('{channels#plural(0:None|{#map(<#{}>)#join( )})}').withArgs<{ channels: Iterable<string>; }>()
                        }
                    }
                }
            },
            info: {
                description: translatable('Gets detailed information about the given censor'),
                messageFieldValue: {
                    notSet: translatable('Not set'),
                    set: translatable('Author: <@{authorId}>\nAuthorizer: <@{authorizerId}>').withArgs<{ authorId: string; authorizerId: string; }>()
                },
                embed: {
                    title: translatable('ℹ️ Censor `{id}`').withArgs<{ id: number; }>(),
                    field: {
                        trigger: {
                            name: {
                                regex: translatable('Trigger (Regex)'),
                                text: translatable('Trigger')
                            }
                        },
                        weight: {
                            name: translatable('Weight'),
                            value: translatable('{weight}').withArgs<{ weight: number; }>()
                        },
                        reason: {
                            name: translatable('Reason'),
                            value: translatable('{reason=Not set}').withArgs<{ reason?: string; }>()
                        },
                        deleteMessage: {
                            name: translatable('Delete message')
                        },
                        timeoutMessage: {
                            name: translatable('Timeout message')
                        },
                        kickMessage: {
                            name: translatable('Kick message')
                        },
                        banMessage: {
                            name: translatable('Ban message')
                        }
                    }
                }
            }
        },
        changeLog: {
            errors: {
                missingPermissions: translatable('❌ I need the manage webhooks permission to subscribe this channel to changelogs!')
            },
            subscribe: {
                description: translatable('Subscribes this channel to my changelog updates. I require the `manage webhooks` permission for this.'),
                alreadySubscribed: translatable('ℹ️ This channel is already subscribed to my changelog updates!'),
                success: translatable('✅ This channel will now get my changelog updates!')
            },
            unsubscribe: {
                description: translatable('Unsubscribes this channel from my changelog updates. I require the `manage webhooks` permission for this.'),
                notSubscribed: translatable('ℹ️ This channel is not subscribed to my changelog updates!'),
                success: translatable('✅ This channel will no longer get my changelog updates!')
            }
        },
        editCommand: {
            list: {
                description: translatable('Shows a list of modified commands'),
                none: translatable('ℹ️ You haven\'t modified any commands'),
                embed: {
                    title: translatable('ℹ️ Edited commands'),
                    description: {
                        name: translatable('**{name}**\n').withArgs<{ name: string; }>(),
                        roles: translatable('- Roles: {roles#map({mention})#join(, )}\n').withArgs<{ roles: Iterable<Eris.Role>; }>(),
                        permissions: translatable('- Permission: {permission}\n').withArgs<{ permission: string; }>(),
                        disabled: translatable('- Disabled\n'),
                        hidden: translatable('- Hidden\n'),
                        template: translatable('{commands#map({name}{roles}{permissions}{disabled}{hidden})#join()}').withArgs<{ commands: Iterable<{ name: IFormattable<string>; roles?: IFormattable<string>; permissions?: IFormattable<string>; disabled?: IFormattable<string>; hidden?: IFormattable<string>; }>; }>()
                    }
                }
            },
            setRole: {
                description: translatable('Sets the role required to run the listed commands'),
                removed: translatable('✅ Removed the role requirement for the following commands:```fix\n{commands#join(, )}\n```').withArgs<{ commands: Iterable<string>; }>(),
                set: translatable('✅ Set the role requirement for the following commands:```fix\n{commands#join(, )}\n```').withArgs<{ commands: Iterable<string>; }>()
            },
            setPermissions: {
                description: translatable('Sets the permissions required to run the listed commands. If a user has any of the permissions, they will be able to use the command.'),
                removed: translatable('✅ Removed the permissions for the following commands:```fix\n{commands#join(, )}\n```').withArgs<{ commands: Iterable<string>; }>(),
                set: translatable('✅ Set the permissions for the following commands:```fix\n{commands#join(, )}\n```').withArgs<{ commands: Iterable<string>; }>()
            },
            disable: {
                description: translatable('Disables the listed commands, so no one but the owner can use them'),
                success: translatable('✅ Disabled the following commands:```fix\n{commands#join(, )}\n```').withArgs<{ commands: Iterable<string>; }>()
            },
            enable: {
                description: translatable('Enables the listed commands, allowing anyone with the correct permissions or roles to use them'),
                success: translatable('✅ Enabled the following commands:```fix\n{commands#join(, )}\n```').withArgs<{ commands: Iterable<string>; }>()
            },
            hide: {
                description: translatable('Hides the listed commands. They can still be executed, but wont show up in help'),
                success: translatable('✅ The following commands are now hidden:```fix\n{commands#join(, )}\n```').withArgs<{ commands: Iterable<string>; }>()
            },
            show: {
                description: translatable('Reveals the listed commands in help'),
                success: translatable('✅ The following commands are no longer hidden:```fix\n{commands#join(, )}\n```').withArgs<{ commands: Iterable<string>; }>()
            }
        },
        farewell: {
            errors: {
                notSet: translatable('❌ No farewell message has been set yet!')
            },
            set: {
                description: translatable('Sets the bbtag to send when someone leaves the server'),
                success: translatable('✅ The farewell message has been set')
            },
            raw: {
                description: translatable('Gets the current message that will be sent when someone leaves the server'),
                inline: translatable('ℹ️ The raw code for the farewell message is: ```\n{content}\n```').withArgs<{ content: string; }>(),
                attached: translatable('ℹ️ The raw code for the farewell message is attached')
            },
            setAuthorizer: {
                description: translatable('Sets the farewell message to use your permissions when running'),
                success: translatable('✅ The farewell message will now run using your permissions')
            },
            setChannel: {
                description: translatable('Sets the channel the farewell message will be sent in.'),
                notOnGuild: translatable('❌ The farewell channel must be on this server!'),
                notTextChannel: translatable('❌ The farewell channel must be a text channel!'),
                success: translatable('✅ Farewell messages will now be sent in {mention}').withArgs<{ channel: Eris.Channel; }>()
            },
            debug: {
                description: translatable('Executes the farewell message as if you left the server and provides the debug output.'),
                channelMissing: translatable('❌ I wasn\'t able to locate a channel to sent the message in!'),
                success: translatable('ℹ️ Ive sent the debug output in a DM')
            },
            delete: {
                description: translatable('Deletes the current farewell message.'),
                success: translatable('✅ Farewell messages will no longer be sent')
            },
            info: {
                description: translatable('Shows information about the current farewell message'),
                success: translatable('ℹ️ The current farewell was last edited by <@{authorId}> ({authorId}) and is authorized by <@{authorizerId}> ({authorizerId})').withArgs<{ authorId: string; authorizerId: string; }>()
            }
        },
        greeting: {
            errors: {
                notSet: translatable('❌ No greeting message has been set yet!')
            },
            set: {
                description: translatable('Sets the message to send when someone joins the server'),
                success: translatable('✅ The greeting message has been set')
            },
            raw: {
                description: translatable('Gets the current message that will be sent when someone joins the server'),
                inline: translatable('ℹ️ The raw code for the greeting message is: \n{content}\n```').withArgs<{ content: string; }>(),
                attached: translatable('ℹ️ The raw code for the greeting message is attached')
            },
            setAuthorizer: {
                description: translatable('Sets the greeting message to use your permissions when running'),
                success: translatable('✅ The greeting message will now run using your permissions')
            },
            setChannel: {
                description: translatable('Sets the channel the greeting message will be sent in.'),
                notOnGuild: translatable('❌ The greeting channel must be on this server!'),
                notTextChannel: translatable('❌ The greeting channel must be a text channel!'),
                success: translatable('✅ Greeting messages will now be sent in {mention}').withArgs<{ channel: Eris.Channel; }>()
            },
            debug: {
                description: translatable('Executes the greeting message as if you left the server and provides the debug output.'),
                channelMissing: translatable('❌ I wasn\'t able to locate a channel to sent the message in!'),
                success: translatable('ℹ️ Ive sent the debug output in a DM')
            },
            delete: {
                description: translatable('Deletes the current greeting message.'),
                success: translatable('✅ Greeting messages will no longer be sent')
            },
            info: {
                description: translatable('Shows information about the current greeting message'),
                success: translatable('ℹ️ The current greeting was last edited by <@{authorId}> ({authorId}) and is authorized by <@{authorizerId}> ({authorizerId})').withArgs<{ authorId: string; authorizerId: string; }>()
            }
        },
        interval: {
            errors: {
                notSet: translatable('❌ No interval has been set yet!')
            },
            set: {
                description: translatable('Sets the bbtag to run every 15 minutes'),
                success: translatable('✅ The interval has been set')
            },
            raw: {
                description: translatable('Gets the current code that the interval is running'),
                inline: translatable('ℹ️ The raw code for the interval is: ```\n{content}\n```').withArgs<{ content: string; }>(),
                attached: translatable('ℹ️ The raw code for the interval is attached')
            },
            delete: {
                description: translatable('Deletes the current interval'),
                success: translatable('✅ The interval has been deleted')
            },
            setAuthorizer: {
                description: translatable('Sets the interval to run using your permissions'),
                success: translatable('✅ Your permissions will now be used when the interval runs')
            },
            debug: {
                description: translatable('Runs the interval now and sends the debug output'),
                failed: translatable('❌ There was an error while running the interval!'),
                authorizerMissing: translatable('❌ I couldn\'t find the user who authorizes the interval!'),
                channelMissing: translatable('❌ I wasn\'t able to figure out which channel to run the interval in!'),
                timedOut: translatable('❌ The interval took longer than the max allowed time ({max#duration(S)}s)').withArgs<{ max: Duration; }>(),
                success: translatable('ℹ️ Ive sent the debug output in a DM')
            },
            info: {
                description: translatable('Shows information about the current interval'),
                success: translatable('ℹ️ The current interval was last edited by <@{authorId}> ({authorId}) and is authorized by <@{authorizerId}> ({authorizerId})').withArgs<{ authorId: string; authorizerId: string; }>()
            }
        },
        kick: {
            flags: {
                reason: translatable('The reason for the kick.')
            },
            default: {
                description: translatable('Kicks a user.\nIf mod-logging is enabled, the kick will be logged.'),
                state: {
                    memberTooHigh: translatable('❌ I don\'t have permission to kick **{user#tag}**! Their highest role is above my highest role.').withArgs<{ user: Eris.User; }>(),
                    moderatorTooLow: translatable('❌ You don\'t have permission to kick **{user#tag}**! Their highest role is above your highest role.').withArgs<{ user: Eris.User; }>(),
                    noPerms: translatable('❌ I don\'t have permission to kick **{user#tag}**! Make sure I have the `kick members` permission and try again.').withArgs<{ user: Eris.User; }>(),
                    moderatorNoPerms: translatable('❌ You don\'t have permission to kick **{user#tag}**! Make sure you have the `kick members` permission or one of the permissions specified in the `kick override` setting and try again.').withArgs<{ user: Eris.User; }>(),
                    success: translatable('✅ **{user#tag}** has been kicked.').withArgs<{ user: Eris.User; }>()
                }
            }
        },
        log: {
            common: {
                events: {
                    avatarupdate: translatable('Triggered when someone changes their username'),
                    kick: translatable('Triggered when a member is kicked'),
                    memberban: translatable('Triggered when a member is banned'),
                    memberjoin: translatable('Triggered when someone joins'),
                    memberleave: translatable('Triggered when someone leaves'),
                    membertimeout: translatable('Triggered when someone is timed out'),
                    membertimeoutclear: translatable('Triggered when someone\'s timeout is removed'),
                    memberunban: translatable('Triggered when someone is unbanned'),
                    messagedelete: translatable('Triggered when someone deletes a message they sent'),
                    messageupdate: translatable('Triggered when someone updates a message they sent'),
                    nameupdate: translatable('Triggered when someone changes their username or discriminator'),
                    nickupdate: translatable('Triggered when someone changes their nickname')
                }
            },
            list: {
                description: translatable('Lists all the events currently being logged'),
                embed: {
                    field: {
                        ignore: {
                            name: translatable('Ignored users'),
                            value: translatable('{userIds#plural(0:No ignored users|{#map(<@{}> ({}))#join(\n)})}').withArgs<{ userIds: Iterable<string>; }>()
                        },
                        current: {
                            name: translatable('Currently logged events'),
                            value: {
                                event: translatable('**{event}** - <#{channelId}>}').withArgs<{ event: string; channelId: string; }>(),
                                role: translatable('**{roleId}** - <#{channelId}>}').withArgs<{ roleId: string; channelId: string; }>(),
                                template: translatable('{entries#plural(0:No logged events|{#join(\n)})}').withArgs<{ entries: Iterable<IFormattable<string>>; }>()
                            }
                        }
                    }
                }
            },
            enable: {
                description: {
                    default: translatable('Sets the channel to log the given events to. Available events are:\n{events#map(`{key}` - {desc})#join(\n)}').withArgs<{ events: Iterable<{ key: string; desc: IFormattable<string>; }>; }>(),
                    all: translatable('Sets the channel to log all events to, except role related events.'),
                    role: translatable('Sets the channel to log when someone gets or loses a role.')
                },
                notOnGuild: translatable('❌ The log channel must be on this server!'),
                notTextChannel: translatable('❌ The log channel must be a text channel!'),
                eventInvalid: translatable('❌ {events#join(, | and )} {events#plural(1:is not a valid event|are not valid events)}').withArgs<{ events: Iterable<string>; }>(),
                success: translatable('✅ I will now log the following events in {channel#tag}:\n{events#join(\n)}').withArgs<{ channel: Eris.Channel; events: Iterable<string>; }>()
            },
            disable: {
                description: {
                    default: translatable('Disables logging of the given events. Available events are:\n{events#map(`{key}` - {desc})#join(\n)}').withArgs<{ events: Iterable<{ key: string; desc: IFormattable<string>; }>; }>(),
                    all: translatable('Disables logging of all events except role related events.'),
                    role: translatable('Stops logging when someone gets or loses a role.')
                },
                success: translatable('✅ I will no longer log the following events:\n{events#join(\n)}').withArgs<{ events: Iterable<string>; }>()
            },
            ignore: {
                description: translatable('Ignores any tracked events concerning the users'),
                success: translatable('✅ I will now ignore events from {senderIds#map(<@{}>)#join(, | and )}').withArgs<{ senderIds: Iterable<string>; }>()
            },
            track: {
                description: translatable('Removes the users from the list of ignored users and begins tracking events from them again'),
                success: translatable('✅ I will no longer ignore events from {senderIds#map(<@{}>)#join(, | and )}').withArgs<{ senderIds: Iterable<string>; }>()
            }
        },
        logs: {
            flags: {
                type: translatable('The type(s) of message. Value can be CREATE, UPDATE, and/or DELETE, separated by commas.'),
                channel: translatable('The channel to retrieve logs from. Value can be a channel ID or a channel mention.'),
                user: translatable('The user(s) to retrieve logs from. Value can be a username, nickname, mention, or ID. This uses the user lookup system.'),
                create: translatable('Get message creates.'),
                update: translatable('Get message updates.'),
                delete: translatable('Get message deletes.'),
                json: translatable('Returns the logs in a json file rather than on a webpage.')
            },
            default: {
                description: translatable('Creates a chatlog page for a specified channel, where `number` is the amount of lines to get. You can retrieve a maximum of 1000 logs. For more specific logs, you can specify flags.\nFor example, if you wanted to get 100 messages `stupid cat` deleted, you would do this:\n`logs 100 --type delete --user stupid cat`\nIf you want to use multiple of the same type, separate parameters with commas or chain them together. For example:\n`logs 100 -CU -u stupid cat, dumb cat`'),
                chatlogsDisabled: translatable('❌ This guild has not opted into chatlogs. Please do `{prefix}settings set makelogs true` to allow me to start creating chatlogs.').withArgs<{ prefix: string; }>(),
                tooManyLogs: translatable('❌ You cant get more than 1000 logs at a time'),
                notEnoughLogs: translatable('❌ A minimum of 1 chatlog entry must be requested'),
                channelMissing: translatable('❌ I couldn\'t find the channel `{channel}`').withArgs<{ channel: string; }>(),
                notOnGuild: translatable('❌ The channel must be on this guild!'),
                noPermissions: translatable('❌ You do not have permissions to look at that channels message history!'),
                userMissing: translatable('❌ I couldn\'t find the user `{user}`').withArgs<{ user: string; }>(),
                generating: translatable('ℹ️ Generating your logs...'),
                sendFailed: translatable('❌ I wasn\'t able to send the message containing the logs!'),
                pleaseWait: translatable('ℹ️ Generating your logs...\nThis seems to be taking longer than usual. I\'ll ping you when I\'m finished.'),
                generated: {
                    link: {
                        quick: translatable('✅ Your logs are available here: {link}').withArgs<{ link: string; }>(),
                        slow: translatable('✅ Sorry that took so long, {user#tag}.\nYour logs are available here: {link}').withArgs<{ user: Eris.User; link: string; }>()
                    },
                    json: {
                        quick: translatable('✅ Here are your logs, in a JSON file!'),
                        slow: translatable('✅ Sorry that took so long, {user#tag}.\nHere are your logs, in a JSON file!').withArgs<{ user: Eris.User; }>()
                    }
                }
            }
        },
        massBan: {
            flags: {
                reason: translatable('The reason for the ban.')
            },
            default: {
                description: translatable('Bans a user who isn\'t currently on your guild, where `<userIds...>` is a list of user IDs or mentions (separated by spaces) and `days` is the number of days to delete messages for.\nIf mod-logging is enabled, the ban will be logged.'),
                state: {
                    alreadyBanned: translatable('❌ All those users are already banned!'),
                    memberTooHigh: translatable('❌ I don\'t have permission to ban any of those users! Their highest roles are above my highest role.'),
                    moderatorTooLow: translatable('❌ You don\'t have permission to ban any of those users! Their highest roles are above your highest role.'),
                    noPerms: translatable('❌ I don\'t have permission to ban anyone! Make sure I have the `ban members` permission and try again.'),
                    moderatorNoPerms: translatable('❌ You don\'t have permission to ban anyone! Make sure you have the `ban members` permission or one of the permissions specified in the `ban override` setting and try again.'),
                    noUsers: translatable('❌ None of the user ids you gave were valid users!')
                },
                success: translatable('✅ The following user(s) have been banned:\n{users#map(`{#tag}`)#join(\n)}').withArgs<{ users: Iterable<Eris.User>; }>()
            }
        },
        modLog: {
            setChannel: {
                description: translatable('Sets the channel to use as the modlog channel'),
                notOnGuild: translatable('❌ The modlog channel must be on this server!'),
                notTextChannel: translatable('❌ The modlog channel must be a text channel!'),
                success: translatable('✅ Modlog entries will now be sent in {channel#tag}').withArgs<{ channel: Eris.Channel; }>()
            },
            disable: {
                description: translatable('Disables the modlog'),
                success: translatable('✅ The modlog is disabled')
            },
            clear: {
                description: translatable('Deletes specific modlog entries. If you don\'t provide any, all the entries will be removed'),
                notFound: translatable('❌ No modlogs were found!'),
                channelMissing: translatable('\n⛔ I couldn\'t find the modlog channel for cases {modlogs#map(`{}`)#join(, | and )}').withArgs<{ modlogs: Iterable<number>; }>(),
                messageMissing: translatable('\n⛔ I couldn\'t find the modlog message for cases {modlogs#map(`{}`)#join(, | and )}').withArgs<{ modlogs: Iterable<number>; }>(),
                permissionMissing: translatable('\n⛔ I didn\'t have permission to delete the modlog for cases {modlogs#map(`{}`)#join(, | and )}').withArgs<{ modlogs: Iterable<number>; }>(),
                success: translatable('✅ I successfully deleted {count} {count#plural(1:modlog|modlogs)} from my database.{errors#join()}').withArgs<{ count: number; errors: Iterable<IFormattable<string>>; }>()
            }
        },
        mute: {
            flags: {
                reason: translatable('The reason for the (un)mute.'),
                time: translatable('The amount of time to mute for, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d2h3m4s\', or some other combination.')
            },
            default: {
                description: translatable('Gives the user a special muted role. On first run, this role will be created. The bot needs to be able to `manage roles` to create and assign the role, and `manage channels` to configure the role. You are able to manually configure the role without the bot, but the bot has to make it. Deleting the muted role causes it to be regenerated.\nIf the bot has permissions for it, this command will also voice-mute the user.\nIf mod-logging is enabled, the mute will be logged.\nYou can also specify a length of time the user should be muted for, using formats such as `1 hour 2 minutes` or `1h2m`.'),
                createPermsMissing: translatable('❌ I don\'t have enough permissions to create a `muted` role! Make sure I have the `manage roles` permission and try again.'),
                configurePermsMissing: translatable('❌ I created a `muted` role, but don\'t have permissions to configure it! Either configure it yourself, or make sure I have the `manage channel` permission, delete the `muted` role, and try again.'),
                state: {
                    alreadyMuted: translatable('❌ {user#tag} is already muted').withArgs<{ user: Eris.User; }>(),
                    noPerms: translatable('❌ I don\'t have permission to mute users! Make sure I have the `manage roles` permission and try again.'),
                    moderatorNoPerms: translatable('❌ You don\'t have permission to mute users! Make sure you have the `manage roles` permission and try again.'),
                    roleMissing: translatable('❌ The muted role has been deleted! Please re-run this command to create a new one.'),
                    roleTooHigh: translatable('❌ I can\'t assign the muted role! (it\'s higher than or equal to my top role)'),
                    moderatorTooLow: translatable('❌ You can\'t assign the muted role! (it\'s higher than or equal to your top role)')

                },
                success: {
                    default: translatable('✅ **{user#tag}** has been muted').withArgs<{ user: Eris.User; }>(),
                    durationInvalid: translatable('⚠️ **{user#tag}** has been muted, but the duration was either 0 seconds or improperly formatted so they won\'t automatically be unmuted.').withArgs<{ user: Eris.User; }>(),
                    temporary: translatable('✅ **{user#tag}** has been muted and will be unmuted **{unmute#tag}**').withArgs<{ user: Eris.User; unmute: Duration; }>()
                }
            },
            clear: {
                description: translatable('Removes the special muted role from the user. \nIf mod-logging is enabled, the mute will be logged.'),
                state: {
                    notMuted: translatable('❌ {user#tag} is not currently muted').withArgs<{ user: Eris.User; }>(),
                    noPerms: translatable('❌ I don\'t have permission to unmute users! Make sure I have the `manage roles` permission and try again.'),
                    moderatorNoPerms: translatable('❌ You don\'t have permission to unmute users! Make sure you have the `manage roles` permission and try again.'),
                    roleTooHigh: translatable('❌ I can\'t revoke the muted role! (it\'s higher than or equal to my top role)'),
                    moderatorTooLow: translatable('❌ You can\'t revoke the muted role! (it\'s higher than or equal to your top role)'),
                    success: translatable('✅ **{user#tag}** has been unmuted').withArgs<{ user: Eris.User; }>()
                }
            }
        },
        pardon: {
            flags: {
                reason: translatable('The reason for the pardon.'),
                count: translatable('The number of warnings that will be removed.')
            },
            default: {
                description: translatable('Pardons a user.\nIf mod-logging is enabled, the pardon will be logged.\nThis will not unban users.'),
                state: {
                    countNaN: translatable('❌ {text} isn\'t a number!').withArgs<{ text: string; }>(),
                    countNegative: translatable('❌ I cant give a negative amount of pardons!'),
                    countZero: translatable('❌ I cant give zero pardons!'),
                    success: translatable('✅ **{user#tag}** has been given {count#plural(1:a warning|{} warnings)}. They now have {warnings#plural(1:1 warning|{} warnings)}.').withArgs<{ user: Eris.User; count: number; warnings: number; }>()
                }
            }
        },
        prefix: {
            list: {
                description: translatable('Lists all the current prefixes on this server'),
                success: translatable('ℹ️ {guild#tag} has {prefixes#plural(0:no custom prefixes|the following prefixes:\n{#map( - {})#join(\n)})}').withArgs<{ guild: Eris.Guild; prefixes: Iterable<string>; }>()
            },
            add: {
                description: translatable('Adds a command prefix to this server'),
                success: translatable('✅ The prefix has been added!')
            },
            remove: {
                description: translatable('Removes a command prefix from this server'),
                success: translatable('✅ The prefix has been removed!')
            }
        },
        reason: {
            default: {
                description: translatable('Sets the reason for an action on the modlog.'),
                none: translatable('❌ There aren\'t any modlog entries yet!'),
                unknownCase: translatable('❌ I couldn\'t find a modlog entry with a case id of {caseId}').withArgs<{ caseId: number; }>(),
                success: {
                    messageMissing: translatable('⚠️ The modlog has been updated! I couldn\'t find the message to update however.'),
                    default: translatable('✅ The modlog has been updated!')
                }
            }
        },
        roleMe: {
            errors: {
                missing: translatable('❌ Roleme {id} doesn\'t exist').withArgs<{ id: number; }>(),
                noMessage: translatable('❌ Roleme {id} doesn\'t have a custom message').withArgs<{ id: number; }>(),
                missingChannels: translatable('❌ I couldn\'t locate any of the channels you provided'),
                missingRoles: translatable('❌ I couldn\'t locate any of the roles you provided'),
                noRoles: translatable('❌ You must provide at least 1 role to add or remove'),
                noTrigger: translatable('❌ You must provide a trigger phrase for the roleme')
            },
            common: {
                triggerQuery: translatable('❓ What should users type for this roleme to trigger?'),
                caseSensitiveQuery: {
                    prompt: translatable('❓ Is the trigger case sensitive?'),
                    continue: translatable('Yes'),
                    cancel: translatable('No')
                },
                channelsQuery: {
                    prompt: translatable('❓ Please mention all the channels you want the roleme to be available in'),
                    cancel: translatable('All channels')
                },
                rolesQuery: {
                    prompt: {
                        add: translatable('❓ Please type the roles you want the roleme to add, 1 per line. Mentions, ids or names can be used.'),
                        remove: translatable('❓ Please type the roles you want the roleme to remove, 1 per line. Mentions, ids or names can be used.')
                    },
                    fail: translatable('❌ I couldn\'t find any of the roles from your message, please try again.'),
                    cancel: translatable('No roles')
                }
            },
            flags: {
                add: translatable('A list of roles to add in the roleme'),
                remove: translatable('A list of roles to remove in the roleme'),
                case: translatable('Whether the phrase is case sensitive'),
                channels: translatable('The channels the roleme should be in')
            },
            add: {
                description: translatable('Adds a new roleme with the given phrase'),
                unexpectedError: translatable('❌ Something went wrong while I was trying to create that roleme'),
                success: translatable('✅ Roleme `{id}` has been created!').withArgs<{ id: number; }>()
            },
            remove: {
                description: translatable('Deletes the given roleme'),
                success: translatable('✅ Roleme `{id}` has been deleted').withArgs<{ id: number; }>()
            },
            edit: {
                description: translatable('Edits the given roleme'),
                unexpectedError: translatable('❌ Something went wrong while I was trying to edit that roleme'),
                success: translatable('✅ Roleme `{id}` has been updated!').withArgs<{ id: number; }>()
            },
            setMessage: {
                description: translatable('Sets the bbtag compatible message to show when the roleme is triggered'),
                success: translatable('✅ Roleme `{id}` has now had its message set').withArgs<{ id: number; }>()
            },
            rawMessage: {
                description: translatable('Gets the current message that will be sent when the roleme is triggered'),
                inline: translatable('ℹ️ The raw code for roleme `{id}` is: ```\n{content}\n```').withArgs<{ id: number; content: string; }>(),
                attached: translatable('ℹ️ The raw code for roleme `{id}` is attached').withArgs<{ id: number; }>()
            },
            debugMessage: {
                description: translatable('Executes the roleme message as if you triggered the roleme'),
                success: translatable('ℹ️ Ive sent the debug output in a DM')
            },
            setAuthorizer: {
                description: translatable('Sets the roleme message to run using your permissions'),
                success: translatable('✅ Your permissions will now be used for roleme `{id}`').withArgs<{ id: number; }>()
            },
            info: {
                description: translatable('Shows information about a roleme'),
                embed: {
                    title: translatable('Roleme #{id}').withArgs<{ id: number; }>(),
                    field: {
                        phrase: {
                            name: translatable('Phrase (case {caseSensitive#bool(sensitive|insensitive)})').withArgs<{ caseSensitive: boolean; }>()
                        },
                        rolesAdded: {
                            name: translatable('Roles added'),
                            value: translatable('{roleIds#plural(0:None|{#map(<@&{}>)#join(\n)})}').withArgs<{ roleIds: Iterable<string>; }>()
                        },
                        rolesRemoved: {
                            name: translatable('Roles removed'),
                            value: translatable('{roleIds#plural(0:None|{#map(<@&{}>)#join(\n)})}').withArgs<{ roleIds: Iterable<string>; }>()
                        },
                        channels: {
                            name: translatable('Channels'),
                            value: translatable('{roleIds#plural(0:Anywhere|{#map(<#{}>)#join(\n)})}').withArgs<{ channelIds: Iterable<string>; }>()
                        },
                        message: {
                            name: translatable('Message'),
                            value: translatable('**Author:** <@{authorId}>\n**Authorizer:** <@{authorizerId}>').withArgs<{ authorId: string; authorizerId: string; }>()
                        }
                    }
                }
            },
            list: {
                description: translatable('Lists the rolemes currently active on this server'),
                none: translatable('❌ You have no rolemes created!'),
                embed: {
                    title: translatable('Rolemes'),
                    description: {
                        channel: translatable('{channelId#bool(<#{}>|All channels)}').withArgs<{ channelId?: string; }>(),
                        roleme: translatable('**Roleme** `{id}`: {message}').withArgs<{ id: number; message: string; }>(),
                        layout: translatable('{groups#map({name}\n{entries#join(\n)})#join(\n\n)}').withArgs<{ groups: Iterable<{ name: IFormattable<string>; entries: Iterable<IFormattable<string>>; }>; }>()
                    }
                }
            }
        },
        removeVoteBan: {
            user: {
                description: translatable('Deletes all the vote bans against the given user'),
                success: translatable('✅ Votebans for {user#tag} have been cleared').withArgs<{ user: Eris.User; }>()
            },
            all: {
                description: translatable('Deletes all vote bans against all users'),
                success: translatable('✅ Votebans for all users have been cleared')
            }
        },
        settings: {
            description: translatable('Gets or sets the settings for the current guild. Visit {website} for key documentation.').withArgs<{ website: string; }>(),
            types: {
                string: translatable('string'),
                channel: translatable('channel'),
                bool: translatable('bool'),
                role: translatable('role'),
                int: translatable('int'),
                float: translatable('float'),
                permission: translatable('permission')
            },
            list: {
                description: translatable('Gets the current settings for this guild'),
                notConfigured: translatable('❌ Your guild is not correctly configured yet! Please try again later'),
                channelValue: {
                    default: translatable('{channel.name} ({channel.id})').withArgs<{ channel: Eris.Channel; }>(),
                    unknown: translatable('Unknown channel ({channelId})').withArgs<{ channelId: string; }>(),
                    none: translatable('Default Channel')
                },
                roleValue: {
                    default: translatable('{role.name} ({role.id})').withArgs<{ role: Eris.Role; }>(),
                    unknown: translatable('Unknown role ({roleId})').withArgs<{ roleId: string; }>()
                },
                notSet: translatable('Not set'),
                groups: {
                    general: translatable('General'),
                    messages: translatable('Messages'),
                    channels: translatable('Channels'),
                    permission: translatable('Permission'),
                    warnings: translatable('Warnings'),
                    moderation: translatable('Moderation')
                }
            },
            keys: {
                description: translatable('Lists all the setting keys and their types'),
                success: translatable('ℹ️ You can use `settings set <key> [value]` to set the following settings. All settings are case insensitive.\n{settings#map( - **{name}:** `{key#upper}` ({type}))#join(\n)}').withArgs<{ settings: Iterable<{ name: IFormattable<string>; key: string; type: IFormattable<string>; }>; }>()
            },
            set: {
                description: translatable('Sets the given setting key to have a certain value. If `value` is omitted, the setting is reverted to its default value'),
                keyInvalid: translatable('❌ Invalid key!'),
                valueInvalid: translatable('❌ `{value}` is not a {type}').withArgs<{ value: string; type: IFormattable<string>; }>(),
                alreadySet: translatable('❌ `{value}` is already set for {key}').withArgs<{ value: string; key: string; }>(),
                success: translatable('✅ {key} is set to {value=nothing}').withArgs<{ key: string; value?: string; }>()
            }
        },
        slowMode: {
            errors: {
                notTextChannel: translatable('❌ You can only set slowmode on text channels!'),
                notInGuild: translatable('❌ You cant set slowmode on channels outside of a server'),
                botNoPerms: translatable('❌ I don\'t have permission to set slowmode in {channel#tag}!').withArgs<{ channel: Eris.Channel; }>()
            },
            on: {
                description: translatable('Sets the channel\'s slowmode to 1 message every `time` seconds, with a max of 6 hours'),
                timeTooLong: translatable('❌ `time` must be less than {duration#duration(S)}s').withArgs<{ duration: Duration; }>(),
                success: translatable('✅ Slowmode has been set to 1 message every {duration#duration(S)}s in {channel#tag}').withArgs<{ duration: Duration; channel: Eris.Channel; }>()
            },
            off: {
                description: translatable('Turns off the channel\'s slowmode'),
                success: translatable('✅ Slowmode has been disabled in {channel#tag}').withArgs<{ channel: Eris.Channel; }>()
            }
        },
        tidy: {
            flags: {
                bots: translatable('Remove messages from bots.'),
                invites: translatable('Remove messages containing invites.'),
                links: translatable('Remove messages containing links.'),
                embeds: translatable('Remove messages containing embeds.'),
                attachments: translatable('Remove messages containing attachments.'),
                user: translatable('Removes messages from the users specified. Separate users by commas'),
                query: translatable('Removes messages that match the provided query as a regex.'),
                invert: translatable('Reverses the effects of all the flag filters.'),
                yes: translatable('Bypasses the confirmation')
            },
            default: {
                description: translatable('Clears messages from chat'),
                notNegative: translatable('❌ I cannot delete {count} messages!').withArgs<{ count: number; }>(),
                unsafeRegex: translatable('❌ That regex is not safe!'),
                invalidUsers: translatable('❌ I couldn\'t find some of the users you gave!'),
                noMessages: translatable('❌ I couldn\'t find any matching messages!'),
                confirmQuery: {
                    prompt: {
                        foundAll: translatable('ℹ️ I am about to attempt to delete {total} {total#plural(1:message|messages)}. Are you sure you wish to continue?\n{breakdown#map({user#tag} - {count} {count#plural(1:message|messages)})}').withArgs<{ total: number; breakdown: Iterable<{ user: Eris.User; count: number; }>; }>(),
                        foundSome: translatable('ℹ️ I am about to attempt to delete {total} {total#plural(1:message|messages)} after searching through {searched} {searched#plural(1:message|messages)}. Are you sure you wish to continue?\n{breakdown#map({user#tag} - {count} {count#plural(1:message|messages)})}').withArgs<{ total: number; searched: number; breakdown: Iterable<{ user: Eris.User; count: number; }>; }>()
                    },
                    cancel: translatable('Cancel'),
                    continue: translatable('Continue')
                },
                cancelled: translatable('✅ Tidy cancelled, No messages will be deleted'),
                deleteFailed: translatable('❌ I wasn\'t able to delete any of the messages! Please make sure I have permission to manage messages'),
                success: {
                    default: translatable('✅ Deleted {deleted} {success#plural(1:message|messages)}:\n{success#map({user#tag} - {count} {count#plural(1:message|messages)})}').withArgs<{ deleted: number; success: Iterable<{ user: Eris.User; count: number; }>; }>(),
                    partial: translatable('⚠️ I managed to delete {deleted} of the messages I attempted to delete.\n{success#map({user#tag} - {count} {count#plural(1:message|messages)})}\n\nFailed:\n{failed#map({user#tag} - {count} {count#plural(1:message|messages)})}').withArgs<{ deleted: number; success: Iterable<{ user: Eris.User; count: number; }>; failed: Iterable<{ user: Eris.User; count: number; }>; }>()
                }
            }
        },
        timeout: {
            flags: {
                reason: translatable('The reason for the timeout (removal).'),
                time: translatable('The amount of time to mute for, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d2h3m4s\', or some other combination.\nMaximum allowed time is 28 days. Default is 1 day.')
            },
            user: {
                description: translatable('Timeouts a user.\nIf mod-logging is enabled, the timeout will be logged.'),
                state: {
                    memberTooHigh: translatable('❌ I don\'t have permission to timeout **{user#tag}**! Their highest role is above my highest role.').withArgs<{ user: Eris.User; }>(),
                    moderatorTooLow: translatable('❌ You don\'t have permission to timeout **{user#tag}**! Their highest role is above your highest role.').withArgs<{ user: Eris.User; }>(),
                    noPerms: translatable('❌ I don\'t have permission to timeout **{user#tag}**! Make sure I have the `moderate members` permission and try again.').withArgs<{ user: Eris.User; }>(),
                    moderatorNoPerms: translatable('❌ You don\'t have permission to timeout **{user#tag}**! Make sure you have the `moderate members` permission or one of the permissions specified in the `timeout override` setting and try again.').withArgs<{ user: Eris.User; }>(),
                    alreadyTimedOut: translatable('❌ **{user#tag}** has already been timed out.').withArgs<{ user: Eris.User; }>(),
                    success: translatable('✅ **{user#tag}** has been timed out.').withArgs<{ user: Eris.User; }>()
                }
            },
            clear: {
                description: translatable('Removes the timeout of a user.\nIf mod-logging is enabled, the timeout removal will be logged.'),
                state: {
                    notTimedOut: translatable('❌ **{user#tag}** is not currently timed out.').withArgs<{ user: Eris.User; }>(),
                    noPerms: translatable('❌ I don\'t have permission to timeout **{user#tag}**! Make sure I have the `moderate members` permission and try again.').withArgs<{ user: Eris.User; }>(),
                    moderatorNoPerms: translatable('❌ You don\'t have permission to timeout **{user#tag}**! Make sure you have the `moderate members` permission or one of the permissions specified in the `timeout override` setting and try again.').withArgs<{ user: Eris.User; }>(),
                    success: translatable('✅ **{user#tag}** timeout has been removed.').withArgs<{ user: Eris.User; }>()
                }
            }
        },
        timers: {
            list: {
                description: translatable('Lists all the currently active timers here'),
                none: translatable('✅ There are no active timers!'),
                paged: translatable('Showing timers {start} - {end} of {total}. Page {page}/{pageCount}').withArgs<{ start: number; end: number; total: number; page: number; pageCount: number; }>(),
                success: translatable('ℹ️ Here are the currently active timers:```prolog\n{table}\n```{paging}').withArgs<{ table: IFormattable<string>; paging?: IFormattable<string>; }>(),
                table: {
                    id: {
                        header: translatable('Id'),
                        cell: translatable('{id}').withArgs<{ id: string; }>()
                    },
                    elapsed: {
                        header: translatable('Elapsed'),
                        cell: translatable('{startTime#duration(H)}').withArgs<{ startTime: Moment; }>()
                    },
                    remain: {
                        header: translatable('Remain'),
                        cell: translatable('endTime#duration(H)').withArgs<{ endTime: Moment; }>()
                    },
                    user: {
                        header: translatable('User'),
                        cell: translatable('{user.username}#{user.discriminator}').withArgs<{ user?: Eris.User; }>()
                    },
                    type: {
                        header: translatable('Type'),
                        cell: translatable('{type}').withArgs<{ type: string; }>()
                    },
                    content: {
                        header: translatable('Content'),
                        cell: translatable('{content}').withArgs<{ content: string; }>()
                    }
                }
            },
            info: {
                description: translatable('Shows detailed information about a given timer'),
                notFound: translatable('❌ I couldn\'t find the timer you gave.'),
                embed: {
                    title: translatable('Timer #{id}').withArgs<{ id: string; }>(),
                    field: {
                        type: {
                            name: translatable('Type')
                        },
                        user: {
                            name: translatable('Started by'),
                            value: translatable('<@{userId}>').withArgs<{ userId: string; }>()
                        },
                        duration: {
                            name: translatable('Duration'),
                            value: translatable('Started {start#tag}\nEnds {end#tag}').withArgs<{ start: Moment; end: Moment; }>()
                        }
                    }
                }
            },
            cancel: {
                description: translatable('Cancels currently active timers'),
                timersMissing: translatable('❌ I couldn\'t find {count#plural(1:the timer|any of the timers)} you specified!').withArgs<{ count: number; }>(),
                success: {
                    default: translatable('✅ Cancelled {success#count#plural(1:{} timer|{} timers)}:\n{timers#map(`{}`)#join(\n)}').withArgs<{ success: Iterable<string>; }>(),
                    partial: translatable('⚠️ Cancelled {success#count#plural(1:{} timer|{} timers)}:\n{success#map(`{}`)#join(\n)}\nCould not find {fail#count#plural(1:{} timer|{} timers)}:\n{fail#map(`{}`)#join(\n)}').withArgs<{ success: Iterable<string>; fail: Iterable<string>; }>()
                }
            },
            clear: {
                description: translatable('Clears all currently active timers'),
                confirm: {
                    prompt: translatable('⚠️ Are you sure you want to clear all timers?'),
                    continue: translatable('Yes'),
                    cancel: translatable('No')
                },
                cancelled: translatable('ℹ️ Cancelled clearing of timers'),
                success: translatable('✅ All timers cleared')
            }
        },
        unban: {
            flags: {
                reason: translatable('The reason for the ban.')
            },
            default: {
                description: translatable('Unbans a user.\nIf mod-logging is enabled, the ban will be logged.'),
                userNotFound: translatable('❌ I couldn\'t find that user!'),
                state: {
                    notBanned: translatable('❌ **{user#tag}** is not currently banned!').withArgs<{ user: Eris.User; }>(),
                    noPerms: translatable('❌ I don\'t have permission to unban **{user#tag}**! Make sure I have the `ban members` permission and try again.').withArgs<{ user: Eris.User; }>(),
                    moderatorNoPerms: translatable('❌ You don\'t have permission to unban **{user#tag}**! Make sure you have the `ban members` permission or one of the permissions specified in the `ban override` setting and try again.').withArgs<{ user: Eris.User; }>(),
                    success: translatable('✅ **{user#tag}** has been unbanned.').withArgs<{ user: Eris.User; }>()
                }
            }
        },
        unmute: {
            flags: {
                reason: translatable('The reason for the unmute.')
            },
            default: {
                description: translatable('Removes the special muted role from the user. \nIf mod-logging is enabled, the mute will be logged.'),
                state: {
                    notMuted: translatable('❌ {user#tag} is not currently muted').withArgs<{ user: Eris.User; }>(),
                    noPerms: translatable('❌ I don\'t have permission to unmute users! Make sure I have the `manage roles` permission and try again.'),
                    moderatorNoPerms: translatable('❌ You don\'t have permission to unmute users! Make sure you have the `manage roles` permission and try again.'),
                    roleTooHigh: translatable('❌ I can\'t revoke the muted role! (it\'s higher than or equal to my top role)'),
                    moderatorTooLow: translatable('❌ You can\'t revoke the muted role! (it\'s higher than or equal to your top role)'),
                    success: translatable('✅ **{user#tag}** has been unmuted').withArgs<{ user: Eris.User; }>()
                }
            }
        },
        warn: {
            actions: {
                ban: translatable('ban'),
                kick: translatable('kick'),
                timeout: translatable('timeout'),
                delete: translatable('warn')
            },
            flags: {
                reason: translatable('The reason for the warning.'),
                count: translatable('The number of warnings that will be issued.')
            },
            default: {
                description: translatable('Issues a warning.\nIf mod-logging is enabled, the warning will be logged.\nIf `kickat` and `banat` have been set using the `settings` command, the target could potentially get banned or kicked.'),
                state: {
                    countNaN: translatable('❌ {value} isn\'t a number!').withArgs<{ value: string; }>(),
                    countNegative: translatable('❌ I cant give a negative amount of warnings!'),
                    countZero: translatable('❌ I cant give zero warnings!'),
                    memberTooHigh: translatable('⚠️ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}.\n⛔ They went over the limit for {action}s but they are above me so I couldn\'t {action} them.').withArgs<{ user: Eris.User; count: number; }>(),
                    moderatorTooLow: translatable('⚠️ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}.\n⛔ They went over the limit for {action}s but they are above you so I didn\'t {action} them.').withArgs<{ user: Eris.User; count: number; action: IFormattable<string>; }>(),
                    noPerms: translatable('⚠️ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}.\n⛔ They went over the limit for {action}s but I don\'t have permission to {action} them.').withArgs<{ user: Eris.User; count: number; action: IFormattable<string>; }>(),
                    moderatorNoPerms: translatable('⚠️ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}.\n⛔ They went over the limit for {action}s but you don\'t have permission to {action} them.').withArgs<{ user: Eris.User; count: number; action: IFormattable<string>; }>(),
                    alreadyBanned: translatable('⚠️ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}.\n⛔ They went over the limit for bans, but they were already banned.').withArgs<{ user: Eris.User; count: number; }>(),
                    alreadyTimedOut: translatable('⚠️ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}.\n⛔ They went over the limit for timeouts, but they were already timed out.').withArgs<{ user: Eris.User; count: number; }>(),
                    success: {
                        delete: translatable('✅ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}. They now have {warnings} {warnings#plural(1:warning|warnings)}.').withArgs<{ user: Eris.User; count: number; warnings: number; }>(),
                        timeout: translatable('✅ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}. They want over the limit for timeouts and so have been timed out.').withArgs<{ user: Eris.User; count: number; }>(),
                        ban: translatable('✅ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}. They went over the limit for bans and so have been banned.').withArgs<{ user: Eris.User; count: number; }>(),
                        kick: translatable('✅ **{user#tag}** has been given {count} {count#plural(1:warning|warnings)}. They went over the limit for kicks and so have been kicked.').withArgs<{ user: Eris.User; count: number; }>()
                    }
                }
            }
        },
        addDomain: {
            default: {
                description: translatable('Toggles multiple domains to the domain whitelist for use with the {request} subtag'),
                success: translatable('✅ Boy howdy, thanks for the domains!{added#plural(0:|\nThese ones are great!```\n{#join(\n)}\n```)}{removed#plural(0:|\nI always hated these ones anyway.```\n{#join(\n)}\n```)}\nJust remember: it might take up to 15 minutes for these to go live.').withArgs<{ added: Iterable<string>; removed: Iterable<string>; }>()
            }
        },
        patch: {
            flags: {
                fixes: translatable('The bug fixes of the patch.'),
                notes: translatable('Other notes.')
            },
            default: {
                description: translatable('Makes a patch note'),
                changelogMissing: translatable('❌ I cant find the changelog channel!'),
                messageEmpty: translatable('❌ I cant send out an empty patch note!'),
                embed: {
                    author: {
                        name: translatable('Version {version}').withArgs<{ version: string; }>()
                    },
                    title: translatable('New Features and Changes'),
                    field: {
                        bugFixes: {
                            name: translatable('Bug fixes')
                        },
                        otherNotes: {
                            name: translatable('Other notes')
                        }
                    }
                },
                confirm: {
                    prompt: translatable('This is a preview of what the patch will look like'),
                    continue: translatable('Looks good, post it!'),
                    cancel: translatable('Nah let me change something')
                },
                cancelled: translatable('ℹ️ Patch cancelled'),
                failed: translatable('❌ I wasn\'t able to send the patch notes!'),
                success: translatable('✅ Done!')
            }
        },
        reload: {
            commands: {
                description: translatable('Reloads the given commands, or all commands if none were given'),
                success: translatable('✅ Successfully reloaded {count} {count#plural(1:command|commands)}').withArgs<{ count: number; }>()
            },
            events: {
                description: translatable('Reloads the given events, or all events if none were given'),
                success: translatable('✅ Successfully reloaded {count} {count#plural(1:event|events)}').withArgs<{ count: number; }>()
            },
            services: {
                description: translatable('Reloads the given services, or all services if none were given'),
                success: translatable('✅ Successfully reloaded {count} {count#plural(1:service|services)}').withArgs<{ count: number; }>()
            }
        },
        restart: {
            description: translatable('Restarts blargbot, or one of its components'),
            default: {
                description: translatable('Restarts all the clusters'),
                success: translatable('Ah! You\'ve killed me but in a way that minimizes downtime! D:')
            },
            kill: {
                description: translatable('Kills the master process, ready for pm2 to restart it'),
                success: translatable('Ah! You\'ve killed me! D:')
            },
            api: {
                description: translatable('Restarts the api process'),
                success: translatable('✅ Api has been respawned.')
            }
        },
        update: {
            default: {
                description: translatable('Updates the codebase to the latest commit.'),
                noUpdate: translatable('✅ No update required!'),
                command: {
                    pending: translatable('ℹ️ Command: `{command}`\nRunning...').withArgs<{ command: string; }>(),
                    success: translatable('✅ Command: `{command}`').withArgs<{ command: string; }>(),
                    error: translatable('❌ Command: `{command}`').withArgs<{ command: string; }>()
                },
                packageIssue: translatable('❌ Failed to update due to a package issue'),
                buildIssue: translatable('❌ Failed to update due to a build issue, but successfully rolled back to commit `{commit}`').withArgs<{ commit: string; }>(),
                rollbackIssue: translatable('❌ A fatal error has occurred while rolling back the latest commit! Manual intervention is required ASAP.'),
                success: translatable('✅ Updated to version {version} commit `{commit}`!\nRun `{prefix}restart` to gracefully start all the clusters on this new version.').withArgs<{ version: string; prefix: string; commit: string; }>()
            }
        },
        avatar: {
            common: {
                formatInvalid: translatable('❌ {format} is not a valid format! Supported formats are {allowedFormats#join(, | and )}').withArgs<{ format: string; allowedFormats: Iterable<string>; }>(),
                sizeInvalid: translatable('❌ {size} is not a valid image size! Supported sizes are {allowedSizes#join(, | and )}').withArgs<{ size: string; allowedSizes: Iterable<number>; }>(),
                success: translatable('✅ {user#tag}\'s avatar').withArgs<{ user: Eris.User; }>()
            },
            flags: {
                format: translatable('The file format. Can be {formats#join(, | or )}.').withArgs<{ formats: Iterable<string>; }>(),
                size: translatable('The file size. Can be {sizes#join(, | or )}.').withArgs<{ sizes: Iterable<number>; }>()
            },
            self: {
                description: translatable('Gets your avatar')
            },
            user: {
                description: translatable('Gets the avatar of the user you chose')
            }
        },
        beeMovie: {
            flags: {
                name: translatable('Shows the name of the character the quote is from, if applicable.'),
                characters: translatable('Only give quotes from actual characters (no stage directions).')
            },
            default: {
                description: translatable('Gives a quote from the Bee Movie.')
            }
        },
        brainfuck: {
            common: {
                queryInput: {
                    prompt: translatable('This brainfuck code requires user input. Please say what you want to use:')
                },
                noInput: translatable('❌ No input was provided!'),
                unexpectedError: translatable('❌ Something went wrong...'),
                success: {
                    empty: translatable('ℹ️ No output...{state#bool(\n\n[{memory#join(,)}]\nPointer: {pointer}|)}').withArgs<{ state?: { memory: Iterable<number>; pointer: number; }; }>(),
                    default: translatable('✅ Output:{output#split(\n)#map(\n> {})#join()}{state#bool(\n\n[{memory#join(,)}]\nPointer: {pointer}|)}').withArgs<{ output: string; state?: { memory: Iterable<number>; pointer: number; }; }>()
                }
            },
            default: {
                description: translatable('Executes brainfuck code.')
            },
            debug: {
                description: translatable('Executes brainfuck code and returns the pointers.')
            }
        },
        commit: {
            default: {
                description: translatable('Gets a random or specified blargbot commit.'),
                noCommits: translatable('❌ I cant find any commits at the moment, please try again later!'),
                unknownCommit: translatable('❌ I couldn\'t find the commit!'),
                embed: {
                    title: translatable('{commit} - commit #{index}').withArgs<{ commit: string; index: number; }>()
                }
            }
        },
        decancer: {
            user: {
                description: translatable('Decancers a users display name. If you have permissions, this will also change their nickname'),
                success: translatable('✅ Successfully decancered **{user#tag}**\'s name to: `{result}`').withArgs<{ user: Eris.User; result: string; }>()
            },
            text: {
                description: translatable('Decancers some text to plain ASCII'),
                success: translatable('✅ The decancered version of **{text}** is: `{result}`').withArgs<{ text: string; result: string; }>()
            }
        },
        define: {
            default: {
                description: translatable('Gets the definition for the specified word. The word must be in english.'),
                unavailable: translatable('❌ It seems I cant find the definition for that word at the moment!'),
                embed: {
                    title: translatable('Definition for {word}').withArgs<{ word: string; }>(),
                    description: translatable('**Pronunciation**: [🔈 {phonetic}]({pronunciation})').withArgs<{ phonetic: string; pronunciation: string; }>(),
                    field: {
                        name: translatable('{index}. {type}').withArgs<{ index: number; type: string; }>(),
                        value: {
                            synonyms: translatable('**Synonyms:** {synonyms#join(, | and )}\n').withArgs<{ synonyms: Iterable<string>; }>(),
                            pronunciation: translatable('**Pronunciation**: [🔈 {phonetic}]({pronunciation})\n').withArgs<{ phonetic: string; pronunciation: string; }>(),
                            default: translatable('{pronunciation}{synonyms}{definition}').withArgs<{ pronunciation?: IFormattable<string>; synonyms?: IFormattable<string>; definition: string; }>()
                        }
                    }
                }
            }
        },
        dmErrors: {
            default: {
                description: translatable('Toggles whether to DM you errors.'),
                enabled: translatable('✅ I will now DM you if I have an issue running a command.'),
                disabled: translatable('✅ I won\'t DM you if I have an issue running a command.')
            }
        },
        donate: {
            default: {
                description: translatable('Gets my donation information'),
                success: translatable('✅ Thanks for the interest! Ive sent you a DM with information about donations.'),
                embed: {
                    description: translatable('Hi! This is stupid cat, creator of blargbot. I hope you\'re enjoying it!\n\nI don\'t like to beg, but right now I\'m a student. Tuition is expensive, and maintaining this project isn\'t exactly free. I have to pay for services such as web servers and domains, not to mention invest time into developing code to make this bot as good as it can be. I don\'t expect to be paid for what I\'m doing; the most important thing to me is that people enjoy what I make, that my product is making people happy. But still, money doesn\'t grow on trees. If you want to support me and what I\'m doing, I have a patreon available for donations. Prefer something with less commitment? I also have a paypal available.\n\nThank you for your time. I really appreciate all of my users! :3'),
                    field: {
                        paypal: {
                            name: translatable('Paypal')
                        },
                        patreon: {
                            name: translatable('Patreon')
                        }
                    }
                }
            }
        },
        feedback: {
            errors: {
                titleTooLong: translatable('❌ The first line of your suggestion cannot be more than {max} characters!').withArgs<{ max: number; }>(),
                noType: translatable('❌ You need to provide at least 1 feedback type.'),
                blacklisted: {
                    guild: translatable('❌ Sorry, your guild has been blacklisted from the use of the `{prefix}feedback` command. If you wish to appeal this, please join my support guild. You can find a link by doing `{prefix}invite`.').withArgs<{ prefix: string; }>(),
                    user: translatable('❌ Sorry, you have been blacklisted from the use of the `{prefix}feedback` command. If you wish to appeal this, please join my support guild. You can find a link by doing `{prefix}invite`.').withArgs<{ prefix: string; }>()
                }
            },
            types: {
                feedback: translatable('Feedback'),
                bugReport: translatable('Bug Report'),
                suggestion: translatable('Suggestion')
            },
            blacklist: {
                unknownType: translatable('❌ I don\'t know how to blacklist a {type}! only `guild` and `user`').withArgs<{ type: string; }>(),
                alreadyBlacklisted: {
                    guild: translatable('❌ That guild id is already blacklisted!'),
                    user: translatable('❌ That user id is already blacklisted!')
                },
                notBlacklisted: {
                    guild: translatable('❌ That guild id is not blacklisted!'),
                    user: translatable('❌ That user id is not blacklisted!')
                },
                success: {
                    guild: translatable('✅ The guild {id} has been {added#bool(blacklisted|removed from the blacklist)}').withArgs<{ id: string; added: boolean; }>(),
                    user: translatable('✅ The user {id} has been {added#bool(blacklisted|removed from the blacklist)}').withArgs<{ id: string; added: boolean; }>()
                }
            },
            flags: {
                command: translatable('Signify your feedback is for a command'),
                bbtag: translatable('Signify your feedback is for BBTag'),
                docs: translatable('Signify your feedback is for documentation'),
                other: translatable('Signify your feedback is for other functionality')
            },
            general: {
                description: translatable('Give me general feedback about the bot'),
                unexpectedError: translatable('❌ Something went wrong while trying to submit that! Please try again'),
                success: translatable('✅ {type} has been sent with the ID {caseId}! 👌\n\nYou can view your {type#lower} here: <{link}>').withArgs<{ type: IFormattable<string>; caseId: number; link: string; }>(),
                queryType: {
                    prompt: translatable('ℹ️ Please select the types that apply to your suggestion'),
                    placeholder: translatable('Select your suggestion type')
                },
                types: {
                    command: translatable('Command'),
                    bbtag: translatable('BBTag'),
                    documentation: translatable('Documentation'),
                    other: translatable('Other Functionality')
                },
                dm: translatable('DM'),
                embed: {
                    description: translatable('**{title}**\n\n{description}').withArgs<{ title: string; description: string; }>(),
                    field: {
                        types: {
                            name: translatable('Types'),
                            value: translatable('{types#join(\n)}').withArgs<{ types: Iterable<string>; }>()
                        }
                    },
                    footer: {
                        text: translatable('Case {caseId} | {messageId}').withArgs<{ caseId: number; messageId: string; }>()
                    }
                }
            },
            suggest: {
                description: translatable('Tell me something you want to be added or changed')
            },
            report: {
                description: translatable('Let me know about a bug you found')
            },
            edit: {
                description: translatable('Edit some feedback you have previously sent'),
                unknownCase: translatable('❌ I couldn\'t find any feedback with the case number {caseNumber}!').withArgs<{ caseNumber: number; }>(),
                notOwner: translatable('❌ You cant edit someone else\'s suggestion.'),
                success: translatable('✅ Your case has been updated.')
            }

        },
        help: {
            self: {
                description: translatable('Gets the help message for this command')
            },
            list: {
                description: translatable('Shows a list of all the available commands')
            },
            command: {
                description: translatable('Shows the help text for the given command')
            }
        },
        info: {
            default: {
                description: translatable('Returns some info about me.'),
                notReady: translatable('⚠️ Im still waking up! Try again in a minute or two'),
                embed: {
                    title: translatable('About me!'),
                    description: translatable('I am a multi-purpose bot with new features implemented regularly, written in typescript using [Eris](https://abal.moe/Eris/).\n\n🎂 I am currently {age#duration(F)} old!').withArgs<{ age: Duration; }>(),
                    field: {
                        patron: {
                            name: translatable('️️️️️️️️❤️ Special thanks to my patrons! ❤️'),
                            value: translatable('{patrons#map({#tag})#join(\n)}').withArgs<{ patrons: Iterable<IFormattable<string> | Eris.User>; }>()
                        },
                        donator: {
                            name: translatable('️️️️️️️️❤️ Special thanks to all my other donators! ❤️'),
                            value: translatable('{donators#map({#tag})#join(\n)}').withArgs<{ donators: Iterable<IFormattable<string> | Eris.User>; }>()
                        },
                        other: {
                            name: translatable('❤️ Special huge thanks to: ❤️'),
                            value: {
                                decorators: {
                                    awesome: translatable('The awesome {user#tag} for {reason}').withArgs<{ user: IFormattable<string> | Eris.User; reason: IFormattable<string>; }>(),
                                    incredible: translatable('The incredible {user#tag} for {reason}').withArgs<{ user: IFormattable<string> | Eris.User; reason: IFormattable<string>; }>(),
                                    amazing: translatable('The amazing {user#tag} for {reason}').withArgs<{ user: IFormattable<string> | Eris.User; reason: IFormattable<string>; }>(),
                                    inspirational: translatable('The inspirational {user#tag} for {reason}').withArgs<{ user: IFormattable<string> | Eris.User; reason: IFormattable<string>; }>()
                                },
                                reasons: {
                                    rewrite: translatable('rewriting me into typescript'),
                                    donations1k: translatable('huge financial contributions ($1000)'),
                                    unknown: translatable('something but I don\'t remember')
                                },
                                layout: translatable('{details#join(\n)}').withArgs<{ details: Iterable<IFormattable<string>>; }>()
                            }
                        },
                        details: {
                            value: translatable('For commands, do `{prefix}help`. For information about supporting me, do `{prefix}donate`.\nFor any additional information, such as command documentation, please visit my website: <https://blargbot.xyz>').withArgs<{ prefix: string; }>()
                        }
                    }
                }

            }
        },
        insult: {
            someone: {
                description: translatable('Generates a random insult directed at the name supplied.'),
                success: translatable('{name}\'s {#rand(mother|mom|father|dad|goat|cheese|dick|boob|eye|mouth|nose|ear|sister|sis|brother|bro|seagull|tea|mother-in-law|rabbit|dog|cat|left foot|body|brain|face|favourite thing)} {#rand(smells like|looks like|is|sounds like|appears to be|wants to be|looks just like|smells oddly similar to|is jealous of|is as stupid as|laughs like)} {#rand(a piece of cheese|a smelly fish|jam|tea|a skunk|a fart|a piece of toast|my mom|your mom|my dad|your dad|my sister|your sister|my brother|your brother|my cat|my dog|my lizard|my seagull|gross|farts|ugly|Captain America|javascript|C#|LUA|python3.5|a furry|an anthropomorphic horse|a tentacle monster|fuck|meow|mississippi|the entire UK|Japan|anime|dickgirls|a really stupid cat|a sentient robot|teaching a robot to love|anime girls with really large boobs who want to eat all of your cream|salty|smegma|mouldy cheese|obesity|Donald Trump|stupid people|crabcakes|firepoles|blue waffle|a really bad random insult generators|a terrible AI|cleverbot|b1nzy|a drunken goblin|poorly censored porn|an egg left in the sun for too long|#BREXIT|leaving the EU)}').withArgs<{ name: string; }>()
            },
            default: {
                description: translatable('Generates a random insult.'),
                success: translatable('Your {#rand(mother|mom|father|dad|goat|cheese|dick|boob|eye|mouth|nose|ear|sister|sis|brother|bro|seagull|tea|mother-in-law|rabbit|dog|cat|left foot|body|brain|face|favourite thing)} {#rand(smells like|looks like|is|sounds like|appears to be|wants to be|looks just like|smells oddly similar to|is jealous of|is as stupid as|laughs like)} {#rand(a piece of cheese|a smelly fish|jam|tea|a skunk|a fart|a piece of toast|my mom|your mom|my dad|your dad|my sister|your sister|my brother|your brother|my cat|my dog|my lizard|my seagull|gross|farts|ugly|Captain America|javascript|C#|LUA|python3.5|a furry|an anthropomorphic horse|a tentacle monster|fuck|meow|mississippi|the entire UK|Japan|anime|dickgirls|a really stupid cat|a sentient robot|teaching a robot to love|anime girls with really large boobs who want to eat all of your cream|salty|smegma|mouldy cheese|obesity|Donald Trump|stupid people|crabcakes|firepoles|blue waffle|a really bad random insult generators|a terrible AI|cleverbot|b1nzy|a drunken goblin|poorly censored porn|an egg left in the sun for too long|#BREXIT|leaving the EU)}')
            }
        },
        invite: {
            default: {
                description: translatable('Gets you invite information.'),
                success: translatable('Invite me to your guild!\n<{inviteLink}>\nJoin my support guild!\n{guildLink}').withArgs<{ inviteLink: string; guildLink: string; }>()
            }
        },
        mods: {
            common: {
                embed: {
                    title: translatable('Moderators'),
                    description: {
                        none: translatable('There are no mods with that status!')
                    },
                    field: {
                        online: {
                            name: translatable('{emote} Online').withArgs<{ emote: string; }>(),
                            value: translatable('{users#map({#tag})#join(\n)}').withArgs<{ users: Iterable<Eris.User>; }>()
                        },
                        away: {
                            name: translatable('{emote} Away').withArgs<{ emote: string; }>(),
                            value: translatable('{users#map({#tag})#join(\n)}').withArgs<{ users: Iterable<Eris.User>; }>()
                        },
                        busy: {
                            name: translatable('{emote} Do not disturb').withArgs<{ emote: string; }>(),
                            value: translatable('{users#map({#tag})#join(\n)}').withArgs<{ users: Iterable<Eris.User>; }>()
                        },
                        offline: {
                            name: translatable('{emote} Offline').withArgs<{ emote: string; }>(),
                            value: translatable('{users#map({#tag})#join(\n)}').withArgs<{ users: Iterable<Eris.User>; }>()
                        }
                    }
                }
            },
            all: {
                description: translatable('Gets a list of all mods.')
            },
            online: {
                description: translatable('Gets a list of all currently online mods.')
            },
            away: {
                description: translatable('Gets a list of all currently away mods.')
            },
            busy: {
                description: translatable('Gets a list of all mods currently set to do not disturb.')
            },
            offline: {
                description: translatable('Gets a list of all currently offline mods.')
            }
        },
        names: {
            flags: {
                all: translatable('Gets all the names.'),
                verbose: translatable('Gets more information about the retrieved names.')
            },
            list: {
                description: translatable('Returns the names that I\'ve seen the specified user have in the past 30 days.'),
                none: {
                    ever: translatable('ℹ️ I haven\'t seen any usernames for {user#tag} yet!').withArgs<{ user: Eris.User; }>(),
                    since: translatable('ℹ️ I haven\'t seen {user#tag} change their username since {from#tag}!').withArgs<{ user: Eris.User; from: Moment; }>()
                },
                embed: {
                    title: translatable('Historical usernames'),
                    description: {
                        since: {
                            detailed: translatable('Since {from#tag}\n{usernames#map({name} - {time#tag(R)})#join(\n)}').withArgs<{ from: Moment; usernames: Iterable<{ name: string; time: Moment; }>; }>(),
                            simple: translatable('Since {from#tag}\n{usernames#map({name})#join(\n)}').withArgs<{ from: Moment; usernames: Iterable<{ name: string; }>; }>()
                        },
                        ever: {
                            detailed: translatable('{usernames#map({name} - {time#tag(R)})#join(\n)}').withArgs<{ usernames: Iterable<{ name: string; time: Moment; }>; }>(),
                            simple: translatable('{usernames#map({name})#join(\n)}').withArgs<{ usernames: Iterable<{ name: string; }>; }>()
                        }
                    }
                }
            },
            remove: {
                description: translatable('Removes the names ive seen you use in the past 30 days'),
                none: translatable('ℹ️ You don\'t have any usernames to remove!'),
                notFound: translatable('❌ I couldn\'t find any of the usernames you gave!'),
                confirm: {
                    prompt: {
                        some: translatable('⚠️ Are you sure you want to remove {count} usernames').withArgs<{ count: number; }>(),
                        all: translatable('⚠️ Are you sure you want to remove **all usernames**')
                    },
                    continue: translatable('Yes'),
                    cancel: translatable('No')
                },
                cancelled: translatable('✅ I wont remove any usernames then!'),
                success: {
                    some: translatable('✅ Successfully removed {count}!').withArgs<{ count: number; }>(),
                    all: translatable('✅ Successfully removed **all usernames**!')
                }
            }
        },
        nato: {
            default: {
                description: translatable('Translates the given text into the NATO phonetic alphabet.')
            }
        },
        personalPrefix: {
            add: {
                description: translatable('Adds a command prefix just for you!'),
                alreadyAdded: translatable('❌ You already have that as a command prefix.'),
                success: translatable('✅ Your personal command prefix has been added.')
            },
            remove: {
                description: translatable('Removes one of your personal command prefixes'),
                notAdded: translatable('❌ That isn\'t one of your prefixes.'),
                success: translatable('✅ Your personal command prefix has been removed.')
            },
            list: {
                description: translatable('Lists the your personal command prefixes'),
                none: translatable('ℹ️ You don\'t have any personal command prefixes set!'),
                embed: {
                    title: translatable('Personal prefixes'),
                    description: translatable('{prefixes#map(- {})#join(\n)}').withArgs<{ prefixes: Iterable<string>; }>()
                }
            }
        },
        ping: {
            description: translatable('Pong!\nFind the command latency.'),
            default: {
                description: translatable('Gets the current latency.'),
                pending: translatable('ℹ️ {#rand(Existence is a lie.|You\'re going to die some day, perhaps soon.|Nothing matters.|Where do you get off?|There is nothing out there.|You are all alone in an infinite void.|Truth is false.|Forsake everything.|Your existence is pitiful.|We are all already dead.)}'),
                success: translatable('✅ Pong! ({ping#duration(MS)}ms)').withArgs<{ ping: Duration; }>()
            }
        },
        poll: {
            flags: {
                time: translatable('How long before the poll expires, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d2h3m4s\', or some other combination.'),
                emojis: translatable('The emojis to apply to the poll.'),
                description: translatable('The description of the poll.'),
                colour: translatable('The color of the poll (in HEX).'),
                announce: translatable('If specified, it will make an announcement. Requires the proper permissions.')
            },
            default: {
                description: translatable('Creates a poll for the given question and duration. If no duration is given, defaults to 60 seconds. If emojis are given, they will be used as options for the poll.'),
                invalidDuration: translatable('❌ `{duration}` is not a valid duration for a poll.').withArgs<{ duration: string; }>(),
                invalidColor: translatable('❌ `{color}` is not a valid color!').withArgs<{ color: string; }>(),
                sendFailed: translatable('❌ I wasn\'t able to send the poll! Please make sure I have the right permissions and try again.'),
                noAnnouncePerms: translatable('❌ Sorry, you don\'t have permissions to send announcements!'),
                announceNotSetUp: translatable('❌ Announcements on this server aren\'t set up correctly. Please fix them before trying again.'),
                emojisMissing: translatable('❌ You must provide some emojis to use in the poll.'),
                emojisInaccessible: translatable('❌ I don\'t have access to some of the emojis you used! Please use different emojis or add me to the server that the emojis are from.'),
                tooShort: translatable('❌ {time#duration(S)}s is too short for a poll! Use a longer time').withArgs<{ duration: Duration; }>(),
                someEmojisMissing: translatable('⚠️ I managed to create the poll, but wasn\'t able to add some of the emojis to it. Please add them manually (they will still be counted in the results)')
            }
        },
        remind: {
            flags: {
                channel: translatable('Sets the reminder to appear in the current channel rather than a DM'),
                time: translatable('The time before the user is to be reminded, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d 2h 3m 4s\', or some other combination')
            },
            default: {
                description: translatable('Reminds you about something after a period of time in a DM.'),
                durationRequired: translatable('❌ The `-t` flag is required to set the duration of the reminder!'),
                durationZero: translatable('❌ I cant set a timer for 0 seconds!'),
                reminderMissing: translatable('❌ You need to say what you need reminding of!'),
                event: translatable('⏰ Hi, <@{userId}>! You asked me to remind you about this {start#tag(R)}:\n{content}').withArgs<{ userId: string; start: Moment; content: string; }>(),
                success: {
                    here: translatable('✅ Ok, ill ping you here {duration#tag}').withArgs<{ duration: Duration; }>(),
                    dm: translatable('✅ Ok, ill ping you in a DM {duration#tag}>').withArgs<{ duration: Duration; }>()
                }
            }
        },
        roles: {
            default: {
                description: translatable('Displays a list of roles and their IDs.'),
                embed: {
                    title: translatable('Roles'),
                    description: translatable('{roles#map({#tag} - ({id}))#join(\n)}').withArgs<{ roles: Iterable<Eris.Role>; }>()
                }
            }
        },
        roll: {
            default: {
                description: translatable('Rolls the dice you tell it to, and adds the modifier'),
                diceInvalid: translatable('❌ `{dice}` is not a valid dice!').withArgs<{ dice: string; }>(),
                tooBig: translatable('❌ You\'re limited to {maxRolls} rolls of a d{maxFaces}').withArgs<{ maxRolls: number; maxFaces: number; }>(),
                character: {
                    embed: {
                        description: translatable('```xl\n{stats#map(Stat #{id} - [{rolls#join(, )}] > {total} - {min} > {result})#join(\n)}\n```').withArgs<{ stats: Iterable<{ id: number; rolls: Iterable<number>; total: number; min: number; result: number; }>; }>()
                    }
                },
                embed: {
                    title: translatable('🎲 {rolls} {rolls#plural(1:roll|rolls)} of a {faces} sided dice:').withArgs<{ rolls: number; faces: number; }>(),
                    description: {
                        modifier: translatable('**Modifier**: {total} {sign} {modifier}').withArgs<{ total: number; sign: '+' | '-'; modifier: number; }>(),
                        natural1: translatable(' - Natural 1...'),
                        natural20: translatable(' - Natural 20'),
                        layout: translatable('{details#bool({}\n|)}{rolls#join(, )}\n{modifier#bool({}\n|)}**Total**: {total}{natural}').withArgs<{ details?: string; rolls: Iterable<number>; modifier?: IFormattable<string>; total: number; natural?: IFormattable<string>; }>()
                    }
                }
            }

        },
        rr: {
            default: {
                description: translatable('Plays russian roulette with a specified number of bullets. If `emote` is specified, uses that specific emote.'),
                notEnoughBullets: translatable('❌ Wimp! You need to load at least one bullet.'),
                guaranteedDeath: translatable('⚠️ Do you have a death wish or something? Your revolver can only hold 6 bullets, that\'s guaranteed death!'),
                tooManyBullets: translatable('⚠️ That\'s gutsy, but your revolver can only hold 6 bullets!'),
                jammed: translatable('❌ Your revolver jams when you try to close the barrel. Maybe you should try somewhere else...'),
                confirm: {
                    prompt: translatable('You load {bullets} {bullets#plural(1:bullet|bullets)} into your revolver, give it a spin, and place it against your head').withArgs<{ bullets: number; }>(),
                    continue: translatable('Put the gun down'),
                    cancel: translatable('Pull the trigger')
                },
                chicken: translatable('You chicken out and put the gun down.\n{#rand(Maybe try again when you\'re not feeling so wimpy.|Its ok, fun isn\'t for everyone!)}'),
                died: translatable('***BOOM!*** {#rand(The gun goes off, splattering your brains across the wall. Unlucky!|☠️💥⚰️😵💀💀☠️|Before you know it, it\'s all over.|At least you had chicken!|I\'m ***not*** cleaning that up.|Guns are not toys!|Well, you can\'t win them all!|W-well... If every porkchop were perfect, we wouldn\'t have hotdogs? Too bad you\'re dead either way.|Blame it on the lag!|Today just wasn\'t your lucky day.|Pssh, foresight is for losers.)}'),
                lived: translatable('*Click!* {#rand(The gun clicks, empty. You get to live another day.|You breath a sign of relief as you realize that you aren\'t going to die today.|As if it would ever go off! Luck is on your side.|You thank RNGesus as you lower the gun.|👼🙏🚫⚰️👌👍👼|You smirk as you realize you survived.)}')
            }
        },
        shard: {
            common: {
                embed: {
                    title: translatable('Shard {shardId}').withArgs<{ shardId: number; }>(),
                    field: {
                        shard: {
                            name: translatable('Shard {shardId}').withArgs<{ shardId: number; }>(),
                            value: translatable('```\nStatus: {statusEmote}\nLatency: {latency}ms\nGuilds: {guildCount}\nCluster: {clusterId}\nLast update: {lastUpdate#duration(H)}\n```').withArgs<{ statusEmote: string; latency: number; guildCount: number; clusterId: number; lastUpdate: Moment; }>()
                        },
                        cluster: {
                            name: translatable('Cluster {clusterId}').withArgs<{ clusterId: number; }>(),
                            value: translatable('CPU usage: {cpu#percent(1)}\nGuilds: {guildCount}\nRam used: {ram#bytes}\nStarted {startTime#tag(R)}').withArgs<{ cpu: number; guildCount: number; ram: number; startTime: Moment; }>()
                        },
                        shards: {
                            name: translatable('Shards'),
                            value: translatable('```\n{shards#map({id} {statusEmote} {latency}ms)#join(\n)}\n```').withArgs<{ shards: Iterable<{ id: number; statusEmote: string; latency: number; }>; }>()
                        }
                    }
                }
            },
            current: {
                description: translatable('Returns information about the shard the current guild is in, along with cluster stats.'),
                dm: {
                    embed: {
                        description: translatable('Discord DMs are on shard `0` in cluster `{clusterId}`').withArgs<{ clusterId: number; }>()
                    }
                }
            },
            guild: {
                description: translatable('Returns information about the shard `guildID` is in, along with cluster stats.'),
                invalidGuild: translatable('❌ `{id}` is not a valid guild id').withArgs<{ id: string; }>(),
                embed: {
                    description: {
                        here: translatable('This guild is on shard `{shardId}` and cluster `{clusterId}`').withArgs<{ shardId: number; clusterId: number; }>(),
                        other: translatable('Guild `{guildId}` is on shard `{shardId}` and cluster `{clusterId}`').withArgs<{ shardId: number; clusterId: number; guildId: string; }>()
                    }
                }
            }
        },
        shards: {
            common: {
                invalidCluster: translatable('❌ Cluster does not exist'),
                noStats: translatable('❌ Cluster {clusterId} is not online at the moment').withArgs<{ clusterId: number; }>(),
                embed: {
                    field: {
                        shard: {
                            name: translatable('Shard {shardId}').withArgs<{ shardId: number; }>(),
                            value: translatable('```\nStatus: {statusEmote}\nLatency: {latency}ms\nGuilds: {guildCount}\nCluster: {clusterId}\nLast update: {lastUpdate#duration(H)}\n```').withArgs<{ statusEmote: string; latency: number; guildCount: number; clusterId: number; lastUpdate: Moment; }>()
                        },
                        cluster: {
                            name: translatable('Cluster {clusterId}').withArgs<{ clusterId: number; }>(),
                            value: translatable('CPU usage: {cpu#percent(1)}\nGuilds: {guildCount}\nRam used: {ram#bytes}\nStarted {startTime#tag(R)}').withArgs<{ cpu: number; guildCount: number; ram: number; startTime: Moment; }>()
                        },
                        shards: {
                            name: translatable('Shards'),
                            value: translatable('```\n{shards#map({id} {statusEmote} {latency}ms)#join(\n)}\n```').withArgs<{ shards: Iterable<{ id: number; statusEmote: string; latency: number; }>; }>()
                        }
                    }
                }
            },
            flags: {
                down: translatable('If provided, only shows downed shards for `b!shards`')
            },
            all: {
                description: translatable('Shows a list of all shards.'),
                noneDown: translatable('ℹ️ No shards are currently down!'),
                noStats: translatable('❌ No cluster stats yet!'),
                embed: {
                    title: translatable('Shards'),
                    description: translatable('I\'m running on `{clusterCount}` {clusterCount#plural(1:cluster|clusters)} and `{shardCount}` {shardCount#plural(1:shard|shards)}\n').withArgs<{ clusterCount: number; shardCount: number; }>(),
                    field: {
                        name: translatable('Cluster {clusterId}').withArgs<{ clusterId: number; }>(),
                        value: translatable('Ready since: {startTime#tag(R)}\nRam: {ram#bytes}\n**Shards**:\n```\n{shards#map({id} {statusEmote} {latency}ms)#join(\n)}\n```').withArgs<{ startTime: Moment; ram: number; shards: Iterable<{ id: number; statusEmote: string; latency: number; }>; }>()
                    }
                }
            },
            guild: {
                description: translatable('Shows information about the shard and cluster `guildID` is in '),
                invalidGuild: translatable('❌ `{guildId}` is not a valid guildID').withArgs<{ guildId: string; }>(),
                embed: {
                    description: {
                        here: translatable('This guild is on shard `{shardId}` and cluster `{clusterId}`').withArgs<{ clusterId: number; shardId: number; }>(),
                        other: translatable('Guild `{guildId}` is on shard `{shardId}` and cluster `{clusterId}`').withArgs<{ guildId: string; clusterId: number; shardId: number; }>()
                    }
                }
            },
            cluster: {
                description: translatable('Show information about `cluster`')
            }
        },
        ship: {
            default: {
                description: translatable('Gives you the ship name for two users.'),
                success: translatable('❤️ Your ship name is **{name}**!').withArgs<{ name: string; }>()
            }
        },
        spell: {
            default: {
                description: translatable('Gives you a description for a D&D 5e spell.'),
                notFound: translatable('❌ I couldn\'t find that spell!'),
                components: {
                    v: translatable('Verbal'),
                    s: translatable('Somatic'),
                    m: translatable('Material'),
                    f: translatable('Focus'),
                    df: translatable('Divine Focus'),
                    xp: translatable('XP Cost')
                },
                query: {
                    prompt: translatable('🪄 Multiple spells found! Please pick the right one'),
                    placeholder: translatable('Pick a spell'),
                    choice: {
                        description: translatable('Level {level} {school}').withArgs<{ level: IFormattable<string>; school: IFormattable<string>; }>()
                    }
                },
                embed: {
                    description: translatable('*Level {level} {school}*\n\n{description}').withArgs<{ level: IFormattable<string>; school: IFormattable<string>; description: IFormattable<string>; }>(),
                    field: {
                        duration: {
                            name: translatable('Duration')
                        },
                        range: {
                            name: translatable('Range')
                        },
                        castingTime: {
                            name: translatable('Casting Time')
                        },
                        components: {
                            name: translatable('Components')
                        }
                    }
                }
            }
        },
        stats: {
            default: {
                description: translatable('Gives you some information about me'),
                embed: {
                    title: translatable('Bot Statistics'),
                    footer: {
                        text: translatable('blargbot')
                    },
                    field: {
                        guilds: {
                            name: translatable('Guilds'),
                            value: translatable('{guildCount}').withArgs<{ guildCount: number; }>()
                        },
                        users: {
                            name: translatable('Users'),
                            value: translatable('{userCount}').withArgs<{ userCount: number; }>()
                        },
                        channels: {
                            name: translatable('Channels'),
                            value: translatable('{channelCount}').withArgs<{ channelCount: number; }>()
                        },
                        shards: {
                            name: translatable('Shards'),
                            value: translatable('{shardCount}').withArgs<{ shardCount: number; }>()
                        },
                        clusters: {
                            name: translatable('Clusters'),
                            value: translatable('{clusterCount}').withArgs<{ clusterCount: number; }>()
                        },
                        ram: {
                            name: translatable('RAM'),
                            value: translatable('{ram#bytes}').withArgs<{ ram: number; }>()
                        },
                        version: {
                            name: translatable('Version')
                        },
                        uptime: {
                            name: translatable('Uptime'),
                            value: translatable('{uptime#tag(R)}').withArgs<{ startTime: Moment; }>()
                        },
                        eris: {
                            name: translatable('Eris')
                        },
                        nodeJS: {
                            name: translatable('Node.js')
                        }
                    }
                }
            }
        },
        status: {
            default: {
                description: translatable('Gets you an image of an HTTP status code.'),
                notFound: translatable('❌ Something terrible has happened! 404 is not found!')
            }
        },
        syntax: {
            default: {
                description: translatable('Gives you the \'syntax\' for a command 😉'),
                success: translatable('❌ Invalid usage!\nProper usage: `{prefix}syntax {name} {tokens#join( )}`').withArgs<{ prefix: string; name: string; tokens: Iterable<string>; }>()
            }
        },
        tag: {
            description: translatable('Tags are a system of public commands that anyone can create or run, using the BBTag language.\n\nFor more information about BBTag, visit <{subtags}>.\nBy creating a tag, you acknowledge that you agree to the Terms of Service (<{tos}>)').withArgs<{ subtags: string; tos: string; }>(),
            request: {
                name: translatable('Enter the name of the tag:'),
                content: translatable('Enter the tag\'s contents:')
            },
            common: {
                debugInDm: translatable('ℹ️ Ive sent the debug output in a DM'),
                done: translatable('✅ I hope you found what you were looking for!')
            },
            errors: {
                noneFound: translatable('❌ No results found!'),
                tagMissing: translatable('❌ The `{name}` tag doesn\'t exist!').withArgs<{ name: string; }>(),
                invalidBBTag: translatable('❌ There were errors with the bbtag you provided!\n{errors#join(\n)}').withArgs<{ errors: Iterable<IFormattable<string>>; }>(),
                bbtagError: translatable('❌ [{location.line},{location.column}]: {message}').withArgs<AnalysisResult>(),
                bbtagWarning: translatable('❌ [{location.line},{location.column}]: {message}').withArgs<AnalysisResult>(),
                notOwner: translatable('❌ You don\'t own the `{name}` tag!').withArgs<{ name: string; }>(),
                alreadyExists: translatable('❌ The `{name}` tag already exists!').withArgs<{ name: string; }>(),
                deleted: translatable('❌ The `{name}` tag has been permanently deleted{user#bool(by **{#tag}**|)}{reason#bool(\n\nReason: {}|)}').withArgs<{ name: string; reason?: string; user?: UserTag; }>()

            },
            run: {
                description: translatable('Runs a user created tag with some arguments')
            },
            test: {
                default: {
                    description: translatable('Uses the BBTag engine to execute the content as if it was a tag')
                },
                debug: {
                    description: translatable('Uses the BBTag engine to execute the content as if it was a tag and will return the debug output'),
                    tagNotOwned: translatable('❌ You cannot debug someone else\'s tag.')
                }
            },
            docs: {
                description: translatable('Returns helpful information about the specified topic.')
            },
            debug: {
                description: translatable('Runs a user created tag with some arguments. A debug file will be sent in a DM after the tag has finished.')
            },
            create: {
                description: translatable('Creates a new tag with the content you give'),
                success: translatable('✅ Tag `{name}` created.\n{errors#join(\n)}').withArgs<{ name: string; errors: Iterable<IFormattable<string>>; }>()
            },
            edit: {
                description: translatable('Edits an existing tag to have the content you specify'),
                success: translatable('✅ Tag `{name}` edited.\n{errors#join(\n)}').withArgs<{ name: string; errors: Iterable<IFormattable<string>>; }>()
            },
            set: {
                description: translatable('Sets the tag to have the content you specify. If the tag doesn\'t exist it will be created.'),
                success: translatable('✅ Tag `{name}` set.\n{errors#join(\n)}').withArgs<{ name: string; errors: Iterable<IFormattable<string>>; }>()
            },
            delete: {
                description: translatable('Deletes an existing tag'),
                success: translatable('✅ The `{name}` tag is gone forever!').withArgs<{ name: string; }>()
            },
            rename: {
                description: translatable('Renames the tag'),
                success: translatable('✅ The `{oldName}` tag has been renamed to `{newName}`.').withArgs<{ oldName: string; newName: string; }>()
            },
            raw: {
                description: translatable('Gets the raw contents of the tag'),
                inline: translatable('ℹ️ The raw code for {name} is: ```\n{content}\n```').withArgs<{ name: string; content: string; }>(),
                attached: translatable('ℹ️ The raw code for {name} is attached').withArgs<{ name: string; }>()
            },
            list: {
                description: translatable('Lists all tags, or tags made by a specific author'),
                page: {
                    content: translatable('```fix\n{tags#join(, )}\n```').withArgs<{ tags: Iterable<string>; }>(),
                    header: {
                        all: translatable('Found {count}/{total} tags').withArgs<{ count: number; total: number; }>(),
                        byUser: translatable('Found {count}/{total} tags made by {user#tag}').withArgs<{ count: number; total: number; user: Eris.User; }>()
                    }
                }
            },
            search: {
                description: translatable('Searches for a tag based on the provided name'),
                query: {
                    prompt: translatable('What would you like to search for?')
                },
                page: {
                    content: translatable('```fix\n{tags#join(, )}\n```').withArgs<{ tags: Iterable<string>; }>(),
                    header: translatable('Found {count}/{total} tags matching `{query}`').withArgs<{ count: number; total: number; query: string; }>()
                }
            },
            permDelete: {
                description: translatable('Marks the tag name as deleted forever, so no one can ever use it'),
                notStaff: translatable('❌ You cannot disable tags'),
                success: translatable('✅ The `{name}` tag has been deleted').withArgs<{ name: string; }>(),
                confirm: {
                    prompt: translatable('You are not the owner of the `{name}`, are you sure you want to modify it?').withArgs<{ name: string; }>(),
                    continue: translatable('Yes'),
                    cancel: translatable('No')
                }
            },
            cooldown: {
                description: translatable('Sets the cooldown of a tag, in milliseconds'),
                cooldownZero: translatable('❌ The cooldown must be greater than 0ms'),
                success: translatable('✅ The tag `{name}` now has a cooldown of `{cooldown#duration(MS)}ms`.').withArgs<{ name: string; cooldown: Duration; }>()
            },
            author: {
                description: translatable('Displays the name of the tag\'s author'),
                success: translatable('✅ The tag `{name}` was made by **{author#tag}**').withArgs<{ name: string; author?: UserTag; }>()
            },
            info: {
                description: translatable('Displays information about a tag'),
                embed: {
                    title: translatable('__**Tag | {name}**__').withArgs<{ name: string; }>(),
                    footer: {
                        text: translatable('{user.username}#{user.discriminator}').withArgs<{ user: Eris.User; }>()
                    },
                    field: {
                        author: {
                            name: translatable('Author'),
                            value: translatable('{user#tag} (id)').withArgs<{ user: UserTag; id: string; }>()
                        },
                        cooldown: {
                            name: translatable('Cooldown'),
                            value: translatable('{cooldown#duration(H)}').withArgs<{ cooldown: Duration; }>()
                        },
                        lastModified: {
                            name: translatable('Last Modified'),
                            value: translatable('{lastModified#tag}').withArgs<{ lastModified: Moment; }>()
                        },
                        usage: {
                            name: translatable('Used'),
                            value: translatable('{count} {count#plural(1:time|times)}').withArgs<{ count: number; }>()
                        },
                        favourited: {
                            name: translatable('Favourited'),
                            value: translatable('{count} {count#plural(1:time|times)}').withArgs<{ count: number; }>()
                        },
                        reported: {
                            name: translatable('⚠️ Reported'),
                            value: translatable('{count} {count#plural(1:time|times)}').withArgs<{ count: number; }>()
                        },
                        flags: {
                            name: translatable('Flags'),
                            value: translatable('{flags#map(`-{flag}`/`--{word}`: {description})#join(\n)}').withArgs<{ flags: Iterable<FlagDefinition<string>>; }>()
                        }
                    }
                }
            },
            top: {
                description: translatable('Displays the top 5 tags'),
                success: translatable('__Here are the top 10 tags:__\n{tags#map(**{index}.** **{name}** \\(**{author#tag}**\\) - used **{count} {count#plural(1:time|times)}**)#join(\n)}').withArgs<{ tags: Iterable<{ index: number; name: string; author: UserTag; count: number; }>; }>()
            },
            report: {
                description: translatable('Reports a tag as violating the ToS'),
                blocked: translatable('❌ Sorry, you cannot report tags.\n{reason}').withArgs<{ reason: string; }>(),
                unavailable: translatable('❌ Sorry, you cannot report tags at this time. Please try again later!'),
                deleted: translatable('✅ The `{name}` tag is no longer being reported by you.').withArgs<{ name: string; }>(),
                added: translatable('✅ The `{name}` tag has been reported.').withArgs<{ name: string; }>(),
                notification: translatable('**{user.username}#{user.discriminator}** has reported the tag: {name}\n\n{reason}').withArgs<{ name: string; reason: string; user: Eris.User; }>(),
                query: {
                    prompt: translatable('Please provide a reason for your report:')
                }
            },
            setLang: {
                description: translatable('Sets the language to use when returning the raw text of your tag'),
                success: translatable('✅ Lang for tag `{name}` set.').withArgs<{ name: string; }>()
            },
            favourite: {
                list: {
                    description: translatable('Displays a list of the tags you have favourited'),
                    success: translatable('{count#plural(0:You have no favourite tags!|You have {} favourite {#plural(1:tag|tags)}. ```fix\n{~tags#join(, )}\n```)}').withArgs<{ count: number; tags: Iterable<string>; }>()
                },
                toggle: {
                    description: translatable('Adds or removes a tag from your list of favourites'),
                    added: translatable('✅ The `{name}` tag is now on your favourites list!\n\nNote: there is no way for a tag to tell if you\'ve favourited it, and thus it\'s impossible to give rewards for favouriting.\nAny tag that claims otherwise is lying, and should be reported.').withArgs<{ name: string; }>(),
                    removed: translatable('✅ The `{name}` tag is no longer on your favourites list!').withArgs<{ name: string; }>()
                }
            },
            flag: {
                updated: translatable('✅ The flags for `{name}` have been updated.').withArgs<{ name: string; }>(),
                list: {
                    description: translatable('Lists the flags the tag accepts'),
                    none: translatable('✅ The `{name}` tag has no flags.').withArgs<{ name: string; }>(),
                    success: translatable('✅ The `{name}` tag has the following flags:\n\n{flags#map(`-{flag}`/`--{word}`: {description})#join(\n)}').withArgs<{ name: string; flags: Iterable<FlagDefinition<string>>; }>()
                },
                create: {
                    description: translatable('Adds multiple flags to your tag. Flags should be of the form `-<f> <flag> [flag description]`\ne.g. `b!t flags add mytag -c category The category you want to use -n name Your name`'),
                    wordMissing: translatable('❌ No word was specified for the `{flag}` flag').withArgs<{ flag: string; }>(),
                    flagExists: translatable('❌ The flag `{flag}` already exists!').withArgs<{ flag: string; }>(),
                    wordExists: translatable('❌ A flag with the word `{word}` already exists!').withArgs<{ word: string; }>()
                },
                delete: {
                    description: translatable('Removes multiple flags from your tag. Flags should be of the form `-<f>`\ne.g. `b!t flags remove mytag -c -n`')
                }
            }
        },
        time: {
            errors: {
                timezoneInvalid: translatable('❌ `{timezone}` is not a valid timezone! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.').withArgs<{ timezone: string; }>()
            },
            self: {
                description: translatable('Gets the time in your timezone')
            },
            user: {
                description: translatable('Gets the current time for the user'),
                timezoneNotSet: translatable('❌ {user#tag} has not set their timezone with the `{prefix}timezone` command yet.').withArgs<{ user: Eris.User; prefix: string; }>(),
                timezoneInvalid: translatable('❌ {user#tag} doesn\'t have a valid timezone set. They need to update it with the `{prefix}timezone` command').withArgs<{ user: Eris.User; prefix: string; }>(),
                success: translatable('ℹ️ It is currently **{now#time(LT)}** for **{user#tag}**.').withArgs<{ now: Moment; user: Eris.User; }>()
            },
            timezone: {
                description: translatable('Gets the current time in the timezone'),
                success: translatable('ℹ️ In **{timezone}**, it is currently **{now#time(LT)}**').withArgs<{ now: Moment; timezone: string; }>()
            },
            convert: {
                description: translatable('Converts a `time` from `timezone1` to `timezone2`'),
                invalidTime: translatable('❌ `{time}` is not a valid time! Please use the 12 or 24 hour format, e.g. 1:32pm or 13:32').withArgs<{ time: string; }>(),
                success: translatable('ℹ️ When it\'s **{source#time(LT)}** in **{sourceTimezone}**, it\'s **{dest#time(LT)}** in **{destTimezone}**.').withArgs<{ source: Moment; dest: Moment; sourceTimezone: string; destTimezone: string; }>()
            }
        },
        timer: {
            flags: {
                channel: translatable('Sets the reminder to appear in the current channel rather than a DM')
            },
            default: {
                description: translatable('Sets a timer for the provided duration, formatted as \'1 day 2 hours 3 minutes and 4 seconds\', \'1d2h3m4s\', or some other combination.'),
                durationZero: translatable('❌ I cant set a timer for 0 seconds!'),
                event: translatable('⏰ *Bzzt!* <@{userId}>, the timer you set {start#tag(R)} has gone off! *Bzzt!* ⏰').withArgs<{ userId: string; start: Moment; }>(),
                success: {
                    here: translatable('✅ Ok, ill ping you here {duration#tag}').withArgs<{ duration: Duration; }>(),
                    dm: translatable('✅ Ok, ill ping you in a DM {duration#tag}').withArgs<{ duration: Duration; }>()
                }
            }
        },
        timeZone: {
            get: {
                description: translatable('Gets your current timezone'),
                notSet: translatable('ℹ️ You haven\'t set a timezone yet.'),
                timezoneInvalid: translatable('⚠️ Your stored timezone code is `{timezone}`, which isn\'t valid! Please update it when possible.').withArgs<{ timezone: string; }>(),
                success: translatable('ℹ️ Your stored timezone code is `{timezone}`, which is equivalent to {now#time(z \\(Z\\))}.').withArgs<{ timezone: string; now: Moment; }>()
            },
            set: {
                description: translatable('Sets your current timezone. A list of [allowed time zones can be found on wikipedia](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List) under the `TZ database name` column'),
                timezoneInvalid: translatable('❌ `{timezone}` is not a valid timezone! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.').withArgs<{ timezone: string; }>(),
                success: translatable('✅ Ok, your timezone code is now set to `{timezone}`, which is equivalent to {now#time(z \\(Z\\))}.').withArgs<{ timezone: string; now: Moment; }>()
            }
        },
        todo: {
            list: {
                description: translatable('Shows you your todo list'),
                embed: {
                    title: translatable('Todo list'),
                    description: translatable('{items#plural(0:You have nothing on your list!|{#map(**{id}.** {value})#join(\n)})}').withArgs<{ items: Iterable<{ id: number; value: string; }>; }>()
                }
            },
            remove: {
                description: translatable('Removes an item from your todo list by id'),
                unknownId: translatable('❌ Your todo list doesn\'t have an item {id}!').withArgs<{ id: number; }>(),
                success: translatable('✅ Done!')
            },
            add: {
                description: translatable('Adds an item to your todo list'),
                success: translatable('✅ Done!')
            }
        },
        tokenify: {
            default: {
                description: translatable('Converts the given input into a token.')
            }
        },
        uptime: {
            default: {
                description: translatable('Gets how long ive been online for'),
                success: translatable('ℹ️ I came online {startTime#tag(R)} at {startTime#tag}').withArgs<{ startTime: Moment; }>()
            }
        },
        user: {
            default: {
                description: translatable('Gets information about a user'),
                activity: {
                    default: translatable('Not doing anything'),
                    5: translatable('Competing in {name}').withArgs<Eris.Activity>(),
                    4: translatable('{emoji#emoji} {name}').withArgs<Eris.Activity>(),
                    2: translatable('Listening to {name}').withArgs<Eris.Activity>(),
                    0: translatable('Playing {name}').withArgs<Eris.Activity>(),
                    1: translatable('Streaming {details}').withArgs<Eris.Activity>(),
                    3: translatable('Watching {name}').withArgs<Eris.Activity>()
                },
                embed: {
                    author: {
                        name: {
                            user: translatable('{user.bot#bool(🤖 |)}{user.username}#{user.discriminator}').withArgs<{ user: Eris.User; }>(),
                            member: translatable('{user.bot#bool(🤖 |)}{user.username}#{user.discriminator}{user.nick#bool( \\({}\\)|)}').withArgs<{ user: Eris.Member; }>()
                        }
                    },
                    description: {
                        user: translatable('**User Id**: {user.id}\n**Created**: {user.createdAt#tag=-}').withArgs<{ user: Eris.User; }>(),
                        member: translatable('**User Id**: {user.id}\n**Created**: {user.createdAt#tag=-}\n**Joined** {user.joinedAt#tag=-}').withArgs<{ user: Eris.Member; }>()
                    },
                    field: {
                        roles: {
                            name: translatable('Roles'),
                            value: translatable('{roles#plural(0:None|{#map({#tag})#join( )})}').withArgs<{ roles: Iterable<Eris.Role>; }>()
                        }
                    }
                }
            }
        },
        version: {
            default: {
                description: translatable('Tells you what version I am on'),
                success: translatable('ℹ️ I am running blargbot version {version}').withArgs<{ version: string; }>()
            }
        },
        voteBan: {
            description: translatable('Its a meme, don\'t worry'),
            errors: {
                failed: translatable('❌ Seems the petitions office didn\'t like that one! Please try again')
            },
            list: {
                description: translatable('Gets the people with the most votes to be banned.'),
                embed: {
                    title: translatable('ℹ️ Top 10 Vote bans'),
                    description: translatable('{items#plural(0:No petitions have been signed yet!|{#map(**{index}.** <@{userId}> - {count} {count#plural(1:signature|signatures)})#join(\n)})}').withArgs<{ items: Iterable<{ index: number; userId: string; count: number; }>; }>()
                }
            },
            info: {
                description: translatable('Checks the status of the petition to ban someone.'),
                embed: {
                    title: translatable('ℹ️ Vote ban signatures'),
                    description: translatable('{votes#plural(0:No one has voted to ban {~user#tag} yet.|{#map(<@{userId}>{reason#bool( - {}|)})#join(\n)})}{excess#bool(\n... and {} more|)}').withArgs<{ user: Eris.User; votes: Iterable<{ userId: string; reason?: string; }>; excess: number; }>()
                }
            },
            sign: {
                description: translatable('Signs a petition to ban a someone'),
                alreadySigned: translatable('❌ I know you\'re eager, but you have already signed the petition to ban {user#tag}!').withArgs<{ user: Eris.User; }>(),
                success: translatable('✅ {user#tag} has signed to ban {target#tag}! A total of **{total} {total#plural(1:person** has|people** have)} signed the petition now.{reason#bool(\n**Reason:** {}|)}').withArgs<{ user: Eris.User; target: Eris.User; total: number; reason?: string; }>()
            },
            forgive: {
                description: translatable('Removes your signature to ban someone'),
                notSigned: translatable('❌ That\'s very kind of you, but you haven\'t even signed to ban {user#tag} yet!').withArgs<{ user: Eris.User; }>(),
                success: translatable('✅ {user#tag} reconsidered and forgiven {target#tag}! A total of **{total} {total#plural(1:person** has|people** have)} signed the petition now.').withArgs<{ user: Eris.User; target: Eris.User; total: number; }>()
            }
        },
        warnings: {
            common: {
                count: translatable('{count#plural(0:🎉|⚠️)} **{user#tag}** {count#plural(0:doesn\'t have any warnings!|1:has accumulated 1 warning|has accumulated {} warnings)}.').withArgs<{ user: Eris.User; count: number; }>(),
                untilTimeout: translatable('- {remaining} more warnings before being timed out.').withArgs<{ remaining: number; }>(),
                untilKick: translatable('- {remaining} more warnings before being kicked.').withArgs<{ remaining: number; }>(),
                untilBan: translatable('- {remaining} more warnings before being banned.').withArgs<{ remaining: number; }>(),
                success: translatable('{parts#join(\n)}').withArgs<{ parts: Iterable<IFormattable<string>>; }>()
            },
            self: {
                description: translatable('Gets how many warnings you have')
            },
            user: {
                description: translatable('Gets how many warnings the user has')
            }
        },
        xkcd: {
            default: {
                description: translatable('Gets an xkcd comic. If a number is not specified, gets a random one.'),
                down: translatable('❌ Seems like xkcd is down 😟'),
                embed: {
                    title: translatable('xkcd #{id}: {title}').withArgs<{ id: number; title: string; }>(),
                    footer: {
                        text: translatable('xkcd {year}').withArgs<{ year: string; }>()
                    }
                }
            }
        },
        art: {
            flags: {
                image: translatable('A custom image.')
            },
            user: {
                description: translatable('Shows everyone a work of art.')
            },
            default: {
                description: translatable('Shows everyone a work of art.'),
                invalidUrl: translatable('❌ {url} is not a valid url!').withArgs<{ url: string; }>()
            }
        },
        cah: {
            flags: {
                unofficial: translatable('Also show unofficial cards.')
            },
            default: {
                description: translatable('Generates a set of Cards Against Humanity cards.')
            },
            packs: {
                description: translatable('Lists all the Cards against packs I know about'),
                success: translatable('ℹ️ These are the packs I know about:')
            }
        },
        caption: {
            errors: {
                imageMissing: translatable('❌ You didn\'t tell me what image I should caption!'),
                captionMissing: translatable('❌ You must give at least 1 caption!'),
                fontInvalid: translatable('❌ {font} is not a supported font! Use `{prefix}caption list` to see all available fonts').withArgs<{ font: string; prefix: string; }>()
            },
            flags: {
                top: translatable('The top caption.'),
                bottom: translatable('The bottom caption.'),
                font: translatable('The font to use (case insensitive). Use the command with the -l flag to view the available fonts. Defaults to impact.')
            },
            fonts: {
                description: translatable('Lists the fonts that are supported'),
                success: translatable('ℹ️ The supported fonts are: {fonts#join(, | and )}').withArgs<{ fonts: Iterable<string>; }>()
            },
            attached: {
                description: translatable('Puts captions on an attached image.')
            },
            linked: {
                description: translatable('Puts captions on the image in the URL.'),
                invalidUrl: translatable('❌ {url} is not a valid url!').withArgs<{ url: string; }>()
            }
        },
        cat: {
            default: {
                description: translatable('Gets a picture of a cat.')
            }
        },
        clint: {
            flags: {
                image: translatable('A custom image.')
            },
            user: {
                description: translatable('I don\'t even know, to be honest.')
            },
            default: {
                description: translatable('I don\'t even know, to be honest.'),
                invalidUrl: translatable('❌ {url} is not a valid url!').withArgs<{ url: string; }>()
            }
        },
        clippy: {
            default: {
                description: translatable('Clippy the paper clip is here to save the day!')
            }
        },
        clyde: {
            default: {
                description: translatable('Give everyone a message from Clyde.')
            }
        },
        color: {
            default: {
                description: translatable('Returns the provided colors.')
            }
        },
        delete: {
            default: {
                description: translatable('Shows that you\'re about to delete something.')
            }
        },
        distort: {
            flags: {
                image: translatable('A custom image.')
            },
            user: {
                description: translatable('Turns an avatar into modern art.')
            },
            default: {
                description: translatable('Turns an image into modern art.'),
                invalidUrl: translatable('❌ {url} is not a valid url!').withArgs<{ url: string; }>()
            }
        },
        emoji: {
            description: translatable('Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.'),
            flags: {
                svg: translatable('Get the emote as an svg instead of a png.')
            },
            default: {
                description: translatable('Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.'),
                invalidEmoji: translatable('❌ No emoji found!')
            }
        },
        free: {
            flags: {
                bottom: translatable('The bottom caption.')
            },
            default: {
                description: translatable('Tells everyone what you got for free')
            }
        },
        linus: {
            flags: {
                image: translatable('A custom image.')
            },
            user: {
                description: translatable('Shows a picture of Linus pointing at something on his monitor.')
            },
            default: {
                description: translatable('Shows a picture of Linus pointing at something on his monitor.'),
                invalidUrl: translatable('❌ {url} is not a valid url!').withArgs<{ url: string; }>()
            }
        },
        pcCheck: {
            default: {
                description: translatable('Tells everyone a reason why they should get their PC checked. Template credits go to Ghosty#8204.')
            }
        },
        pixelate: {
            flags: {
                image: translatable('A custom image.'),
                scale: translatable('The amount to pixelate by (defaults to 64)')
            },
            user: {
                description: translatable('Pixelates an image.')
            },
            default: {
                description: translatable('Pixelates an image.'),
                invalidUrl: translatable('❌ {url} is not a valid url!').withArgs<{ url: string; }>()
            }
        },
        shit: {
            flags: {
                plural: translatable('Whether or not the text is plural (use ARE instead of IS).')
            },
            default: {
                description: translatable('Tells everyone what\'s shit.')
            }
        },
        sonicSays: {
            default: {
                description: translatable('Sonic wants to share some words of wisdom.')
            }
        },
        starVsTheForcesOf: {
            flags: {
                image: translatable('A custom image.')
            },
            user: {
                description: translatable('WHO IS STAR BATTLING THIS EPISODE?')
            },
            default: {
                description: translatable('WHO IS STAR BATTLING THIS EPISODE?'),
                invalidUrl: translatable('❌ {url} is not a valid url!').withArgs<{ url: string; }>()
            }
        },
        stupid: {
            flags: {
                user: translatable('The person who is stupid.'),
                image: translatable('A custom image.')
            },
            default: {
                description: translatable('Tells everyone who is stupid.'),
                invalidUser: translatable('❌ I could not find the user `{user}`').withArgs<{ user: string; }>()
            }
        },
        theSearch: {
            default: {
                description: translatable('Tells everyone about the progress of the search for intelligent life.')
            }
        },
        truth: {
            default: {
                description: translatable('Shows everyone what is written in the Scroll of Truth.')
            }
        },
        danbooru: {
            default: {
                description: translatable('Gets three pictures from \'<https://danbooru.donmai.us/>\' using given tags.'),
                noTags: translatable('❌ You need to provide some tags'),
                unsafeTags: translatable('❌ None of the tags you provided were safe!'),
                noResults: translatable('❌ No results were found!'),
                success: translatable('Found **{count}/{total}** posts for tags {tags#map(`{}`)#join(, | and )}').withArgs<{ count: number; total: number; tags: Iterable<string>; }>(),
                embed: {
                    author: {
                        name: translatable('By {author=UNKNOWN}').withArgs<{ author?: string; }>()
                    }
                }
            }
        },
        rule34: {
            default: {
                description: translatable('Gets three pictures from \'<https://rule34.xxx/>\' using given tags.'),
                noTags: translatable('❌ You need to provide some tags'),
                unsafeTags: translatable('❌ None of the tags you provided were safe!'),
                noResults: translatable('❌ No results were found!'),
                success: translatable('Found **{count}/{total}** posts for tags {tags#map(`{}`)#join(, | and )}').withArgs<{ count: number; total: number; tags: Iterable<string>; }>(),
                embed: {
                    author: {
                        name: translatable('By {author=UNKNOWN}').withArgs<{ author?: string; }>()
                    }
                }
            }
        },
        eval: {
            errors: {
                error: translatable('❌ An error occurred!```\n{result}\n```').withArgs<{ code: string; result: string; }>()
            },
            here: {
                description: translatable('Runs the code you enter on the current cluster'),
                success: translatable('✅ Input:```js\n{code}\n```Output:```\n{result}\n```').withArgs<{ code: string; result: string; }>()
            },
            master: {
                description: translatable('Runs the code you enter on the master process'),
                success: translatable('✅ Master eval input:```js\n{code}\n```Output:```\n{result}\n```').withArgs<{ code: string; result: string; }>()
            },
            global: {
                description: translatable('Runs the code you enter on all the clusters and aggregates the result'),
                results: {
                    template: translatable('Global eval input:```js\n{code}\n```{results#join(\n)}').withArgs<{ code: string; results: Iterable<IFormattable<string>>; }>(),
                    success: translatable('✅ Cluster {clusterId} output:```\n{result}\n```').withArgs<{ clusterId: number; code: string; result: string; }>(),
                    failed: translatable('❌ Cluster {clusterId}: An error occurred!```\n{result}\n```').withArgs<{ clusterId: number; code: string; result: string; }>()
                }
            },
            cluster: {
                description: translatable('Runs the code you enter on all the clusters and aggregates the result'),
                success: translatable('✅ Cluster {clusterId} eval input:```js\n{code}\n```Output:```\n{result}\n```').withArgs<{ clusterId: number; code: string; result: string; }>()
            }
        },
        exec: {
            default: {
                description: translatable('Executes a command on the current shell'),
                pm2Bad: translatable('❌ No! That\'s dangerous! Do `b!restart` instead.\n\nIt\'s not that I don\'t trust you, it\'s just...\n\nI don\'t trust you.'),
                confirm: {
                    prompt: translatable('⚠️ You are about to execute the following on the command line:```bash\n{command}\n```').withArgs<{ command: string; }>(),
                    continue: translatable('Continue'),
                    cancel: translatable('Cancel')
                },
                cancelled: translatable('✅ Execution cancelled'),
                command: {
                    pending: translatable('ℹ️ Command: `{command}`\nRunning...').withArgs<{ command: string; }>(),
                    success: translatable('✅ Command: `{command}`').withArgs<{ command: string; }>(),
                    error: translatable('❌ Command: `{command}`').withArgs<{ command: string; }>()
                }
            }
        },
        logLevel: {
            default: {
                description: translatable('Sets the current log level'),
                success: translatable('✅ Log level set to `{logLevel}`').withArgs<{ logLevel: string; }>()
            }
        },
        awoo: {
            description: translatable('Awoooooooooo!'),
            action: translatable('**{self#tag}** awoos!').withArgs<{ self: Eris.User; }>()
        },
        bang: {
            description: translatable('Bang bang!'),
            action: translatable('**{self#tag}** bangs!').withArgs<{ self: Eris.User; }>()
        },
        bite: {
            description: translatable('Give someone a bite!'),
            action: translatable('**{self#tag}** bites **{target#tag=themselves}**').withArgs<{ self: Eris.User; target?: Eris.User; }>()
        },
        blush: {
            description: translatable('Show everyone that you\'re blushing.'),
            action: translatable('**{self#tag}** blushes!').withArgs<{ self: Eris.User; }>()
        },
        cry: {
            description: translatable('Show everyone that you\'re crying.'),
            action: translatable('**{self#tag}** cries!').withArgs<{ self: Eris.User; }>()
        },
        cuddles: {
            description: translatable('Cuddle with someone.'),
            action: translatable('**{self#tag}** cuddles with **{target#tag=themselves}**').withArgs<{ self: Eris.User; target?: Eris.User; }>()
        },
        dance: {
            description: translatable('Break out some sweet, sweet dance moves.'),
            action: translatable('**{self#tag}** dances!').withArgs<{ self: Eris.User; }>()
        },
        hug: {
            description: translatable('Give somebody a hug.'),
            action: translatable('**{self#tag}** hugs **{target#tag=themselves}**').withArgs<{ self: Eris.User; target?: Eris.User; }>()
        },
        jojo: {
            description: translatable('This must be the work of an enemy stand!')
        },
        kiss: {
            description: translatable('Give somebody a kiss.'),
            action: translatable('**{self#tag}** kisses **{target#tag=themselves}**').withArgs<{ self: Eris.User; target?: Eris.User; }>()
        },
        lewd: {
            description: translatable('T-that\'s lewd...'),
            action: translatable('**{self#tag}** is lewd 😳!').withArgs<{ self: Eris.User; }>()
        },
        lick: {
            description: translatable('Give someone a lick. Sluurrpppp!'),
            action: translatable('**{self#tag}** licks **{target#tag=themselves}**').withArgs<{ self: Eris.User; target?: Eris.User; }>()
        },
        megumin: {
            description: translatable('Darkness blacker than black and darker than dark, I beseech thee, combine with my deep crimson. The time of awakening cometh. Justice, fallen upon the infallible boundary, appear now as an intangible distortion! Dance, Dance, Dance! I desire for my torrent of power a destructive force: a destructive force without equal! Return all creation to cinders, and come from the abyss!')
        },
        nom: {
            description: translatable('Nom on somebody.'),
            action: translatable('**{self#tag}** noms on **{target#tag=themselves}**').withArgs<{ self: Eris.User; target?: Eris.User; }>()
        },
        owo: {
            description: translatable('owo whats this?'),
            action: translatable('**{self#tag}** owos!').withArgs<{ self: Eris.User; }>()
        },
        pat: {
            description: translatable('Give somebody a lovely pat.'),
            action: translatable('**{self#tag}** pats **{target#tag=themselves}**').withArgs<{ self: Eris.User; target?: Eris.User; }>()
        },
        poke: {
            description: translatable('Gives somebody a poke.'),
            action: translatable('**{self#tag}** pokes **{target#tag=themselves}**').withArgs<{ self: Eris.User; target?: Eris.User; }>()
        },
        pout: {
            description: translatable('Let everyone know that you\'re being pouty.'),
            action: translatable('**{self#tag}** pouts!').withArgs<{ self: Eris.User; }>()
        },
        punch: {
            description: translatable('Punch someone. They probably deserved it.'),
            action: translatable('**{self#tag}** punches **{target#tag=themselves}**').withArgs<{ self: Eris.User; target?: Eris.User; }>()
        },
        rem: {
            description: translatable('Worst girl')
        },
        shrug: {
            description: translatable('Let everyone know that you\'re a bit indifferent.'),
            action: translatable('**{self#tag}** shrugs!').withArgs<{ self: Eris.User; }>()
        },
        slap: {
            description: translatable('Slaps someone.'),
            action: translatable('**{self#tag}** slaps **{target#tag=themselves}**').withArgs<{ self: Eris.User; target?: Eris.User; }>()
        },
        sleepy: {
            description: translatable('Let everyone know that you\'re feeling tired.'),
            action: translatable('**{self#tag}** is sleepy!').withArgs<{ self: Eris.User; }>()
        },
        smile: {
            description: translatable('Smile!'),
            action: translatable('**{self#tag}** smiles!').withArgs<{ self: Eris.User; }>()
        },
        smug: {
            description: translatable('Let out your inner smugness.'),
            action: translatable('**{self#tag}** is smug!').withArgs<{ self: Eris.User; }>()
        },
        stare: {
            description: translatable('Staaaaaaaaare'),
            action: translatable('**{self#tag}** stares!').withArgs<{ self: Eris.User; }>()
        },
        thumbsUp: {
            description: translatable('Give a thumbs up!'),
            action: translatable('**{self#tag}** gives a thumbs up!').withArgs<{ self: Eris.User; }>()
        },
        wag: {
            description: translatable('Wagwagwagwag'),
            action: translatable('**{self#tag}** wags!').withArgs<{ self: Eris.User; }>()
        },
        respawn: {
            description: translatable('Cluster respawning only for staff.'),
            default: {
                description: translatable('Respawns the cluster specified'),
                requested: translatable('**{user#tag}** has called for a respawn of cluster {clusterId}.').withArgs<{ user: Eris.User; clusterId: number; }>(),
                success: translatable('✅ Cluster {clusterId} is being respawned and stuff now').withArgs<{ clusterId: number; }>()
            }
        },
        respond: {
            default: {
                description: translatable('Responds to a suggestion, bug report or feature request'),
                notFound: translatable('❌ I couldn\'t find that feedback!'),
                userNotFound: translatable('⚠️ Feedback successfully updated\n⛔ I couldn\'t find the user who submitted that feedback'),
                alertFailed: translatable('⚠️ Feedback successfully updated\n⛔ I wasn\'t able to send the response in the channel where the feedback was initially sent'),
                success: translatable('✅ Feedback successfully updated and response has been sent.'),
                alert: translatable('**Hi, <@{submitterId}>!**  You recently made this suggestion:\n\n**{title}**{description#bool(\n\n{}|)}\n\n**{respondent#tag}** has responded to your feedback with this:\n\n{response}\n\nIf you have any further questions or concerns, please join my support guild so that they can talk to you directly. You can get a link by doing `b!invite`. Thanks for your time!\n\nYour card has been updated here: <{link}>').withArgs<{ submitterId: string; title: string; description: string; respondent: Eris.User; response: string; link: string; }>()
            }
        }
    }
});

export default templates;

function translatable<T extends string>(template: T, value?: unknown): { (id: string): IFormatString<T>; withArgs<V>(): (id: string) => IFormatStringDefinition<T, V>; } {
    return Object.assign(
        (id: string): IFormatString<T> => TranslatableString.create(id, template, value),
        {
            withArgs<V>(): (id: string) => IFormatStringDefinition<T, V> {
                return id => TranslatableString.define<V, T>(id, template);
            }
        }
    );
}

type FormatVal<T extends string> = IFormatString<T> | IFormatStringDefinition<T, never>;
type FormatProvider<T extends FormatVal<string> = FormatVal<string>> = (id: string) => T;
type FormatTree = { [P in string]: FormatTree | FormatProvider | Array<FormatTree | FormatProvider> };

type FormattedVal<T extends FormatTree[string]> = T extends FormatProvider<infer R> ? R
    : T extends FormatTree ? FormattedTree<T>
    : T extends Array<FormatTree | FormatProvider> ? FormattedArray<T>
    : never;
type FormattedArray<T extends Array<FormatTree | FormatProvider>> = { [P in keyof T]: FormattedVal<T[P]> }
type FormattedTree<T extends FormatTree> = { [P in keyof T]: FormattedVal<T[P]> };

function crunchTree<T extends FormatTree>(prefix: string, value: T): FormattedTree<T> {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, crunchVal(`${prefix}.${k}`, v)] as const)) as FormattedTree<T>;
}

function crunchVal(id: string, v: FormatTree[string]): FormattedVal<FormatTree[string]> {
    if (typeof v === 'function')
        return v(id);
    if (Array.isArray(v))
        return v.map((v, i) => crunchVal(`${id}.${i}`, v)) as FormattedVal<FormatTree[string]>;
    return crunchTree(id, v);
}
