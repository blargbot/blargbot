import { BBTagContext } from './BBTagContext';
import ReadWriteLock from 'rwlock';
import { get as getLock } from './lock';
import { SubtagVariableType } from '../utils';
import { SubtagCall } from '../types';

export const tagVariableScopes: readonly TagVariableScope[] = [
    {
        name: 'Server',
        prefix: '_',
        description: 'Server variables (also referred to as Guild variables) are commonly used if you wish to store data on a per server level. ' +
            'They are however stored in 2 separate \'pools\', one for tags and one for custom commands, meaning they cannot be used to pass data between the two\n' +
            'This makes then very useful for communicating data between tags that are intended to be used within 1 server at a time.',
        setter: async (context, _subtag, values) => await context.database.tagVariables.upsert(values, ...serverScope(context)),
        getter: async (context, _subtag, name) => await context.database.tagVariables.get(name, ...serverScope(context)),
        getLock: (context: BBTagContext, _subtag: SubtagCall | undefined, key: string): ReadWriteLock => getLock(...['SERVER', context.isCC ? 'CC' : 'Tag', key])
    },
    {
        name: 'Author',
        prefix: '@',
        description: 'Author variables are stored against the author of the tag, meaning that only tags made by you can access or edit your author variables.\n' +
            'These are very useful when you have a set of tags that are designed to be used by people between servers, effectively allowing servers to communicate with eachother.',
        setter: async (context, _subtag, values) => await context.database.tagVariables.upsert(values, SubtagVariableType.AUTHOR, context.author),
        getter: async (context, _subtag, name) => await context.database.tagVariables.get(name, SubtagVariableType.AUTHOR, context.author),
        getLock: (context: BBTagContext, _subtag: SubtagCall | undefined, key: string): ReadWriteLock => getLock(...['AUTHOR', context.author, key])
    },
    {
        name: 'Global',
        prefix: '*',
        description: 'Global variables are completely public, anyone can read **OR EDIT** your global variables.\n' +
            'These are very useful if you like pain.',
        setter: async (context, _subtag, values) => await context.database.tagVariables.upsert(values, SubtagVariableType.GLOBAL, ''),
        getter: async (context, _subtag, name) => await context.database.tagVariables.get(name, SubtagVariableType.GLOBAL, ''),
        getLock: (_context: BBTagContext, _subtag: SubtagCall | undefined, key: string): ReadWriteLock => getLock(...['GLOBAL', key])
    },
    {
        name: 'Temporary',
        prefix: '~',
        description: 'Temporary variables are never stored to the database, meaning they are by far the fastest variable type.\n' +
            'If you are working with data which you only need to store for later use within the same tag call, then you should use temporary variables over any other type',
        setter: (): Promise<void> => Promise.resolve(), //Temporary is never persisted to the database
        getter: (): Promise<JToken> => Promise.resolve(''), //Temporary is never persisted to the database
        getLock: (context, _subtag, key): ReadWriteLock => context.getLock(key)
    },
    {
        name: 'Local',
        prefix: '',
        description: 'Local variables are the default variable type, only usable if your variable name doesnt start with one of the other prefixes. ' +
            'These variables are only accessible by the tag that created them, meaning there is no possibility to share the values with any other tag.\n' +
            'These are useful if you are intending to create a single tag which is usable anywhere, as the variables are not confined to a single server, just a single tag',
        setter: async (context, _subtag, values) => await context.database.tagVariables.upsert(values, ...localScope(context)),
        getter: async (context, _subtag, name) => await context.database.tagVariables.get(name, ...localScope(context)),
        getLock: (context, _subtag, key) => getLock(...['LOCAL', context.isCC ? 'CC' : 'TAG', key])
    }
];

interface TagVariableScope {
    readonly name: string;
    readonly prefix: string;
    readonly description: string;
    setter(context: BBTagContext, subtag: SubtagCall | undefined, values: Record<string, JToken>): Promise<void>;
    getter(context: BBTagContext, subtag: SubtagCall | undefined, name: string): Promise<JToken>;
    getLock(context: BBTagContext, subtag: SubtagCall | undefined, key: string): ReadWriteLock;
}

function localScope(context: BBTagContext): [type: SubtagVariableType, scope: string] {
    return context.tagVars
        ? [SubtagVariableType.LOCAL, context.tagName]
        : [SubtagVariableType.GUILDLOCAL, `${context.guild.id}_${context.tagName}`];
}

function serverScope(context: BBTagContext): [type: SubtagVariableType, scope: string] {
    return context.tagVars
        ? [SubtagVariableType.TAGGUILD, context.guild.id]
        : [SubtagVariableType.GUILD, context.guild.id];
}
