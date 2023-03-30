import textTemplates from '../text.js';
import type { TagVariableScopeProvider } from './TagVariableScopeProvider.js';

export const tagVariableScopeProviders: readonly TagVariableScopeProvider[] = [
    {
        name: textTemplates.subtag.variables.server.name,
        prefix: '_',
        description: textTemplates.subtag.variables.server.description,
        getScope: (context) => ({
            ownerId: BigInt(context.guild.id),
            scope: context.isTrusted ? 'secret' : `public:${context.type}`
        })
    },
    {
        name: textTemplates.subtag.variables.author.name,
        prefix: '@',
        description: textTemplates.subtag.variables.author.description,
        getScope: (context) => context.authorId !== null
            ? { ownerId: BigInt(context.authorId), scope: 'global' }
            : { ownerId: 0n, scope: `temp:${context.id}` }
    },
    {
        name: textTemplates.subtag.variables.global.name,
        prefix: '*',
        description: textTemplates.subtag.variables.global.description,
        getScope: () => ({
            ownerId: 0n,
            scope: 'global'
        })
    },
    {
        name: textTemplates.subtag.variables.temporary.name,
        prefix: '~',
        description: textTemplates.subtag.variables.temporary.description,
        getScope: context => ({
            ownerId: 0n,
            scope: `temp:${context.id}`
        })
    },
    {
        name: textTemplates.subtag.variables.local.name,
        prefix: '',
        description: textTemplates.subtag.variables.local.description,
        getScope: (context) => ({
            ownerId: context.isTrusted ? BigInt(context.guild.id) : 0n,
            scope: `local:${context.type}:${context.entrypoint.name}`
        })
    }
];
