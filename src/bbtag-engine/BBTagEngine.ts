import { BBTagContext } from './BBTagContext.js';
import type { BBTagErrorRenderer } from './BBTagErrorRenderer.js';
import type { BBTagLocalsFactory } from './BBTagLocalsFactory.js';
import type { BBTagReplacer } from './BBTagReplacer.js';
import type { BBTagSerializer } from './BBTagSerializer.js';

export interface BBTagEngineOptions<Input, Locals extends object> {
    readonly replacer: BBTagReplacer<Locals>;
    readonly renderError: BBTagErrorRenderer<NoInfer<Locals>>;
    readonly serializer: BBTagSerializer<NoInfer<Input>>;
    readonly locals: BBTagLocalsFactory<Input, NoInfer<Locals>>;
}

export class BBTagEngine<Input, Locals extends object> {
    readonly #serializer: BBTagSerializer<Input>;
    readonly #locals: BBTagLocalsFactory<Input, Locals>;
    readonly #replacer: BBTagReplacer<Locals>;
    readonly #renderError: BBTagErrorRenderer<Locals>;
    readonly #serialize: (context: BBTagContext<Locals>) => Promise<Uint8Array>;

    public constructor(options: BBTagEngineOptions<Input, Locals>) {
        this.#replacer = options.replacer;
        this.#renderError = options.renderError;
        this.#serializer = options.serializer;
        this.#locals = options.locals;
        this.#serialize = async context => {
            const input = await this.#locals.toInput(context.locals);
            return await this.#serializer.serialize(input);
        };
    }

    public async createContext(input: Input): Promise<BBTagContext<Locals>> {
        const locals = await this.#locals.toLocals(input);
        return new BBTagContext(
            locals,
            this.#replacer,
            this.#renderError,
            this.#serialize
        );
    }

    public async deserialize(data: Uint8Array): Promise<BBTagContext<Locals>> {
        const input = await this.#serializer.deserialize(data);
        return await this.createContext(input);
    }
}
