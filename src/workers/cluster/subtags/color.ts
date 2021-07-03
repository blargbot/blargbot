// import { Cluster } from '../cluster';
// import { BaseSubtag, BBTagContext, SubtagCall } from '../core/bbtag';
// import { SubtagType, bbtagUtil } from '../utils';
// import Color from 'color';
// const getArray = bbtagUtil.tagArray.getArray;

// type InputFormat = 'hsl' | 'rgb' | 'hsv' | 'hwb' | 'cmyk' | 'xyz' | 'lab' | 'lch' | 'hex' | 'keyword' | 'ansi16' | 'ansi256' | 'hcg' | 'apple' | 'gray' | undefined;

// export class ColorSubtag extends BaseSubtag {
//     public constructor(
//         cluster: Cluster
//     ) {
//         super(cluster, {
//             name: 'color',
//             category: SubtagType.COMPLEX,
//             desc: 'If `inputFormat` is omitted or left empty, the format of `color` is automatically calculated, but might be innaccurate. For accuracy and known `color` formats use `inputFormat`. It converts all ways between `rgb`, `hsl`, `hsv`, `hwb`, `cmyk`, `ansi16`, `hex` strings, and CSS `keyword`s (will round to closest).',
//             definition: [
//                 {
//                     parameters: ['color', 'outputFormat?:hex'],
//                     description: 'Converts a color to `outputFormat`.',
//                     exampleCode: '{color;#4286f4;RGB}',
//                     exampleOut: '[66,134,244]',
//                     execute: (ctx, args, subtag) => this.parseColor(ctx, args[0].value, args[1].value, undefined, subtag)
//                 },
//                 {
//                     parameters: ['color', 'outputFormat:hex', 'inputFormat'],
//                     description: 'Converts a color of `inputFormat` to `outputFormat`. If `inputFormat` is left empty, it will be automatically calculated.',
//                     exampleCode: '{color;[66,134,244];hex;RGB}',
//                     exampleOut: '#4286f4',
//                     execute: (ctx, args, subtag) => this.parseColor(ctx, args[0].value, args[1].value, args[2].value as InputFormat, subtag)
//                 }
//             ]
//         });
//     }

//     public async parseColor(
//         context: BBTagContext,
//         colorStr: string,
//         outputFormat: string, //TODO format checking
//         inputFormat: InputFormat,//TODO idem
//         subtag: SubtagCall
//     ): Promise<string> {
//         if (!colorStr) return '`Invalid color`'; //TODO Would be better to use this.customError to add it to debug.

//         const arr = await getArray(context, subtag, colorStr);
//         let input: string | string[];
//         if (!arr || !Array.isArray(arr.v)) {
//             input = colorStr;
//         } else {
//             input = arr.v.map(elem => elem?.toString()).join(',');
//         }
//         let parsedInput;
//         if (typeof input === 'string') {
//             const match = /^\(?(\d{1,3}),(\d{1,3}),(\d{1,3})\)?$/.exec(input);
//             if (match !== null) {
//                 const r = parseInt(match[1]);
//                 const g = parseInt(match[2]);
//                 const b = parseInt(match[3]);
//                 parsedInput = [r, g, b];
//             } else if (inputFormat && inputFormat.toLowerCase() === 'hsl') {
//                 input = input.split(',');
//                 parsedInput = [];
//                 for (let i = 0; i < input.length; i++) {
//                     parsedInput.push(input[i]);
//                 }
//             } else parsedInput = input;
//         } else {
//             parsedInput = input;
//         }

//         const method = outputFormat.toLowerCase();
//         let color: Color | undefined;
//         try {
//             color = Color(parsedInput, (inputFormat || undefined));
//         } catch (e) {
//             try {
//                 color = Color(`#${parsedInput}`, (inputFormat || undefined));
//             } catch (e) {
//                 if (e.toString().includes('Unknown model')) {
//                     return '`Invalid input method`';
//                 }
//             }
//         }

