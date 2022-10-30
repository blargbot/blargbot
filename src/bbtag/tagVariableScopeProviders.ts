import { TagVariableScope, TagVariableType } from '@blargbot/domain/models';
import { IFormattable } from '@blargbot/formatting';

import { BBTagContext } from './BBTagContext';
import templates from './text';

export const tagVariableScopeProviders: readonly TagVariableScopeProvider[] = [
    {
        name: templates.subtag.variables.server.name,
        prefix: '_',
        description: templates.subtag.variables.server.description,
        getScope: (context) => ({
            type: context.tagVars ? TagVariableType.TAGGUILD : TagVariableType.GUILD,
            entityId: context.guild.id
        })
    },
    {
        name: templates.subtag.variables.author.name,
        prefix: '@',
        description: templates.subtag.variables.author.description,
        getScope: (context) => ({
            type: TagVariableType.AUTHOR,
            entityId: context.authorId
        })
    },
    {
        name: templates.subtag.variables.global.name,
        prefix: '*',
        description: templates.subtag.variables.global.description,
        getScope: () => ({
            type: TagVariableType.GLOBAL
        })
    },
    {
        name: templates.subtag.variables.temporary.name,
        prefix: '~',
        description: templates.subtag.variables.temporary.description,
        getScope: () => undefined
    },
    {
        name: templates.subtag.variables.local.name,
        prefix: '',
        description: templates.subtag.variables.local.description,
        getScope: (context) => ({
            type: context.tagVars ? TagVariableType.LOCAL : TagVariableType.GUILDLOCAL,
            entityId: context.tagVars ? undefined : context.guild.id,
            name: context.rootTagName
        })
    }
];

export interface TagVariableScopeProvider {
    readonly name: IFormattable<string>;
    readonly prefix: string;
    readonly description: IFormattable<string>;
    getScope(context: BBTagContext): TagVariableScope | undefined;
}
