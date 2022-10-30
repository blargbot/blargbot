import { IValueResolverTransform } from '../types';

export const rand: IValueResolverTransform = {
    transform(_compiler, _, ...choices) {
        return () => {
            const index = Math.floor(Math.random() * choices.length);
            return choices[index];
        };
    }
};
