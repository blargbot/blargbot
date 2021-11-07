import { CommandContext } from '@cluster/command';
import { SubtagHandlerCallSignature, SubtagHandlerValueParameter } from '@cluster/types';
import { bbtagUtil, codeBlock, quote, SubtagType, tagTypeDetails } from '@cluster/utils';
import { humanize } from '@core/utils';
import { EmbedFieldData, MessageEmbedOptions } from 'discord.js';

import { BaseSubtag } from './BaseSubtag';
import { limits } from './limits';

interface CategoryChoice {
    label: string;
    description: string;
    value: SubtagType | 'all';
}

export async function getDocsEmbed(context: CommandContext, topic: string | undefined): Promise<MessageEmbedOptions | string | undefined> {
    const embed = await getTopicBody(context, topic);
    if (embed === undefined)
        return undefined;
    if (typeof embed === 'string')
        return embed;
    embed.title = `BBTag documentation${embed.title ?? ''}`;
    embed.url = context.cluster.util.websiteLink(`tags${embed.url ?? ''}`);
    embed.color ??= 0xefff00;
    return embed;
}

async function getTopicBody(context: CommandContext, topic: string | undefined): Promise<MessageEmbedOptions | string | undefined> {
    const words = topic === undefined ? [] : humanize.smartSplit(topic);

    switch (words[0]?.toLowerCase()) {
        case undefined:
        case 'index': return {
            description: 'Blargbot is equipped with a system of tags called BBTag, designed to mimic a programming language while still remaining simple. You can use this system as the building-blocks to create your own advanced command system, whether it be through public tags or guild-specific custom commands.\n\nCustomizing can prove difficult via discord, fortunately there is an online [BBTag IDE](' + context.util.websiteLink('tags/editor') + ') which should make developing a little easier.',
            fields: [
                {
                    name: 'Topics',
                    value: 'For specific information about a topic, please use `' + context.prefix + 'docs <topic>` (like `' + context.prefix + 'docs subtags`\n- `terminology`, for more information about terms like \'subtags\', \'tags\', etc.  \n- `variables`, for more information about variables and the different variable scopes.\n- `argTypes`, for more information about the syntax of parameters\n- `dynamic`, for information about dynamic subtags\n- `subtags`, arguably the most important topic on this list. `' + context.prefix + 'docs subtags` displays a list of subtag categories.'
                }
            ]
        };
        case 'subtags':
            return subtagsEmbed(context, words[1]);
        case 'variables':
        case 'variable':
        case 'vars':
        case 'var': return {
            title: ' - Variables',
            url: '/variables',
            description: `In BBTag there are ${0} different scopes that can be used for storing your data. ` +
                'These scopes are determined by the first character of your variable name, so choose carefully!\nThe available scopes are as follows:',
            fields: [
                ...variablesScopes.map(scope => {
                    return {
                        name: `${scope.name} variables (prefix: ${scope.prefix})`,
                        value: scope.description
                    };
                })
                , {
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
        case 'arguments': return {
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
            const subtag = await lookupSubtag(context, words[0]);
            if (subtag === undefined)
                return;
            if (typeof subtag === 'string')
                return subtag;
            return subtagDocs(context, subtag);
        }
    }
}

function toField(subtag: BaseSubtag, signature: SubtagHandlerCallSignature, index: number): EmbedFieldData {
    let description = codeBlock(bbtagUtil.stringifyParameters(subtag.name, signature.parameters));
    const defaultDesc = signature.parameters
        .flatMap<SubtagHandlerValueParameter>(p => 'nested' in p ? p.nested : [p])
        .filter(param => param.defaultValue !== '')
        .map(param => `\`${param.name}\` defaults to \`${param.defaultValue}\` if ${param.required ? 'left blank' : 'omitted or left blank'}`)
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

function subtagDocs(context: CommandContext, subtag: BaseSubtag): MessageEmbedOptions {
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

    for (const limitClass of Object.values(limits)) {
        const limit = new limitClass();
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
        description: description.length === 0 ? undefined : description.join('\n'),
        color: subtag.deprecated !== false ? 0xff0000 : undefined,
        fields,
        footer: {
            text: `For detailed info about the argument syntax, use: ${context.prefix}${context.commandName} docs arguments`
        }
    });
}
async function lookupSubtag(context: CommandContext, input: string): Promise<BaseSubtag | string | undefined> {
    input = input.replace(/[{}]/, '').toLowerCase();
    const matchedSubtags = [...context.cluster.subtags.list()].filter(subtag => {
        return subtag.name.includes(input) ? true : subtag.aliases.reduce<boolean>((acc, alias) => alias.includes(input) || acc, false);
    });
    if (matchedSubtags.find(s => s.name === input) !== undefined)
        return matchedSubtags.find(s => s.name === input);
    if (matchedSubtags.length === 1)
        return matchedSubtags[0];

    const result = await context.util.queryChoice({
        context: context.message,
        actors: context.author,
        prompt: 'ℹ️ Multiple subtags found, please select one from the drop down.',
        placeholder: 'Select a subtag',
        choices: matchedSubtags.map(subtag => {
            return {
                label: '{' + subtag.name + '}',
                value: subtag.name
            };
        })
    });

    switch (result.state) {
        case 'CANCELLED':
            return '✅ Cancelled subtag lookup';
        case 'FAILED':
            return '❌ Drop down failed!';
        case 'NO_OPTIONS':
            return '❌ I wasn\'t able to find any subtags...'; //how
        case 'TIMED_OUT':
            return '❌ Drop down timed out!';
        case 'SUCCESS':
            return matchedSubtags.find(v => v.name === result.value);
    }
}

async function subtagsEmbed(context: CommandContext, input?: string): Promise<MessageEmbedOptions | string> {
    const categories = Object.values(SubtagType)
        .filter((p): p is SubtagType => typeof p !== 'string');
    if (input === undefined) {
        return categoriesEmbed(context, categories);
    }
    const matchedCategories = categories.filter(c => tagTypeDetails[c].name.toLowerCase().includes(input.toLowerCase().toString()));
    if (matchedCategories.length === 0) {
        return categoriesEmbed(context, categories);
    }

    if (matchedCategories.length === 1) {
        const category = matchedCategories[0];
        const props = tagTypeDetails[category];
        const subtags = [...context.cluster.subtags.list(s => s.category === category)].map(t => t.name);
        return {
            description: `**${props.name} Subtags** - ${props.desc}\n` +
                codeBlock(subtags.join(', '))
        };
    }

    const queryResponse = await context.util.queryChoice({
        context: context.message,
        actors: context.author,
        placeholder: 'Select a category',
        prompt: 'ℹ️ Multiple categories found, please select one from the drop down.',
        choices: matchedCategories.map(c => {
            const catName = tagTypeDetails[c].name;
            return {
                label: catName[0].toUpperCase() + catName.slice(1),
                value: c
            };
        })
    });

    switch (queryResponse.state) {
        case 'CANCELLED':
            return '✅ Cancelled category lookup';
        case 'TIMED_OUT':
            return '❌ Drop down timed out';
        case 'FAILED':
            return '❌ Drop down failed';
        case 'NO_OPTIONS':
            return '❌ No categories provided';
        case 'SUCCESS': {
            const category = queryResponse.value;
            const props = tagTypeDetails[category];
            const subtags = [...context.cluster.subtags.list(s => s.category === category)].map(t => t.name);
            return {
                description: `**${props.name} Subtags** - ${props.desc}\n` +
                    codeBlock(subtags.join(', '))
            };
        }
    }

}

async function categoriesEmbed(context: CommandContext, categories: SubtagType[]): Promise<MessageEmbedOptions | string> {
    const mappedCategories: CategoryChoice[] = [{
        label: 'All',
        description: 'Displays all subtags',
        value: 'all'
    }];
    mappedCategories.push(...categories.map(c => {
        return {
            label: tagTypeDetails[c].name,
            value: c,
            description: tagTypeDetails[c].desc
        };
    }));

    const queryResponse = await context.util.queryChoice({
        context: context.message,
        actors: context.author,
        placeholder: 'Select a category',
        prompt: 'ℹ️ Please select a category in the drop down below.',
        choices: mappedCategories
    });

    switch (queryResponse.state) {
        case 'CANCELLED':
            return '✅ Cancelled category lookup';
        case 'TIMED_OUT':
            return '❌ Drop down timed out';
        case 'FAILED':
            return '❌ Drop down failed';
        case 'NO_OPTIONS':
            return '❌ No categories provided';
        case 'SUCCESS': {
            const category = queryResponse.value;
            if (category === 'all') {
                const subtags = [...context.cluster.subtags.list()];
                return {
                    title: 'BBTag documentation - All subtags',
                    fields: categories.map(c => {
                        return {
                            name: tagTypeDetails[c].name,
                            value: '```\n' + subtags.filter(s => s.category === c).map(s => s.name).join(', ') + '```'
                        };
                    })
                };
            }
            const props = tagTypeDetails[category];
            const subtags = [...context.cluster.subtags.list(s => s.category === category)].map(t => t.name);
            return {
                description: `**${props.name} Subtags** - ${props.desc}\n` +
                    codeBlock(subtags.join(', '))
            };

        }
    }
}
const variablesScopes = [
    {
        name: 'Server',
        prefix: '_',
        description: 'Server variables (also referred to as Guild variables) are commonly used if you wish to store data on a per server level. ' +
            'They are however stored in 2 separate \'pools\', one for tags and one for custom commands, meaning they cannot be used to pass data between the two\n' +
            'This makes then very useful for communicating data between tags that are intended to be used within 1 server at a time.'
    },
    {
        name: 'Author',
        prefix: '@',
        description: 'Author variables are stored against the author of the tag, meaning that only tags made by you can access or edit your author variables.\n' +
            'These are very useful when you have a set of tags that are designed to be used by people between servers, effectively allowing servers to communicate with eachother.'
    },
    {
        name: 'Global',
        prefix: '*',
        description: 'Global variables are completely public, anyone can read **OR EDIT** your global variables.\n' +
            'These are very useful if you like pain.'
    },
    {
        name: 'Temporary',
        prefix: '~',
        description: 'Temporary variables are never stored to the database, meaning they are by far the fastest variable type.\n' +
            'If you are working with data which you only need to store for later use within the same tag call, then you should use temporary variables over any other type'
    },
    {
        name: 'Local',
        prefix: '',
        description: 'Local variables are the default variable type, only usable if your variable name doesnt start with one of the other prefixes. ' +
            'These variables are only accessible by the tag that created them, meaning there is no possibility to share the values with any other tag.\n' +
            'These are useful if you are intending to create a single tag which is usable anywhere, as the variables are not confined to a single server, just a single tag'
    }
];
