import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.dump;

export interface DumpOptions {
    readonly content: string;
    readonly channelId: string;
}
export interface GenerateDumpLinkFeature {
    generateDumpLink(options: DumpOptions): Promise<URL>;
}

type Features = GenerateDumpLinkFeature;
export class DumpSubtag extends CompiledSubtag {
    readonly #features: GenerateDumpLinkFeature;
    public constructor(features: Features) {
        super({
            name: 'dump',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [text]) => this.createDump(ctx, text.value)
                }
            ]
        });
        this.#features = features;
    }

    public async createDump(context: BBTagContext, text: string): Promise<string> {
        const url = await this.#features.generateDumpLink({ content: text, channelId: context.local.channelId });
        return url.toString();
    }
}
