import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class FileSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'file',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['file', 'filename'],
                    description: 'Sets the output attachment to the provided `file` and `filename`. If `file` starts with `buffer:`, the following text will be parsed as base64 to a raw buffer - useful for uploading images.',
                    exampleCode: '{file;Hello, world!;readme.txt}',
                    exampleOut: '(a file labeled readme.txt containing "Hello, world!")',
                    execute: (context, [{ value: fileContent }, { value: fileName }]) => {
                        context.state.file = { file: fileContent, name: fileName};
                        if (fileContent.startsWith('buffer:'))
                            context.state.file.file = Buffer.from(fileContent.substring(7), 'base64');
                    }
                }
            ]
        });
    }
}
