import { AnalysisResult } from "@blargbot/bbtag";
import { IFormatString, IFormatStringDefinition, IFormattable, TranslatableString } from "@blargbot/domain/messages";
import { FlagDefinition } from "@blargbot/domain/models/index";
import { channel } from "diagnostics_channel";
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
            errors: {
                missingPermissions: f(`❌ I need the manage webhooks permission to subscribe this channel to changelogs!`)
            },
            subscribe: {
                description: f(`Subscribes this channel to my changelog updates. I require the \`manage webhooks\` permission for this.`),
                alreadySubscribed: f(`ℹ️ This channel is already subscribed to my changelog updates!`),
                success: f(`✅ This channel will now get my changelog updates!`)
            },
            unsubscribe: {
                description: f(`Unsubscribes this channel from my changelog updates. I require the \`manage webhooks\` permission for this.`),
                notSubscribed: f(`ℹ️ This channel is not subscribed to my changelog updates!`),
                success: f(`✅ This channel will no longer get my changelog updates!`)
            }
        },
        editCommand: {
            list: {
                description: f(`Shows a list of modified commands`),
                none: f(`ℹ️ You havent modified any commands`),
                embed: {
                    title: f(`ℹ️ Edited commands`),
                    description: {
                        name: f(`**{name}**\n`).withArgs<{ name: string; }>(),
                        roles: f(`- Roles: {roles#map({mention})#join(, )}\n`).withArgs<{ roles: Iterable<Eris.Role>; }>(),
                        permissions: f(`- Permission: {permission}\n`).withArgs<{ permission: string; }>(),
                        disabled: f(`- Disabled\n`),
                        hidden: f(`- Hidden\n`),
                        template: f(`{commands#map({name}{roles}{permissions}{disabled}{hidden})#join()}`).withArgs<{ commands: Iterable<{ name: IFormattable<string>; roles?: IFormattable<string>; permissions?: IFormattable<string>; disabled?: IFormattable<string>; hidden?: IFormattable<string>; }>; }>()
                    }
                }
            },
            setRole: {
                description: f(`Sets the role required to run the listed commands`),
                removed: f(`✅ Removed the role requirement for the following commands:\`\`\`fix\n{commands#join(, )}\`\`\``).withArgs<{ commands: Iterable<string>; }>(),
                set: f(`✅ Set the role requirement for the following commands:\`\`\`fix\n{commands#join(, )}\`\`\``).withArgs<{ commands: Iterable<string>; }>()
            },
            setPermissions: {
                description: f(`Sets the permssions required to run the listed commands. If a user has any of the permissions, they will be able to use the command.`),
                removed: f(`✅ Removed the permissions for the following commands:\`\`\`fix\n{commands#join(, )}\`\`\``).withArgs<{ commands: Iterable<string>; }>(),
                set: f(`✅ Set the permissions for the following commands:\`\`\`fix\n{commands#join(, )}\`\`\``).withArgs<{ commands: Iterable<string>; }>()
            },
            disable: {
                description: f(`Disables the listed commands, so no one but the owner can use them`),
                success: f(`✅ Disabled the following commands:\`\`\`fix\n{commands#join(, )}\`\`\``).withArgs<{ commands: Iterable<string>; }>()
            },
            enable: {
                description: f(`Enables the listed commands, allowing anyone with the correct permissions or roles to use them`),
                success: f(`✅ Enabled the following commands:\`\`\`fix\n{commands#join(, )}\`\`\``).withArgs<{ commands: Iterable<string>; }>()
            },
            hide: {
                description: f(`Hides the listed commands. They can still be executed, but wont show up in help`),
                success: f(`✅ The following commands are now hidden:\`\`\`fix\n{commands#join(, )}\`\`\``).withArgs<{ commands: Iterable<string>; }>()
            },
            show: {
                description: f(`Reveals the listed commands in help`),
                success: f(`✅ The following commands are no longer hidden:\`\`\`fix\n{commands#join(, )}\`\`\``).withArgs<{ commands: Iterable<string>; }>()
            }
        },
        farewell: {
            errors: {
                notSet: f(`❌ No farewell message has been set yet!`)
            },
            set: {
                description: f(`Sets the bbtag to send when someone leaves the server`),
                success: f(`✅ The farewell message has been set`)
            },
            raw: {
                description: f(`Gets the current message that will be sent when someone leaves the server`),
                inline: f(`ℹ️ The raw code for the farewell message is: \`\`\`{content}\`\`\``).withArgs<{ content: string; }>(),
                attached: f(`ℹ️ The raw code for the farewell message is attached`)
            },
            setAuthorizer: {
                description: f(`Sets the farewell message to use your permissions when running`),
                success: f(`✅ The farewell message will now run using your permissions`)
            },
            setChannel: {
                description: f(`Sets the channel the farewell message will be sent in.`),
                notOnGuild: f(`❌ The farewell channel must be on this server!`),
                notTextChannel: f(`❌ The farewell channel must be a text channel!`),
                success: f(`✅ Farewell messages will now be sent in {mention}`).withArgs<{ channel: Eris.Channel; }>()
            },
            debug: {
                description: f(`Executes the farewell message as if you left the server and provides the debug output.`),
                channelMissing: f(`❌ I wasnt able to locate a channel to sent the message in!`),
                success: f(`ℹ️ Ive sent the debug output in a DM`)
            },
            delete: {
                description: f(`Deletes the current farewell message.`),
                success: f(`✅ Farewell messages will no longer be sent`)
            },
            info: {
                description: f(`Shows information about the current farewell message`),
                success: f(`ℹ️ The current farewell was last edited by <@{authorId}> ({authorId}) and is authorized by <@{authorizerId}> ({authorizerId})`).withArgs<{ authorId: string; authorizerId: string; }>()
            }
        },
        greeting: {
            errors: {
                notSet: f(`❌ No greeting message has been set yet!`)
            },
            set: {
                description: f(`Sets the message to send when someone joins the server`),
                success: f(`✅ The greeting message has been set`)
            },
            raw: {
                description: f(`Gets the current message that will be sent when someone joins the server`),
                inline: f(`ℹ️ The raw code for the greeting message is: \`\`\`{content}\`\`\``).withArgs<{ content: string; }>(),
                attached: f(`ℹ️ The raw code for the greeting message is attached`)
            },
            setAuthorizer: {
                description: f(`Sets the greeting message to use your permissions when running`),
                success: f(`✅ The greeting message will now run using your permissions`)
            },
            setChannel: {
                description: f(`Sets the channel the greeting message will be sent in.`),
                notOnGuild: f(`❌ The greeting channel must be on this server!`),
                notTextChannel: f(`❌ The greeting channel must be a text channel!`),
                success: f(`✅ Greeting messages will now be sent in {mention}`).withArgs<{ channel: Eris.Channel; }>()
            },
            debug: {
                description: f(`Executes the greeting message as if you left the server and provides the debug output.`),
                channelMissing: f(`❌ I wasnt able to locate a channel to sent the message in!`),
                success: f(`ℹ️ Ive sent the debug output in a DM`)
            },
            delete: {
                description: f(`Deletes the current greeting message.`),
                success: f(`✅ Greeting messages will no longer be sent`)
            },
            info: {
                description: f(`Shows information about the current greeting message`),
                success: f(`ℹ️ The current greeting was last edited by <@{authorId}> ({authorId}) and is authorized by <@{authorizerId}> ({authorizerId})`).withArgs<{ authorId: string; authorizerId: string; }>()
            }
        },
        interval: {
            errors: {
                notSet: f(`❌ No interval has been set yet!`)
            },
            set: {
                description: f(`Sets the bbtag to run every 15 minutes`),
                success: f(`✅ The interval has been set`)
            },
            raw: {
                description: f(`Gets the current code that the interval is running`),
                inline: f(`ℹ️ The raw code for the interval is: \`\`\`{content}\`\`\``).withArgs<{ content: string; }>(),
                attached: f(`ℹ️ The raw code for the interval is attached`)
            },
            delete: {
                description: f(`Deletes the current interval`),
                success: f(`✅ The interval has been deleted`)
            },
            setauthorizer: {
                description: f(`Sets the interval to run using your permissions`),
                success: f(`✅ Your permissions will now be used when the interval runs`)
            },
            debug: {
                description: f(`Runs the interval now and sends the debug output`),
                failed: f(`❌ There was an error while running the interval!`),
                authorizerMissing: f(`❌ I couldn't find the user who authorizes the interval!`),
                channelMissing: f(`❌ I wasn't able to figure out which channel to run the interval in!`),
                timedOut: f(`❌ The interval took longer than the max allowed time ({max#duration(S)}s)`).withArgs<{ max: Duration; }>(),
                success: f(`ℹ️ Ive sent the debug output in a DM`)
            },
            info: {
                description: f(`Shows information about the current interval`),
                success: f(`ℹ️ The current interval was last edited by <@{authorId}> ({authorId}) and is authorized by <@{authorizerId}> ({authorizerId})`).withArgs<{ authorId: string; authorizerId: string; }>()
            }
        },
        kick: {
            flags: {
                reason: f(`The reason for the kick.`)
            },
            default: {
                description: f(`Kicks a user.\nIf mod-logging is enabled, the kick will be logged.`),
                state: {
                    memberTooHigh: f(`❌ I don't have permission to kick **{user#userTag}**! Their highest role is above my highest role.`).withArgs<{ user: Eris.User; }>(),
                    moderatorTooLow: f(`❌ You don't have permission to kick **{user#userTag}**! Their highest role is above your highest role.`).withArgs<{ user: Eris.User; }>(),
                    noPerms: f(`❌ I don't have permission to kick **{user#userTag}**! Make sure I have the \`kick members\` permission and try again.`).withArgs<{ user: Eris.User; }>(),
                    moderatorNoPerms: f(`❌ You don't have permission to kick **{user#userTag}**! Make sure you have the \`kick members\` permission or one of the permissions specified in the \`kick override\` setting and try again.`).withArgs<{ user: Eris.User; }>(),
                    success: f(`✅ **{user#userTag}** has been kicked.`).withArgs<{ user: Eris.User; }>()
                }
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
                description: f(`Lists all the events currently being logged`),
                embed: {
                    field: {
                        ignore: {
                            name: f(`Ignored users`),
                            value: {
                                none: f(`No ignored users`),
                                some: f(`{userIds#map(<@{}> ({}))#join(\n)}`).withArgs<{ userIds: Iterable<string>; }>()
                            }
                        },
                        current: {
                            name: f(`Currently logged events`),
                            value: {
                                none: f(`No logged events`),
                                some: {
                                    event: f(`**{event}** - <#{channelId}>}`).withArgs<{ event: string; channelId: string; }>(),
                                    role: f(`**{roleId}** - <#{channelId}>}`).withArgs<{ roleId: string; channelId: string; }>(),
                                    template: f(`{entries#join(\n)}`).withArgs<{ entries: Iterable<IFormattable<string>>; }>()
                                }
                            }
                        }
                    }
                }
            },
            enable: {
                description: {
                    default: f(`Sets the channel to log the given events to. Available events are:\n{events#map(\`{key}\` - {desc})#join(\n)}`).withArgs<{ events: Iterable<{ key: string; desc: IFormattable<string>; }>; }>(),
                    all: f(`Sets the channel to log all events to, except role related events.`),
                    role: f(`Sets the channel to log when someone gets or loses a role.`)
                },
                notOnGuild: f(`❌ The log channel must be on this server!`),
                notTextChannel: f(`❌ The log channel must be a text channel!`),
                eventInvalid: f(`❌ {events#join(, | and )} {events#plural(is not a valid event|are not valid events)}`).withArgs<{ events: Iterable<string>; }>(),
                success: f(`✅ I will now log the following events in {channel.mention}:\n{events#join(\n)}`).withArgs<{ channel: Eris.Channel; events: Iterable<string>; }>()
            },
            disable: {
                description: {
                    default: f(`Disables logging of the given events. Available events are:\n{events#map(\`{key}\` - {desc})#join(\n)}`).withArgs<{ events: Iterable<{ key: string; desc: IFormattable<string>; }>; }>(),
                    all: f(`Disables logging of all events except role related events.`),
                    role: f(`Stops logging when someone gets or loses a role.`)
                },
                success: f(`✅ I will no longer log the following events:\n{events#join(\n)}`).withArgs<{ events: Iterable<string>; }>()
            },
            ignore: {
                description: f(`Ignores any tracked events concerning the users`),
                success: f(`✅ I will now ignore events from {senderIds#map(<@{}>)#join(, | and )}`).withArgs<{ senderIds: Iterable<string>; }>()
            },
            track: {
                description: f(`Removes the users from the list of ignored users and begins tracking events from them again`),
                success: f(`✅ I will no longer ignore events from {senderIds#map(<@{}>)#join(, | and )}`).withArgs<{ senderIds: Iterable<string>; }>()
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
                description: f(`Creates a chatlog page for a specified channel, where \`number\` is the amount of lines to get. You can retrieve a maximum of 1000 logs. For more specific logs, you can specify flags.\nFor example, if you wanted to get 100 messages \`stupid cat\` deleted, you would do this:\n\`logs 100 --type delete --user stupid cat\`\nIf you want to use multiple of the same type, separate parameters with commas or chain them together. For example:\n\`logs 100 -CU -u stupid cat, dumb cat\``),
                chatlogsDisabled: f(`❌ This guild has not opted into chatlogs. Please do \`{prefix}settings set makelogs true\` to allow me to start creating chatlogs.`).withArgs<{ prefix: string; }>(),
                tooManyLogs: f(`❌ You cant get more than 1000 logs at a time`),
                notEnoughLogs: f(`❌ A minimum of 1 chatlog entry must be requested`),
                channelMissing: f(`❌ I couldn't find the channel \`{channel}\``).withArgs<{ channel: string; }>(),
                notOnGuild: f(`❌ The channel must be on this guild!`),
                noPermissions: f(`❌ You do not have permissions to look at that channels message history!`),
                userMissing: f(`❌ I couldn't find the user \`{user}\``).withArgs<{ user: string; }>(),
                generating: f(`ℹ️ Generating your logs...`),
                sendFailed: f(`❌ I wasn't able to send the message containing the logs!`),
                pleaseWait: f(`ℹ️ Generating your logs...\nThis seems to be taking longer than usual. I'll ping you when I'm finished.`),
                generated: {
                    link: {
                        quick: f(`✅ Your logs are available here: {link}`).withArgs<{ link: string; }>(),
                        slow: f(`✅ Sorry that took so long, {user.mention}.\nYour logs are available here: {link}`).withArgs<{ user: Eris.User; link: string; }>()
                    },
                    json: {
                        quick: f(`✅ Here are your logs, in a JSON file!`),
                        slow: f(`✅ Sorry that took so long, {user.mention}.\nHere are your logs, in a JSON file!`).withArgs<{ user: Eris.User; }>()
                    }
                }
            }
        },
        massBan: {
            flags: {
                reason: f(`The reason for the ban.`)
            },
            default: {
                description: f(`Bans a user who isn't currently on your guild, where \`<userIds...>\` is a list of user IDs or mentions (separated by spaces) and \`days\` is the number of days to delete messages for.\nIf mod-logging is enabled, the ban will be logged.`),

                alreadyBanned: f(`❌ All those users are already banned!`),
                targetAboveBot: f(`❌ I don't have permission to ban any of those users! Their highest roles are above my highest role.`),
                targetAboveUser: f(`❌ You don't have permission to ban any of those users! Their highest roles are above your highest role.`),
                botNoPerms: f(`❌ I don't have permission to ban anyone! Make sure I have the \`ban members\` permission and try again.`),
                userNoPerms: f(`❌ You don't have permission to ban anyone! Make sure you have the \`ban members\` permission or one of the permissions specified in the \`ban override\` setting and try again.`),
                invalidUsers: f(`❌ None of the user ids you gave were valid users!`),
                success: f(`✅ The following user(s) have been banned:${result.map(humanize.fullName).map(u => `\n**${u}**`).join(``)}`)
            }
        },
        modLog: {
            setChannel: {
                description: f(`Sets the channel to use as the modlog channel`),
                notOnGuild: f(`❌ The modlog channel must be on this server!`),
                notTextChannel: f(`❌ The modlog channel must be a text channel!`),
                success: f(`✅ Modlog entries will now be sent in ${channel.mention}`)
            },
            disable: {
                description: f(`Disables the modlog`),
                success: f(`✅ The modlog is disabled`)
            },
            clear: {
                description: f(`Deletes specific modlog entries. If you don't provide any, all the entries will be removed`),
                notFound: f(`❌ No modlogs were found!`),
                channelMissing: f(`⛔ I couldn't find the modlog channel for cases ${humanize.smartJoin(missingChannel.map(c => `\`${c}\``), `, `, ` and `)}`),
                messageMissing: f(`⛔ I couldn't find the modlog message for cases ${humanize.smartJoin(missingMessage.map(c => `\`${c}\``), `, `, ` and `)}`),
                permissionMissing: f(`⛔ I didn't have permission to delete the modlog for cases ${humanize.smartJoin(noperms.map(c => `\`${c}\``), `, `, ` and `)}`),
                success: {
                    withErrors: f(`⚠️ I successfully deleted ${modlogs.length} ${p(modlogs.length, `modlog`)} from my database.${errors.map(e => `\n⛔ ${e}`).join(``)}`),
                    default: f(`✅ I successfully deleted ${modlogs.length} ${p(modlogs.length, `modlog`)} from my database.`)
                }
            }
        },
        mute: {
            errors: {
                createPermsMissing: f(`❌ I don't have enough permissions to create a \`muted\` role! Make sure I have the \`manage roles\` permission and try again.`),
                configurePermsMissing: f(`❌ I created a \`muted\` role, but don't have permissions to configure it! Either configure it yourself, or make sure I have the \`manage channel\` permission, delete the \`muted\` role, and try again.`)
            },
            flags: {
                reason: f(`The reason for the (un)mute.`),
                time: f(`The amount of time to mute for, formatted as '1 day 2 hours 3 minutes and 4 seconds', '1d2h3m4s', or some other combination.`)
            },
            default: {
                description: f(`Gives the user a special muted role. On first run, this role will be created. The bot needs to be able to \`manage roles\` to create and assign the role, and \`manage channels\` to configure the role. You are able to manually configure the role without the bot, but the bot has to make it. Deleting the muted role causes it to be regenerated.\nIf the bot has permissions for it, this command will also voice-mute the user.\nIf mod-logging is enabled, the mute will be logged.\nYou can also specify a length of time the user should be muted for, using formats such as \`1 hour 2 minutes\` or \`1h2m\`.`),

                alreadyMuted: f(`❌ ${humanize.fullName(member.user)} is already muted`),
                botNoPerms: f(`❌ I don't have permission to mute users! Make sure I have the \`manage roles\` permission and try again.`),
                userNoPerms: f(`❌ You don't have permission to mute users! Make sure you have the \`manage roles\` permission and try again.`),
                roleMissing: f(`❌ The muted role has been deleted! Please re-run this command to create a new one.`),
                roleAboveBot: f(`❌ I can't assign the muted role! (it's higher than or equal to my top role)`),
                roleAboveUser: f(`❌ You can't assign the muted role! (it's higher than or equal to your top role)`),
                success: {
                    default: f(`✅ **${humanize.fullName(member.user)}** has been muted`),
                    durationInvalid: f(`⚠️ **${humanize.fullName(member.user)}** has been muted, but the duration was either 0 seconds or improperly formatted so they won't automatically be unmuted.`),
                    temporary: f(`✅ **${humanize.fullName(member.user)}** has been muted and will be unmuted **<t:${moment().add(duration).unix()}:R>**`)
                }
            },
            clear: {
                description: f(`Removes the special muted role from the user. \nIf mod-logging is enabled, the mute will be logged.`),
                notMuted: f(`❌ ${humanize.fullName(member.user)} is not currently muted`),
                botNoPerms: f(`❌ I don't have permission to unmute users! Make sure I have the \`manage roles\` permission and try again.`),
                userNoPerms: f(`❌ You don't have permission to unmute users! Make sure you have the \`manage roles\` permission and try again.`),
                roleAboveBot: f(`❌ I can't revoke the muted role! (it's higher than or equal to my top role)`),
                roleAboveUser: f(`❌ You can't revoke the muted role! (it's higher than or equal to your top role)`),
                success: f(`✅ **${humanize.fullName(member.user)}** has been unmuted`)
            }
        },
        pardon: {
            flags: {
                reason: f(`The reason for the pardon.`),
                count: f(`The number of warnings that will be removed.`)
            },
            default: {
                description: f(`Pardons a user.\nIf mod-logging is enabled, the pardon will be logged.\nThis will not unban users.`),
                countInvalid: f(`❌ ${flags.c?.merge().value ?? ``} isnt a number!`),
                countNegative: f(`❌ I cant give a negative amount of pardons!`),
                countZero: f(`❌ I cant give zero pardons!`),
                success: f(`✅ **${humanize.fullName(member.user)}** has been given ${p(count, `a pardon`, `${count} pardons`)}. They now have ${result.warnings} warnings.`)
            }
        },
        prefix: {
            list: {
                description: f(`Lists all the current prefixes on this server`),
                none: f(`❌ ${context.channel.guild.name} has no custom prefixes!`),
                success: f(`ℹ️ ${context.channel.guild.name} has the following prefixes:\n${prefixes.map(p => ` - ${p}`).join(`\n`)}`)
            },
            add: {
                description: f(`Adds a command prefix to this server`),
                success: f(`✅ The prefix has been added!`)
            },
            remove: {
                description: f(`Removes a command prefix from this server`),
                success: f(`✅ The prefix has been removed!`)
            }
        },
        reason: {
            default: {
                description: f(`Sets the reason for an action on the modlog.`),
                none: f(`❌ There arent any modlog entries yet!`),
                unknownCase: f(`❌ I couldnt find a modlog entry with a case id of ${caseId}`),
                success: {
                    messageMissing: f(`⚠️ The modlog has been updated! I couldnt find the message to update however.`),
                    default: f(`✅ The modlog has been updated!`)
                }
            }
        },
        roleMe: {
            errors: {
                missing: f(`❌ Roleme ${id} doesnt exist`),
                noMessage: f(`❌ Roleme ${id} doesnt have a custom message`),
                missingChannels: f(`❌ I couldnt locate any of the channels you provided`),
                missingRoles: f(`❌ I couldnt locate any of the roles you provided`),
                noRoles: f(`❌ You must provide atleast 1 role to add or remove`),
                noTrigger: f(`❌ You must provide a trigger phrase for the roleme`),
                unknownRoles: f(`❌ I couldnt find any of the roles from your message, please try again.`)
            },
            common: {
                typeQuery: f(`❓ What should users type for this roleme to trigger?`),
                caseSensitiveQuery: f(`❓ Is the trigger case sensitive?`),
                channelsQuery: f(`❓ Please mention all the channels you want the roleme to be available in`),
                rolesToAdd: f(`❓ Please type the roles you want the roleme to add, 1 per line. Mentions, ids or names can be used.`),
                rolesToRemove: f(`❓ Please type the roles you want the roleme to remove, 1 per line. Mentions, ids or names can be used.`),
                cancelRoles: f(`No roles`)
            },
            flags: {
                add: f(`A list of roles to add in the roleme`),
                remove: f(`A list of roles to remove in the roleme`),
                case: f(`Whether the phrase is case sensitive`),
                channels: f(`The channels the roleme should be in`)
            },
            add: {
                description: f(`Adds a new roleme with the given phrase`),
                unexpectedError: f(`❌ Something went wrong while I was trying to create that roleme`),
                success: f(`✅ Roleme \`${nextId}\` has been created!`)
            },
            remove: {
                description: f(`Deletes the given roleme`),
                success: f(`✅ Roleme ${id} has been deleted`)
            },
            edit: {
                description: f(`Edits the given roleme`),
                unexpectedError: f(`❌ Something went wrong while I was trying to edit that roleme`),
                success: f(`✅ Roleme \`${id}\` has been updated!`)
            },
            setmessage: {
                description: f(`Sets the bbtag compatible message to show when the roleme is triggered`),
                success: f(`✅ Roleme ${id} has now had its message set`)
            },
            rawmessage: {
                description: f(`Gets the current message that will be sent when the roleme is triggered`),

                inline: f(`ℹ️ The raw code for roleme {id} is: \`\`\`{content}\`\`\``).withArgs<{ id: number; content: string; }>(),
                attached: f(`ℹ️ The raw code for roleme {id} is attached`).withArgs<{ id: number; }>()
            },
            debugmessage: {
                description: f(`Executes the roleme message as if you triggered the roleme`),
                success: f(`ℹ️ Ive sent the debug output in a DM`)
            },
            setauthorizer: {
                description: f(`Sets the roleme message to run using your permissions`),
                success: f(`✅ Your permissions will now be used for roleme ${id}`)
            },
            info: {
                description: f(`Shows information about a roleme`),
                embed: {
                    title: f(`Roleme #${id}`),
                    field: {
                        phrase: {
                            name: f(`Phrase (case ${roleme.casesensitive ? `sensistive` : `insensitive`})`)
                        },
                        rolesAdded: {
                            name: f(`Roles added`)
                        },
                        rolesRemoved: {
                            name: f(`Roles removed`)
                        },
                        channels: {
                            name: f(`Channels`),
                            value: {
                                none: f(`Anywhere`),
                                some: f(`${channels.map(c => `<#${c}>`).join(`\n`)}`)
                            }
                        },
                        message: {
                            name: f(`Message`),
                            value: f(`**Author:** <@${roleme.output.author ?? 0}>\n**Authorizer:** <@${roleme.output.authorizer ?? roleme.output.author ?? `????`}>`)
                        }
                    }
                }
            },
            list: {
                description: f(`Lists the rolemes currently active on this server`),
                none: f(`❌ You have no rolemes created!`),
                embed: {
                    title: f(`Rolemes`),
                    description: {
                        anywhere: f(`All channels`),
                        roleme: f(`**Roleme** \`${id}\`: ${message}`),
                        layout: f(`${groups.map(g => `${g.name}\n${g.entries.join(`\n`)}`).join(`\n\n`)}`)
                    }
                }
            }
        },
        removeVoteBan: {
            user: {
                description: f(`Deletes all the vote bans against the given user`),
                success: f(`✅ Votebans for ${user.mention} have been cleared`)
            },
            all: {
                description: f(`Deletes all vote bans against all users`),
                success: f(`✅ Votebans for all users have been cleared`)
            }
        },
        settings: {
            description: f(`Gets or sets the settings for the current guild. Visit {website} for key documentation.`).withArgs<{ website: string; }>(),
            types: {
                channel: f(`channel`),
                bool: f(`bool`),
                role: f(`role`),
                int: f(`int`),
                permission: f(`permission`)
            },
            list: {
                description: f(`Gets the current settings for this guild`),
                notConfigured: f(`❌ Your guild is not correctly configured yet! Please try again later`),
                channelValue: {
                    default: f(`${channel.name ?? `Unknown channel`} (${channel.id})`),
                    none: f(`Default Channel`)
                },
                roleValue: f(`${role.name ?? `Unknown role`} (${role.id})`),
                notSet: f(`Not set`),
                groups: {
                    general: f(`General`),
                    messages: f(`Messages`),
                    channels: f(`Channels`),
                    permission: f(`Permission`),
                    warnings: f(`Warnings`),
                    moderation: f(`Moderation`)
                }
            },
            keys: {
                description: f(`Lists all the setting keys and their types`),
                key: f(` - **${setting.name}:** \`${setting.key.toUpperCase()}\``),
                success: f(`ℹ️ You can use \`settings set <key> [value]\` to set the following settings. All settings are case insensitive.\n${message.sort().join(`\n`)}`)
            },
            set: {
                description: f(`Sets the given setting key to have a certian value. If \`value\` is omitted, the setting is reverted to its default value`),
                keyInvalid: f(`❌ Invalid key!`),
                valueInvalid: f(`❌ '${value ?? `\u200b`}' is not a ${guildSettings[key].type}`),
                alreadySet: f(`❌ ${value ?? `\u200b`} is already set for ${key}`),
                success: f(`✅ ${guildSettings[key].name} is set to ${parsed.display ?? `nothing`}`)
            }
        },
        slowMode: {
            errors: {
                notTextChannel: f(`❌ You can only set slowmode on text channels!`),
                notInGuild: f(`❌ You cant set slowmode on channels outside of a server`),
                botNoPerms: f(`❌ I dont have permission to set slowmode in ${channel.mention}!`)
            },
            on: {
                description: f(`Sets the channel's slowmode to 1 message every \`time\` seconds, with a max of 6 hours`),
                timeTooLong: f(`❌ \`time\` must be less than ${duration}`),
                success: f(`✅ Slowmode has been set to 1 message every ${duration} in ${channel.mention}`)
            },
            off: {
                description: f(`Turns off the channel's slowmode`),
                success: f(`✅ Slowmode has been disabled in ${channel.mention}`)
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
                description: f(`Clears messages from chat`),
                notNegative: f(`❌ I cannot delete ${count} messages!`),
                unsafeRegex: f(`❌ That regex is not safe!`),
                invalidUsers: f(`❌ I couldnt find some of the users you gave!`),
                noMessages: f(`❌ I couldnt find any matching messages!`),
                confirm: {
                    prompt: {
                        foundAll: f(`ℹ️ I am about to attempt to delete ${`${messages.length} ${p(messages.length, `message`)}`}. Are you sure you wish to continue?\n${buildSummary(messages)}`),
                        foundSome: f(`ℹ️ I am about to attempt to delete ${`${messages.length} ${p(messages.length, `message`)} after searching through ${searched} ${p(searched, `message`)}`}. Are you sure you wish to continue?\n${buildSummary(messages)}`)
                    }
                },
                cancelled: f(`✅ Tidy cancelled, No messages will be deleted`),
                deleteFailed: f(`❌ I wasnt able to delete any of the messages! Please make sure I have permission to manage messages`),
                success: {
                    default: f(`✅ Deleted ${result.success.size} ${p(result.success.size, `message`)}:\n${buildSummary(result.success)}`),
                    partial: f(`⚠️ I managed to delete ${result.success.size} of the messages I attempted to delete.\n${buildSummary(result.success)}\n\nFailed:\n${buildSummary(result.failed)}`)
                }
            }
        },
        timeout: {
            errors: {
                botNoPerms: f(`❌ I don't have permission to timeout **${humanize.fullName(member.user)}**! Make sure I have the \`moderate members\` permission and try again.`),
                userNoPerms: f(`❌ You don't have permission to timeout **${humanize.fullName(member.user)}**! Make sure you have the \`moderate members\` permission or one of the permissions specified in the \`timeout override\` setting and try again.`)
            },
            flags: {
                reason: f(`The reason for the timeout (removal).`),
                time: f(`The amount of time to mute for, formatted as '1 day 2 hours 3 minutes and 4 seconds', '1d2h3m4s', or some other combination.\nMaximum allowed time is 28 days. Default is 1 day.`)
            },
            user: {
                description: f(`Timeouts a user.\nIf mod-logging is enabled, the timeout will be logged.`),
                targetAboveBot: f(`❌ I don't have permission to timeout **${humanize.fullName(member.user)}**! Their highest role is above my highest role.`),
                targetAboveUser: f(`❌ You don't have permission to timeout **${humanize.fullName(member.user)}**! Their highest role is above your highest role.`),
                alreadyTimedOut: f(`❌ **${humanize.fullName(member.user)}** has already been timed out.`),
                success: f(`✅ **${humanize.fullName(member.user)}** has been timed out.`)
            },
            clear: {
                description: f(`Removes the timeout of a user.\nIf mod-logging is enabled, the timeout removal will be logged.`),
                notTimedOut: f(`❌ **${humanize.fullName(member.user)}** is not currently timed out.`),
                success: f(`✅ **${humanize.fullName(member.user)}** timeout has been removed.`)
            }
        },
        timers: {
            list: {
                description: f(`Lists all the currently active timers here`),
                none: f(`✅ There are no active timers!`),
                paged: f(`Showing timers ${(page - 1) * pageSize + 1} - ${page * pageSize + 1} of ${eventsPage.total}. Page ${page}/${Math.ceil(eventsPage.total / pageSize)}`),
                success: f(`ℹ️ Here are the currently active timers:${codeBlock(gridLines.join(`\n`), `prolog`)}${paging}`)
            },
            info: {
                description: f(`Shows detailed information about a given timer`),
                notFound: f(`❌ I couldn't find the timer you gave.`),
                embed: {
                    title: f(`Timer #${simpleId(timer.id)}`),
                    field: {
                        type: {
                            name: f(`Type`)
                        },
                        user: {
                            name: f(`Started by`)
                        },
                        duration: {
                            name: f(`Duration`),
                            value: f(`Started <t:${moment(timer.starttime).unix()}>\nEnds <t:${moment(timer.endtime).unix()}>`)
                        }
                    }
                }
            },
            cancel: {
                description: f(`Cancels currently active timers`),
                timersMissing: f(`❌ I couldnt find ${p(timerIds.length, `the timer`, `any of the timers`)} you specified!`)
            },
            clear: {
                description: f(`Clears all currently active timers`),
                confirm: {
                    prompt: f(`⚠️ Are you sure you want to clear all timers?`),
                    confirm: f(`Yes`),
                    cancel: f(`No`)
                },
                cancelled: f(`ℹ️ Cancelled clearing of timers`),
                success: f(`✅ All timers cleared`)
            }
        },
        unban: {
            flags: {
                reason: f(`The reason for the ban.`)
            },
            default: {
                description: f(`Unbans a user.\nIf mod-logging is enabled, the ban will be logged.`),
                userNotFound: f(`❌ I couldn't find that user!`),
                notBanned: f(`❌ **${humanize.fullName(user)}** is not currently banned!`),
                botNoPerms: f(`❌ I don't have permission to unban **${humanize.fullName(user)}**! Make sure I have the \`ban members\` permission and try again.`),
                userNoPerms: f(`❌ You don't have permission to unban **${humanize.fullName(user)}**! Make sure you have the \`ban members\` permission or one of the permissions specified in the \`ban override\` setting and try again.`),
                success: f(`✅ **${humanize.fullName(user)}** has been unbanned.`)
            }
        },
        unmute: {
            flags: {
                reason: f(`The reason for the unmute.`)
            },
            default: {
                description: f(`Removes the special muted role from the user. \nIf mod-logging is enabled, the mute will be logged.`),
                notMuted: f(`❌ ${humanize.fullName(member.user)} is not currently muted`),
                botNoPerms: f(`❌ I don't have permission to unmute users! Make sure I have the \`manage roles\` permission and try again.`),
                userNoPerms: f(`❌ You don't have permission to unmute users! Make sure you have the \`manage roles\` permission and try again.`),
                targetAboveBot: f(`❌ I can't revoke the muted role! (it's higher than or equal to my top role)`),
                targetAboveUser: f(`❌ You can't revoke the muted role! (it's higher than or equal to your top role)`),
                success: f(`✅ **${humanize.fullName(member.user)}** has been unmuted`)
            }
        },
        warn: {
            actions: {
                ban: f(`ban`),
                kick: f(`kick`),
                timeout: f(`timeout`),
                warn: f(`warn`)
            },
            flags: {
                reason: f(`The reason for the warning.`),
                count: f(`The number of warnings that will be issued.`)
            },
            default: {
                description: f(`Issues a warning.\nIf mod-logging is enabled, the warning will be logged.\nIf \`kickat\` and \`banat\` have been set using the \`settings\` command, the target could potentially get banned or kicked.`),
                countInvalid: f(`❌ ${flags.c?.merge().value ?? ``} isnt a number!`),
                countNegative: f(`❌ I cant give a negative amount of warnings!`),
                countZero: f(`❌ I cant give zero warnings!`),
                success: {
                    targetAboveBot: f(`⚠️ **${humanize.fullName(member.user)}** has been given ${count} ${p(count, `warning`)}.\n⛔ They went over the limit for ${actionStr}s but they are above me so I couldnt ${actionStr} them.`),
                    targetAboveUser: f(`⚠️ **${humanize.fullName(member.user)}** has been given ${count} ${p(count, `warning`)}.\n⛔ They went over the limit for ${actionStr}s but they are above you so I didnt ${actionStr} them.`),
                    botNoPerms: f(`⚠️ **${humanize.fullName(member.user)}** has been given ${count} ${p(count, `warning`)}.\n⛔ They went over the limit for ${actionStr}s but I dont have permission to ${actionStr} them.`),
                    userNoPerms: f(`⚠️ **${humanize.fullName(member.user)}** has been given ${count} ${p(count, `warning`)}.\n⛔ They went over the limit for ${actionStr}s but you dont have permission to ${actionStr} them.`),
                    alreadyBanned: f(`⚠️ **${humanize.fullName(member.user)}** has been given ${count} ${p(count, `warning`)}.\n⛔ They went over the limit for bans, but they were already banned.`),
                    alreadyTimedOut: f(`⚠️ **${humanize.fullName(member.user)}** has been given ${count} ${p(count, `warning`)}.\n⛔ They went over the limit for timeouts, but they were already timed out.`),
                    warned: f(`✅ **${humanize.fullName(member.user)}** has been given ${count} ${p(count, `warning`)}. They now have ${result.warnings} warnings.`),
                    timedOut: f(`✅ **${humanize.fullName(member.user)}** has been given ${count} ${p(count, `warning`)}. They want over the limit for timeouts and so have been timed out.`),
                    banned: f(`✅ **${humanize.fullName(member.user)}** has been given ${count} ${p(count, `warning`)}. They went over the limit for bans and so have been banned.`),
                    kicked: f(`✅ **${humanize.fullName(member.user)}** has been given ${count} ${p(count, `warning`)}. They went over the limit for kicks and so have been kicked.`)
                }
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
                description: f(`Makes a patch note`),
                changelogMissing: f(`❌ I cant find the changelog channel!`),
                messageEmpty: f(`❌ I cant send out an empty patch note!`),
                embed: {
                    author: {
                        name: f(`Version ${version}`)
                    },
                    title: f(`New Features and Changes`),
                    field: {
                        bugFixes: f(`Bug fixes`),
                        otherNotes: f(`Other notes`)
                    }
                },
                confirm: {
                    prompt: f(`This is a preview of what the patch will look like`),
                    confirm: f(`Looks good, post it!`),
                    cancel: f(`Nah let me change something`)
                },
                cancelled: f(`ℹ️ Patch cancelled`),
                failed: f(`❌ I wasnt able to send the patch notes!`),
                success: f(`✅ Done!`)
            }
        },
        reload: {
            common: {
                success: f(`✅ Successfully reloaded ${count} ${p(count, type)}`)
            },
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
                description: f(`Restarts all the clusters`),
                success: f(`Ah! You've killed me but in a way that minimizes downtime! D:`)
            },
            kill: {
                description: f(`Kills the master process, ready for pm2 to restart it`),
                success: f(`Ah! You've killed me! D:`)
            },
            api: {
                description: f(`Restarts the api process`),
                success: f(`✅ Api has been respawned.`)
            }
        },
        update: {
            default: {
                description: f(`Updates the codebase to the latest commit.`),
                none: f(`✅ No update required!`),
                command: {
                    pending: f(`ℹ️ Command: \`${command}\`\nRunning...`),
                    success: f(`✅ Command: \`${command}\``),
                    error: f(`❌ Command: \`${command}\``)
                },
                packageIssue: f(`❌ Failed to update due to a package issue`),
                buildIssue: f(`❌ Failed to update due to a build issue, but successfully rolled back to commit \`${oldCommit}\``),
                rollbackIssue: f(`❌ A fatal error has occurred while rolling back the latest commit! Manual intervention is required ASAP.`),
                success: f(`✅ Updated to version ${version} commit \`${newCommit}\`!\nRun \`${context.prefix}restart\` to gracefully start all the clusters on this new version.`)
            }
        },
        avatar: {
            common: {
                formatInvalid: f(`❌ ${format} is not a valid format! Supported formats are ${humanize.smartJoin(allowedFormats, `, `, ` and `)}`),
                sizeInvalid: f(`❌ ${size ?? parsedSize} is not a valid image size! Supported sizes are ${humanize.smartJoin(allowedImageSizes, `, `, ` and `)}`),
                success: f(`✅ <@${user.id}>'s avatar`)
            },
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
            common: {
                queryInput: {
                    prompt: f(`This brainfuck code requires user input. Please say what you want to use:`)
                },
                noInput: f(`❌ No input was provided!`),
                unexpectedError: f(`❌ Something went wrong...`),
                success: {
                    empty: f(`ℹ️ No output...${pointers}`),
                    default: f(`✅ Output:\n> ${result.output.trim().split(`\n`).join(`\n> `)}${pointers}`)
                }
            },
            default: {
                description: f(`Executes brainfuck code.`)
            },
            debug: {
                description: f(`Executes brainfuck code and returns the pointers.`)
            }
        },
        commit: {
            default: {
                description: f(`Gets a random or specified blargbot commit.`),
                noCommits: f(`❌ I cant find any commits at the moment, please try again later!`),
                unknownCommit: f(`❌ I couldnt find the commit!`),
                embed: {
                    title: f(`${commit.sha.substring(0, 7)} - commit #${commitNumber}`)
                }
            }
        },
        decancer: {
            user: {
                description: f(`Decancers a users display name. If you have permissions, this will also change their nickname`),
                success: f(`✅ Successfully decancered **${member.mention}**'s name to: \`${decancered}\``)
            },
            text: {
                description: f(`Decancers some text to plain ASCII`),
                success: f(`✅ The decancered version of **${text}** is: \`${decancered}\``)
            }
        },
        define: {
            default: {
                description: f(`Gets the definition for the specified word. The word must be in english.`),
                unavailable: f(`❌ It seems I cant find the definition for that word at the moment!`),
                embed: {
                    title: f(`Definition for ${word}`),
                    description: f(`**Pronunciation** ${linkPronunciation(defaultIPA)}`),
                    field: {
                        name: f(`${i + 1}. ${r.partOfSpeech}`),
                        value: {
                            pronunciation: f(`**Pronunciation**: ${linkPronunciation(specificIPA)}\n`),
                            synonyms: f(`**Synonyms:** ${humanize.smartJoin(r.synonyms.map(s => `\`${s}\``), `, `, ` and `)}\n`),
                            default: f(`${pronunciation}${synonyms}${definition}`)
                        }
                    }
                }
            }
        },
        dmErrors: {
            default: {
                description: f(`Toggles whether to DM you errors.`),
                enabled: f(`✅ I will now DM you if I have an issue running a command.`),
                disabled: f(`✅ I won't DM you if I have an issue running a command.`)
            }
        },
        donate: {
            default: {
                description: f(`Gets my donation information`),
                success: f(`✅ Thanks for the interest! Ive sent you a DM with information about donations.`),
                embed: {
                    description: f(`Hi! This is stupid cat, creator of blargbot. I hope you're enjoying it!\n\nI don't like to beg, but right now I'm a student. Tuition is expensive, and maintaining this project isn't exactly free. I have to pay for services such as web servers and domains, not to mention invest time into developing code to make this bot as good as it can be. I don't expect to be paid for what I'm doing; the most important thing to me is that people enjoy what I make, that my product is making people happy. But still, money doesn't grow on trees. If you want to support me and what I'm doing, I have a patreon available for donations. Prefer something with less commitment? I also have a paypal available.\n\nThank you for your time. I really appreciate all of my users! :3`),
                    field: {
                        paylap: {
                            name: f(`Paypal`)
                        },
                        patreon: {
                            name: f(`Patreon`)
                        }
                    }
                }
            }
        },
        feedback: {
            errors: {
                titleTooLong: f(`❌ The first line of your suggestion cannot be more than ${64} characters!`),
                noType: f(`❌ You need to provide at least 1 feedback type.`),
                blacklisted: f(`❌ Sorry, ${type === `GUILD` ? `your guild has` : `you have`} been blacklisted from the use of the \`${context.prefix}feedback\` command. If you wish to appeal this, please join my support guild. You can find a link by doing \`${context.prefix}invite\`.`)
            },
            blacklist: {
                unknownType: f(`❌ I dont know how to blacklist a ${type}! only \`guild\` and \`user\``),
                alreadyBlacklisted: f(`❌ That ${type} id is already blacklisted!`),
                notBlacklisted: f(`❌ That ${type} id is not blacklisted!`),
                success: f(`✅ The ${type} ${id} has been ${add ? `blacklisted` : `removed from the blacklist`}`)
            },
            flags: {
                command: f(`Signify your feedack is for a command`),
                bbtag: f(`Signify your feedack is for BBTag`),
                docs: f(`Signify your feedack is for documentation`),
                other: f(`Signify your feedack is for other functionality`)
            },
            general: {
                description: f(`Give me general feedback about the bot`),
                unexpectedError: f(`❌ Something went wrong while trying to submit that! Please try again`),
                queryType: {
                    prompt: f(`ℹ️ Please select the types that apply to your suggestion`),
                    placeholder: f(`Select your suggestion type`)
                },
                types: {
                    command: f(`Command`),
                    bbtag: f(`BBTag`),
                    documentation: f(`Documentation`),
                    other: f(`Other Functionality`)
                },
                embed: {
                    description: f(`**${title}**\n\n${description}`),
                    field: {
                        types: {
                            name: f(`Types`)
                        }
                    },
                    footer: {
                        text: f(`Case ${record} | ${context.message.id}`)
                    }
                }
            },
            suggest: {
                description: f(`Tell me something you want to be added or changed`)
            },
            report: {
                description: f(`Let me know about a bug you found`)
            },
            edit: {
                description: f(`Edit some feedback you have previously sent`),
                unknownCase: f(`❌ I couldnt find any feedback with the case number ${caseNumber}!`),
                notOwner: f(`❌ You cant edit someone elses suggestion.`),
                success: f(`✅ Your case has been updated.`)
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
                description: f(`Returns some info about me.`),
                notReady: f(`⚠️ Im still waking up! Try again in a minute or two`),
                embed: {
                    title: f(`About me!`),
                    description: f(`I am a multipurpose bot with new features implemented regularly, written in typescript using [Eris](https://abal.moe/Eris/).\n\n🎂 I am currently ${ageStr} old!`),
                    field: {
                        patron: {
                            name: f(`️️️️️️️️❤️ Special thanks to my patrons! ❤️`)
                        },
                        donator: {
                            name: f(`️️️️️️️️❤️ Special thanks to all my other donators! ❤️`)
                        },
                        other: {
                            name: f(`❤️ Special huge thanks to: ❤️`)
                        },
                        details: {
                            value: f(`For commands, do \`${context.prefix}help\`. For information about supporting me, do \`${context.prefix}donate\`.\nFor any additional information, such as command documentation, please visit my website: <https://blargbot.xyz>`)
                        }
                    }
                }
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
                description: f(`Gets you invite information.`),
                success: f(`Invite me to your guild!\n<${context.util.websiteLink(`invite`)}>\nJoin my support guild!\nhttps://discord.gg/015GVxZxI8rtlJgXF\``)
            }
        },
        mods: {
            common: {
                embed: {
                    title: f(`Moderators`),
                    description: {
                        none: f(`There are no mods with that status!`)
                    },
                    field: {
                        online: {
                            name: f(`<${context.config.discord.emotes.online}> Online`)
                        },
                        online: {
                            name: f(`<${context.config.discord.emotes.away}> Away`)
                        },
                        online: {
                            name: f(`<${context.config.discord.emotes.busy}> Do not disturb`)
                        },
                        online: {
                            name: f(`<${context.config.discord.emotes.offline}> Offline`)
                        }
                    }
                }
            },
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
                description: f(`Returns the names that I've seen the specified user have in the past 30 days.`),
                none: {
                    ever: f(`ℹ️ I havent seen any usernames for ${user.mention} yet!`),
                    since: f(`ℹ️ I havent seen ${user.mention} change their username since <t:${cutoff.unix()}>!`)
                },
                embed: {
                    title: f(`Historical usernames`),
                    description: {
                        since: f(`Since <t:${cutoff.unix()}>\n${usernames.map(u => `${u.name} - <t:${moment(u.date).unix()}:R>`).join(`\n`)}`),
                        ever: f(`${usernames.map(u => `${u.name} - <t:${moment(u.date).unix()}:R>`).join(`\n`)}`)
                    }
                }
            },
            remove: {
                description: f(`Removes the names ive seen you use in the past 30 days`),
                none: f(`ℹ️ You dont have any usernames to remove!`),
                notFound: f(`❌ I couldnt find any of the usernames you gave!`),
                confirm: {
                    prompt: {
                        some: f(`⚠️ Are you sure you want to remove ${countStr} usernames`),
                        all: f(`⚠️ Are you sure you want to remove **all usernames**`)
                    },
                    confirm: f(`Yes`),
                    cancel: f(`No`)
                },
                cancelled: f(`✅ I wont remove any usernames then!`),
                success: f(`✅ Successfully removed ${countStr}!`)
            }
        },
        nato: {
            default: {
                description: f(`Translates the given text into the NATO phonetic alphabet.`)
            }
        },
        personalPrefix: {
            add: {
                description: f(`Adds a command prefix just for you!`),
                alreadyAdded: f(`❌ You already have that as a command prefix.`),
                success: f(`✅ Your personal command prefix has been added.`)
            },
            remove: {
                description: f(`Removes one of your personal command prefixes`),
                notAdded: f(`❌ That isnt one of your prefixes.`),
                success: f(`✅ Your personal command prefix has been removed.`)
            },
            list: {
                description: f(`Lists the your personal command prefixes`),
                none: f(`ℹ️ You dont have any personal command prefixes set!`),
                embed: {
                    title: f(`Personal prefixes`),
                    description: f(`${prefixes.map(x => ` - ${x}`).join(`\n`)}`)
                }
            }
        },
        ping: {
            description: f(`Pong!\nFind the command latency.`),
            default: {
                description: f(`Gets the current latency.`),
                pending: f(`ℹ️ ${content}`),
                success: f(`✅ Pong! (${message.createdAt - context.timestamp}ms)`)
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
                description: f(`Creates a poll for the given question and duration. If no duration is given, defaults to 60 seconds. If emojis are given, they will be used as options for the poll.`),
                invalidDuration: f(`❌ \`${time}\` is not a valid duration for a poll.`),
                invalidColor: f(`❌ \`${options.color}\` is not a valid color!`),
                sendFailed: f(`❌ I wasnt able to send the poll! Please make sure I have the right permissions and try again.`),
                noAnnouncePerms: f(`❌ Sorry, you dont have permissions to send announcements!`),
                announceNotSetUp: f(`❌ Announcements on this server arent set up correctly. Please fix them before trying again.`),
                emojisMissing: f(`❌ You must provide some emojis to use in the poll.`),
                emojisInaccessible: f(`❌ I dont have access to some of the emojis you used! Please use different emojis or add me to the server that the emojis are from.`),
                tooShort: f(`❌ ${time.humanize()} is too short for a poll! Use a longer time`),
                someEmojisMissing: f(`⚠️ I managed to create the poll, but wasnt able to add some of the emojis to it. Please add them manually (they will still be counted in the results)`)
            }
        },
        remind: {
            flags: {
                channel: f(`Sets the reminder to appear in the current channel rather than a DM`),
                time: f(`The time before the user is to be reminded, formatted as '1 day 2 hours 3 minutes and 4 seconds', '1d 2h 3m 4s', or some other combination`)
            },
            default: {
                description: f(`Reminds you about something after a period of time in a DM.`),
                durationRequired: f(`❌ The \`-t\` flag is required to set the duration of the reminder!`),
                durationZero: f(`❌ I cant set a timer for 0 seconds!`),
                reminderMissing: f(`❌ You need to say what you need reminding of!`),
                success: f(`✅ Ok, ill ping you ${channel === context.channel ? `here` : `in a DM`} <t:${moment().add(duration).unix()}:R>`)
            }
        },
        roles: {
            default: {
                description: f(`Displays a list of roles and their IDs.`),
                embed: {
                    title: f(`Roles`)
                }
            }
        },
        roll: {
            default: {
                description: f(`Rolls the dice you tell it to, and adds the modifier`),
                diceInvalid: f(`❌ \`${dice}\` is not a valid dice!`),
                tooBig: f(`❌ Youre limited to ${maxRolls} of a d${maxFaces}`),
                character: {
                    embed: {
                        description: f(`Stat #${i} - [ ${rolls.join(`, `)} ] > ${total.toString().padStart(2, ` `)} - ${min} > ${(total - min).toString().padStart(2, ` `)}`)
                    }
                },
                embed: {
                    title: f(`🎲 ${rollCount} ${p(rollCount, `roll`)} of a ${faceCount} sided dice:`),
                    description: {
                        modifier: f(`**Modifier**: ${total + modifier} ${sign} ${-modifier}\n`),
                        natural1: f(`- Natural 1...`),
                        natural20: f(`- Natural 20`)
                    }
                }
            }

        },
        rr: {
            default: {
                description: f(`Plays russian roulette with a specified number of bullets. If \`emote\` is specified, uses that specific emote.`),
                notEnoughBullets: f(`❌ Wimp! You need to load at least one bullet.`),
                guaranteedDeath: f(`⚠️ Do you have a deathwish or something? Your revolver can only hold 6 bullets, that's guaranteed death!`),
                tooManyBullets: f(`⚠️ That's gutsy, but your revolver can only hold 6 bullets!`),
                jammed: f(`❌ Your revolver jams when you try to close the barrel. Maybe you should try somewhere else...`),
                confirm: {
                    prompt: f(`You load ${p(bullets, `a`, numMap[bullets])} ${p(bullets, `bullet`)} into your revolver, give it a spin, and place it against your head`),
                    confirm: f(`Put the gun down`),
                    cancel: f(`Pull the trigger`)
                },
                chicken: f(`You chicken out and put the gun down.\n${randChoose(chickenMsg)}`),
                died: f(`***BOOM!*** ${randChoose(deathMsg)}`),
                lived: f(`*Click!* ${randChoose(liveMsg)}`)
            }
        },
        shard: {
            common: {
                embed: {
                    title: f(`Shard ${shard.id}`),
                    field: {
                        shard: {
                            name: f(`Shard ${shard.id.toString()}`),
                            value: f(`\`\`\`\nStatus: ${discord.cluster.statusEmojiMap[shard.status]}\nLatency: ${shard.latency}ms\nGuilds: ${shard.guilds}\nCluster: ${shard.cluster}\nLast update: ${humanize.duration(moment(), moment(shard.time, `x`), 1)} ago\n\`\`\``)
                        },
                        cluster: {
                            name: f(`Cluster ${clusterData.id.toString()}`),
                            value: f(`CPU usage: ${clusterData.userCpu.toFixed(1)}\nGuilds: ${clusterData.guilds.toString()}\nRam used: ${humanize.ram(clusterData.rss)}\nStarted <t:${Math.round(clusterData.readyTime / 1000)}:R>`)
                        },
                        shards: {
                            name: f(`Shards`),
                            value: f(`\`\`\`\n${clusterData.shards.map(shard => `${shard.id} ${discord.cluster.statusEmojiMap[shard.status]} ${shard.latency}ms`).join(`\n`)}\n\`\`\``)
                        }
                    }
                }
            },
            current: {
                description: f(`Returns information about the shard the current guild is in, along with cluster stats.`),
                dm: {
                    embed: {
                        description: f(`Discord DMs are on shard \`0\` in cluster \`${context.cluster.id.toString()}\``)
                    }
                }
            },
            guild: {
                description: f(`Returns information about the shard \`guildID\` is in, along with cluster stats.`),
                invalidGuild: f(`❌ \`${guildID}\` is not a valid guildID`),
                embed: {
                    description: {
                        here: f(`This guild is on shard \`${clusterData.shard.id}\` and cluster \`${clusterData.cluster.id}\``),
                        other: f(`Guild \`${guildID}\` is on shard \`${clusterData.shard.id}\` and cluster \`${clusterData.cluster.id}\``)
                    }
                }
            }
        },
        shards: {
            common: {
                invalidCluster: f(`❌ Cluster does not exist`),
                noStats: f(`❌ Cluster ${clusterID} is not online at the moment`),
                embed: {
                    title: f(`Shard ${shard.id}`),
                    field: {
                        shard: {
                            name: f(`Shard ${shard.id.toString()}`),
                            value: f(`\`\`\`\nStatus: ${discord.cluster.statusEmojiMap[shard.status]}\nLatency: ${shard.latency}ms\nGuilds: ${shard.guilds}\nCluster: ${shard.cluster}\nLast update: ${humanize.duration(moment(), moment(shard.time, `x`), 1)} ago\n\`\`\``)
                        },
                        cluster: {
                            name: f(`Cluster ${clusterData.id.toString()}`),
                            value: f(`CPU usage: ${clusterData.userCpu.toFixed(1)}\nGuilds: ${clusterData.guilds.toString()}\nRam used: ${humanize.ram(clusterData.rss)}\nStarted <t:${Math.round(clusterData.readyTime / 1000)}:R>`)
                        },
                        shards: {
                            name: f(`Shards`),
                            value: f(`\`\`\`\n${clusterData.shards.map(shard => `${shard.id} ${discord.cluster.statusEmojiMap[shard.status]} ${shard.latency}ms`).join(`\n`)}\n\`\`\``)
                        }
                    }
                }
            },
            flags: {
                down: f(`If provided, only shows downed shards for \`b!shards\``)
            },
            all: {
                description: f(`Shows a list of all shards.`),
                noneDown: f(`ℹ️ No shards are currently down!`),
                noStats: f(`❌ No cluster stats yet!`),
                embed: {
                    title: f(`Shards`),
                    description: f(`I'm running on \`${clusterCount}\` cluster${clusterCount > 1 ? `s` : ``} and \`${shardConfig.max}\` shard${shardConfig.max > 1 ? `s` : ``}\n`),
                    field: {
                        name: f(`Cluster ${cluster.id.toString()}`),
                        value: f(`Ready since: <t:${Math.round(cluster.readyTime / 1000)}:R>\nRam: ${humanize.ram(cluster.rss)}\n**Shards**:\n\`\`\`\n${cluster.shards.map(shard => `${shard.id} ${discord.cluster.statusEmojiMap[shard.status]} ${shard.latency}ms`).join(`\n`)}\n\`\`\``)
                    }
                }
            },
            guild: {
                description: f(`Shows information about the shard and cluster \`guildID\` is in `),
                invalidGuild: f(`❌ \`${guildIDStr}\` is not a valid guildID`),
                embed: {
                    description: {
                        here: f(`This guild is on shard \`${clusterData.shard.id}\` and cluster \`${clusterData.cluster.id}\``),
                        other: f(`Guild \`${guildID}\` is on shard \`${clusterData.shard.id}\` and cluster \`${clusterData.cluster.id}\``)
                    }
                }
            },
            cluster: {
                description: f(`Show information about \`cluster\``)
            }
        },
        ship: {
            default: {
                description: f(`Gives you the ship name for two users.`),
                success: f(`❤️ Your ship name is **${firstHalf}${secondHalf}**!`)
            }
        },
        spell: {
            default: {
                description: f(`Gives you a description for a D&D 5e spell.`),
                notFound: f(`❌ I couldnt find that spell!`),
                components: {
                    v: f(`Verbal`),
                    s: f(`Somantic`),
                    m: f(`Material`),
                    f: f(`Focus`),
                    df: f(`Divine Focus`),
                    xp: f(`XP Cost`)
                },
                query: {
                    prompt: f(`🪄 Multiple spells found! Please pick the right one`),
                    placeholder: f(`Pick a spell`),
                    choice: {
                        description: f(`Level ${s.level} ${s.school}`)
                    }
                },
                embed: {
                    description: f(`*Level ${spell.level} ${spell.school}*\n\n${spell.desc}`),
                    field: {
                        duration: {
                            name: f(`Duration`)
                        },
                        range: {
                            name: f(`Range`)
                        },
                        castingTime: {
                            name: f(`Casting Time`)
                        },
                        components: {
                            name: f(`Components`)
                        }
                    }
                }
            }
        },
        stats: {
            default: {
                description: f(`Gives you some information about me`),
                embed: {
                    title: f(`Bot Statistics`),
                    footer: {
                        text: f(`blargbot`)
                    },
                    field: {
                        guilds: {
                            name: f(`Guilds`)
                        },
                        users: {
                            name: f(`Users`)
                        },
                        channels: {
                            name: f(`Channels`)
                        },
                        shards: {
                            name: f(`Shards`),
                            value: f(`${context.config.discord.shards.max}`)
                        },
                        clusters: {
                            name: f(`Clusters`),
                            value: f(`${Math.ceil(context.config.discord.shards.max / context.config.discord.shards.perCluster)}`)
                        },
                        ram: {
                            name: f(`RAM`),
                            value: f(`${humanize.ram(mappedStats.rss)}`)
                        },
                        version: {
                            name: f(`Version`)
                        },
                        uptime: {
                            name: f(`Uptime`),
                            value: f(`<t:${context.cluster.createdAt.unix()}:R>`)
                        },
                        eris: {
                            name: f(`Eris`),
                            value: eris.VERSION
                        },
                        nodeJS: {
                            name: f(`Node.js`)
                        }
                    }
                }
            }
        },
        status: {
            default: {
                description: f(`Gets you an image of an HTTP status code.`),
                notFound: f(`❌ Something terrible has happened! 404 is not found!`)
            }
        },
        syntax: {
            default: {
                description: f(`Gives you the 'syntax' for a command 😉`),
                success: f(`❌ Invalid usage!\nProper usage: \`${context.prefix}syntax ${cleanName} ${correctTokens.join(` `)}\``)
            }
        },
        tag: {
            description: f(`Tags are a system of public commands that anyone can create or run, using the BBTag language.\n\nFor more information about BBTag, visit <{subtags}>.\nBy creating a tag, you acknowledge that you agree to the Terms of Service (<{tos}>)`).withArgs<{ subtags: string; tos: string; }>(),
            common: {
                debugInDm: f(`ℹ️ Ive sent the debug output in a DM`),
                done: f(`✅ I hope you found what you were looking for!`)
            },
            errors: {
                noneFound: f(`❌ No results found!`),
                tagMissing: f(`❌ The \`${tagName}\` tag doesn't exist!`),
                invalidBBTag: f(`❌ There were errors with the bbtag you provided!\n${bbtag.stringifyAnalysis(analysis)}`),
                notOwner: f(`❌ You don't own the \`${match.name}\` tag!`),
                alreadyExists: f(`❌ The \`${match.name}\` tag already exists!`)

            },
            run: {
                description: f(`Runs a user created tag with some arguments`)
            },
            test: {
                default: {
                    description: f(`Uses the BBTag engine to execute the content as if it was a tag`)
                },
                debug: {
                    description: f(`Uses the BBTag engine to execute the content as if it was a tag and will return the debug output`),
                    tagNotOwned: f(`❌ You cannot debug someone elses tag.`)
                }
            },
            docs: {
                description: f(`Returns helpful information about the specified topic.`)
            },
            debug: {
                description: f(`Runs a user created tag with some arguments. A debug file will be sent in a DM after the tag has finished.`)
            },
            create: {
                description: f(`Creates a new tag with the content you give`),
                success: f(`✅ Tag \`{name}\` created.\n{errors#join(\n)}`).withArgs<{ name: string; errors: Iterable<IFormattable<string>>; }>()
            },
            edit: {
                description: f(`Edits an existing tag to have the content you specify`),
                success: f(`✅ Tag \`{name}\` edited.\n{errors#join(\n)}`).withArgs<{ name: string; errors: Iterable<IFormattable<string>>; }>()
            },
            set: {
                description: f(`Sets the tag to have the content you specify. If the tag doesnt exist it will be created.`),
                success: f(`✅ Tag \`{name}\` set.\n{errors#join(\n)}`).withArgs<{ name: string; errors: Iterable<IFormattable<string>>; }>()
            },
            delete: {
                description: f(`Deletes an existing tag`),
                success: f(`✅ The \`${match.name}\` tag is gone forever!`)
            },
            rename: {
                description: f(`Renames the tag`),
                success: f(`✅ The \`${from.name}\` tag has been renamed to \`${to.name}\`.`)
            },
            raw: {
                description: f(`Gets the raw contents of the tag`),
                inline: f(`ℹ️ The raw code for {name} is: \`\`\`{content}\`\`\``).withArgs<{ name: string; content: string; }>(),
                attached: f(`ℹ️ The raw code for {name} is attached`).withArgs<{ name: string; }>()
            },
            list: {
                description: f(`Lists all tags, or tags made by a specific author`)
            },
            search: {
                description: f(`Searches for a tag based on the provided name`)
            },
            permdelete: {
                description: f(`Marks the tag name as deleted forever, so no one can ever use it`),
                notStaff: f(`❌ You cannot disable tags`),
                success: f(`✅ The \`${tagName}\` tag has been deleted`)
            },
            cooldown: {
                description: f(`Sets the cooldown of a tag, in milliseconds`),
                cooldownZero: f(`❌ The cooldown must be greater than 0ms`),
                success: f(`✅ The tag \`${match.name}\` now has a cooldown of \`${humanize.duration(cooldown)}\`.`)
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
                description: f(`Reports a tag as violating the ToS`),
                unavailable: f(`❌ Sorry, you cannot report tags at this time. Please try again later!`),
                deleted: f(`✅ The \`${match.name}\` tag is no longer being reported by you.`),
                added: f(`✅ The \`${match.name}\` tag has been reported.`)
            },
            setlang: {
                description: f(`Sets the language to use when returning the raw text of your tag`),
                success: f(`✅ Lang for tag \`${match.name}\` set.`)
            },
            favourite: {
                list: {
                    description: f(`Displays a list of the tags you have favourited`),
                    none: f(`You have no favourite tags!`),
                    success: f(`You have ${tags.length} favourite ${p(tags.length, `tag`)}. ${codeBlock(tags.join(`, `), `fix`)}`)
                },
                toggle: {
                    description: f(`Adds or removes a tag from your list of favourites`)
                }
            },
            flag: {
                list: {
                    description: f(`Lists the flags the tag accepts`),
                    none: f(`The \`${match.name}\` tag has no flags.`),
                    success: f(`The \`${match.name}\` tag has the following flags:\n\n${flags.join(`\n`)}`)
                },
                create: {
                    description: f(`Adds multiple flags to your tag. Flags should be of the form \`-<f> <flag> [flag description]\`\ne.g. \`b!t flags add mytag -c category The category you want to use -n name Your name\``),
                    wordMissing: f(`❌ No word was specified for the \`${flag}\` flag`),
                    flagExists: f(`❌ The flag \`${flag}\` already exists!`),
                    wordExists: f(`❌ A flag with the word \`${word}\` already exists!`),
                    success: f(`✅ The flags for \`${match.name}\` have been updated.`)
                },
                delete: {
                    description: f(`Removes multiple flags from your tag. Flags should be of the form \`-<f>\`\ne.g. \`b!t flags remove mytag -c -n\``),
                    success: f(`✅ The flags for \`${match.name}\` have been updated.`)
                }
            }
        },
        time: {
            errors: {
                timezoneInvalid: f(`❌ \`${timezone}\` is not a valid timezone! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.`)
            },
            self: {
                description: f(`Gets the time in your timezone`)
            },
            user: {
                description: f(`Gets the current time for the user`),
                timezoneNotSet: f(`❌ ${user.mention} has not set their timezone with the \`${context.prefix}timezone\` command yet.`),
                timezoneInvalid: f(`❌ ${user.mention} doesnt have a valid timezone set. They need to update it with the \`${context.prefix}timezone\` command`),
                success: f(`ℹ️ It is currently **${now.format(`LT`)}** for **${user.mention}**.`)
            },
            timezone: {
                description: f(`Gets the current time in the timezone`),
                success: f(`ℹ️ In **${now.zoneAbbr()}**, it is currently **${now.format(`LT`)}**`)
            },
            convert: {
                description: f(`Converts a \`time\` from \`timezone1\` to \`timezone2\``),
                invalidTime: f(`❌ \`${time}\` is not a valid time! Please use the 12 or 24 hour format, e.g. 1:32pm or 13:32`),
                success: f(`ℹ️ When it's **${source.format(`LT`)}** in **${source.zoneAbbr()}**, it's **${dest.format(`LT`)}** in **${dest.zoneAbbr()}**.`)
            }
        },
        timer: {
            flags: {
                channel: f(`Sets the reminder to appear in the current channel rather than a DM`)
            },
            default: {
                description: f(`Sets a timer for the provided duration, formatted as '1 day 2 hours 3 minutes and 4 seconds', '1d2h3m4s', or some other combination.`),
                durationZero: f(`❌ I cant set a timer for 0 seconds!`),
                success: f(`✅ Ok, ill ping you ${channel === context.channel ? `here` : `in a DM`} <t:${moment().add(duration).unix()}:R>`)
            }
        },
        timeZone: {
            get: {
                description: f(`Gets your current timezone`),
                notSet: f(`ℹ️ You haven't set a timezone yet.`),
                timezoneInvalid: f(`⚠️ Your stored timezone code is \`${timezone}\`, which isnt valid! Please update it when possible.`),
                success: f(`ℹ️ Your stored timezone code is \`${timezone}\`, which is equivalent to ${zone.format(`z (Z)`)}.`)
            },
            set: {
                description: f(`Sets your current timezone. A list of [allowed timezones can be found on wikipedia](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List) under the \`TZ database name\` column`),
                timezoneInvalid: f(`❌ \`${timezone}\` is not a valid timezone! See <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> for timezone codes that I understand.`),
                success: f(`✅ Ok, your timezone code is now set to \`${timezone}\`, which is equivalent to ${zone.format(`z (Z)`)}.`)
            }
        },
        todo: {
            list: {
                description: f(`Shows you your todo list`),
                embed: {
                    title: f(`Todo list`),
                    description: {
                        none: f(`You have nothing on your list!`),
                        item: f(`**${i + 1}.** ${e}`),
                        default: f(`${items.map(i => `**${i.id}.** ${i.value}`).join(`\n`)}`)
                    }
                }
            },
            remove: {
                description: f(`Removes an item from your todo list by id`),
                unknownId: f(`❌ Your todo list doesnt have an item ${index}!`),
                success: f(`✅ Done!`)
            },
            add: {
                description: f(`Adds an item to your todo list`),
                success: f(`✅ Done!`)
            }
        },
        tokenify: {
            default: {
                description: f(`Converts the given input into a token.`)
            }
        },
        uptime: {
            default: {
                description: f(`Gets how long ive been online for`),
                success: f(`ℹ️ I came online <t:${context.cluster.createdAt.unix()}:R> at <t:${context.cluster.createdAt.unix()}>`)
            }
        },
        user: {
            default: {
                description: f(`Gets information about a user`),
                activity: {
                    default: f(`Not doing anything`),
                    5: f(`Competing in ${activity.name}`),
                    4: f(`${activity.name}`),
                    2: f(`Listening to ${activity.name}`),
                    0: f(`Playing ${activity.name}`),
                    1: f(`Streaming ${activity.details}`),
                    3: f(`Watching ${activity.name}`)
                },
                embed: {
                    description: f(`**User Id**: ${user.id}\n**Created**: ${timestamp(user.createdAt)}`),
                    field: {
                        roles: {
                            name: f(`Roles`)
                        }
                    }
                }
            }
        },
        version: {
            default: {
                description: f(`Tells you what version I am on`),
                success: f(`ℹ️ I am running blargbot version ${version}`)
            }
        },
        voteBan: {
            description: f(`Its a meme, dont worry`),
            errors: {
                failed: f(`❌ Seems the petitions office didnt like that one! Please try again`)
            },
            list: {
                description: f(`Gets the people with the most votes to be banned.`),
                embed: {
                    title: f(`ℹ️ Top 10 Vote bans`),
                    description: {
                        empty: f(`No petitions have been signed yet!`),
                        default: f(`${users.map(u => `**${u.position}.** ${u.user.mention} - ${u.count} ${p(u.count, `signature`)}`).join(`\n`)}`)
                    }
                }
            },
            info: {
                description: f(`Checks the status of the petition to ban someone.`),
                embed: {
                    title: f(`ℹ️ Vote ban signatures`),
                    description: {
                        empty: f(`No one has voted to ban ${user.mention} yet.`),
                        tooMany: f(`${votes.map(v => `<@${v.id}>${v.reason ? ` - ${v.reason}` : ``}`).join(`\n`)}`),
                        default: f(`${votes.map(v => `<@${v.id}>${v.reason ? ` - ${v.reason}` : ``}`).join(`\n`)}\n... and ${votes.length - 15} more`)
                    }
                }
            },
            sign: {
                description: f(`Signs a petition to ban a someone`),
                alreadySigned: f(`❌ I know youre eager, but you have already signed the petition to ban ${user.mention}!`),
                success: f(`✅ ${context.author.mention} has signed to ban ${user.mention}! A total of **${newTotal} ${p(newTotal, `person** has`, `people** have`)} signed the petition now.${reason !== undefined ? `\n**Reason**: ${reason}` : ``}`)
            },
            forgive: {
                description: f(`Removes your signature to ban someone`),
                notSigned: f(`❌ Thats very kind of you, but you havent even signed to ban ${user.mention} yet!`),
                success: f(`✅ ${context.author.mention} reconsidered and forgiven ${user.mention}! A total of **${newTotal} ${p(newTotal, `person** has`, `people** have`)} signed the petition now.`)
            }
        },
        warnings: {
            common: {
                some: f(`⚠️ **${humanize.fullName(member.user)}** has accumulated ${count} ${p(count, `warning`)}.`),
                none: f(`🎉 **${humanize.fullName(member.user)}** doesn't have any warnings!`),
                untilTimeout: f(`- ${timeoutAt - count} more warnings before being timed out.`),
                untilKick: f(`- ${kickAt - count} more warnings before being kicked.`),
                untilBan: f(`- ${banAt - count} more warnings before being banned.`),
                success: f(`${lines.join(`\n`)}`)
            },
            self: {
                description: f(`Gets how many warnings you have`)
            },
            user: {
                description: f(`Gets how many warnings the user has`)
            }
        },
        xkcd: {
            default: {
                description: f(`Gets an xkcd comic. If a number is not specified, gets a random one.`),
                down: f(`❌ Seems like xkcd is down 😟`),
                embed: {
                    title: f(`xkcd #${comic.num}: ${comic.title}`),
                    footer: {
                        text: f(`xkcd ${comic.year}`)
                    }
                }
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
                description: f(`Shows everyone a work of art.`),
                invalidUrl: f(`❌ ${url} is not a valid url!`)
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
                description: f(`Lists all the Cards against packs I know about`),
                success: f(`ℹ️ These are the packs I know about:`)
            }
        },
        caption: {
            common: {
                imageMissing: f(`❌ You didnt tell me what image I should caption!`),
                captionMissing: f(`❌ You must give atleast 1 caption!`),
                fontInvalid: f(`❌ ${fontName} is not a supported font! Use \`${context.prefix}caption list\` to see all available fonts`)
            },
            flags: {
                top: f(`The top caption.`),
                bottom: f(`The bottom caption.`),
                font: f(`The font to use (case insensitive). Use the command with the -l flag to view the available fonts. Defaults to impact.`)
            },
            fonts: {
                description: f(`Lists the fonts that are supported`),
                success: f(`ℹ️ The supported fonts are:${humanize.smartJoin(Object.keys(fontLookup), `, `, ` and `)}`)
            },
            attached: {
                description: f(`Puts captions on an attached image.`)
            },
            linked: {
                description: f(`Puts captions on the image in the URL.`),
                urlInvalid: f(`❌ ${url} is not a valid url!`)
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
                description: f(`I don't even know, to be honest.`),
                urlInvalid: f(`❌ ${url} is not a valid url!`)
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
                description: f(`Turns an image into modern art.`),
                urlInvalid: f(`❌ ${url} is not a valid url!`)
            }
        },
        emoji: {
            description: f(`Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.`),
            flags: {
                svg: f(`Get the emote as an svg instead of a png.`)
            },
            default: {
                description: f(`Gives you a large version of an emoji. If size is specified and the emoji is not a custom emoji, the image will be that size.`),
                invalidEmoji: f(`❌ No emoji found!`)
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
                description: f(`Shows a picture of Linus pointing at something on his monitor.`),
                urlInvalid: f(`❌ ${url} is not a valid url!`)
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
                description: f(`Pixelates an image.`),
                urlInvalid: f(`❌ ${url} is not a valid url!`)
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
                description: f(`WHO IS STAR BATTLING THIS EPISODE?`),
                urlInvalid: f(`❌ ${url} is not a valid url!`)
            }
        },
        stupid: {
            flags: {
                user: f(`The person who is stupid.`),
                image: f(`A custom image.`)
            },
            default: {
                description: f(`Tells everyone who is stupid.`),
                invalidUser: f(`❌ I could not find the user \`${userStr}\``)
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
                description: f(`Gets three pictures from '<https://danbooru.donmai.us/>' using given tags.`),
                noTags: f(`❌ You need to provide some tags`),
                unsafeTags: f(`❌ None of the tags you provided were safe!`),
                noResults: f(`❌ No results were found!`)
            }
        },
        rule34: {
            default: {
                description: f(`Gets three pictures from '<https://rule34.xxx/>' using given tags.`),
                noTags: f(`❌ You need to provide some tags`),
                unsafeTags: f(`❌ None of the tags you provided were safe!`),
                noResults: f(`❌ No results were found!`)
            }
        },
        eval: {
            errors: {
                error: f(`❌ An error occured!${codeBlock(response.error)}`)
            },
            here: {
                description: f(`Runs the code you enter on the current cluster`),
                success: f(`✅ Input:${codeBlock(code, `js`)}Output:${codeBlock(result.result)}`)
            },
            master: {
                description: f(`Runs the code you enter on the master process`),
                success: f(`✅ Master eval input:${codeBlock(code, `js`)}Output:${codeBlock(response.result)}`)
            },
            global: {
                description: f(`Runs the code you enter on all the clusters and aggregates the result`),
                results: {
                    template: f(`Global eval input:${codeBlock(code, `js`)}${clusterResults.join(`\n`)}`),
                    success: f(`✅ Cluster ${id} output:${codeBlock(response.result)}`),
                    failed: f(`❌ Cluster ${id}: An error occured!${codeBlock(response.error)}`)
                }
            },
            cluster: {
                description: f(`Runs the code you enter on all the clusters and aggregates the result`),
                success: f(`✅ Cluster ${clusterId} eval input:${codeBlock(code, `js`)}Output:${codeBlock(response.result)}`)
            }
        },
        exec: {
            default: {
                description: f(`Executes a command on the current shell`),
                pm2Bad: f(`❌ No! That's dangerous! Do \`b!restart\` instead.\n\nIt's not that I don't trust you, it's just...\n\nI don't trust you.`),
                confirm: {
                    prompt: f(`⚠️ You are about to execute the following on the command line:${codeBlock(command, `bash`)}`),
                    confirm: f(`Continue`),
                    cancel: f(`Cancel`)
                },
                cancelled: f(`✅ Execution cancelled`),
                command: {
                    pending: f(`ℹ️ Command: \`${command}\`\nRunning...`),
                    success: f(`✅ Command: \`${command}\``),
                    error: f(`❌ Command: \`${command}\``)
                }
            }
        },
        logLevel: {
            default: {
                description: f(`Sets the current log level`),
                success: f(`✅ Log level set to \`${logLevel}\``)
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
                description: f(`Respawns the cluster specified`),
                requested: f(`**${humanize.fullName(context.author)}** has called for a respawn of cluster ${clusterId}.`),
                success: f(`✅ Cluster ${clusterId} is being respawned and stuff now`)
            }
        },
        respond: {
            default: {
                description: f(`Responds to a suggestion, bug report or feature request`),
                notFound: f(`❌ I couldnt find that feeback!`),
                userNotFound: f(`⚠️ Feedback successfully updated\n⛔ I couldnt find the user who submitted that feedback`),
                alertFailed: f(`⚠️ Feedback successfully updated\n⛔ I wasnt able to send the response in the channel where the feedback was initially sent`),
                success: f(`✅ Feedback successfully updated and response has been sent.`),
                alert: f(`**Hi, <@${author.ID}>!**  You recently made this suggestion:\n\n**${feedback.Title}**${feedback.Description.length > 0 ? `\n\n${feedback.Description}` : ``}\n\n**${humanize.fullName(context.author)}** has responded to your feedback with this:\n\n${response}\n\nIf you have any further questions or concerns, please join my support guild so that they can talk to you directly. You can get a link by doing \`b!invite\`. Thanks for your time!\n\nYour card has been updated here: <${context.util.websiteLink(`feedback/${id}`)}>`)
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
type FormattedTree<T extends FormatTree> = { [P in keyof T]: T[P] extends (id: string) => infer R ? R : T[P] extends FormatTree ? FormattedTree<T[P]> : never };

function crunchTree<T extends FormatTree>(prefix: string, value: T): FormattedTree<T> {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => {
        const id = `${prefix}.${k}`;
        if (typeof v === `function`)
            return [k, v(id)] as const;
        return [k, crunchTree(id, v)] as const;
    })) as FormattedTree<T>;
}
