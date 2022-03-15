import { ImageCallback } from '@jimp/core';
import { Instance } from 'tinycolor2';

export module '@jimp/plugin-color' {
    export type BetterColorActionName = | ColorActionName | keyof Instance;

    export type BetterColorAction = Omit<ColorAction, 'apply'> & { apply: BetterColorActionName; }

    export interface Color {
        color(actions: BetterColorAction[], cb?: ImageCallback<this>): this;
        colour(actions: BetterColorAction[], cb?: ImageCallback<this>): this;
    }
}
