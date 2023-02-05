import type { Subtag, SubtagSignature, SubtagSignatureParameter, SubtagSignatureValueParameter, SubtagType } from '@bbtag/blargbot';
import { limits, tagTypeDetails, tagVariableScopeProviders } from '@bbtag/blargbot';
import type { SendContent } from '@blargbot/core/types.js';
import type { IFormattable } from '@blargbot/formatting';
import { hasValue } from '@blargbot/guards';

import type { Cluster } from '../../Cluster.js';
import templates from '../../text.js';
import type { Documentation, DocumentationPage, DocumentationPaged } from './DocumentationManager.js';
import { DocumentationTreeManager } from './DocumentationTreeManager.js';

const doc = templates.documentation.bbtag;

export class BBTagDocumentationManager extends DocumentationTreeManager {
    readonly #cluster: Cluster;
    #tree: Documentation | undefined;
    readonly #commandName: string;

    public constructor(cluster: Cluster, commandName: string, id: string = commandName) {
        super(cluster, id, doc.invalid, doc.prompt);
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
            name: doc.index.name,
            type: 'group',
            tags: [''],
            embed: {
                color: 0xefff00,
                description: doc.index.description({ editorLink: this.#cluster.util.websiteLink('bbtag/editor') }),
                fields: [
                    {
                        name: doc.index.topics.name,
                        value: doc.index.topics.value({ commandName: this.#commandName })
                    }
                ]
            },
            selectText: doc.index.prompt,
            items: [
                {
                    id: 'subtags',
                    name: doc.subtags.name,
                    type: 'group',
                    tags: ['subtags', 'all', 'categories', 'category'],
                    embed: {
                        url: '/bbtag/subtags',
                        description: doc.subtags.description({
                            categories: [...subtagGroups.keys()]
                                .map(id => tagTypeDetails[id])
                                .filter(g => g.hidden !== true)
                                .map(g => ({ name: g.name, description: g.desc }))
                        })
                    },
                    selectText: doc.subtags.prompt,
                    items: [...subtagGroups.entries()]
                        .map(kvp => ({ category: tagTypeDetails[kvp[0]], subtags: [...kvp[1]].sort((a, b) => a.name < b.name ? -1 : 1) }))
                        .sort((a, b) => a.category.name < b.category.name ? -1 : 1)
                        .map(({ category, subtags }) => ({
                            id: `category_${category.id}`,
                            name: category.name,
                            type: 'group',
                            selectText: doc.subtagCategory.prompt,
                            items: subtags.map(s => this.#getSubtagDocs(s)),
                            hidden: category.hidden,
                            embed: {
                                description: doc.subtagCategory.description({ description: category.desc, subtags: subtags.map(s => s.name) })
                            }
                        }))
                },
                {
                    id: 'variables',
                    name: doc.variables.name,
                    type: 'paged',
                    tags: ['variables'],
                    embed: {
                        description: doc.variables.description({ scopeCount: tagVariableScopeProviders.length })
                    },
                    selectText: doc.variables.prompt,
                    pages: [
                        ...tagVariableScopeProviders.map(scope => {
                            return {
                                name: doc.variables.pages.variableType.name({ name: scope.name, prefix: scope.prefix }),
                                value: scope.description
                            };
                        }),
                        {
                            name: doc.variables.pages.commitRollback.name,
                            value: doc.variables.pages.commitRollback.value
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
                    name: doc.arguments.name,
                    type: 'paged',
                    tags: ['arguments', 'argtypes'],
                    embed: {
                        description: doc.arguments.description
                    },
                    selectText: doc.arguments.prompt,
                    pages: [
                        {
                            name: doc.arguments.pages.required.name,
                            value: doc.arguments.pages.required.value
                        },
                        {
                            name: doc.arguments.pages.optional.name,
                            value: doc.arguments.pages.optional.value({ commandName: this.#commandName })
                        },
                        {
                            name: doc.arguments.pages.multiple.name,
                            value: doc.arguments.pages.multiple.value({ commandName: this.#commandName })
                        },
                        {
                            name: doc.arguments.pages.nested.name,
                            value: doc.arguments.pages.nested.value({ commandName: this.#commandName })
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
                    name: doc.terminology.name,
                    type: 'paged',
                    tags: ['terms', 'terminology', 'definitions', 'define'],
                    embed: {
                        description: doc.terminology.description
                    },
                    selectText: doc.terminology.prompt,
                    pages: [
                        {
                            name: doc.terminology.pages.bbtag.name,
                            value: doc.terminology.pages.bbtag.value
                        },
                        {
                            name: doc.terminology.pages.subtag.name,
                            value: doc.terminology.pages.subtag.value
                        },
                        {
                            name: doc.terminology.pages.tag.name,
                            value: doc.terminology.pages.tag.value
                        },
                        {
                            name: doc.terminology.pages.argument.name,
                            value: doc.terminology.pages.argument.value
                        },
                        {
                            name: doc.terminology.pages.variable.name,
                            value: doc.terminology.pages.variable.value({ commandName: this.#commandName })
                        },
                        {
                            name: doc.terminology.pages.array.name,
                            value: doc.terminology.pages.array.value
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
                    name: doc.dynamic.name,
                    type: 'single',
                    embed: {
                        description: doc.dynamic.description
                    }
                }
            ]
        };
    }

    #getSubtagDocs(subtag: Subtag): DocumentationPaged {
        const description = [];
        if (subtag.deprecated !== false)
            description.push(doc.subtag.description.deprecated({ replacement: typeof subtag.deprecated === 'string' ? subtag.deprecated : undefined }));
        if (subtag.aliases.length > 0)
            description.push(doc.subtag.description.aliases({ aliases: subtag.aliases }));
        if (subtag.description !== undefined)
            description.push(subtag.description);

        return {
            id: `subtag_${subtag.name}`,
            name: doc.subtag.name({ name: subtag.name }),
            type: 'paged',
            embed: {
                url: `bbtag/subtags/#${encodeURIComponent(subtag.name)}`,
                description: description.length === 0 ? undefined : doc.subtag.description.template({ parts: description }),
                color: subtag.deprecated !== false ? 0xff0000 : undefined
            },
            tags: [subtag.name, ...subtag.aliases],
            hidden: subtag.hidden,
            selectText: doc.subtag.prompt,
            pages: subtag.signatures.map(sig => this.#toSubtagSignaturePage(subtag, sig))
        };
    }

    #toSubtagSignaturePage(subtag: Subtag, signature: SubtagSignature<IFormattable<string>>): DocumentationPage {
        const parameters = stringifyParameters(signature.subtagName ?? subtag.name, signature.parameters);

        return {
            name: doc.subtag.pages.signature.name({ parameters }),
            embed: {
                fields: [
                    {
                        name: doc.subtag.pages.signature.usage.name,
                        value: doc.subtag.pages.signature.usage.value.template({
                            parts: [
                                doc.subtag.pages.signature.usage.value.parameters({ parameters }),
                                ...signature.parameters
                                    .flatMap<SubtagSignatureValueParameter>(p => 'nested' in p ? p.nested : [p])
                                    .map(this.#getParameterModifiers)
                                    .filter(hasValue),
                                signature.description
                            ]
                        })
                    },
                    {
                        name: doc.subtag.pages.signature.exampleCode.name,
                        value: doc.subtag.pages.signature.exampleCode.value({ code: signature.exampleCode })
                    },
                    ...signature.exampleIn === undefined ? [] : [{
                        name: doc.subtag.pages.signature.exampleIn.name,
                        value: doc.subtag.pages.signature.exampleIn.value({ text: signature.exampleIn })
                    }],
                    {
                        name: doc.subtag.pages.signature.exampleOut.name,
                        value: doc.subtag.pages.signature.exampleOut.value({ text: signature.exampleOut })
                    },
                    ...Object.values(limits)
                        .flatMap(l => {
                            const limit = new l();
                            const rules = limit.rulesFor(subtag.name);
                            return rules.length === 0 ? [] : [{
                                name: doc.subtag.pages.signature.limit.name[limit.id],
                                value: doc.subtag.pages.signature.limit.value({ rules })
                            }];
                        })
                ]
            }
        };
    }

    #getParameterModifiers(this: void, parameter: SubtagSignatureValueParameter): IFormattable<string> | undefined {
        const hasDefault = parameter.defaultValue !== '';
        return parameter.maxLength !== 1_000_000
            ? hasDefault
                ? doc.subtag.pages.signature.usage.value.modifier.defaultedMaxLength(parameter)
                : doc.subtag.pages.signature.usage.value.modifier.maxLength(parameter)
            : hasDefault
                ? doc.subtag.pages.signature.usage.value.modifier.defaulted(parameter)
                : undefined;
    }

    protected getTree(): Documentation {
        return this.#tree ??= this.#loadTree();
    }

    protected noMatches(): Omit<SendContent<IFormattable<string>>, 'components'> {
        return {
            content: doc.unknown({ commandName: this.#commandName }),
            embeds: []
        };
    }
}

function stringifyParameters(subtagName: string, parameters: readonly SubtagSignatureParameter[]): string {
    return `{${[subtagName, ...parameters.map(stringifyParameter)].join(';')}}`;
}

function stringifyParameter(parameter: SubtagSignatureParameter): string {
    if ('nested' in parameter) {
        if (parameter.nested.length === 1)
            return `${stringifyParameter(parameter.nested[0])}...`;
        return `(${parameter.nested.map(stringifyParameter).join(';')})...`;
    }
    return parameter.required
        ? `<${parameter.name}>`
        : `[${parameter.name}]`;
}
