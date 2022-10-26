import { IFormatterMiddleware } from '../Formatter';
import { format, IFormatString, IFormatter } from '../types';

export interface ITranslationSource {
    getTranslation(id: string, locale: Intl.Locale): string | undefined;
}

export class TranslationMiddleware implements IFormatterMiddleware {
    readonly #source: ITranslationSource;

    public constructor(source: ITranslationSource) {
        this.#source = source;
    }

    public handle(formatter: IFormatter, next: (string: IFormatString<string>) => string, string: IFormatString<string>): string {
        const translated = this.#source.getTranslation(string.id, formatter.locale);
        if (translated !== undefined) {
            string = {
                id: string.id,
                template: translated,
                value: string.value,
                [format](formatter) {
                    return formatter.format(this);
                }
            };
        }
        return next(string);
    }
}
