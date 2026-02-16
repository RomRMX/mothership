// Minimal Type definition for Photoshop API
declare const require: any;

export const batchPlay = async (descriptors: any[], options: any = {}) => {
    try {
        const ps = require("photoshop");
        return await ps.action.batchPlay(descriptors, {
            synchronousExecution: false,
            modalBehavior: "execute",
            ...options
        });
    } catch (e) {
        console.error("BatchPlay Error (or not in PS environment):", e);
        return null;
    }
};

// Start a modal state (suspending history)
export const executeAsModal = async (targetFunction: () => Promise<void>, commandName: string) => {
    try {
        const ps = require("photoshop");
        await ps.core.executeAsModal(targetFunction, { commandName });
    } catch (e) {
        console.error("ExecuteAsModal Error:", e);
        // Fallback for non-PS environment testing
        await targetFunction();
    }
};
