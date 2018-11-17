function isPromiseLike<T>(value: T | PromiseLike<T>): value is PromiseLike<T> {
    return typeof value === "object" && "then" in (value as any);
}

export class Deferred<T> {
    private value: { v: T }|{error: any}|undefined;
    private resolved = false;

    private resolveInternal!: (value: T | PromiseLike<T>) => void;
    private rejectInternal!: (error: any) => void;
    private promise = new Promise<T>((resolve, reject) => {
        this.resolveInternal = resolve;
        this.rejectInternal = reject;
    });

    constructor() {
        // Prevent uncaught promise rejection death
        this.promise.catch(() => {});
    }

    public Resolve = (...values: T extends void ? [(T | PromiseLike<T>)?] : [T | PromiseLike<T>]): this => {
        if(this.resolved) {
            return this;
        }
        this.resolved = true;
        let value = values[0];
        if(value === undefined) {
            value = value as T;
        }
        if(isPromiseLike(value)) {
            value.then(x => {
                this.value = { v: x };
            }, e => {
                this.value = { error: e };
            });
        } else {
            this.value = { v: value };
        }
        this.resolveInternal(value);
        return this;
    };
    public Reject(error: any): this {
        if(this.resolved) {
            return this;
        }
        this.resolved = true;
        this.value = { error: error };
        this.rejectInternal(error);
        return this;
    }

    /** Resolves it, using a new internal promise with a new value if this Deferred has previous been resolved or rejected. */
    public ForceResolve(...values: T extends void ? [(T | PromiseLike<T>)?] : [T | PromiseLike<T>]): this {
        let value = values[0];
        if(value === undefined) {
            value = value as T;
        }
        if(this.resolved) {
            this.resolved = false;
            this.value = undefined;
            this.promise = new Promise<T>((resolve, reject) => {
                this.resolveInternal = resolve;
                this.rejectInternal = reject;
            });
            // Prevent uncaught promise rejection death
            this.promise.catch(() => {});
        }
        // typescript 3.1.6 complains about this line, but it is definitely fine, AND internal to this code, so...
        return (this.Resolve as any)(value);
    }

    public Promise() {
        return this.promise;
    }

    public Value() {
        return this.value;
    }
}