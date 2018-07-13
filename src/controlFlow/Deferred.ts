export class Deferred<T> {
    private resolveInternal!: (value: T) => void;
    private rejectInternal!: (error: any) => void;
    private promise = new Promise((resolve, reject) => {
        this.resolveInternal = resolve;
        this.rejectInternal = reject;
    });

    public Resolve(value: T): this {
        this.resolveInternal(value);
        return this;
    }
    public Reject(error: any): this {
        this.rejectInternal(error);
        return this;
    }
    public Promise() {
        return this.promise;
    }
}