import { bbtag, limits, Subtag, SubtagSignature, SubtagSignatureValueParameter, SubtagType, tagTypeDetails, tagVariableScopeProviders } from '@blargbot/bbtag';
import { codeBlock, guard, quote } from '@blargbot/core/utils';
import { AdvancedMessageContent, EmbedField } from 'eris';

import { Cluster } from '../../Cluster';
import { humanize } from '../../utils';
import { Documentation, DocumentationPage, DocumentationPaged } from './DocumentationManager';
import { DocumentationTreeManager } from './DocumentationTreeManager';

export class BBTagDocumentationManager extends DocumentationTreeManager {
    readonly #cluster: Cluster;
    #tree: Documentation | undefined;
    readonly #commandName: string;

    public constructor(cluster: Cluster, commandName: string, id: string = commandName) {
        super(cluster, id, commandName);
        this.#cluster = cluster;
        this.#commandName = commandName;
    }

    #loadTree(): Documentation {
        const subtags = [...this.#cluster.bbtag.subtags.values()];
        const subtagGroups = subtags
            .reduce((res, sub) => {
                let subtags = res.get(sub.category);
                if (subtags === undefined)
                    res.set(sub.category, subtags = new Set());
                subtags.add(sub);
                return res;
            }, new Map<SubtagType, Set<Subtag>>);

        return {
            id: 'index',
            name: 'BBTag',
            type: 'group',
            tags: [''],
            embed: {
                description: `Blargbot is equipped with a system of tags called BBTag, designed to mimic a programming language while still remaining simple. You can use this system as the building-blocks to create your own advanced command system, whether it be through public tags or guild-specific custom commands.\n\nCustomizing can prove difficult via discord, fortunately there is an online [BBTag IDE](${this.#cluster.util.websiteLink('bbtag/editor')}) which should make developing a little easier.`,
                fields: [
                    {
                        name: 'Topics',
                        value: `For specific information about a topic, please use \`b!${this.#commandName} docs <topic>\` (like \`b!${this.#commandName} docs subtags\`\n- \`terminology\`, for more information about terms like 'subtags', 'tags', etc.  \n- \`variables\`, for more information about variables and the different variable scopes.\n- \`argTypes\`, for more information about the syntax of parameters\n- \`dynamic\`, for information about dynamic subtags\n- \`subtags\`, arguably the most important topic on this list. \`b!${this.#commandName} docs subtags\` displays a list of subtag categories.`
                    }
                ]
            },
            selectText: 'Pick a topic',
            items: [
                {
                    id: 'subtags',
                    name: 'Subtags',
                    type: 'group',
                    tags: ['subtags', 'all', 'categories', 'category'],
                    embed: {
                        url: '/bbtag/subtags',
                        description: `Subtags are the building blocks of BBTag, and fall into ${subtagGroups.size} categories:\n\n` +
                            [...subtagGroups.keys()]
                                .map(id => tagTypeDetails[id])
                                .filter(g => g.hidden !== true)
                                .map(g => `**${g.name}** - ${g.desc}`)
                                .join('\n')
                    },
                    selectText: 'Pick a category',
                    items: [...subtagGroups.entries()]
                        .map(kvp => ({ category: tagTypeDetails[kvp[0]], subtags: [...kvp[1]].sort((a, b) => a.name < b.name ? -1 : 1) }))
                        .sort((a, b) => a.category.name < b.category.name ? -1 : 1)
                        .map(({ category, subtags }) => ({
                            id: `category_${category.name}`,
                            name: category.name,
                            type: 'group',
                            selectText: 'Pick a subtag',
                            items: subtags.map(s => this.#getSubtagDocs(s)),
                            hidden: category.hidden,
                            embed: {
                                description: category.desc + '\n\n' + codeBlock(subtags.map(s => s.name).join(', '))
                            }
                        }))
                },
                {
                    id: 'variables',
                    name: 'Variables',
                    type: 'paged',
                    tags: ['variables'],
                    embed: {
                        description: `In BBTag there are ${tagVariableScopeProviders.length} different scopes that can be used for storing your data. ` +
                            'These scopes are determined by the first character of your variable name, so choose carefully!'
                    },
                    selectText: 'Pick a variable scope',
                    pages: [
                        ...tagVariableScopeProviders.map(scope => {
                            return {
                                name: `${scope.name} variables (prefix: ${scope.prefix})`,
                                value: scope.description
                            };
                        }),
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
                    ].map(x => ({
                        name: x.name,
                        type: 'leaf',
                        embed: {
                            fields: [x]
                        }
                    }))
                },
                {
                    id: 'arguments',
                    name: 'Arguments',
                    type: 'paged',
                    tags: ['arguments', 'argtypes'],
                    embed: {
                        description: 'As you may have noticed, the various help documentation for subtags will have a usage that often look like this: ' +
                            '```\n{subtag;<arg1>;[arg2];<arg3...>}```' +
                            'This way of formatting arguments is designed to easily be able to tell you what is and is not required.\n' +
                            'All arguments are separated by `;`\'s and each will be displayed in a way that tells you what kind of argument it is.\n' +
                            'NOTE: Simple subtags do not accept any arguments and so should not be supplied any.\n'
                    },
                    selectText: 'Pick a argument type',
                    pages: [
                        {
                            name: 'Required arguments <>',
                            value: 'Example:```\n<arg>```' +
                                'Required arguments must be supplied for a subtag to work. If they are not then you will normally be given a `Not enough args` error\n\u200B'
                        },
                        {
                            name: 'Optional arguments []',
                            value: 'Example:```\n[arg]```' +
                                'Optional arguments may or may not be provided. If supplied, optional arguments may either change the functionality of the tag ' +
                                `(e.g. \`b!${this.#commandName} docs shuffle\`) or simply replace a default value (e.g. \`b!${this.#commandName} docs username\`).\n\u200B`
                        },
                        {
                            name: 'Multiple arguments ...',
                            value: 'Example:```\n<arg...>```' +
                                'Some arguments can accept multiple values, meaning you are able to list additional values, still separated by `;`, which will be included in the execution. ' +
                                `(e.g. \`b!${this.#commandName} docs randchoose\`)`
                        },
                        {
                            name: 'Nested arguments <<> <>>',
                            value: 'Example:```\n<<arg1>, [arg2]>```' +
                                `Some subtags may have special rules for how their arguments are grouped (e.g. \`b!${this.#commandName} docs switch\`) ` +
                                'and will use nested arguments to show that grouping. When actually calling the subtag, you provide the arguments as normal, ' +
                                'however you must obey the grouping rules.\n' +
                                'In the example of `switch`, you may optionally supply `<case>` and `<then>` as many times as you like ' +
                                'but they must always be in pairs. e.g. `{switch;value;case1;then1}` or `{switch;value;case1;then1;case2;then2}` etc'
                        }
                    ].map(x => ({
                        name: x.name,
                        type: 'leaf',
                        embed: {
                            fields: [x]
                        }
                    }))
                },
                {
                    id: 'terminology',
                    name: 'Terminology',
                    type: 'paged',
                    tags: ['terms', 'terminology', 'definitions', 'define'],
                    embed: {
                        description: 'There are various terms used in BBTag that might not be intuitive, ' +
                            'so here is a list of definitions for some of the most important ones:'
                    },
                    selectText: 'Pick a term',
                    pages: [
                        {
                            name: 'BBTag',
                            value: 'BBTag is a text replacement language. Any text between a `{` and `}` pair (called a subtag) ' +
                                'will be taken as code and run, with the output of that replacing the whole subtag. ' +
                                'Each subtag does something different, and each accepts its own list of arguments.'
                        },
                        {
                            name: 'Subtag',
                            value: 'A subtag is a pre-defined function that accepts some arguments and returns a single output. ' +
                                'Subtags can be called by placing their name between a pair of `{` and `}`, ' +
                                'with any arguments to be passed to the subtag being separated by `;`.\nAs an example:```{math;+;1;2}```' +
                                'Subtag: `math`\nArguments: `+`, `1`, `2`\nResult: `3`'
                        },
                        {
                            name: 'Tag',
                            value: 'A tag is a user-made block of text which may or may not contain subtags. ' +
                                'Any subtags that it does contain will be executed and be replaced by their output.'
                        },
                        {
                            name: 'Argument',
                            value: 'An argument is a single value which gets given to a subtag. Arguments can be numbers, text, arrays, anything you can type really. ' +
                                'Each subtag will require a different argument pattern, so be sure to check what pattern your subtag needs!'
                        },
                        {
                            name: 'Variable',
                            value: 'A variable is a value that is stored in the bots memory ready to access it later on. ' +
                                `For more in-depth details about variables, please use \`b!${this.#commandName} docs variable\`.`
                        },
                        {
                            name: 'Array',
                            value: 'An array is a collection of values all grouped together, commonly done so by enclosing them inside `[]`. ' +
                                'In BBTag, arrays can be assigned to a variable to store them for later use. In this situation, you might ' +
                                'see an array displayed like this `{"v":["1","2","3"],"n":"varname"}`. If you do, dont worry, nothing is broken! ' +
                                'That is just there to allow you to modify the array in place within certain subtags.'
                        }
                    ].map(x => ({
                        name: x.name,
                        type: 'leaf',
                        embed: {
                            fields: [x]
                        }
                    }))
                },
                {
                    id: 'dynamic',
                    name: 'Dynamic',
                    type: 'leaf',
                    embed: {
                        description: 'In bbtag, even the names of subtags can be dynamic. This can be achieved simply by placing subtags before the ' +
                            'first `;` of a subtag. \n e.g. ```{user{get;~action};{userid}}``` If `~action` is set to `name`, then this will run the `username` subtag, ' +
                            'if it is set to `avatar` then it will run the `useravatar` subtag, and so on. Because dynamic subtags are by definition not set in ' +
                            'stone, it is recommended not to use them, and as such you will receive warnings when editing/creating a tag/cc which contains a ' +
                            'dynamic subtag. Your tag will function correctly, however some optimizations employed by bbtag will be unable to run on any such tag.'
                    }
                }
            ]
        };
    }

    #getSubtagDocs(subtag: Subtag): DocumentationPaged {
        const description = [];
        if (typeof subtag.deprecated === 'string')
            description.push(`**This subtag is deprecated and has been replaced by {${subtag.deprecated}}**`);
        else if (subtag.deprecated)
            description.push('**This subtag is deprecated**');
        if (subtag.aliases.length > 0)
            description.push('**Aliases:**', codeBlock(subtag.aliases.join(', ')));
        if (subtag.description !== undefined)
            description.push(subtag.description);

        return {
            id: `subtag_${subtag.name}`,
            name: `{${subtag.name}}`,
            type: 'paged',
            embed: {
                url: `bbtag/subtags/#${encodeURIComponent(subtag.name)}`,
                description: description.length === 0 ? undefined : description.join('\n'),
                color: subtag.deprecated !== false ? 0xff0000 : undefined
            },
            tags: [subtag.name, ...subtag.aliases],
            hidden: subtag.hidden,
            selectText: 'Pick a call signature',
            pages: subtag.signatures.map(sig => this.#toSubtagSignaturePage(subtag, sig))
        };
    }

    #toSubtagSignaturePage(subtag: Subtag, signature: SubtagSignature): DocumentationPage {
        const parameters = bbtag.stringifyParameters(signature.subtagName ?? subtag.name, signature.parameters);

        const description = [codeBlock(parameters)];
        const defaultDesc = signature.parameters
            .flatMap<SubtagSignatureValueParameter>(p => 'nested' in p ? p.nested : [p])
            .map(this.#getParameterModifiers)
            .filter(guard.hasValue)
            .join('\n');
        if (defaultDesc.length > 0)
            description.push(defaultDesc, '');
        description.push(signature.description, '');

        function showExample(value: string): string {
            if (value.length === 0)
                return '_empty output_';
            return quote(value);
        }

        const fields: EmbedField[] = [
            {
                name: '**Usage**',
                value: description.join('\n')
            },
            {
                name: '**Example code**',
                value: codeBlock(signature.exampleCode)
            },
            {
                name: '**Example output**',
                value: showExample(signature.exampleOut)
            }
        ];

        for (const limitClass of Object.values(limits)) {
            const limit = new limitClass();
            const text = limit.rulesFor(subtag.name).join('\n');
            if (text.length > 0)
                fields.push({ name: `**Limits for ${limit.scopeName}:**`, value: codeBlock(text), inline: true });
        }

        if (signature.exampleIn !== undefined) {
            fields.splice(2, 0, {
                name: '**Example user input**',
                value: showExample(signature.exampleIn)
            });
        }

        return {
            name: parameters,
            embed: { fields }
        };
    }

    #getParameterModifiers(this: void, parameter: SubtagSignatureValueParameter): string | undefined {
        const modifiers = [];
        if (parameter.maxLength !== 1_000_000)
            modifiers.push(`can at most be ${parameter.maxLength} characters long`);
        if (parameter.defaultValue !== '')
            modifiers.push(`defaults to \`${parameter.defaultValue}\` if ${parameter.required ? '' : 'omitted or'} left blank.`);
        if (modifiers.length === 0)
            return undefined;

        return `\`${parameter.name}\` ${humanize.smartJoin(modifiers, ', ', ', and ')}`;
    }

    protected getTree(): Documentation {
        return this.#tree ??= this.#loadTree();
    }

    protected noMatches(): Awaitable<Omit<AdvancedMessageContent, 'components'>> {
        return {
            content: `❌ Oops, I didnt recognise that topic! Try using \`b!${this.#commandName} docs\` for a list of all topics`,
            embeds: []
        };
    }
}
