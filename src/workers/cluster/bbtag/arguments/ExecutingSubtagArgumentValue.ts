import { RuntimeReturnState, Statement, SubtagArgumentValue, SubtagCall } from '@cluster/types';
import { MessageEmbedOptions } from 'discord.js';

import { BBTagContext } from '../BBTagContext';
import { BBTagError } from '../BBTagError';

export class ExecutingSubtagArgumentValue implements SubtagArgumentValue {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #promise?: Promise<string>;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #value?: string;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #defaultValue: string;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #context: BBTagContext;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #maxLength: number;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #subtagName: string;

    public readonly code: Statement;
    public readonly call: SubtagCall;
    public get isCached(): boolean { return this.#value !== undefined; }
    public get raw(): string { return this.code.map(c => typeof c === 'string' ? c : c.source).join(''); }
    public get value(): string {
        if (this.#value === undefined)
            throw new Error('The value is not available yet. Please await the wait() method before attempting to access the value');
        return this.#value;
    }

    public constructor(
        context: BBTagContext,
        subtagName: string,
        call: SubtagCall,
        code: Statement,
        defaultValue: string,
        maxLength: number
    ) {
        this.call = call;
        this.code = code;
        this.#context = context;
        this.#defaultValue = defaultValue;
        this.#maxLength = maxLength;
        this.#subtagName = subtagName;
    }

    public execute(): Promise<string> {
        return this.#promise = this.executeInner();
    }

    public wait(): Promise<string> {
        return this.#promise ??= this.execute();
    }

    private async executeInner(): Promise<string> {
        const result = await this.#context.eval(this.code);
        if (result.length > this.#maxLength) {
            await this.#context.util.send(this.#context.engine.cluster.config.discord.channels.errorlog, {
                embeds: [
                    {
                        title: `ERROR: SubTag arg > ${this.#maxLength}`,
                        color: 0xff0000,
                        ...buildLengthEmbed(this.#context, this.call, this.#subtagName)
                    }
                ]
            });
            this.#context.state.return = RuntimeReturnState.ALL;
            throw new BBTagError(this.call.start, this.#context.addError(
                'Argument length exceeded limit',
                this.call,
                `Argument ${this.call.args.indexOf(this.code)} is limited to ${this.#maxLength} but got a value of length ${result.length}`
            ));
        }

        if (result.length > this.#maxLength / 2) {
            await this.#context.util.send(this.#context.engine.cluster.config.discord.channels.errorlog, {
                embeds: [
                    {
                        title: `WARN: SubTag arg length > ${this.#maxLength}`,
                        color: 0xffff00,
                        ...buildLengthEmbed(this.#context, this.call, this.#subtagName)
                    }
                ]
            });
        }
        return this.#value = result.length === 0 ? this.#defaultValue : result;
    }
}

function buildLengthEmbed(context: BBTagContext, subtag: SubtagCall, subtagName: string): MessageEmbedOptions {
    return {
        fields: [
            { name: 'Details', value: `Guild: ${context.guild.id}\nChannel: ${context.channel.id}\nAuthor: <@${context.author}>\nUser: <@${context.user.id}>`, inline: true },
            { name: `Type: ${context.isCC ? 'CC' : 'Tag'}`, value: context.rootTagName, inline: true },
            { name: 'Subtag', value: subtagName, inline: true },
            { name: 'Location', value: `(${subtag.start.line},${subtag.start.column}):(${subtag.end.line},${subtag.end.column})`, inline: true }
        ]
    };
}
