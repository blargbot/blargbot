import { emptyResultAdapter, Subtag } from '@bbtag/subtag';

export class LangSubtag extends Subtag {
    public constructor() {
        super({
            name: 'lang',
            deprecated: true
        });
    }

    @Subtag.signature({ id: 'default' })
        .convertResultUsing(emptyResultAdapter)
    public godIHateThisSubtag(): void {
        /* NOOP */
    }
}
