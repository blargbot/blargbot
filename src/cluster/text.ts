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
        autoResponse: {
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
        changeLog: {
            subscribe: {
                description: f(`Subscribes this channel to my changelog updates. I require the \`manage webhooks\` permission for this.`)
            },
            unsubscribe: {
                description: f(`Unsubscribes this channel from my changelog updates. I require the \`manage webhooks\` permission for this.`)
            }
        },
        editCommand: {
            list: {
                description: f(`Shows a list of modified commands`)
            },
            setrole: {
                description: f(`Sets the role required to run the listed commands`)
            },
            setperm: {
                description: f(`Sets the permssions required to run the listed commands. If a user has any of the permissions, they will be able to use the command.`)
            },
            disable: {
                description: f(`Disables the listed commands, so no one but the owner can use them`)
            },
            enable: {
                description: f(`Enables the listed commands, allowing anyone with the correct permissions or roles to use them`)
            },
            hide: {
                description: f(`Hides the listed commands. They can still be executed, but wont show up in help`)
            },
            show: {
                description: f(`Reveals the listed commands in help`)
            }
        },
        farewell: {
            set: {
                description: f(`Sets the bbtag to send when someone leaves the server`)
            },
            raw: {
                description: f(`Gets the current message that will be sent when someone leaves the server`)
            },
            setauthorizer: {
                description: f(`Sets the farewell message to use your permissions when running`)
            },
            setchannel: {
                description: f(`Sets the channel the farewell message will be sent in.`)
            },
            debug: {
                description: f(`Executes the farewell message as if you left the server and provides the debug output.`)
            },
            delete: {
                description: f(`Deletes the current farewell message.`)
            },
            info: {
                description: f(`Shows information about the current farewell message`)
            }
        },
        greeting: {
            set: {
                description: f(`Sets the message to send when someone joins the server`)
            },
            raw: {
                description: f(`Gets the current message that will be sent when someone joins the server`)
            },
            setauthorizer: {
                description: f(`Sets the greeting message to use your permissions when running`)
            },
            setchannel: {
                description: f(`Sets the channel the greeting message will be sent in.`)
            },
            debug: {
                description: f(`Executes the greeting message as if you left the server and provides the debug output.`)
            },
            delete: {
                description: f(`Deletes the current greeting message.`)
            },
            info: {
                description: f(`Shows information about the current greeting message`)
            }
        },
        interval: {
            set: {
                description: f(`Sets the bbtag to run every 15 minutes`)
            },
            raw: {
                description: f(`Gets the current code that the interval is running`)
            },
            delete: {
                description: f(`Deletes the current interval`)
            },
            setauthorizer: {
                description: f(`Sets the interval to run using your permissions`)
            },
            debug: {
                description: f(`Runs the interval now and sends the debug output`)
            },
            info: {
                description: f(`Shows information about the current interval`)
            }
        },
        kick: {
            flags: {
                reason: f(`The reason for the kick.`)
            },
            default: {
                description: f(`Kicks a user.\nIf mod-logging is enabled, the kick will be logged.`)
            }
        },
        log: {
            common: {
                events: {
                    avatarupdate: f(`Triggered when someone changes their username`),
                    kick: f(`Triggered when a member is kicked`),
                    memberban: f(`Triggered when a member is banned`),
                    memberjoin: f(`Triggered when someone joins`),
                    memberleave: f(`Triggered when someone leaves`),
                    membertimeout: f(`Triggered when someone is timed out`),
                    membertimeoutclear: f(`Triggered when someone's timeout is removed`),
                    memberunban: f(`Triggered when someone is unbanned`),
                    messagedelete: f(`Triggered when someone deletes a message they sent`),
                    messageupdate: f(`Triggered when someone updates a message they sent`),
                    nameupdate: f(`Triggered when someone changes their username or discriminator`),
                    nickupdate: f(`Triggered when someone changes their nickname`)
                }
            },
            list: {
                description: f(`Lists all the events currently being logged`)
            },
            enable: {
                description: {
                    default: f(`Sets the channel to log the given events to. Available events are:\n{events#map(\`{key}\` - {desc})#join(\n)}`).withArgs<{ events: Iterable<{ key: string; desc: IFormattable<string>; }>; }>(),
                    all: f(`Sets the channel to log all events to, except role related events.`),
                    role: f(`Sets the channel to log when someone gets or loses a role.`)
                }
            },
            disable: {
                description: {
                    default: f(`Disables logging of the given events. Available events are:\n{events#map(\`{key}\` - {desc})#join(\n)}`).withArgs<{ events: Iterable<{ key: string; desc: IFormattable<string>; }>; }>(),
                    all: f(`Disables logging of all events except role related events.`),
                    role: f(`Stops logging when someone gets or loses a role.`)
                }
            },
            ignore: {
                description: f(`Ignores any tracked events concerning the users`)
            },
            track: {
                description: f(`Removes the users from the list of ignored users and begins tracking events from them again`)
            }
        },
        logs: {
            flags: {
                type: f(`The type(s) of message. Value can be CREATE, UPDATE, and/or DELETE, separated by commas.`),
                channel: f(`The channel to retrieve logs from. Value can be a channel ID or a channel mention.`),
                user: f(`The user(s) to retrieve logs from. Value can be a username, nickname, mention, or ID. This uses the user lookup system.`),
                create: f(`Get message creates.`),
                update: f(`Get message updates.`),
                delete: f(`Get message deletes.`),
                json: f(`Returns the logs in a json file rather than on a webpage.`)
            },
            default: {
                description: f(`Creates a chatlog page for a specified channel, where \`number\` is the amount of lines to get. You can retrieve a maximum of 1000 logs. For more specific logs, you can specify flags.\nFor example, if you wanted to get 100 messages \`stupid cat\` deleted, you would do this:\n\`logs 100 --type delete --user stupid cat\`\nIf you want to use multiple of the same type, separate parameters with commas or chain them together. For example:\n\`logs 100 -CU -u stupid cat, dumb cat\``)
            }
        },
        massBan: {
            flags: {
                reason: f(`The reason for the ban.`)
            },
            default: {
                description: f(`Bans a user who isn't currently on your guild, where \`<userIds...>\` is a list of user IDs or mentions (separated by spaces) and \`days\` is the number of days to delete messages for.\nIf mod-logging is enabled, the ban will be logged.`)
            }
        },
        modLog: {
            setChannel: {
                description: f(`Sets the channel to use as the modlog channel`)
            },
            disable: {
                description: f(`Disables the modlog`)
            },
            clear: {
                description: f(`Deletes specific modlog entries. If you dont provide any, all the entries will be removed`)
            }
        },
        mute: {
            flags: {
                reason: f(`The reason for the (un)mute.`),
                time: f(`The amount of time to mute for, formatted as '1 day 2 hours 3 minutes and 4 seconds', '1d2h3m4s', or some other combination.`)
            },
            default: {
                description: f(`Gives the user a special muted role. On first run, this role will be created. The bot needs to be able to \`manage roles\` to create and assign the role, and \`manage channels\` to configure the role. You are able to manually configure the role without the bot, but the bot has to make it. Deleting the muted role causes it to be regenerated.\nIf the bot has permissions for it, this command will also voice-mute the user.\nIf mod-logging is enabled, the mute will be logged.\nYou can also specify a length of time the user should be muted for, using formats such as \`1 hour 2 minutes\` or \`1h2m\`.`)
            },

            clear: {
                description: f(`Removes the special muted role from the user. \nIf mod-logging is enabled, the mute will be logged.`)
            }
        },
        pardon: {
            flags: {
                reason: f(`The reason for the pardon.`),
                count: f(`The number of warnings that will be removed.`)
            },
            default: {
                description: f(`Pardons a user.\nIf mod-logging is enabled, the pardon will be logged.\nThis will not unban users.`)
            }
        },
        prefix: {
            list: {
                description: f(`Lists all the current prefixes on this server`)
            },
            add: {
                description: f(`Adds a command prefix to this server`)
            },
            remove: {
                description: f(`Removes a command prefix from this server`)
            }
        },
        reason: {
            default: {
                description: f(`Sets the reason for an action on the modlog.`)
            }
        },
        roleMe: {
            flags: {
                add: f(`A list of roles to add in the roleme`),
                remove: f(`A list of roles to remove in the roleme`),
                case: f(`Whether the phrase is case sensitive`),
                channels: f(`The channels the roleme should be in`)
            },
            add: {
                description: f(`Adds a new roleme with the given phrase`)
            },
            remove: {
                description: f(`Deletes the given roleme`)
            },
            edit: {
                description: f(`Edits the given roleme`)
            },
            setmessage: {
                description: f(`Sets the bbtag compatible message to show when the roleme is triggered`)
            },
            rawmessage: {
                description: f(`Gets the current message that will be sent when the roleme is triggered`)
            },
            debugmessage: {
                description: f(`Executes the roleme message as if you triggered the roleme`)
            },
            setauthorizer: {
                description: f(`Sets the roleme message to run using your permissions`)
            },
            info: {
                description: f(`Shows information about a roleme`)
            },
            list: {
                description: f(`Lists the rolemes currently active on this server`)
            }
        },
        removeVoteBan: {
            user: {
                description: f(`Deletes all the vote bans against the given user`)
            },
            all: {
                description: f(`Deletes all vote bans against all users`)
            }
        },
        settings: {
            description: f(`Gets or sets the settings for the current guild. Visit {website} for key documentation.`).withArgs<{ website: string; }>(),
            view: {
                description: f(`Gets the current settings for this guild`)
            },
            keys: {
                description: f(`Lists all the setting keys and their types`)
            },
            set: {
                description: f(`Sets the given setting key to have a certian value. If \`value\` is omitted, the setting is reverted to its default value`)
            }
        },
        slowMode: {
            on: {
                description: f(`Sets the channel's slowmode to 1 message every \`time\` seconds, with a max of 6 hours`)
            },
            off: {
                description: f(`Turns off the channel's slowmode`)
            }
        },
        tidy: {
            flags: {
                bots: f(`Remove messages from bots.`),
                invites: f(`Remove messages containing invites.`),
                links: f(`Remove messages containing links.`),
                embeds: f(`Remove messages containing embeds.`),
                attachments: f(`Remove messages containing attachments.`),
                user: f(`Removes messages from the users specified. Separate users by commas`),
                query: f(`Removes messages that match the provided query as a regex.`),
                invert: f(`Reverses the effects of all the flag filters.`),
                yes: f(`Bypasses the confirmation`)
            },
            default: {
                description: f(`Clears messages from chat`)
            }
        },
        timeout: {
            flags: {
                reason: f(`The reason for the timeout (removal).`),
                time: f(`The amount of time to mute for, formatted as '1 day 2 hours 3 minutes and 4 seconds', '1d2h3m4s', or some other combination.\nMaximum allowed time is 28 days. Default is 1 day.`)
            },
            user: {
                description: f(`Timeouts a user.\nIf mod-logging is enabled, the timeout will be logged.`)
            },
            clear: {
                description: f(`Removes the timeout of a user.\nIf mod-logging is enabled, the timeout removal will be logged.`)
            }
        },
        timers: {
            list: {
                description: f(`Lists all the currently active timers here`)
            },
            info: {
                description: f(`Shows detailed information about a given timer`)
            },
            cancel: {
                description: f(`Cancels currently active timers`)
            },
            clear: {
                description: f(`Clears all currently active timers`)
            }
        },
        unban: {
            flags: {
                reason: f(`The reason for the ban.`)
            },
            default: {
                description: f(`Unbans a user.\nIf mod-logging is enabled, the ban will be logged.`)
            }
        },
        unmute: {
            flags: {
                reason: f(`The reason for the unmute.`)
            },
            default: {
                description: f(`Removes the special muted role from the user. \nIf mod-logging is enabled, the mute will be logged.`)
            }
        },
        warn: {
            flags: {
                reason: f(`The reason for the warning.`),
                count: f(`The number of warnings that will be issued.`)
            },
            default: {
                description: f(`Issues a warning.\nIf mod-logging is enabled, the warning will be logged.\nIf \`kickat\` and \`banat\` have been set using the \`settings\` command, the target could potentially get banned or kicked.`)
            }
        },
        addDomain: {
            default: {
                description: f(`Toggles multiple domains to the domain whitelist for use with the {request} subtag`)
            }
        },
        patch: {
            flags: {
                fixes: f(`The bug fixes of the patch.`),
                notes: f(`Other notes.`)
            },
            default: {
                description: f(`Makes a patch note`)
            }
        },
        reload: {
            commands: {
                description: f(`Reloads the given commands, or all commands if none were given`)
            },
            events: {
                description: f(`Reloads the given events, or all events if none were given`)
            },
            services: {
                description: f(`Reloads the given services, or all services if none were given`)
            }
        },
        restart: {
            description: f(`Restarts blargbot, or one of its components`),
            default: {
                description: f(`Restarts all the clusters`)
            },
            kill: {
                description: f(`Kills the master process, ready for pm2 to restart it`)
            },
            api: {
                description: f(`Restarts the api process`)
            }
        },
        update: {
            default: {
                description: f(`Updates the codebase to the latest commit.`)
            }
        },
        avatar: {
            flags: {
                format: f(`The file format. Can be {formats#join(, | or )}.`).withArgs<{ formats: Iterable<string>; }>(),
                size: f(`The file size. Can be {sizes#join(, | or )}.`).withArgs<{ sizes: Iterable<number>; }>()
            },
            self: {
                description: f(`Gets your avatar`)
            },
            user: {
                description: f(`Gets the avatar of the user you chose`)
            }
        },
        beeMovie: {
            flags: {
                name: f(`Shows the name of the character the quote is from, if applicable.`),
                characters: f(`Only give quotes from actual characters (no stage directions).`)
            },
            default: {
                description: f(`Gives a quote from the Bee Movie.`)
            }
        },
        brainfuck: {
            default: {
                description: f(`Executes brainfuck code.`)
            },
            debug: {
                description: f(`Executes brainfuck code and returns the pointers.`)
            }
        },
        commit: {
            default: {
                description: f(`Gets a random or specified blargbot commit.`)
            }
        },
        decancer: {
            user: {
                description: f(`Decancers a users display name. If you have permissions, this will also change their nickname`)
            },
            text: {
                description: f(`Decancers some text to plain ASCII`)
            }
        },
        define: {
            default: {
                description: f(`Gets the definition for the specified word. The word must be in english.`)
            }
        },
        dmErrors: {
            default: {
                description: f(`Toggles whether to DM you errors.`)
            }
        },
        donate: {
            default: {
                description: f(`Gets my donation information`)
            }
        },
        feedback: {
            flags: {
                command: f(`Signify your feedack is for a command`),
                bbtag: f(`Signify your feedack is for BBTag`),
                docs: f(`Signify your feedack is for documentation`),
                other: f(`Signify your feedack is for other functionality`)
            },
            general: {
                description: f(`Give me general feedback about the bot`)
            },
            suggest: {
                description: f(`Tell me something you want to be added or changed`)
            },
            report: {
                description: f(`Let me know about a bug you found`)
            },
            edit: {
                description: f(`Edit some feedback you have previously sent`)
            }
        },
        help: {
            self: {
                description: f(`Gets the help message for this command`)
            },
            list: {
                description: f(`Shows a list of all the available commands`)
            },
            command: {
                description: f(`Shows the help text for the given command`)
            }
        },
        info: {
            default: {
                description: f(`Returns some info about me.`)
            }
        },
        insult: {
            someone: {
                description: f(`Generates a random insult directed at the name supplied.`)
            },
            default: {
                description: f(`Generates a random insult.`)
            }
        },
        invite: {
            default: {
                description: f(`Gets you invite information.`)
            }
        },
        mods: {
            all: {
                description: f(`Gets a list of all mods.`)
            },
            online: {
                description: f(`Gets a list of all currently online mods.`)
            },
            away: {
                description: f(`Gets a list of all currently away mods.`)
            },
            dnd: {
                description: f(`Gets a list of all mods currently set to do not disturb.`)
            },
            offline: {
                description: f(`Gets a list of all currently offline mods.`)
            }
        },
        names: {
            flags: {
                all: f(`Gets all the names.`),
                verbose: f(`Gets more information about the retrieved names.`)
            },
            list: {
                description: f(`Returns the names that I've seen the specified user have in the past 30 days.`)
            },
            remove: {
                description: f(`Removes the names ive seen you use in the past 30 days`)
            }
        },
        nato: {
            default: {
                description: f(`Translates the given text into the NATO phonetic alphabet.`)
            }
        },
        personalPrefix: {
            add: {
                description: f(`Adds a command prefix just for you!`)
            },
            remove: {
                description: f(`Removes one of your personal command prefixes`)
            },
            list: {
                description: f(`Lists the your personal command prefixes`)
            }
        },
        ping: {
            description: f(`Pong!\nFind the command latency.`),
            default: {
                description: f(`Gets the current latency.`)
            }
        },
        poll: {
            flags: {
                time: f(`How long before the poll expires, formatted as '1 day 2 hours 3 minutes and 4 seconds', '1d2h3m4s', or some other combination.`),
                emojis: f(`The emojis to apply to the poll.`),
                description: f(`The description of the poll.`),
                colour: f(`The colour of the poll (in HEX).`),
                announce: f(`If specified, it will make an announcement. Requires the proper permissions.`)
            },
            default: {
                description: f(`Creates a poll for the given question and duration. If no duration is given, defaults to 60 seconds. If emojis are given, they will be used as options for the poll.`)
            }
        },
        remind: {
            flags: {
                channel: f(`Sets the reminder to appear in the current channel rather than a DM`),
                time: f(`The time before the user is to be reminded, formatted as '1 day 2 hours 3 minutes and 4 seconds', '1d 2h 3m 4s', or some other combination`)
            },
            default: {
                description: f(`Reminds you about something after a period of time in a DM.`)
            }
        },
        roles: {
            default: {
                description: f(`Displays a list of roles and their IDs.`)
            }
        },
        roll: {
            default: {
                description: f(`Rolls the dice you tell it to, and adds the modifier`)
            }
        },
        rr: {
            default: {
                description: f(`Plays russian roulette with a specified number of bullets. If \`emote\` is specified, uses that specific emote.`)
            }
        },
        shard: {
            current: {
                description: f(`Returns information about the shard the current guild is in, along with cluster stats.`)
            },
            guild: {
                description: f(`Returns information about the shard \`guildID\` is in, along with cluster stats.`)
            }
        },
        shards: {
            flags: {
                down: f(`If provided, only shows downed shards for \`b!shards\``)
            },
            all: {
                description: f(`Shows a list of all shards.`)
            },
            guild: {
                description: f(`Shows information about the shard and cluster \`guildID\` is in `)
            },
            cluster: {
                description: f(`Show information about \`cluster\``)
            }
        },
        ship: {
            default: {
                description: f(`Gives you the ship name for two users.`)
            }
        },
        spell: {
            default: {
                description: f(`Gives you a description for a D&D 5e spell.`)
            }
        },
        stats: {
            default: {
                description: f(`Gives you some information about me`)
            }
        },
        status: {
            default: {
                description: f(`Gets you an image of an HTTP status code.`)
            }
        },
        syntax: {
            default: {
                description: f(`Gives you the 'syntax' for a command 😉`)
            }
        },
        tag: {
            description: f(`Tags are a system of public commands that anyone can create or run, using the BBTag language.\n\nFor more information about BBTag, visit <{subtags}>.\nBy creating a tag, you acknowledge that you agree to the Terms of Service (<{tos}>)`).withArgs<{ subtags: string; tos: string; }>(),
            run: {
                description: f(`Runs a user created tag with some arguments`)
            },
            test: {
                default: {
                    description: f(`Uses the BBTag engine to execute the content as if it was a tag`)
                },
                debug: {
                    description: f(`Uses the BBTag engine to execute the content as if it was a tag and will return the debug output`)
                }
            },
            docs: {
                description: f(`Returns helpful information about the specified topic.`)
            },
            debug: {
                description: f(`Runs a user created tag with some arguments. A debug file will be sent in a DM after the tag has finished.`)
            },
            create: {
                description: f(`Creates a new tag with the content you give`)
            },
            edit: {
                description: f(`Edits an existing tag to have the content you specify`)
            },
            set: {
                description: f(`Sets the tag to have the content you specify. If the tag doesnt exist it will be created.`)
            },
            delete: {
                description: f(`Deletes an existing tag`)
            },
            rename: {
                description: f(`Renames the tag`)
            },
            raw: {
                description: f(`Gets the raw contents of the tag`)
            },
            list: {
                description: f(`Lists all tags, or tags made by a specific author`)
            },
            search: {
                description: f(`Searches for a tag based on the provided name`)
            },
            permdelete: {
                description: f(`Marks the tag name as deleted forever, so no one can ever use it`)
            },
            cooldown: {
                description: f(`Sets the cooldown of a tag, in milliseconds`)
            },
            author: {
                description: f(`Displays the name of the tag's author`)
            },
            info: {
                description: f(`Displays information about a tag`)
            },
            top: {
                description: f(`Displays the top 5 tags`)
            },
            report: {
                description: f(`Reports a tag as violating the ToS`)
            },
            setlang: {
                description: f(`Sets the language to use when returning the raw text of your tag`)
            },
            favourite: {
                list: {
                    description: f(`Displays a list of the tags you have favourited`)
                },
                toggle: {
                    description: f(`Adds or removes a tag from your list of favourites`)
                }
            },
            flag: {
                list: {
                    description: f(`Lists the flags the tag accepts`)
                },
                create: {
                    description: f(`Adds multiple flags to your tag. Flags should be of the form \`-<f> <flag> [flag description]\`\ne.g. \`b!t flags add mytag -c category The category you want to use -n name Your name\``)
                },
                delete: {
                    description: f(`Removes multiple flags from your tag. Flags should be of the form \`-<f>\`\ne.g. \`b!t flags remove mytag -c -n\``)
                }
            }
        },
        time: {
            self: {
                description: f(`Gets the time in your timezone`)
            },
            user: {
                description: f(`Gets the current time for the user`)
            },
            timezone: {
                description: f(`Gets the current time in the timezone`)
            },
            convert: {
                description: f(`Converts a \`time\` from \`timezone1\` to \`timezone2\``)
            }
        },
        timer: {
            flags: {
                channel: f(`Sets the reminder to appear in the current channel rather than a DM`)
            },
            default: {
                description: f(`Sets a timer for the provided duration, formatted as '1 day 2 hours 3 minutes and 4 seconds', '1d2h3m4s', or some other combination.`)
            }
        },
        timeZone: {
            get: {
                description: f(`Gets your current timezone`)
            },
            set: {
                description: f(`Sets your current timezone. A list of [allowed timezones can be found on wikipedia](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List) under the \`TZ database name\` column`)
            }
        },
        todo: {
            list: {
                description: f(`Shows you your todo list`)
            },
            remove: {
                description: f(`Removes an item from your todo list by id`)
            },
            add: {
                description: f(`Adds an item to your todo list`)
            }
        },
        tokenify: {
            default: {
                description: f(`Converts the given input into a token.`)
            }
        },
        uptime: {
            default: {
                description: f(`Gets how long ive been online for`)
            }
        },
        user: {
            default: {
                description: f(`Gets information about a user`)
            }
        },
        version: {
            default: {
                description: f(`Tells you what version I am on`)
            }
        },
        voteBan: {
            description: f(`Its a meme, dont worry`),
            list: {
                description: f(`Gets the people with the most votes to be banned.`)
            },
            info: {
                description: f(`Checks the status of the petition to ban someone.`)
            },
            sign: {
                description: f(`Signs a petition to ban a someone`)
            },
            forgive: {
                description: f(`Removes your signature to ban someone`)
            }
        },
        warnings: {
            self: {
                description: f(`Gets how many warnings you have`)
            },
            user: {
                description: f(`Gets how many warnings the user has`)
            }
        },
        xkcd: {
            default: {
                description: f(`Gets an xkcd comic. If a number is not specified, gets a random one.`)
            }
        },
        art: {
            flags: {
                image: f(`A custom image.`)
            },
            user: {
                description: f(`Shows everyone a work of art.`)
            },
            default: {
                description: f(`Shows everyone a work of art.`)
            }
        },
        cah: {
            flags: {
                unofficial: f(`Also show unofficial cards.`)
            },
            default: {
                description: f(`Generates a set of Cards Against Humanity cards.`)
            },
            packs: {
                description: f(`Lists all the Cards against packs I know about`)
            }
        },
        caption: {
            flags: {
                top: f(`The top caption.`),
                bottom: f(`The bottom caption.`),
                font: f(`The font to use (case insensitive). Use the command with the -l flag to view the available fonts. Defaults to impact.`)
            },
            fonts: {
                description: f(`Lists the fonts that are supported`)
            },
            attached: {
                description: f(`Puts captions on an attached image.`)
            },
            linked: {
                description: f(`Puts captions on the image in the URL.`)
            }
        },
        cat: {
            default: {
                description: f(`Gets a picture of a cat.`)
            }
        },
        clint: {
            flags: {
                image: f(`A custom image.`)
            },
            user: {
                description: f(`I don't even know, to be honest.`)
            },
            default: {
                description: f(`I don't even know, to be honest.`)
            }
        },
        clippy: {
            default: {
                description: f(`Clippy the paperclip is here to save the day!`)
            }
        },
        clyde: {
            default: {
                description: f(`Give everyone a message from Clyde.`)
            }
        },
        color: {
            default: {
                description: f(`Returns the provided colors.`)
            }
        },
        delete: {
            default: {
                description: f(`Shows that you're about to delete something.`)
            }
        },
        distort: {
            flags: {
                image: f(`A custom image.`)
            },
            user: {
                description: f(`Turns an avatar into modern art.`)
            },
            default: {
                description: f(`Turns an image into modern art.`)
            }
        },
        emoji: {
            description: f(`Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.`),
            flags: {
                svg: f(`Get the emote as an svg instead of a png.`)
            },
            default: {
                description: f(`Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.`)
            }
        },
        free: {
            flags: {
                bottom: f(`The bottom caption.`)
            },
            default: {
                description: f(`Tells everyone what you got for free`)
            }
        },
        linus: {
            flags: {
                image: f(`A custom image.`)
            },
            user: {
                description: f(`Shows a picture of Linus pointing at something on his monitor.`)
            },
            default: {
                description: f(`Shows a picture of Linus pointing at something on his monitor.`)
            }
        },
        pcCheck: {
            default: {
                description: f(`Tells everyone a reason why they should get their PC checked. Template credits go to Ghosty#8204.`)
            }
        },
        pixelate: {
            flags: {
                image: f(`A custom image.`),
                scale: f(`The amount to pixelate by (defaults to 64)`)
            },
            user: {
                description: f(`Pixelates an image.`)
            },
            default: {
                description: f(`Pixelates an image.`)
            }
        },
        shit: {
            flags: {
                plural: f(`Whether or not the text is plural (use ARE instead of IS).`)
            },
            default: {
                description: f(`Tells everyone what's shit.`)
            }
        },
        sonicSays: {
            default: {
                description: f(`Sonic wants to share some words of wisdom.`)
            }
        },
        starVsTheForcesOf: {
            flags: {
                image: f(`A custom image.`)
            },
            user: {
                description: f(`WHO IS STAR BATTLING THIS EPISODE?`)
            },
            default: {
                description: f(`WHO IS STAR BATTLING THIS EPISODE?`)
            }
        },
        stupid: {
            flags: {
                user: f(`The person who is stupid.`),
                image: f(`A custom image.`)
            },
            default: {
                description: f(`Tells everyone who is stupid.`)
            }
        },
        theSearch: {
            default: {
                description: f(`Tells everyone about the progress of the search for intelligent life.`)
            }
        },
        truth: {
            default: {
                description: f(`Shows everyone what is written in the Scroll of Truth.`)
            }
        },
        danbooru: {
            default: {
                description: f(`Gets three pictures from '<https://danbooru.donmai.us/>' using given tags.`)
            }
        },
        rule34: {
            default: {
                description: f(`Gets three pictures from '<https://rule34.xxx/>' using given tags.`)
            }
        },
        eval: {
            here: {
                description: f(`Runs the code you enter on the current cluster`)
            },
            master: {
                description: f(`Runs the code you enter on the master process`)
            },
            global: {
                description: f(`Runs the code you enter on all the clusters and aggregates the result`)
            },
            cluster: {
                description: f(`Runs the code you enter on all the clusters and aggregates the result`)
            }
        },
        exec: {
            default: {
                description: f(`Executes a command on the current shell`)
            }
        },
        logLevel: {
            default: {
                description: f(`Sets the current log level`)
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
        },
        respawn: {
            description: f(`Cluster respawning only for staff.`),
            default: {
                description: f(`Respawns the cluster specified`)
            }
        },
        respond: {
            default: {
                description: f(`Responds to a suggestion, bug report or feature request`)
            }
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
