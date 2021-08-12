import { Logger } from '@core/Logger';
import { mapping } from '@core/utils';
import { BaseImageGenerator } from '@image/BaseImageGenerator';
import { ImageResult, PCCheckOptions } from '@image/types';

export class PCCheckGenerator extends BaseImageGenerator<'pcCheck'> {
    public constructor(logger: Logger) {
        super('pcCheck', logger, mapOptions);
    }

    public async executeCore({ text }: PCCheckOptions): Promise<ImageResult> {
        const container: Array<{ italic: boolean; text: string; }> = [];
        let italic = false;
        let temp = '';
        for (const t of text) {
            if (t === '*') {
                container.push({ italic, text: temp });
                temp = '';
                italic = !italic;
            } else
                temp += t;
        }
        container.push({ italic, text: temp });

        return {
            fileName: 'pccheck.png',
            data: await this.renderPhantom('pccheck.html', {
                scale: 2,
                transformArg: container,
                format: 'PNG',
                transform(m: typeof container) {
                    const thing = document.getElementById('replace1');
                    if (thing !== null) {
                        // This is run in phantom which might not support for-of
                        // eslint-disable-next-line @typescript-eslint/prefer-for-of
                        for (let i = 0; i < m.length; i++) {
                            const el = document.createElement(m[i].italic ? 'em' : 'span');
                            el.innerText = m[i].text;
                            thing.appendChild(el);
                        }
                    }
                }
            })
        };
    }
}

const mapOptions = mapping.mapObject<PCCheckOptions>({
    text: mapping.mapString
});
