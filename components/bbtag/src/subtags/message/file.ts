import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.file;

@Subtag.id('file')
@Subtag.factory()
export class FileSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: ['file', 'filename'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [file, fileName]) => this.attachFile(ctx, fileName.value, file.value)
                }
            ]
        });
    }

    public attachFile(context: BBTagContext, fileName: string, fileContent: string): void {
        const data = fileContent.startsWith('buffer:')
            ? Buffer.from(fileContent.substring(7), 'base64')
            : fileContent;
        context.data.file = { file: data, name: fileName };
    }
}
