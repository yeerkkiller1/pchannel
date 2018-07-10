import { throws, ThrowIfNotImplementsData } from "./assert";

describe("types for testing", () => {
    describe("throwIfNotImplementsData", () => {
        it("can throw", () => {
            throws(() => {
                ThrowIfNotImplementsData({x: 5}, {x: 6});
            });
        });

        it("can throw when extra array element", () => {
            throws(() => {
                ThrowIfNotImplementsData([1], []);
            });
        });

        it("can throw when missing array element", () => {
            throws(() => {
                ThrowIfNotImplementsData([], [1]);
            });
        });

        it("can throw when array instead of object", () => {
            throws(() => {
                ThrowIfNotImplementsData([], {});
            });
        });
        it("can throw when object instead of array", () => {
            throws(() => {
                ThrowIfNotImplementsData({}, []);
            });
        });
    });
});