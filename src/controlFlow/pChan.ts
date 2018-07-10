import { g } from "../reflection/misc";

export function SetDefaultTimeout(timeout: number, code: () => void) {
    let prevTimeout = g.PROMISE_defaultTimeout;
    g.PROMISE_defaultTimeout = timeout;
    try {
        code();
    } finally {
        g.PROMISE_defaultTimeout = prevTimeout;
    }
}

/** An alias for new PChan. Lowercase so it is super short and easy to type, so I can use it everywhere. */
export function pchan<T>(promiseErrorTimeout: number = g.PROMISE_defaultTimeout) {
    return new PChan<T>(promiseErrorTimeout);
}

export class PChan<T> {
    constructor (
        /** -1 means infinite */
        private promiseErrorTimeout: number = g.PROMISE_defaultTimeout
    ) { }

    private closed = false;

    // With synchronous handling only one of these lists will have values at once (or none).
    //  BUT, if we added artificial latency, (to simulate a network connection), both lists COULD have values.

    private sentValues: ({ value: (T | PromiseLike<T>) } | { error: any })[] = [];
    private getValues: {
        resolve: (val: T | PromiseLike<T>) => void;
        reject: (err: any) => void;
    }[] = [];

    public SendValue(value: T | PromiseLike<T>) {
        if(this.closed) {
            throw new Error(`Tried to send on closed connection`);
        }
        let getObj = this.getValues.shift();
        if(getObj) {
            getObj.resolve(value);
        } else {
            this.sentValues.push({ value });
        }
    }
    public SendError(error: any) {
        if(this.closed) {
            throw new Error(`Tried to send error on closed connection`);
        }
        let getObj = this.getValues.shift();
        if(getObj) {
            getObj.reject(error);
        } else {
            this.sentValues.push({ error });
        }
    }

    public GetPromise(): Promise<T | PromiseLike<T>> {
        let sentObj = this.sentValues.shift();
        if(sentObj) {
            if("value" in sentObj) {
                return Promise.resolve(sentObj.value);
            } else {
                return Promise.reject(sentObj.error);
            }
        } else {
            let promise = new Promise<T | PromiseLike<T>>((resolve, reject) => {
                let resolved = false;
                let errorTimeout: NodeJS.Timer|undefined = undefined;
                if(!this.closed && this.promiseErrorTimeout !== -1) {
                    errorTimeout = setTimeout(() => {
                        resolved = true;
                        for(let i = 0; i < this.getValues.length; i++) {
                            let getObj = this.getValues[i];
                            if(getObj.resolve === resolveRedirect) {
                                this.getValues.splice(i, 1);
                                break;
                            }
                        }
                        reject(`PChan promise requested timed out, timeout is ${this.promiseErrorTimeout}ms.`);
                    }, this.promiseErrorTimeout);
                }

                let resolveRedirect = (val: T | PromiseLike<T>) => {
                    if(errorTimeout !== undefined) {
                        clearTimeout(errorTimeout);
                    }
                    if(resolved) {
                        // exclude coverage
                        throw new Error(`Impossible, double resolve, this should be prevented internally`);
                    }
                    resolved = true;
                    resolve(val);
                };

                this.getValues.push({ resolve: resolveRedirect, reject });
            });

            if(this.closed) {
                this.errorOutOnClosed();
            }

            return promise;
        }
    }

    public IsClosed(): boolean {
        return this.closed;
    }
    public Close() {
        if(this.closed) {
            throw new Error(`Tried to close already closed PChan.`);
        }
        this.closed = true;

        this.errorOutOnClosed();
    }
    private errorOutOnClosed() {
        this.sentValues = [];
        // Error out all getValues
        while(true) {
            let getObj = this.getValues.shift();
            if(!getObj) break;
            getObj.reject(new Error(`PChan closed`));
        }
    }
}