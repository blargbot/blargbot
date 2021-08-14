import { BaseGlobalImageCommand, CommandContext } from '@cluster/command';
import { ImageResult } from '@image/types';

export class ColorCommand extends BaseGlobalImageCommand {
    public constructor() {
        super({
            name: 'color',
            definitions: [
                {
                    parameters: '{colors[]}',
                    description: 'Returns the provided colors.',
                    execute: (ctx, [text]) => this.render(ctx, text)
                }
            ]
        });
    }

    public async render(context: CommandContext, colors: string[]): Promise<string | ImageResult> {
        return await this.renderImage(context, 'color', { color: colors });
    }
}
