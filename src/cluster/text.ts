import { AnalysisResult } from "@blargbot/bbtag";
import { IFormatString, IFormatStringDefinition, IFormattable, TranslatableString } from "@blargbot/domain/messages";
import { FlagDefinition } from "@blargbot/domain/models/index";
import * as Eris from "eris";
import { Duration, Moment } from "moment-timezone";

import { Command } from "./command/Command";
import { CommandContext } from "./command/CommandContext";
import { GuildCommandContext } from "./types";

export function t(value: string): IFormattable<string> {
    return {
        format() {
            return value;
        }
    };
}

interface UserTag {
    readonly username?: string;
    readonly discriminator?: string;
}

export const templates = crunchTree(`cluster`, {
    common: {
    },
    regex: {
        tooLong: f(`❌ Regex is too long!`),
        invalid: f(`❌ Regex is invalid!`),
        unsafe: f(`❌ Regex is unsafe!\nIf you are 100% sure your regex is valid, it has likely been blocked due to how I detect catastrophic backtracking.\nYou can find more info about catastrophic backtracking here: <https://www.regular-expressions.info/catastrophic.html>`),
        matchesEverything: f(`❌ Your regex cannot match everything!`)
    },
    commands: {
        $errors: {
            generic: f(`❌ Something went wrong while handling your command!\nError id: \`{token}\``).withArgs<{ token: string; }>(),
            alreadyRunning: f(`❌ Sorry, this command is already running! Please wait and try again.`),
            guildOnly: f(`❌ \`{prefix}{commandName}\` can only be used on guilds.`).withArgs<CommandContext>(),
            privateOnly: f(`❌ \`{prefix}{commandName}\` can only be used in private messages.`).withArgs<CommandContext>(),
            rateLimited: {
                local: f(`❌ Sorry, you ran this command too recently! Please try again in {delay#duration(S)} seconds.`).withArgs<{ duration: Duration; }>(),
                global: f(`❌ Sorry, you've been running too many commands. To prevent abuse, I'm going to have to time you out for \`{duration#duration(S)}s\`.\n\nContinuing to spam commands will lengthen your timeout by \`{penalty#duration(S)}s\`!`).withArgs<{ duration: Duration; penalty: Duration; }>()
            },
            missingPermission: {
                generic: f(`❌ Oops, I don't seem to have permission to do that!`),
                guild: f(`❌ Hi! You asked me to do something, but I didn't have permission to do it! Please make sure I have permissions to do what you asked.\nGuild: {channel.guild.name}\nChannel: {channel.mention}\nCommand: {commandText}\n\nIf you wish to stop seeing these messages, do the command \`{prefix}dmerrors\`.`).withArgs<GuildCommandContext>()
            },
            arguments: {
                invalid: f(`❌ Invalid arguments! \`{value}\` isnt {types#map(\`{}\`)#join(, | or )}`).withArgs<{ value: string; types: string[]; }>(),
                missing: f(`❌ Not enough arguments! You need to provide {missing#map(\`{}\`)#join(, | or )}`).withArgs<{ missing: string[]; }>(),
                unknown: f(`❌ I couldn't understand those arguments!`),
                noneNeeded: f(`❌ Too many arguments! \`{command.name}\` doesn't need any arguments`).withArgs<{ command: Command; }>(),
                tooMany: f(`❌ Too many arguments! Expected at most {max} {max#plural(one:argument|other:arguments)}, but you gave {given}`).withArgs<{ max: number; given: number; }>()
            }
        },
        announce: {
            default: {
                description: f(`Resets the current configuration for announcements`),
                embed: {
                    author: {
                        name: f(`Announcement`)
                    }
                },
                failed: f(`❌ I wasn't able to send that message for some reason!`),
                success: f(`✅ I've sent the announcement!`)
            },
            reset: {
                description: f(`Resets the current configuration for announcements`),
                success: f(`✅ Announcement configuration reset! Do \`{prefix}announce configure\` to reconfigure it.`).withArgs<CommandContext>()
            },
            configure: {
                description: f(`Resets the current configuration for announcements`),
                state: {
                    ChannelInvalid: f(`❌ The announcement channel must be a text channel!`),
                    ChannelNotFound: f(`❌ No channel is set up for announcements`),
                    ChannelNotInGuild: f(`❌ The announcement channel must be on this server!`),
                    NotAllowed: f(`❌ You cannot send announcements`),
                    RoleNotFound: f(`❌ No role is set up for announcements`),
                    TimedOut: f(`❌ You must configure a role and channel to use announcements!`),
                    Success: f(`✅ Your announcements have been configured!`)
                }
            },
            info: {
                description: f(`Displays the current configuration for announcements on this server`),
                unconfigured: f(`ℹ️ Announcements are not yet configured for this server. Please use \`{prefix}announce configure\` to set them up`).withArgs<CommandContext>(),
                details: f(`ℹ️ Announcements will be sent in {channel.mention=\`<unconfigured>\`} and will mention {role.mention=\`<unconfigured>\`}`).withArgs<{ channel?: Eris.Channel; role?: Eris.Role; }>()
            }
        },
        autoresponse: {
            notWhitelisted: f(`❌ Sorry, autoresponses are currently whitelisted. To request access, do \`b!ar whitelist [reason]\``),
            notFoundId: f(`❌ There isnt an autoresponse with id \`{id}\` here!`).withArgs<{ id: string; }>(),
            notFoundEverything: f(`❌ There isn't an everything autoresponse here!`),
            flags: {
                regex: f(`If specified, parse as /regex/ rather than plaintext. Unsafe and very long (more than 2000 characters) regexes will not parse successfully.`),
                everything: f(`Makes the added autoresponse respond to everything. Only one is allowed.`)
            },
            whitelist: {
                description: f(`Requests for the current server to have autoresponses whitelisted`),
                alreadyApproved: f(`❌ This server is already whitelisted!`),
                requested: f(`✅ Your request has been sent. Please don't spam this command.\n\nYou will hear back in this channel if you were accepted or rejected.`)
            },
            list: {
                description: f(`Displays information about autoresponses`),
                noAutoresponses: f(`❌ There are no autoresponses configured for this server!`),
                embed: {
                    title: f(`Autoresponses`),
                    field: {
                        name: f(`Autoresponse \`{id}\``).withArgs<{ id: string; }>(),
                        value: {
                            regex: f(`**Trigger regex:**\n\`{trigger}\``).withArgs<{ trigger: string; }>(),
                            text: f(`**Trigger text:**\n\`{trigger}\``).withArgs<{ trigger: string; }>(),
                            any: f(`**Trigger:**\neverything`)
                        }
                    }
                }
            },
            info: {
                description: f(`Displays information about an autoresponse`),
                embed: {
                    title: {
                        id: f(`Autoresponse #{id}`).withArgs<{ id: string; }>(),
                        everything: f(`Everything Autoresponse`)
                    },
                    field: {
                        trigger: {
                            regex: f(`Trigger regex`),
                            text: f(`Trigger text`)
                        },
                        author: f(`Author`),
                        authorizer: f(`Authorizer`)
                    }
                }
            },
            create: {
                description: f(`Adds a autoresponse which matches the given pattern`),
                everythingAlreadyExists: f(`❌ An autoresponse that responds to everything already exists!`),
                everythingCannotHavePattern: f(`❌ Autoresponses that respond to everything cannot have a pattern`),
                tooMany: f(`❌ You already have {max} autoresponses!`).withArgs<{ max: number; }>(),
                missingEFlag: f(`❌ If you want to respond to everything, you need to use the \`-e\` flag.`),
                success: f(`✅ Your autoresponse has been added! Use \`{prefix}autoresponse set {id} <bbtag>\` to change the code that it runs`).withArgs<{ context: CommandContext; id: `everything` | number; }>()
            },
            delete: {
                description: f(`Deletes an autoresponse. Ids can be seen when using the \`list\` subcommand`),
                success: {
                    regex: f(`✅ Autoresponse {id} (Regex: \`{term}\`) has been deleted`).withArgs<{ id: number; term: string; }>(),
                    text: f(`✅ Autoresponse {id} (Pattern: \`{term}\`) has been deleted`).withArgs<{ id: number; term: string; }>(),
                    everything: f(`✅ The everything autoresponse has been deleted!`)
                }
            },
            setPattern: {
                description: f(`Sets the pattern of an autoresponse`),
                notEmpty: f(`❌ The pattern cannot be empty`),
                notEverything: f(`❌ Cannot set the pattern for the everything autoresponse`),
                success: {
                    regex: f(`✅ The pattern for autoresponse {id} has been set to (regex) \`{term}\`!`).withArgs<{ id: number; term: string; }>(),
                    text: f(`✅ The pattern for autoresponse {id} has been set to \`{term}\`!`).withArgs<{ id: number; term: string; }>()
                }
            },
            set: {
                description: f(`Sets the bbtag code to run when the autoresponse is triggered`),
                success: {
                    id: f(`✅ Updated the code for autoresponse {id}`).withArgs<{ id: number; }>(),
                    everything: f(`✅ Updated the code for the everything autoresponse`)
                }
            },
            raw: {
                description: f(`Gets the bbtag that is executed when the autoresponse is triggered`),
                inline: {
                    id: f(`✅ The raw code for autoresponse {id} is: \`\`\`{content}\`\`\``).withArgs<{ id: number; content: string; }>(),
                    everything: f(`✅ The raw code for the everything autoresponse is: \`\`\`{content}\`\`\``).withArgs<{ content: string; }>()
                },
                attached: {
                    id: f(`✅ The raw code for autoresponse {id} is attached`).withArgs<{ id: number; }>(),
                    everything: f(`✅ The raw code for the everything autoresponse is attached`)
                }
            },
            setAuthorizer: {
                description: f(`Sets the autoresponse to use your permissions for the bbtag when it is triggered`),
                success: {
                    id: f(`✅ You are now the authorizer for autoresponse {id}`).withArgs<{ id: number; }>(),
                    everything: f(`✅ You are now the authorizer for the everything autoresponse`)
                }
            },
            debug: {
                description: f(`Sets the autoresponse to send you the debug output when it is next triggered by one of your messages`),
                success: {
                    id: f(`✅ The next message that you send that triggers autoresponse {id} will send the debug output here`).withArgs<{ id: number; }>(),
                    everything: f(`✅ The next message that you send that triggers the everything autoresponse will send the debug output here`)
                }
            }
        },
        ban: {
            flags: {
                reason: f(`The reason for the (un)ban.`),
                time: f(`If provided, the user will be unbanned after the period of time. (softban)`)
            },
            default: {
                description: f(`Bans a user, where \`days\` is the number of days to delete messages for.\nIf mod-logging is enabled, the ban will be logged.`),
                state: {
                    alreadyBanned: f(`❌ **{user#userTag}** is already banned!`).withArgs<{ user: Eris.User; }>(),
                    memberTooHigh: f(`❌ I don't have permission to ban **{user#userTag}**! Their highest role is above my highest role.`).withArgs<{ user: Eris.User; }>(),
                    moderatorTooLow: f(`❌ You don't have permission to ban **{user#userTag}**! Their highest role is above your highest role.`).withArgs<{ user: Eris.User; }>(),
                    noPerms: f(`❌ I don't have permission to ban **{user#userTag}**! Make sure I have the \`ban members\` permission and try again.`).withArgs<{ user: Eris.User; }>(),
                    moderatorNoPerms: f(`❌ You don't have permission to ban **{user#userTag}**! Make sure you have the \`ban members\` permission or one of the permissions specified in the \`ban override\` setting and try again.`).withArgs<{ user: Eris.User; }>(),
                    success: f(`✅ **{user#userTag}** has been banned.`).withArgs<{ user: Eris.User; }>()
                },
                unbanSchedule: {
                    success: f(`✅ **{user#userTag}** has been banned and will be unbanned in **<t:{unbanAt.unix}:R>**`).withArgs<{ user: Eris.User; unbanAt: Moment; }>(),
                    invalid: f(`⚠️ **{user#userTag}** has been banned, but the duration was either 0 seconds or improperly formatted so they won't automatically be unbanned.`).withArgs<{ user: Eris.User; }>()
                }
            },
            clear: {
                description: f(`Unbans a user.\nIf mod-logging is enabled, the ban will be logged.`),
                userNotFound: f(`❌ I couldn't find that user!`),
                state: {
                    notBanned: f(`❌ **{user#userTag}** is not currently banned!`).withArgs<{ user: Eris.User; }>(),
                    noPerms: f(`❌ I don't have permission to unban **{user#userTag}**! Make sure I have the \`ban members\` permission and try again.`).withArgs<{ user: Eris.User; }>(),
                    moderatorNoPerms: f(`❌ You don't have permission to unban **{user#userTag}**! Make sure you have the \`ban members\` permission or one of the permissions specified in the \`ban override\` setting and try again.`).withArgs<{ user: Eris.User; }>(),
                    success: f(`✅ **{user#userTag}** has been unbanned.`).withArgs<{ user: Eris.User; }>()
                }
            }
        },
        blacklist: {
            default: {
                description: f(`Blacklists the current channel, or the channel that you mention. The bot will not respond until you do \`blacklist\` again.`),
                notInServer: f(`❌ You cannot blacklist a channel outside of this server`),
                success: {
                    added: f(`✅ {channel.mention} is no longer blacklisted.`).withArgs<{ channel: Eris.Channel; }>(),
                    removed: f(`✅ {channel.mention} is now blacklisted`).withArgs<{ channel: Eris.Channel; }>()
                }
            }
        },
        bot: {
            reset: {
                description: f(`Resets the bot to the state it is in when joining a guild for the first time.`),
                prompt: f(`⚠️ Are you sure you want to reset the bot to its initial state?\nThis will:\n- Reset all settings back to their defaults\n- Delete all custom commands, autoresponses, rolemes, censors, etc\n- Delete all tag guild variables`),
                cancelled: f(`❌ Reset cancelled`),
                success: f(`✅ I have been reset back to my initial configuration`)
            }
        },
        ccommand: {
            description: f(`Creates a custom command, using the BBTag language.\n\nCustom commands take precedent over all other commands. As such, you can use it to overwrite commands, or disable them entirely. If the command content is "null" (without the quotations), blargbot will have no output whatsoever, allowing you to disable any built-in command you wish. You cannot overwrite the 'ccommand' command. For more in-depth command customization, see the \`editcommand\` command.\nFor more information about BBTag, visit <{subtags}>.\nBy creating a custom command, you acknowledge that you agree to the Terms of Service (<{tos}>)`).withArgs<{ subtags: string; tos: string; }>(),
            request: {
                name: f(`Enter the name of the custom command:`),
                content: f(`Enter the custom command's contents:`)
            },
            errors: {
                isAlias: f(`❌ The command \`{commandName}\` is an alias to the tag \`{tagName}\``).withArgs<{ commandName: string; tagName: string; }>(),
                alreadyExists: f(`❌ The \`{name}\` custom command already exists!`).withArgs<{ name: string; }>(),
                doesntExist: f(`❌ The \`{name}\` custom command doesn't exist!`).withArgs<{ name: string; }>(),
                isHidden: f(`❌ The \`{name}\` custom command is a hidden command!`).withArgs<{ name: string; }>(),
                invalidBBTag: f(`❌ There were errors with the bbtag you provided!\n{errors#join(\n)}`).withArgs<{ errors: Iterable<IFormattable<string>>; }>(),
                bbtagError: f(`❌ [{location.line},{location.column}]: {message}`).withArgs<AnalysisResult>(),
                bbtagWarning: f(`❌ [{location.line},{location.column}]: {message}`).withArgs<AnalysisResult>(),
                nameReserved: f(`❌ The command name \`{name}\` is reserved and cannot be overwritten`).withArgs<{ name: string; }>(),
                tooLong: f(`❌ Command names cannot be longer than {max} characters`).withArgs<{ max: number; }>()
            },
            test: {
                default: {
                    description: f(`Uses the BBTag engine to execute the content as if it was a custom command`)
                },
                debug: {
                    description: f(`Uses the BBTag engine to execute the content as if it was a custom command and will return the debug output`)
                }
            },
            docs: {
                description: f(`Returns helpful information about the specified topic.`)
            },
            debug: {
                description: f(`Runs a custom command with some arguments. A debug file will be sent in a DM after the command has finished.`),
                notOwner: f(`❌ You cannot debug someone elses custom command.`),
                success: f(`ℹ️ Ive sent the debug output in a DM`)
            },
            create: {
                description: f(`Creates a new custom command with the content you give`),
                success: f(`✅ Custom command \`{name}\` created.\n{errors#join(\n)}`).withArgs<{ name: string; errors: Iterable<IFormattable<string>>; }>()
            },
            edit: {
                description: f(`Edits an existing custom command to have the content you specify`),
                success: f(`✅ Custom command \`{name}\` edited.\n{errors#join(\n)}`).withArgs<{ name: string; errors: Iterable<IFormattable<string>>; }>()
            },
            set: {
                description: f(`Sets the custom command to have the content you specify. If the custom command doesn't exist it will be created.`),
                success: f(`✅ Custom command \`{name}\` set.\n{errors#join(\n)}`).withArgs<{ name: string; errors: Iterable<IFormattable<string>>; }>()
            },
            delete: {
                description: f(`Deletes an existing custom command`),
                success: f(`✅ The \`{name}\` custom command is gone forever!`).withArgs<{ name: string; }>()
            },
            rename: {
                description: f(`Renames the custom command`),
                enterOldName: f(`Enter the name of the custom command to rename:`),
                enterNewName: f(`Enter the new name of the custom command:`),
                success: f(`✅ The \`{oldName}\` custom command has been renamed to \`{newName}\`.`).withArgs<{ oldName: string; newName: string; }>()
            },
            raw: {
                description: f(`Gets the raw content of the custom command`),
                inline: f(`ℹ️ The raw code for {name} is: \`\`\`{content}\`\`\``).withArgs<{ name: string; content: string; }>(),
                attached: f(`ℹ️ The raw code for {name} is attached`).withArgs<{ name: string; }>()
            },
            list: {
                description: f(`Lists all custom commands on this server`),
                embed: {
                    title: f(`List of custom commands`),
                    field: {
                        anyRole: {
                            name: f(`Any role`)
                        }
                    }
                }
            },
            cooldown: {
                description: f(`Sets the cooldown of a custom command, in milliseconds`),
                mustBePositive: f(`❌ The cooldown must be greater than 0ms`),
                success: f(`✅ The custom command \`{name}\` now has a cooldown of \`{cooldown#duration(MS)}ms\`.`).withArgs<{ name: string; cooldown: Duration; }>()
            },
            author: {
                description: f(`Displays the name of the custom command's author`),
                noAuthorizer: f(`✅ The custom command \`{name}\` was made by **{author#userTag}**`).withArgs<{ name: string; author?: UserTag; }>(),
                withAuthorizer: f(`✅ The custom command \`{name}\` was made by **{author#userTag}** and is authorized by **{authorizer#userTag}**`).withArgs<{ name: string; author?: UserTag; authorizer?: UserTag; }>()
            },
            flag: {
                updated: f(`✅ The flags for \`{name}\` have been updated.`).withArgs<{ name: string; }>(),
                get: {
                    description: f(`Lists the flags the custom command accepts`),
                    none: f(`❌ The \`{name}\` custom command has no flags.`).withArgs<{ name: string; }>(),
                    success: f(`✅ The \`{name}\` custom command has the following flags:\n\n{flags#map(\`-{flag}\`/\`--{word}\`: {description})#join(\n)}`).withArgs<{ name: string; flags: Iterable<FlagDefinition<string>>; }>()
                },
                create: {
                    description: f(`Adds multiple flags to your custom command. Flags should be of the form \`-<f> <flag> [flag description]\`\ne.g. \`b!cc flags add myCommand -c category The category you want to use -n name Your name\``),
                    wordMissing: f(`❌ No word was specified for the \`{flag}\` flag`).withArgs<{ flag: string; }>(),
                    flagExists: f(`❌ The flag \`{flag}\` already exists!`).withArgs<{ flag: string; }>(),
                    wordExists: f(`❌ A flag with the word \`{word}\` already exists!`).withArgs<{ word: string; }>()
                },
                delete: {
                    description: f(`Removes multiple flags from your custom command. Flags should be of the form \`-<f>\`\ne.g. \`b!cc flags remove myCommand -c -n\``)
                }
            },
            setHelp: {
                description: f(`Sets the help text to show for the command`),
                success: f(`✅ Help text for custom command \`{name}\` set.`).withArgs<{ name: string; }>()
            },
            hide: {
                description: f(`Toggles whether the command is hidden from the command list or not`),
                success: f(`✅ Custom command \`{name}\` is now {hidden#bool(hidden|visible)}.`).withArgs<{ name: string; hidden: boolean; }>()
            },
            setRole: {
                description: f(`Sets the roles that are allowed to use the command`),
                success: f(`✅ Roles for custom command \`{name}\` set to {roles#map({mention})#join(, | and )}.`).withArgs<{ name: string; roles: Iterable<Eris.Role>; }>()
            },
            shrinkwrap: {
                description: f(`Bundles up the given commands into a single file that you can download and install into another server`),
                confirm: {
                    prompt: f(`Salutations! You have discovered the super handy ShrinkWrapper9000!\n\nIf you decide to proceed, this will:\n{steps#join(\n)}\nThis will not:\n - Export variables\n - Export authors or authorizers\n - Export dependencies`).withArgs<{ steps: Iterable<IFormattable<string>>; }>(),
                    export: f(` - Export the custom command \`{name}\``).withArgs<{ name: string; }>(),
                    continue: f(`Confirm`),
                    cancel: f(`Cancel`)
                },
                cancelled: f(`✅ Maybe next time then.`),
                success: f(`✅ No problem, my job here is done.`)
            },
            install: {
                description: f(`Bundles up the given commands into a single file that you can download and install into another server`),
                fileMissing: f(`❌ You have to upload the installation file, or give me a URL to one.`),
                malformed: f(`❌ Your installation file was malformed.`),
                confirm: {
                    unsigned: f(`⚠️ **Warning**: This installation file is **unsigned**. It did not come from me. Please double check to make sure you want to go through with this.\n\n`),
                    tampered: f(`⚠️ **Warning**: This installation file's signature is **incorrect**. There is a 100% chance that it has been tampered with. Please double check to make sure you want to go through with this.\n\n`),
                    prompt: f(`{warning}Salutations! You have discovered the super handy CommandInstaller9000!\n\nIf you decide to proceed, this will:\n{steps#join(\n)}\nThis will also:\n - Set you as the author for all imported commands`).withArgs<{ warning?: IFormattable<string>; steps: Iterable<IFormattable<string>>; }>(),
                    import: f(`✅ Import the command \`{name}\``).withArgs<{ name: string; }>(),
                    skip: f(`❌ Ignore the command \`{name}\` as a command with that name already exists`).withArgs<{ name: string; }>(),
                    continue: f(`Confirm`),
                    cancel: f(`Cancel`)
                },
                cancelled: f(`✅ Maybe next time then.`),
                success: f(`✅ No problem, my job here is done.`)
            },
            import: {
                description: f(`Imports a tag as a ccommand, retaining all data such as author variables`),
                tagMissing: f(`❌ The \`{name}\` tag doesn't exist!`).withArgs<{ name: string; }>(),
                success: f(`✅ The tag \`{tagName}\` by **{author#userTag}** has been imported as \`{commandName}\` and is authorized by **{authorizer#userTag}**`).withArgs<{ tagName: string; commandName: string; author?: UserTag; authorizer?: UserTag; }>()
            }
        },
        censor: {
            flags: {
                regex: f(`If specified, parse as /regex/ rather than plaintext. Unsafe and very long (more than 2000 characters) regexes will not parse successfully.`),
                decancer: f(`If specified, perform the censor check against the decancered version of the message.`),
                weight: f(`How many incidents the censor is worth.`),
                reason: f(`A custom modlog reason. NOT BBTag compatible.`)
            },
            errors: {
                doesntExist: f(`❌ Censor \`{id}\` doesn't exist`).withArgs<{ id: number; }>(),
                weightNotNumber: f(`❌ The censor weight must be a number but \`{value}\` is not`).withArgs<{ value: string; }>(),
                invalidType: f(`❌ \`{type}\` is not a valid type`).withArgs<{ type: string; }>(),
                messageNotSet: {
                    default: f(`❌ A custom default {type} message has not been set yet`).withArgs<{ type: string; }>(),
                    id: f(`❌ A custom {type} message for censor {id} has not been set yet`).withArgs<{ type: string; id: number; }>()
                }
            },
            add: {
                description: f(`Creates a censor using the given phrase`),
                success: f(`✅ Censor \`{id}\` has been created`).withArgs<{ id: number; }>()
            },
            edit: {
                description: f(`Updates a censor`),
                success: f(`✅ Censor \`{id}\` has been updated`).withArgs<{ id: number; }>()
            },
            delete: {
                description: f(`Deletes a censor`),
                success: f(`✅ Censor \`{id}\` has been deleted`).withArgs<{ id: number; }>()
            },
            exception: {
                user: {
                    description: f(`Adds or removes a user from the list of users which all censors ignore`),
                    success: f(`✅ {user.mention} is now exempt from all censors`).withArgs<{ user: Eris.User; }>()
                },
                role: {
                    description: f(`Adds or removes a role from the list of roles which all censors ignore`),
                    success: f(`✅ Anyone with the role {role.mention} is now exempt from all censors`).withArgs<{ role: Eris.Role; }>()
                },
                channel: {
                    description: f(`Adds or removes a channel from the list of channels which all censors ignore`),
                    notOnServer: f(`❌ The channel must be on this server!`),
                    success: f(`✅ Messages sent in {channel.mention} are now exempt from all censors`).withArgs<{ channel: Eris.Channel; }>()
                }
            },
            setMessage: {
                description: f(`Sets the message so show when the given censor causes a user to be granted a \`timeout\`, or to be \`kick\`ed or \`ban\`ned, or the message is \`delete\`d\nIf \`id\` is not provided, the message will be the default message that gets shown if one isnt set for the censor that is triggered`),
                success: {
                    default: f(`✅ The default {type} message has been set`).withArgs<{ type: string; }>(),
                    id: f(`✅ The {type} message for censor {id} has been set`).withArgs<{ type: string; id: number; }>()
                }
            },
            setAuthorizer: {
                description: f(`Sets the custom censor message to use your permissions when executing.`),
                success: {
                    default: f(`✅ The default {type} message authorizer has been set`).withArgs<{ type: string; }>(),
                    id: f(`✅ The {type} message authorizer for censor {id} has been set`).withArgs<{ type: string; id: number; }>()
                }
            },
            rawMessage: {
                description: f(`Gets the raw code for the given censor`),
                inline: {
                    default: f(`ℹ️ The raw code for the default {type} message is: \`\`\`{content}\`\`\``).withArgs<{ type: string; content: string; }>(),
                    id: f(`ℹ️ The raw code for the {type} message for censor \`{id}\` is: \`\`\`{content}\`\`\``).withArgs<{ type: string; id: number; content: string; }>()
                },
                attached: {
                    default: f(`ℹ️ The raw code for the default {type} message is attached`).withArgs<{ type: string; }>(),
                    id: f(`ℹ️ The raw code for the {type} message for censor \`{id}\` is attached`).withArgs<{ type: string; id: number; }>()
                }
            },
            debug: {
                description: f(`Sets the censor to send you the debug output when it is next triggered by one of your messages. Make sure you arent exempt from censors!`),
                success: f(`✅ The next message that you send that triggers censor \`{id}\` will send the debug output here`).withArgs<{ id: number; }>()
            },
            list: {
                description: f(`Lists all the details about the censors that are currently set up on this server`),
                embed: {
                    title: f(`ℹ️ Censors`),
                    description: {
                        value: f(`{censors#join(\n)}`).withArgs<{ censors: Iterable<IFormattable<string>>; }>(),
                        censor: {
                            regex: f(`**Censor** \`{id}\` (Regex): {term}`).withArgs<{ id: number; term: string; }>(),
                            text: f(`**Censor** \`{id}\`: {term}`).withArgs<{ id: number; term: string; }>()
                        },
                        none: f(`No censors configured`)
                    },
                    field: {
                        users: {
                            name: f(`Excluded users`),
                            value: {
                                some: f(`{users#map(<@{}>)#join( )}`).withArgs<{ users: Iterable<string>; }>(),
                                none: f(`None`)
                            }
                        },
                        roles: {
                            name: f(`Excluded roles`),
                            value: {
                                some: f(`{roles#map(<@&{}>)#join( )}`).withArgs<{ roles: Iterable<string>; }>(),
                                none: f(`None`)
                            }
                        },
                        channels: {
                            name: f(`Excluded channels`),
                            value: {
                                some: f(`{channels#map(<#{}>)#join( )}`).withArgs<{ channels: Iterable<string>; }>(),
                                none: f(`None`)
                            }
                        }
                    }
                }
            },
            info: {
                description: f(`Gets detailed information about the given censor`),
                messageFieldValue: {
                    notSet: f(`Not set`),
                    set: f(`Author: <@{authorId}>\nAuthorizer: <@{authorizerId}>`).withArgs<{ authorId: string; authorizerId: string; }>()
                },
                embed: {
                    title: f(`ℹ️ Censor \`{id}\``).withArgs<{ id: number; }>(),
                    field: {
                        trigger: {
                            name: {
                                regex: f(`Trigger (Regex)`),
                                text: f(`Trigger`)
                            }
                        },
                        weight: {
                            name: f(`Weight`),
                            value: f(`{weight}`).withArgs<{ weight: number; }>()
                        },
                        reason: {
                            name: f(`Reason`),
                            value: f(`{reason=Not set}`).withArgs<{ reason?: string; }>()
                        },
                        deleteMessage: {
                            name: f(`Delete message`)
                        },
                        timeoutMessage: {
                            name: f(`Timeout message`)
                        },
                        kickMessage: {
                            name: f(`Kick message`)
                        },
                        banMessage: {
                            name: f(`Ban message`)
                        }
                    }
                }
            }
        },
        help: {
            forCommand: {
                description: f(`Gets the help message for this command`)
            }
        },
        awoo: {
            description: f(`Awoooooooooo!`),
            action: f(`**{self.mention}** awoos!`).withArgs<{ self: Eris.User; }>()
        },
        bang: {
            description: f(`Bang bang!`),
            action: f(`**{self.mention}** bangs!`).withArgs<{ self: Eris.User; }>()
        },
        bite: {
            description: f(`Give someone a bite!`),
            action: f(`**{self.mention}** bites **{target.mention=themselves}**`).withArgs<{ self: Eris.User; target?: Eris.User; }>()
        },
        blush: {
            description: f(`Show everyone that you're blushing.`),
            action: f(`**{self.mention}** blushes!`).withArgs<{ self: Eris.User; }>()
        },
        cry: {
            description: f(`Show everyone that you're crying.`),
            action: f(`**{self.mention}** cries!`).withArgs<{ self: Eris.User; }>()
        },
        cuddles: {
            description: f(`Cuddle with someone.`),
            action: f(`**{self.mention}** cuddles with **{target.mention=themselves}**`).withArgs<{ self: Eris.User; target?: Eris.User; }>()
        },
        dance: {
            description: f(`Break out some sweet, sweet dance moves.`),
            action: f(`**{self.mention}** dances!`).withArgs<{ self: Eris.User; }>()
        },
        hug: {
            description: f(`Give somebody a hug.`),
            action: f(`**{self.mention}** hugs **{target.mention=themselves}**`).withArgs<{ self: Eris.User; target?: Eris.User; }>()
        },
        jojo: {
            description: f(`This must be the work of an enemy stand!`)
        },
        kiss: {
            description: f(`Give somebody a kiss.`),
            action: f(`**{self.mention}** kisses **{target.mention=themselves}**`).withArgs<{ self: Eris.User; target?: Eris.User; }>()
        },
        lewd: {
            description: f(`T-that's lewd...`),
            action: f(`**{self.mention}** is lewd 😳!`).withArgs<{ self: Eris.User; }>()
        },
        lick: {
            description: f(`Give someone a lick. Sluurrpppp!`),
            action: f(`**{self.mention}** licks **{target.mention=themselves}**`).withArgs<{ self: Eris.User; target?: Eris.User; }>()
        },
        megumin: {
            description: f(`Darkness blacker than black and darker than dark, I beseech thee, combine with my deep crimson. The time of awakening cometh. Justice, fallen upon the infallible boundary, appear now as an intangible distortion! Dance, Dance, Dance! I desire for my torrent of power a destructive force: a destructive force without equal! Return all creation to cinders, and come from the abyss!`)
        },
        nom: {
            description: f(`Nom on somebody.`),
            action: f(`**{self.mention}** noms on **{target.mention=themselves}**`).withArgs<{ self: Eris.User; target?: Eris.User; }>()
        },
        owo: {
            description: f(`owo whats this?`),
            action: f(`**{self.mention}** owos!`).withArgs<{ self: Eris.User; }>()
        },
        pat: {
            description: f(`Give somebody a lovely pat.`),
            action: f(`**{self.mention}** pats **{target.mention=themselves}**`).withArgs<{ self: Eris.User; target?: Eris.User; }>()
        },
        poke: {
            description: f(`Gives somebody a poke.`),
            action: f(`**{self.mention}** pokes **{target.mention=themselves}**`).withArgs<{ self: Eris.User; target?: Eris.User; }>()
        },
        pout: {
            description: f(`Let everyone know that you're being pouty.`),
            action: f(`**{self.mention}** pouts!`).withArgs<{ self: Eris.User; }>()
        },
        punch: {
            description: f(`Punch someone. They probably deserved it.`),
            action: f(`**{self.mention}** punches **{target.mention=themselves}**`).withArgs<{ self: Eris.User; target?: Eris.User; }>()
        },
        rem: {
            description: f(`Worst girl`)
        },
        shrug: {
            description: f(`Let everyone know that you're a bit indifferent.`),
            action: f(`**{self.mention}** shrugs!`).withArgs<{ self: Eris.User; }>()
        },
        slap: {
            description: f(`Slaps someone.`),
            action: f(`**{self.mention}** slaps **{target.mention=themselves}**`).withArgs<{ self: Eris.User; target?: Eris.User; }>()
        },
        sleepy: {
            description: f(`Let everyone know that you're feeling tired.`),
            action: f(`**{self.mention}** is sleepy!`).withArgs<{ self: Eris.User; }>()
        },
        smile: {
            description: f(`Smile!`),
            action: f(`**{self.mention}** smiles!`).withArgs<{ self: Eris.User; }>()
        },
        smug: {
            description: f(`Let out your inner smugness.`),
            action: f(`**{self.mention}** is smug!`).withArgs<{ self: Eris.User; }>()
        },
        stare: {
            description: f(`Staaaaaaaaare`),
            action: f(`**{self.mention}** stares!`).withArgs<{ self: Eris.User; }>()
        },
        thumbsUp: {
            description: f(`Give a thumbs up!`),
            action: f(`**{self.mention}** gives a thumbs up!`).withArgs<{ self: Eris.User; }>()
        },
        wag: {
            description: f(`Wagwagwagwag`),
            action: f(`**{self.mention}** wags!`).withArgs<{ self: Eris.User; }>()
        }
    }
});

export default templates;

function f<T extends string>(template: T, value?: unknown): { (id: string): IFormatString<T>; withArgs<V>(): (id: string) => IFormatStringDefinition<T, V>; } {
    return Object.assign(
        (id: string): IFormatString<T> => TranslatableString.create(id, template, value),
        {
            withArgs<V>(): (id: string) => IFormatStringDefinition<T, V> {
                return id => TranslatableString.define<V, T>(id, template);
            }
        }
    );
}

type FormatTree = { [P in string]: FormatTree | ((id: string) => unknown) };
type FormattedTree<T extends FormatTree> = { [P in keyof T]: T[P] extends (id: string) => infer R ? R : T[P] extends FormatTree ? FormattedTree<T[P]> : never }

function crunchTree<T extends FormatTree>(prefix: string, value: T): FormattedTree<T> {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => {
        const id = `${prefix}.${k}`;
        if (typeof v === `function`)
            return [k, v(id)] as const;
        return [k, crunchTree(id, v)] as const;
    })) as FormattedTree<T>;
}
