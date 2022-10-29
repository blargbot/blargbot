import { ITranslationSource } from '@blargbot/formatting';
import fs from 'fs';
import path from 'path';

export class FileSystemTranslationSource implements ITranslationSource {
    readonly #translationData: { readonly [P in string]?: { readonly [P in string]?: string } };

    public locales: ReadonlyMap<string, ReadonlySet<string>>;

    public constructor(directory: string) {
        this.#translationData = Object.fromEntries(
            fs.readdirSync(directory)
                .map(f => [
                    f.slice(0, -path.extname(f).length),
                    FileSystemTranslationSource.#getTranslationKeys(directory, f)
                ] as const)
                .filter(x => {
                    try {
                        new Intl.Locale(x[0]);
                        return true;
                    } catch {
                        return false;
                    }
                })
        );
        this.locales = Object.freeze(new Map(
            Object.entries(this.#translationData)
                .map(([locale, data]) => [locale, Object.freeze(new Set(Object.keys(data ?? {})))])
        ));
    }

    public getTranslation(id: string, locale: Intl.Locale): string | undefined {
        const translations = this.#translationData[locale.baseName]
            ?? this.#translationData[locale.language];
        return translations?.[id];
    }

    static #getTranslationKeys(directory: string, fileName: string): { [P in string]?: string } {
        const data = fs.readFileSync(path.join(directory, fileName), 'utf8');
        const json = JSON.parse(data);
        if (typeof json !== 'object' || json === null)
            return {};
        return Object.fromEntries([...this.#flattenJson([], json)]);
    }

    static * #flattenJson(keys: string[], json: object): Generator<[string, string]> {
        for (const [key, value] of Object.entries<string, unknown>(json)) {
            keys.push(key);
            switch (typeof value) {
                case 'string':
                    yield [keys.join('.'), value];
                    break;
                case 'object': if (value !== null)
                    yield* this.#flattenJson(keys, value);
                    break;
            }
            keys.pop();
        }
    }
}
