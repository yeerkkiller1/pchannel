import { throwsAsync, ThrowIfNotImplementsData, throws } from "../reflection/assert";
import { pchan } from "../p-chan";
import { SetDefaultTimeout, PChan } from "./pChan";
import { SetTimeoutAsync } from "./promise";

describe("pchan", () => {
    describe("throws", () => {
        it("throws on timeout", async () => {
            let test = pchan();

            await throwsAsync(async () => {
                await test.GetPromise();
            });
        });

        it("throws on double close", () => {
            let chan = pchan();
            chan.Close();
            throws(() => {
                chan.Close();
            });
        });

        it("throws on sending on closed connection", () => {
            let chan = pchan();
            chan.Close();
            throws(() => {
                chan.SendValue(1);
            });
            throws(() => {
                chan.SendError(1);
            });
        });

        it("throws on getting on closed connection", async () => {
            let chan = pchan();
            chan.Close();
            await throwsAsync(async () => {
                await chan.GetPromise();
            });
        });
    });

    describe("misc", () => {
        it("SetDefaultTimeout", async () => {
            let chan!: PChan<number>;
            SetDefaultTimeout(10000, () => {
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
            await throwsAsync(async () => {
                await p1;
            });
        });
        it("handles closing and sending", () => {
            let chan = pchan();
            chan.SendValue
        });
        it("handles closing and erroring", () => {
            let chan = pchan();
            chan.SendValue
        });
    });
});