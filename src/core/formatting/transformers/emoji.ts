import { Emote } from '../../Emote';
import { IValueResolverTransform } from '../FormatStringCompiler';

export const emoji: IValueResolverTransform = {
    transform(_compiler, source, ...args) {
        if (args.length !== 0)
            throw new Error('Emoji expects no arguments');

        return ctx => {
            const value = source(ctx);
            if (value === undefined)
                return undefined;
            if (typeof value !== 'object' || value === null)
                throw new Error('Value isnt an emote');
            if (value instanceof Emote)
                return value.toString();
            if (!('name' in value))
                throw new Error('Emote missing name');
            const emote = value as { name: string; id?: string; animated?: boolean; };
            return emote.id !== undefined
                ? `<${emote.animated === true ? 'a' : ''}:${emote.id}:${emote.name}>`
                : emote.name;
        };
    }
};
