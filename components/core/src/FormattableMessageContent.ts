import { FormatActionRowComponents, FormatButton, FormatEmbedAuthor, FormatEmbedFooter, FormatEmbedOptions, FormatSelectMenu, SendContent } from '@blargbot/core/types';
import { format, IFormattable, IFormatter } from '@blargbot/formatting';
import Eris from 'eris';

export class FormattableMessageContent implements IFormattable<SendContent<string>> {
    readonly #content: SendContent<IFormattable<string>>;

    public constructor(content: SendContent<IFormattable<string>>) {
        this.#content = content;
    }

    public [format](formatter: IFormatter): SendContent<string> {
        const result = {
            ...this.#content,
            content: this.#getString(this.#content.content, formatter),
            embeds: this.#content.embeds?.map(e => this.#getEmbed(e, formatter)),
            components: this.#content.components?.map(x => ({
                ...x,
                components: x.components.map(c => this.#getComponent(c, formatter))
            }))
        };
        for (const key of Object.keys(result) as Array<keyof typeof result>)
            if (result[key] === undefined)
                delete result[key];
        return result;
    }

    #getString(value: string | IFormattable<string>, formatter: IFormatter): string;
    #getString(value: string | undefined | IFormattable<string | undefined>, formatter: IFormatter): string | undefined;
    #getString(value: string | undefined | IFormattable<string | undefined>, formatter: IFormatter): string | undefined {
        switch (typeof value) {
            case 'string': return value;
            case 'undefined': return value;
            default: return value[format](formatter);
        }
    }

    #getEmbed(value: FormatEmbedOptions<string | IFormattable<string>>, formatter: IFormatter): Eris.EmbedOptions;
    #getEmbed(value: FormatEmbedOptions<string | IFormattable<string>> | undefined, formatter: IFormatter): Eris.EmbedOptions | undefined;
    #getEmbed(value: FormatEmbedOptions<string | IFormattable<string>> | undefined, formatter: IFormatter): Eris.EmbedOptions | undefined {
        if (value === undefined)
            return undefined;

        return {
            ...value,
            author: this.#getEmbedAuthor(value.author, formatter),
            description: this.#getString(value.description, formatter),
            title: this.#getString(value.title, formatter),
            footer: this.#getEmbedFooter(value.footer, formatter),
            fields: value.fields?.map(f => ({
                ...f,
                name: this.#getString(f.name, formatter),
                value: this.#getString(f.value, formatter)
            }))
        };
    }

    #getEmbedAuthor(value: FormatEmbedAuthor<string | IFormattable<string>> | undefined, formatter: IFormatter): Eris.EmbedAuthor | undefined {
        if (value === undefined)
            return undefined;

        return {
            ...value,
            name: this.#getString(value.name, formatter)
        };
    }
    #getEmbedFooter(value: FormatEmbedFooter<string | IFormattable<string>> | undefined, formatter: IFormatter): Eris.EmbedFooter | undefined {
        if (value === undefined)
            return undefined;

        return {
            ...value,
            text: this.#getString(value.text, formatter)
        };
    }

    #getComponent(value: FormatActionRowComponents<string | IFormattable<string>>, formatter: IFormatter): Eris.ActionRowComponents {
        switch (value.type) {
            case 2: return this.#getButton(value, formatter);
            case 3: return this.#getSelectMenu(value, formatter);
        }
    }

    #getButton(value: FormatButton<string | IFormattable<string>>, formatter: IFormatter): Eris.Button {
        return {
            ...value,
            label: this.#getString(value.label, formatter)
        };
    }

    #getSelectMenu(value: FormatSelectMenu<string | IFormattable<string>>, formatter: IFormatter): Eris.SelectMenu {
        return {
            ...value,
            placeholder: this.#getString(value.placeholder, formatter),
            options: value.options.map(o => ({
                ...o,
                label: this.#getString(o.label, formatter),
                description: this.#getString(o.description, formatter)
            }))
        };
    }

}
