import { ThrowsAsync, ThrowIfNotImplementsData, Throws } from "../reflection/assert";
import { SetDefaultTimeout, PChan, pchan } from "./pChan";
import { SetTimeoutAsync } from "./promise";

// file.only
describe("pchan", () => {
    describe("throws", () => {
        it("throws on timeout", async () => {
            let test = pchan();

            await ThrowsAsync(async () => {
                await test.GetPromise();
            });
        });

        it("throws on double close", () => {
            let chan = pchan();
            chan.Close();
            Throws(() => {
                chan.Close();
            });
        });

        it("throws on sending on closed connection", () => {
            let chan = pchan();
            chan.Close();
            Throws(() => {
                chan.SendValue(1);
            });
            // Doesn't throw on sending an error, as an error on a closed connection is fine
            //  (and likely just sending the fact that a send failed, which makes sense, as the connection is closed).
            chan.SendError(1);
        });

        it("throws on getting on closed connection", async () => {
            let chan = pchan();
            chan.Close();
            await ThrowsAsync(async () => {
                await chan.GetPromise();
            });
        });
    });

    describe("misc", () => {
        it("SetDefaultTimeout", async () => {
            let chan!: PChan<number>;
            SetDefaultTimeout(undefined, () => {
                chan = pchan();
            });
            let p = chan.GetPromise();
            await SetTimeoutAsync(100);
            chan.SendValue(1);
            ThrowIfNotImplementsData(await p, 1);
        });
    });

    describe("send, receive", () => {
        it("handles buffered sends", async () => {
            let chan = pchan();
            chan.SendValue(1);
            chan.SendValue(2);
            ThrowIfNotImplementsData(await chan.GetPromise(), 1);
            ThrowIfNotImplementsData(await chan.GetPromise(), 2);
        });
        it("handles buffered gets", async () => {
            let chan = pchan();
            let p1 = chan.GetPromise();
            let p2 = chan.GetPromise();
            chan.SendValue(1);
            chan.SendValue(2);
            ThrowIfNotImplementsData(await p1, 1);
            ThrowIfNotImplementsData(await p2, 2);
        });

        it("handles sending errors", async () => {
            let chan = pchan();
            chan.SendError(1);
            chan.SendError(2);
            try {
                await chan.GetPromise();
                throw new Error(`Previous line should have thrown`);
            } catch(e) {
                ThrowIfNotImplementsData(e, 1);
            }
            try {
                await chan.GetPromise();
                throw new Error(`Previous line should have thrown`);
            } catch(e) {
                ThrowIfNotImplementsData(e, 2);
            }
        });

        it("handles sending errors buffered", async () => {
            let chan = pchan();
            let p1 = chan.GetPromise();
            let p2 = chan.GetPromise();
            chan.SendError(1);
            chan.SendError(2);
            try {
                await p1;
                throw new Error(`Previous line should have thrown`);
            } catch(e) {
                ThrowIfNotImplementsData(e, 1);
            }
            try {
                await p2;
                throw new Error(`Previous line should have thrown`);
            } catch(e) {
                ThrowIfNotImplementsData(e, 2);
            }
        });
    });

    describe("close", () => {
        it("IsClosed", () => {
            let x = pchan();
            x.Close();
            ThrowIfNotImplementsData(x.IsClosed(), true);
        });
        it("handles closing on gets", async () => {
            let chan = pchan();
            let p1 = chan.GetPromise();
            chan.Close();
            await ThrowsAsync(async () => {
                await p1;
            });
        });
    });
});