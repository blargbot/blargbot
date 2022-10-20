import { IFormattable } from '@blargbot/domain/messages/types';
import { TagVariableScope, TagVariableType } from '@blargbot/domain/models';

import { BBTagContext } from './BBTagContext';

export const tagVariableScopeProviders: readonly TagVariableScopeProvider[] = [
    {
        name: 'Server',
        prefix: '_',
        description: 'Server variables (also referred to as Guild variables) are commonly used if you wish to store data on a per server level. They are however stored in 2 separate \'pools\', one for tags and one for custom commands, meaning they cannot be used to pass data between the two\nThis makes then very useful for communicating data between tags that are intended to be used within 1 server at a time.',
        getScope: (context) => ({
            type: context.tagVars ? TagVariableType.TAGGUILD : TagVariableType.GUILD,
            entityId: context.guild.id
        })
    },
    {
        name: 'Author',
        prefix: '@',
        description: 'Author variables are stored against the author of the tag, meaning that only tags made by you can access or edit your author variables.\nThese are very useful when you have a set of tags that are designed to be used by people between servers, effectively allowing servers to communicate with eachother.',
        getScope: (context) => ({
            type: TagVariableType.AUTHOR,
            entityId: context.authorId
        })
    },
    {
        name: 'Global',
        prefix: '*',
        description: 'Global variables are completely public, anyone can read **OR EDIT** your global variables.\nThese are very useful if you like pain.',
        getScope: () => ({
            type: TagVariableType.GLOBAL
        })
    },
    {
        name: 'Temporary',
        prefix: '~',
        description: 'Temporary variables are never stored to the database, meaning they are by far the fastest variable type.\nIf you are working with data which you only need to store for later use within the same tag call, then you should use temporary variables over any other type',
        getScope: () => undefined
    },
    {
        name: 'Local',
        prefix: '',
        description: 'Local variables are the default variable type, only usable if your variable name doesnt start with one of the other prefixes. These variables are only accessible by the tag that created them, meaning there is no possibility to share the values with any other tag.\nThese are useful if you are intending to create a single tag which is usable anywhere, as the variables are not confined to a single server, just a single tag',
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
