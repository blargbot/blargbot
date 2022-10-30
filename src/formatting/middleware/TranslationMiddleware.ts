import { IFormatterMiddleware } from '../Formatter';
import { IFormatString, IFormatter } from '../types';

export interface ITranslationSource {
    getTranslation(id: string, locale: Intl.Locale): string | undefined;
}

export class TranslationMiddleware implements IFormatterMiddleware {
    readonly #source: ITranslationSource;
    readonly #logger: (...message: unknown[]) => void;

    public constructor(source: ITranslationSource, errorLogger: (...message: unknown[]) => void) {
        this.#source = source;
        this.#logger = errorLogger;
    }

    public handle(formatter: IFormatter, next: (string: IFormatString) => string, string: IFormatString): string {
        const translated = this.#source.getTranslation(string.id, formatter.locale);
        if (translated !== undefined) {
            try {
                return next(makeTranslated(string, translated));
            } catch (err: unknown) {
                this.#logger('Translation', string.id, 'in', formatter.locale.toString(), 'failed:', err);
            }
        }
        return next(string);
    }
}

function makeTranslated(value: IFormatString, template: string): IFormatString {
    return Object.defineProperty(
        Object.create(value),
        'template',
        { value: template }
    );
}
