export class Deferred<T> {
    private value: { v: T }|{error: any}|undefined;

    private resolveInternal!: (value: T | PromiseLike<T>) => void;
    private rejectInternal!: (error: any) => void;
    private promise = new Promise<T>((resolve, reject) => {
        this.resolveInternal = resolve;
        this.rejectInternal = reject;
    });

    public Resolve(...values: T extends void ? [T?] : [T]): this {
        let value = values[0] as T;
        this.value = this.value || { v: value };
        this.resolveInternal(value);
        return this;
    }
    public Reject(error: any): this {
        this.value = this.value || { error: error };
        this.rejectInternal(error);
        return this;
    }

    /** Resolves it, using a new internal promise with a new value if this Deferred has previous been resolved or rejected. */
    public ForceResolve(...values: T extends void ? [(T | PromiseLike<T>)?] : [T | PromiseLike<T>]): this {
        let value = values[0] as T;
        if(this.value) {
            this.value = undefined;
            this.promise = new Promise<T>((resolve, reject) => {
                this.resolveInternal = resolve;
                this.rejectInternal = reject;
            });
        }
        return this.Resolve(value);
    }

    public Promise() {
        return this.promise;
    }

    public Value() {
        return this.value;
    }
}