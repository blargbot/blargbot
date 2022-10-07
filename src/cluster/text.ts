import { IFormatString, IFormatStringDefinition, TranslatableString } from "@blargbot/domain/messages";
import * as Eris from "eris";
import { Duration } from "moment-timezone";

import { Command } from "./command/Command";
import { CommandContext } from "./command/CommandContext";
import { GuildCommandContext } from "./types";

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
                generic: f(`❌ Oops, I dont seem to have permission to do that!`),
                guild: f(`❌ Hi! You asked me to do something, but I didn't have permission to do it! Please make sure I have permissions to do what you asked.\nGuild: {channel.guild.name}\nChannel: {channel.mention}\nCommand: {commandText}\n\nIf you wish to stop seeing these messages, do the command \`{prefix}dmerrors\`.`).withArgs<GuildCommandContext>()
            },
            arguments: {
                invalid: f(`❌ Invalid arguments! \`{value}\` isnt {types#map(\`{}\`)#join(, | or )}`).withArgs<{ value: string; types: string[]; }>(),
                missing: f(`❌ Not enough arguments! You need to provide {missing#map(\`{}\`)#join(, | or )}`).withArgs<{ missing: string[]; }>(),
                unknown: f(`❌ I couldnt understand those arguments!`),
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
                failed: f(`❌ I wasnt able to send that message for some reason!`),
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
            notFoundEverything: f(`❌ There isnt an everything autoresponse here!`),
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
                return id => TranslatableString.define<T, V>(id, template);
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
