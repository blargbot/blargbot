export module 'brainfuck-node' {
    export default class Brainfuck {
        public execute(code: string, input: string): Result;
    }

    interface Result {
        readonly output: string;
        readonly memory: Memory;
        readonly steps: number;
        readonly time: number;
    }

    interface Memory {
        current: number;
        readonly base: number;
        readonly pointer: number;
        readonly list: readonly number[];
        readonly currentChar: string;
        incrementPointer(value?: number): void;
        decrementPointer(value?: number): void;
        increment(): void;
        decrement(): void;
    }
}