//         if (typeof color === 'undefined') return '`Invalid color`';
//         if (typeof color[method] !== 'function') return '`Invalid output method`';

//         let converted = color[method]();

//         if (typeof converted === 'object') {
//             if (converted.model === 'rgb' && typeof converted.color !== 'undefined') {
//                 for (const i in converted.color) {
//                     converted.color[i] = parseInt(converted.color[i]);
//                 }
//             }

//             if (typeof converted.color === 'object') {
//                 return JSON.stringify(converted.color);
//             } else {
//                 if (converted.color.indexOf('#') === 0) converted.color = converted.color.replace('#', '');
//                 return converted.color;
//             }
//         } else {
//             if (converted.indexOf('#') === 0) converted = converted.replace('#', '');
//             return converted;
//         }
//     }
// }
// // module.exports =
// // 	Builder.AutoTag('color')
// // 		.withArgs(a => [a.required('color'), a.optional('outputFormat'), a.optional('inputFormat')])
// // 		.withDesc('Convert colors. Default outputFormat is `hex`. Default inputFormat is automatically calculated, but might be inaccurate.\nIt converts all ways between `rgb`, `hsl`, `hsv`, `hwb`, `cmyk`, `ansi16`, `hex` strings, and CSS `keyword`s (will round to closest).')
// // 		.withExample(
// // 			'{color;#4286f4;RGB}',
// // 			'[66,134,244]'
// // 		)
// // 		.whenArgs('0', Builder.errors.notEnoughArguments)
// // 		.whenArgs('1-3', async function (subtag, context, args) {
// // 			if (!args[0]) return '`Invalid color`';

// // 			let arr = await bu.getArray(context, args[0]);
// // 			let input = undefined;

// // 			if (arr === null || !Array.isArray(arr.v)) input = args[0];
// // 			else {
// // 				input = arr.v;
// // 				input = input.map(elem => elem.toString()).join(',');
// // 			}

// // 			if (typeof input === 'string') {
// // 				let match = input.match(/^\(?(\d{1,3}),(\d{1,3}),(\d{1,3})\)?$/);
// // 				if (match !== null) {
// // 					let r = parseInt(match[1]);
// // 					let g = parseInt(match[2]);
// // 					let b = parseInt(match[3]);
// // 					input = [r, g, b];
// // 				} else if (args[2] && args[2].toLowerCase() === 'hsl') {
// // 					input = input.split(',');
// // 					for (let i in input) {
// // 						input[i] = parseFloat(input[i]);
// // 					}
// // 				}
// // 			}

// // 			let method = undefined;
// // 			if (typeof args[1] === 'undefined' || !args[1]) method = 'hex';
// // 			else method = args[1].toLowerCase();

// // 			let color = undefined;
// // 			try {
// // 				color = Color(input, (args[2] || ''));
// // 			} catch (e) {
// // 				try {
// // 					color = Color('#' + input, (args[2] || ''));
// // 				} catch (e) {
// // 					if (e.toString().includes('Unknown model')) {
// // 						return '`Invalid input method`';
// // 					}
// // 				}
// // 			}

// // 			if (typeof color === 'undefined') return '`Invalid color`';
// // 			if (typeof color[method] !== 'function') return '`Invalid output method`';

// // 			let converted = color[method]();

// // 			if (typeof converted === 'object') {
// // 				if (converted.model === 'rgb' && typeof converted.color !== 'undefined') {
// // 					for (let i in converted.color) {
// // 						converted.color[i] = parseInt(converted.color[i]);
// // 					}
// // 				}

// // 				if (typeof converted.color === 'object') {
// // 					return JSON.stringify(converted.color);
// // 				} else {
// // 					if (converted.color.indexOf('#') === 0) converted.color = converted.color.replace('#', '');
// // 					return converted.color;
// // 				}
// // 			} else {
// // 				if (converted.indexOf('#') === 0) converted = converted.replace('#', '');
// // 				return converted;
// // 			}
// // 		}).whenDefault(Builder.errors.tooManyArguments)
// // 		.build();
