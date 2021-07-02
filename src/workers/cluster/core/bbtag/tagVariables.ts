import { BBTagContext as BBContext } from './BBTagContext';
import ReadWriteLock from 'rwlock';
import { get as getLock } from './lock';
import { SubtagVariableType } from '../utils';
import { SubtagCall } from '../types';

export const tagVariableScopes = [
    {
        name: 'Server',
        prefix: '_',
        description: 'Server variables (also referred to as Guild variables) are commonly used if you wish to store data on a per server level. ' +
            'They are however stored in 2 separate \'pools\', one for tags and one for custom commands, meaning they cannot be used to pass data between the two\n' +
            'This makes then very useful for communicating data between tags that are intended to be used within 1 server at a time.',
        tagScope(context: BBContext): [type: SubtagVariableType, scope: string] {
            return context.tagVars
                ? [SubtagVariableType.TAGGUILD, context.guild.id]
                : [SubtagVariableType.GUILD, context.guild.id];
        },
        async setter(context: BBContext, _subtag: SubtagCall | undefined, values: Record<string, JToken>): Promise<void> {
            return await context.database.tagVariables.upsert(values, ...this.tagScope(context));
        },
        async getter(context: BBContext, _subtag: SubtagCall | undefined, name: string): Promise<JToken> {
            return await context.database.tagVariables.get(name, ...this.tagScope(context));
        },
        getLock: (context: BBContext, _subtag: SubtagCall | undefined, key: string): ReadWriteLock => getLock(...['SERVER', context.isCC ? 'CC' : 'Tag', key])
    },
    {
        name: 'Author',
        prefix: '@',
        description: 'Author variables are stored against the author of the tag, meaning that only tags made by you can access or edit your author variables.\n' +
            'These are very useful when you have a set of tags that are designed to be used by people between servers, effectively allowing servers to communicate with eachother.',
        tagScope(context: BBContext): [type: SubtagVariableType, scope: string] {
            return [SubtagVariableType.AUTHOR, context.author];
        },
        async setter(context: BBContext, _subtag: SubtagCall | undefined, values: Record<string, JToken>): Promise<void> {
            return await context.database.tagVariables.upsert(values, ...this.tagScope(context));
        },
        async getter(context: BBContext, _subtag: SubtagCall | undefined, name: string): Promise<JToken> {
            return await context.database.tagVariables.get(name, ...this.tagScope(context));
        },
        getLock: (context: BBContext, _subtag: SubtagCall | undefined, key: string): ReadWriteLock => getLock(...['AUTHOR', context.author, key])
    },
    {
        name: 'Global',
        prefix: '*',
        description: 'Global variables are completely public, anyone can read **OR EDIT** your global variables.\n' +
            'These are very useful if you like pain.',
        tagScope(_context: BBContext): [type: SubtagVariableType, scope: string] {
            return [SubtagVariableType.GLOBAL, ''];
        },
        async setter(context: BBContext, _subtag: SubtagCall | undefined, values: Record<string, JToken>): Promise<void> {
            return await context.database.tagVariables.upsert(values, ...this.tagScope(context));
        },
        async getter(context: BBContext, _subtag: SubtagCall | undefined, name: string): Promise<JToken> {
            return await context.database.tagVariables.get(name, ...this.tagScope(context));
        },
        getLock: (_context: BBContext, _subtag: SubtagCall | undefined, key: string): ReadWriteLock => getLock(...['GLOBAL', key])
    },
    {
        name: 'Temporary',
        prefix: '~',
        description: 'Temporary variables are never stored to the database, meaning they are by far the fastest variable type.\n' +
            'If you are working with data which you only need to store for later use within the same tag call, then you should use temporary variables over any other type',
        setter: (_context: BBContext, _subtag: SubtagCall | undefined, _values: Record<string, JToken>): Promise<void> => Promise.resolve(), //Temporary is never persisted to the database
        getter: (_context: BBContext, _subtag: SubtagCall | undefined, _name: string): Promise<JToken> => Promise.resolve(''), //Temporary is never persisted to the database
        getLock: (context: BBContext, _subtag: SubtagCall | undefined, key: string): ReadWriteLock => context.getLock(key)
    },
    {
        name: 'Local',
        prefix: '',
        description: 'Local variables are the default variable type, only usable if your variable name doesnt start with one of the other prefixes. ' +
            'These variables are only accessible by the tag that created them, meaning there is no possibility to share the values with any other tag.\n' +
            'These are useful if you are intending to create a single tag which is usable anywhere, as the variables are not confined to a single server, just a single tag',
        tagScope(context: BBContext): [type: SubtagVariableType, scope: string] {
            return context.tagVars
                ? [SubtagVariableType.LOCAL, context.tagName]
                : [SubtagVariableType.GUILDLOCAL, `${context.guild.id}_${context.tagName}`];
        },
        async setter(context: BBContext, _subtag: SubtagCall | undefined, values: Record<string, JToken>): Promise<void> {
            return await context.database.tagVariables.upsert(values, ...this.tagScope(context));
        },
        async getter(context: BBContext, _subtag: SubtagCall | undefined, name: string): Promise<JToken> {
            return await context.database.tagVariables.get(name, ...this.tagScope(context));
        },
        getLock: (context: BBContext, _subtag: SubtagCall | undefined, key: string): ReadWriteLock => getLock(...['LOCAL', context.isCC ? 'CC' : 'TAG', key])
    }
];