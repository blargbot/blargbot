import { TagVariableScope, TagVariableType } from '@blargbot/domain/models';
import { IFormattable } from '@blargbot/formatting';

import { BBTagContext } from './BBTagContext';
import templates from './text';

export const tagVariableScopeProviders: readonly TagVariableScopeProvider[] = [
    {
        name: templates.subtag.variables.server.name,
        prefix: '_',
        description: templates.subtag.variables.server.description,
        getScope: (context) => context.tagVars
            ? { type: TagVariableType.GUILD_TAG, guildId: context.guild.id }
            : { type: TagVariableType.GUILD_CC, guildId: context.guild.id }
    },
    {
        name: templates.subtag.variables.author.name,
        prefix: '@',
        description: templates.subtag.variables.author.description,
        getScope: (context) => context.authorId !== undefined
            ? { type: TagVariableType.AUTHOR, authorId: context.authorId }
            : undefined
    },
    {
        name: templates.subtag.variables.global.name,
        prefix: '*',
        description: templates.subtag.variables.global.description,
        getScope: () => ({ type: TagVariableType.GLOBAL })
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
        getScope: (context) => context.tagVars
            ? { type: TagVariableType.LOCAL_TAG, name: context.rootTagName }
            : { type: TagVariableType.LOCAL_CC, name: context.rootTagName, guildId: context.guild.id }
    }
];

export interface TagVariableScopeProvider {
    readonly name: IFormattable<string>;
    readonly prefix: string;
    readonly description: IFormattable<string>;
    getScope(context: BBTagContext): TagVariableScope | undefined;
}
