import { CommandContext } from '@cluster/command';
import { SubtagHandlerCallSignature } from '@cluster/types';
import { bbtagUtil, codeBlock, quote, SubtagType, tagTypeDetails } from '@cluster/utils';
import { humanize } from '@core/utils';
import { EmbedFieldData, MessageEmbedOptions } from 'discord.js';

import { BaseSubtag } from './BaseSubtag';
import { limits } from './limits';

export function getDocsEmbed(context: CommandContext, topic: string | undefined): MessageEmbedOptions | undefined {
    const embed = getTopicBody(context, topic);
    if (embed === undefined)
        return undefined;

    embed.title = `BBTag documentation${embed.title ?? ''}`;
    embed.url = context.cluster.util.websiteLink(`tags${embed.url ?? ''}`);
    embed.color ??= 0xefff00;
    return embed;
}

function getTopicBody(context: CommandContext, topic: string | undefined): MessageEmbedOptions | undefined {
    const words = topic === undefined ? [] : humanize.smartSplit(topic);

    switch (words[0]?.toLowerCase()) {
        case undefined:
        case 'index': return {
            description: `Please use \`${context.prefix}${context.commandName} docs [topic]\` to view available information on a topic.\n\n` +
                'Available Topics:\n' +
                '- subtags <category>\n' +
                '- variables\n' +
                '- argTypes\n' +
                '- terminology\n' +
                '- dynamic\n\n' +
                'Available Subtag Categories:\n' +
                Object.values(tagTypeDetails).map(k => `- ${k.name}`).join('\n')
        };
        case 'subtags': {
            const category = Object.values(SubtagType)
                .filter((p): p is SubtagType => typeof p !== 'string')
                .find(p => tagTypeDetails[p].name.toLowerCase() === words[1]?.toLowerCase());
            if (category === undefined) {
                return {
                    description: 'Available Subtag Categories:\n' +
                        Object.values(tagTypeDetails).map(k => `- ${k.name} - ${k.desc}`).join('\n')
                };
            }

            const props = tagTypeDetails[category];
            const subtags = [...context.cluster.subtags.list(s => s.category === category)].map(t => t.name);
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
            const terms = [
                {
                    name: 'BBTag',
                    description: 'BBTag is a text replacement language. Any text between a `{` and `}` pair (called a subtag) ' +
                        'will be taken as code and run, with the output of that replacing the whole subtag. ' +
                        'Each subtag does something different, and each accepts its own list of arguments.'
                },
                {
                    name: 'Subtag', description: 'A subtag is a pre-defined function that accepts some arguments and returns a single output. ' +
                        'Subtags can be called by placing their name between a pair of `{` and `}`, ' +
                        'with any arguments to be passed to the subtag being separated by `;`.\nAs an example:```{math;+;1;2}```' +
                        'Subtag: `math`\nArguments: `+`, `1`, `2`\nResult: `3`'
                },
                {
                    name: 'Tag', description: 'A tag is a user-made block of text which may or may not contain subtags. ' +
                        'Any subtags that it does contain will be executed and be replaced by their output.'
                },
                {
                    name: 'Argument', description: 'An argument is a single value which gets given to a subtag. Arguments can be numbers, text, arrays, anything you can type really. ' +
                        'Each subtag will require a different argument pattern, so be sure to check what pattern your subtag needs!'
                },
                {
                    name: 'Variable', description: 'A variable is a value that is stored in the bots memory ready to access it later on. ' +
                        `For more in-depth details about variables, please use \`${context.prefix}${context.commandName} docs variable\`.`
                },
                {
                    name: 'Array', description: 'An array is a collection of values all grouped together, commonly done so by enclosing them inside `[]`. ' +
                        'In BBTag, arrays can be assigned to a variable to store them for later use. In this situation, you might ' +
                        'see an array displayed like this `{"v":["1","2","3"],"n":"varname"}`. If you do, dont worry, nothing is broken! ' +
                        `That is just there to allow ${context.cluster.discord.user.username} to modify the array in place within certain subtags.`
                }
            ];
            const term = terms.find(t => t.name.toLowerCase() === words[1]?.toLowerCase());
            if (term !== undefined) {
                return {
                    title: ` - Terminology - ${term.name}`,
                    description: term.description
                };
            }

            return {
                title: ' - Terminology',
                description: 'There are various terms used in BBTag that might not be intuitive, ' +
                    'so here is a list of definitions for some of the most important ones:\n\u200B',
                fields: terms.map(t => ({
                    name: t.name,
                    value: `${t.description}\n\u200B`
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
            const subtagName = words[0].replace(/[{}]/g, '').toLowerCase();
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
            if (subtag.desc !== undefined)
                description.push(subtag.desc);

            const fields = subtag.signatures.map((sig, index) => toField(subtag, sig, index));
            const limitField: EmbedFieldData = { name: '__Usage limits__', value: '' };

            for (const key of Object.keys(limits)) {
                const limit = new limits[key]();
                const text = limit.rulesFor(subtag.name).join('\n');
                if (text.length > 0) {
                    limitField.value += `**Limits for ${limit.scopeName}:**\n${codeBlock(text)}\n\n`;
                }
            }

            if (limitField.value.length > 0)
                fields.push(limitField);

            return subtag.enrichDocs({
                title: ` - {${subtag.name}}`,
                url: `/#${encodeURIComponent(subtag.name)}`,
                description: description.length === 0 ? undefined : description.join('\n') + '\u200b',
                color: subtag.deprecated !== false ? 0xff0000 : undefined,
                fields,
                footer: {
                    text: `For detailed info about the argument syntax, use: ${context.prefix}${context.commandName} docs arguments`
                }
            });
        }
    }
}

function toField(subtag: BaseSubtag, signature: SubtagHandlerCallSignature, index: number): EmbedFieldData {
    let description = codeBlock(bbtagUtil.stringifyParameters(subtag.name, signature.parameters));
    const defaultDesc = signature.parameters
        .filter(param => param.defaultValue !== '')
        .map(param => `\`${param.name ?? '\u200b'}\` defaults to \`${param.defaultValue}\` if ${param.required ? 'left blank' : 'omitted or left blank'}`)
        .join('\n');
    if (defaultDesc.length > 0)
        description += defaultDesc + '\n\n';

    if (signature.description !== undefined)
        description += `${signature.description}\n`;
    description += '\n';
    if (signature.exampleCode !== undefined)
        description += `**Example code:**${quote(signature.exampleCode)}`;
    if (signature.exampleIn !== undefined)
        description += `**Example user input:**${quote(signature.exampleIn)}`;
    if (signature.exampleOut !== undefined)
        description += `**Example output:**${quote(signature.exampleOut)}`;
    return { name: index === 0 ? '  **Usage**' : '\u200b', value: description.trim() };
}
