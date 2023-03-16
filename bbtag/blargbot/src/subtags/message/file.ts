import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.file;

@Subtag.id('file')
@Subtag.ctorArgs()
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

    public attachFile(context: BBTagScript, fileName: string, fileContent: string): void {
        const data = fileContent.startsWith('buffer:')
            ? fileContent.substring(7)
            : Buffer.from(fileContent).toString('base64');
        context.runtime.outputOptions.file = { file: data, name: fileName };
    }
}
