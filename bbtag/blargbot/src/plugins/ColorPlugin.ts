export abstract class ColorPlugin {
    public abstract getReader(key: string): ColorReader | undefined;
}

export interface ColorReader {
    (text: string): Color | undefined;
}

export interface Color {
    (type: string): string | undefined;
}

export class DefaultColorPlugin<Color> extends ColorPlugin {
    readonly #options: Record<string, ColorConverter<Color> | undefined>;

    public constructor(options: Record<string, ColorConverter<Color> | undefined>) {
        super();
        this.#options = options;
    }

    public override getReader(key: string): ColorReader | undefined {
        const converter = this.#options[key];
        if (converter === undefined)
            return undefined;

        return text => {
            try {
                const color = converter.read(text);
                return type => this.#options[type]?.write(color);
            } catch {
                return undefined;
            }
        };
    }
}

export interface ColorConverter<Color> {
    read(text: string): Color;
    write(color: Color): string;
}
