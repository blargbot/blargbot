declare module 'color-thief-jimp' {
    import Jimp from 'jimp';

    export type RGB = [red: number, green: number, blue: number];

    class ColorThief {
        getColor(source: Jimp, quality?: number): RGB
    }

    var colorThief: ColorThief;

    export default colorThief;
}