import { EmbedField, EmbedOptions } from 'eris';
import { bbtagUtil, codeBlock, quote, SubtagType, tagTypes } from '../../utils';
import { CommandContext } from '../command';
import { BaseSubtag } from './BaseSubtag';
import { SubtagHandlerCallSignature } from './types';
import * as limits from './limits';

export function getDocsEmbed(context: CommandContext, topic: readonly string[]): EmbedOptions | undefined {
    const embed = getTopicBody(context, topic);
    if (embed === undefined)
        return undefined;

    embed.title = `BBTag documentation${embed.title}`;
    embed.url = context.cluster.util.websiteLink(`tags${embed.url}`);
    embed.color ??= 0xefff00;
    return embed;
}

function getTopicBody(context: CommandContext, topic: readonly string[]): EmbedOptions | undefined {
    switch (topic[0].toLowerCase()) {
        case 'index': return {
            description: `Please use \`${context.prefix}${context.commandName} docs [topic]\` to view available information on a topic.\n\n` +
                'Available Topics:\n' +
                '- subtags <category>\n' +
                '- variables\n' +
                '- argTypes\n' +
                '- terminology\n' +
                '- dynamic\n\n' +
                'Available Subtag Categories:\n' +
                Object.values(tagTypes.properties).map(k => `- ${k.name}`).join('\n')
        };
        case 'subtags': {
            const category = Object.values(SubtagType)
                .filter((p): p is SubtagType => typeof p !== 'string')
                .find(p => tagTypes.properties[p].name.toLowerCase() == topic[1]?.toLowerCase());
            if (!category) {
                return {
                    description: 'Available Subtag Categories:\n' +
                        Object.values(tagTypes.properties).map(k => `- ${k.name} - ${k.desc}`).join('\n')
                };
            }

            const props = tagTypes.properties[category];
            const subtags = [...context.cluster.subtags.list(s => s.category == category)].map(t => t.name);
            return {
                description: `**${props.name} Subtags** - ${props.desc}\n` +
                    codeBlock(subtags.join(','))
            };
        }
        case 'variables':
        case 'variable':
        case 'vars':
        case 'var': return {
            title: ' - Variables',
            url: '/variables',
            description: `In BBTag there are ${0} different scopes that can be used for storing your data. ` +
                'These scopes are determined by the first character of your variable name, so choose carefully!\nThe available scopes are as follows:',
            fields: [
                // TODO Need variable scopes here!
                {
                    name: '{commit} and {rollback}',
                    value: 'For performance reasons, when a value is `{set}` it wont be immediately populated to the database. ' +
                        '`{commit}` and `{rollback}` can be used to manipulate when variables are sent to the database, if at all. ' +
                        '`{commit}` will force the given variables to be sent to the database immediately. `{rollback}` will ' +
                        'revert the given variables to their original value (start of tag or most recent `{commit}`).\n' +
                        'There is also an additional prefix for {set} and {get} which is `!`. ' +
                        'This prefix can be combined with other prefixes and will act the ' +
                        'same as if you have called `{set}` and then `{commit}` immediately after. e.g. ' +
                        '```{set;!@varname;value}``` is identical to ```{set;@varname;value}{commit;@varname}```'
                }
            ]
        };
        case 'argtypes':
        case 'arguments':
        case 'parameters':
        case 'params': return {
            title: ' - Arguments',
            description: 'As you may have noticed, the various help documentation for subtags will have a usage that often look like this: ' +
                '```\n{subtag;<arg1>;[arg2];<arg3...>}```' +
                'This way of formatting arguments is designed to easily be able to tell you what is and is not required.\n' +
                'All arguments are separated by `;`\'s and each will be displayed in a way that tells you what kind of argument it is.\n' +
                'NOTE: Simple subtags do not accept any arguments and so should not be supplied any.\n' +
                'The basic rules are as follows:\n\u200B',
            fields: [
                {
                    name: 'Required arguments <>',
                    value: 'Example:```\n<arg>```' +
                        'Required arguments must be supplied for a subtag to work. If they are not then you will normally be given a `Not enough args` error\n\u200B'
                },
                {
                    name: 'Optional arguments []',
                    value: 'Example:```\n[arg]```' +
                        'Optional arguments may or may not be provided. If supplied, optional arguments may either change the functionality of the tag ' +
                        `(e.g. \`${context.prefix}${context.commandName} docs shuffle\`) or simply replace a default value (e.g. \`${context.prefix}${context.commandName} docs username\`).\n\u200B`
                },
                {
                    name: 'Multiple arguments ...',
                    value: 'Example:```\n<arg...>```' +
                        'Some arguments can accept multiple values, meaning you are able to list additional values, still separated by `;`, which will be included in the execution. ' +
                        `(e.g. \`${context.prefix}${context.commandName} docs randchoose\`)\n\u200B`
                },
                {
                    name: 'Nested arguments <<> <>>',
                    value: 'Example:```\n<<arg1>, [arg2]>```' +
                        `Some subtags may have special rules for how their arguments are grouped (e.g. \`${context.prefix}${context.commandName} docs switch\`) ` +
                        'and will use nested arguments to show that grouping. When actually calling the subtag, you provide the arguments as normal, ' +
                        'however you must obey the grouping rules.\n' +
                        'In the example of `switch`, you may optionally supply `<case>` and `<then>` as many times as you like ' +
                        'but they must always be in pairs. e.g. `{switch;value;case1;then1}` or `{switch;value;case1;then1;case2;then2}` etc'
                }
            ]
        };
        case 'terms':
        case 'terminology':
        case 'definitions':
        case 'define': {
            const terms = {
                BBTag: 'BBTag is a text replacement language. Any text between a `{` and `}` pair (called a subtag) ' +
                    'will be taken as code and run, with the output of that replacing the whole subtag. ' +
                    'Each subtag does something different, and each accepts its own list of arguments.',
                Subtag: 'A subtag is a pre-defined function that accepts some arguments and returns a single output. ' +
                    'Subtags can be called by placing their name between a pair of `{` and `}`, ' +
                    'with any arguments to be passed to the subtag being separated by `;`.\nAs an example:```{math;+;1;2}```' +
                    'Subtag: `math`\nArguments: `+`, `1`, `2`\nResult: `3`',
                Tag: 'A tag is a user-made block of text which may or may not contain subtags. ' +
                    'Any subtags that it does contain will be executed and be replaced by their output.',
                Argument: 'An argument is a single value which gets given to a subtag. Arguments can be numbers, text, arrays, anything you can type really. ' +
                    'Each subtag will require a different argument pattern, so be sure to check what pattern your subtag needs!',
                Variable: 'A variable is a value that is stored in the bots memory ready to access it later on. ' +
                    `For more in-depth details about variables, please use \`${context.prefix}${context.commandName} docs variable\`.`,
                Array: 'An array is a collection of values all grouped together, commonly done so by enclosing them inside `[]`. ' +
                    'In BBTag, arrays can be assigned to a variable to store them for later use. In this situation, you might ' +
                    'see an array displayed like this `{"v":["1","2","3"],"n":"varname"}`. If you do, dont worry, nothing is broken! ' +
                    `That is just there to allow ${context.cluster.discord.user.username} to modify the array in place within certain subtags.`
            };
            const term = Object.keys(terms).find(k => k.toLowerCase() === topic[1]?.toLowerCase());
            if (term !== undefined) {
                return {
                    title: ` - Terminology - ${term}`,
                    description: terms[term]
                };
            }

            return {
                title: ' - Terminology',
                description: 'There are various terms used in BBTag that might not be intuitive, ' +
                    'so here is a list of definitions for some of the most important ones:\n\u200B',
                fields: Object.keys(terms).map(k => ({
                    name: k,
                    value: `${terms[k]}\n\u200B`
                }))
            };
        }
        case 'dynamic': return {
            description: 'In bbtag, even the names of subtags can be dynamic. This can be achieved simply by placing subtags before the ' +
                'first `;` of a subtag. \n e.g. ```{user{get;~action};{userid}}``` If `~action` is set to `name`, then this will run the `username` subtag, ' +
                'if it is set to `avatar` then it will run the `useravatar` subtag, and so on. Because dynamic subtags are by definition not set in ' +
                'stone, it is reccommended not to use them, and as such you will recieve warnings when editing/creating a tag/cc which contains a ' +
                'dynamic subtag. Your tag will function correctly, however some optimisations employed by bbtag will be unable to run on any such tag.'
        };
        default: {
            const subtagName = topic[0].replace(/[\{\}]/g, '').toLowerCase();
            const subtag = context.cluster.subtags.get(subtagName);
            if (subtag === undefined)
                return undefined;

            const description = [];
            if (typeof subtag.deprecated === 'string')
                description.push(`**This subtag is deprecated and has been replaced by {${subtag.deprecated}}**`);
            else if (subtag.deprecated)
                description.push('**This subtag is deprecated**');
            if (subtag.aliases.length > 0)
                description.push('**Aliases:**', codeBlock(subtag.aliases.join(', ')));
            if (subtag.desc)
                description.push(subtag.desc);

            const fields = subtag.signatures.map(sig => toField(subtag, sig));
            const limitField: EmbedField = { name: '__Usage limits__', value: '' };

            for (const key of Object.keys(limits)) {
                const limit = new limits[key]();
                const text = limit.rulesFor(subtag.name).join('\n');
                if (text) {
                    limitField.value += `**Limits for ${limit.scopeName}:**\n${codeBlock(text)}\n\n`;
                }
            }

            if (limitField.value)
                fields.push(limitField);

            return subtag.enrichDocs({
                title: ` - {${subtag.name}}`,
                url: `/#${encodeURIComponent(subtag.name)}`,
                description: description.length === 0 ? undefined : description.join('\n') + '\u200b',
                color: subtag.deprecated ? 0xff0000 : undefined,
                fields,
                footer: {
                    text: `For detailed info about the argument syntax, use: ${context.prefix}${context.commandName} docs arguments`
                }
            });
        }
    }
}

function toField(subtag: BaseSubtag, signature: SubtagHandlerCallSignature): EmbedField {
    let description = codeBlock(bbtagUtil.stringifyArguments(subtag.name, signature.args));
    if (signature.description)
        description += `${signature.description}\n`;
    description += '\n';
    if (signature.exampleCode)
        description += `**Example code:**${quote(signature.exampleCode)}`;
    if (signature.exampleIn)
        description += `**Example user input:**${quote(signature.exampleIn)}`;
    if (signature.exampleOut)
        description += `**Example output:**${quote(signature.exampleOut)}`;
    return { name: '\u200b', value: description.trim() };
}

quote('');