# Workers, how do they work?

The IPC in blargbot is all centered around 2 classes: [BaseWorker](./BaseWorker.ts) and [WorkerConnection](./WorkerConnection.ts).

`WorkerConnection` is created on the parent process side and is what spawns the worker. The worker is expected to then construct an instance of `BaseWorker` and call the `start()` method in order to signal to the `WorkerConnection` that the worker started successfully through the use of a `ready` message.

A [WorkerPool](./WorkerPool.ts) manages a collection of `WorkerConnection`s on the parent side and can be used to gracefully restart workers if they begin to misbehave.

---

## Creating a new worker
The process for setting up a parent/worker relationship is as follows

1. Create worker specific implementations of:
    - `BaseWorker`: Override the `start()` method to do any setup the worker needs before calling `super.start()`
        <details>
            <summary>Example BaseWorker implementation</summary>

        ```ts
        export class MyWorker extends BaseWorker {
            public async start(): Promise<void> {
                await Promise.All([
                    setupService1(),
                    setupService2(),
                    setupService3()
                ]);
                await super.start();
            }
        }
        ```
        </details>
    
    - `WorkerConnection`: Pass in the name of the [entrypoint](/src/entrypoints) we will create later to the constructor
        <details>
            <summary>Example WorkerConnection implementation</summary>

        ```ts
        export class MyConnection extends WorkerConnection {
            public constructor(id: number, logger: Logger) {
                super(id, 'myWorker', logger);
            }
        }
        ```
        </details>

    - `WorkerPool`: Implement the abstract `createWorker(id: number)` method to return an instance of our new `WorkerConnection` class
        <details>
            <summary>Example WorkerPool implementation</summary>

        ```ts
        export class MyWorkerPool extends WorkerPool<MyConnection> {
            public constructor(logger: Logger) {
                super(
                    'Test process', /* a name, just used for logging */
                    10, /* number of workers */
                    60000, /* how long to allow each worker to start up */
                    logger
                );
            }

            protected createWorker(id: number): MyConnection {
                return new MyConnection(id, this.logger);
            }
        }
        ```
        </details>
    
1. Create an [entrypoint](/src/entrypoints) file which creates a new instance of the workers implementation of `BaseWorker` and calls the `start()` method. 
    <details>
        <summary>Example entrypoint file</summary>

    ```ts
    // src/entrypoints/myWorker.ts
    function handleTick(data: string, id: snowflake, reply: (data: string) => void): void {
        reply(`tock! ${data}`);
    }

    const worker = new MyWorker();
    worker.on('tick', handleTick);
    await worker.start();

    ```
    </details>

1. From the parent process, create a new instance of the workers implementation of `WorkerPool` and call `spawnAll()`
    <details>
        <summary>Example spawning of all the workers</summary>

    ```ts
    const workers = new MyWorkerPool(logger);
    await workers.spawnAll();
    ```
    </details>

1. Attach to the `on('spawningworker')` and `on('killingworker')` events of the `WorkerPool` on the parent process. These events give you the `WorkerConnection` that is being spawned or killed so you can attach and detach from any events that the worker raises
    <details>
        <summary>Example of subscribing events to worker connections</summary>

    ```ts
    function handlePing(worker: MyConnection, data: string, id: snowflake, reply: (data: string) => void): void {
        reply(`${data} back at you, worker ${worker.id}!`);
    }

    workers.on('spawningworker', worker => worker.on('ping', handlePing));
    workers.on('killingworker', worker => worker.off('ping', handlePing));
    ```
    </details>

1. And youre done! Now you can use the `send()` or `request()` methods on either the `WorkerConnection` or `BaseWorker` implementations to send messages between the parent and worker.
    <details>
        <summary>Example of sending requests</summary>

    ```ts
    /***** on the worker *****/
    // This will be handled by the handlePing method in the master example above.
    // value will be 'Hello! back at you, worker 0' if this is worker 0
    const response: string = await worker.request<string, string>('ping', 'Hello!');

    /***** on the master *****/
    // This will be handled by the worker 
    // value will be 'tock! 5'
    const response: string = await workers.get(0).request<number, string>('tick', 5);
    ```
    </details>

Managing attaching and detaching from the worker events whenever `'spawningworker'` or `'killingworker'` is raised on the `WorkerPool` can be a bit of a pain. You can instead create an instance of a [WorkerPoolEventService](/src/core/serviceTypes/WorkerPoolEventService.ts) in order to handle the attaching and detaching for you, meaning you just need to focus on how to handle the specific event you attach to. Call the `start()` method on `WorkerPoolEventService` to subscribe to the events, and `stop()` to unsubscribe!