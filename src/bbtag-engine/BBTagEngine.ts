import { BBTagContext } from './BBTagContext.js';
import type { BBTagErrorRenderer } from './BBTagErrorRenderer.js';
import type { BBTagReplacer } from './BBTagReplacer.js';
import type { BBTagSerializer } from './BBTagSerializer.js';

export interface BBTagEngineOptions<Locals extends Record<string, unknown>> {
    readonly replacer: BBTagReplacer<Locals>;
    readonly renderError: BBTagErrorRenderer<NoInfer<Locals>>;
    readonly serializer: BBTagSerializer<NoInfer<Locals>>;
}

export class BBTagEngine<Locals extends Record<string, unknown>> {
    readonly #serializer: BBTagSerializer<Locals>;

    public readonly replacer: BBTagReplacer<Locals>;
    public readonly renderError: BBTagErrorRenderer<Locals>;

    public constructor(options: BBTagEngineOptions<Locals>) {
        this.replacer = options.replacer;
        this.renderError = options.renderError;
        this.#serializer = options.serializer;
    }

    public createContext(locals: Locals): BBTagContext<Locals> {
        return new BBTagContext(locals, this);
    }

    public async serialize(context: BBTagContext<Locals>): Promise<Uint8Array> {
        return await this.#serializer.serialize(context.locals);
    }

    public async deserialize(data: Uint8Array): Promise<BBTagContext<Locals>> {
        return new BBTagContext(await this.#serializer.deserialize(data), this);
    }
}
