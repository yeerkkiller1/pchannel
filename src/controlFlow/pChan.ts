import { g } from "../reflection/misc";

export function SetDefaultTimeout(timeout: number|undefined, code: () => void) {
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

    public GetPromise(): Promise<T> {
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
                if(!this.closed && this.promiseErrorTimeout !== undefined) {
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

            // Okay... MDN says about Promise.resolve (which appears to apply to just calling resolve inside a promise):
            /*
                Returns a Promise object that is resolved with the given value. If the value is a thenable (i.e. has a then method),
                    the returned promise will "follow" that thenable, adopting its eventual state; otherwise the returned promise
                    will be fulfilled with the value. 
            */
            // Which means the lib.es5.d.ts spec for Promise.then is actually incorrect. It should be manipulating the result if
            //  it is thenable, and following it (which is actually possible now). However... I can't change that, and while I SHOULD
            //  create a type to correctly map my input T to my outputs, that is too much work for now. So... I'll just at least not
            //  FORCE the returned promise to have T equal to a Promise, and it will work for now.
            return promise as Promise<T>;
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