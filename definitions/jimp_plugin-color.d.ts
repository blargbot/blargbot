import { ImageCallback } from '@jimp/core';
import { Instance } from 'tinycolor2';

declare module '@jimp/plugin-color' {
    type BetterColorActionName = | ColorActionName | keyof Instance;

    type BetterColorAction = Omit<ColorAction, 'apply'> & { apply: BetterColorActionName }

    interface Color {
        color(actions: BetterColorAction[], cb?: ImageCallback<this>): this;
        colour(actions: BetterColorAction[], cb?: ImageCallback<this>): this;
    }
}