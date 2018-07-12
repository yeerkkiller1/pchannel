import { pchan } from "./pChan";

/** Creates a channel that transforms the input, to the output, by calling the tranform function, but only in serial.
 *      I guess this is more like a real channel? Or it could be called a two way channel?
 */
export function TransformChannel<Input, Output>(
    transform: (input: Input) => Promise<Output>,
    afterClose?: () => void,
): ((input: Input) => Promise<Output>) & {
    Close(): void;
} {
    let inputChan = pchan<Input>();
    let outputChan = pchan<Output>();

    (async () => {
        while(!inputChan.IsClosed() || inputChan.HasValues()) {
            let input;
            try {
                input = await inputChan.GetPromise();
                let output = await transform(input);
                outputChan.SendValue(output);
            } catch (e) {
                outputChan.SendError(e);
            }
        }

        outputChan.Close();

        if(afterClose) {
            afterClose();
        }
    })();

    let acceptInput = (input: Input): Promise<Output> => {
        inputChan.SendValue(input);
        return outputChan.GetPromise();
    };

    return Object.assign(acceptInput, {
        Close() {
            inputChan.Close();
        }
    });
}