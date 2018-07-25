export class Deferred<T> {
    private value: { v: T }|{error: any}|undefined;

    private resolveInternal!: (value: T) => void;
    private rejectInternal!: (error: any) => void;
    private promise = new Promise<T>((resolve, reject) => {
        this.resolveInternal = resolve;
        this.rejectInternal = reject;
    });

    public Resolve(value: T): this {
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
    public ForceResolve(value: T): this {
        if(this.value) {
            let blank = new Deferred<T>();
            for(let key in Object.keys(blank)) {
                (this as any)[key] = (blank as any)[key];
            }
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