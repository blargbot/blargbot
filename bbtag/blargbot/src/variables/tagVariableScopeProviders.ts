import textTemplates from '../text.js';
import type { TagVariableScopeProvider } from './TagVariableScopeProvider.js';
import { TagVariableType } from './TagVariableType.js';

export const tagVariableScopeProviders: readonly TagVariableScopeProvider[] = [
    {
        name: textTemplates.subtag.variables.server.name,
        prefix: '_',
        description: textTemplates.subtag.variables.server.description,
        getScope: (context) => context.tagVars
            ? { type: TagVariableType.GUILD_TAG, guildId: context.guild.id }
            : { type: TagVariableType.GUILD_CC, guildId: context.guild.id }
    },
    {
        name: textTemplates.subtag.variables.author.name,
        prefix: '@',
        description: textTemplates.subtag.variables.author.description,
        getScope: (context) => context.authorId !== undefined
            ? { type: TagVariableType.AUTHOR, authorId: context.authorId }
            : { type: TagVariableType.TEMP }
    },
    {
        name: textTemplates.subtag.variables.global.name,
        prefix: '*',
        description: textTemplates.subtag.variables.global.description,
        getScope: () => ({ type: TagVariableType.GLOBAL })
    },
    {
        name: textTemplates.subtag.variables.temporary.name,
        prefix: '~',
        description: textTemplates.subtag.variables.temporary.description,
        getScope: () => ({ type: TagVariableType.TEMP })
    },
    {
        name: textTemplates.subtag.variables.local.name,
        prefix: '',
        description: textTemplates.subtag.variables.local.description,
        getScope: (context) => context.tagVars
            ? { type: TagVariableType.LOCAL_TAG, name: context.rootTagName }
            : { type: TagVariableType.LOCAL_CC, name: context.rootTagName, guildId: context.guild.id }
    }
];
