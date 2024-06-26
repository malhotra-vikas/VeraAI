chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "verifyText",
        title: "Verify by Vera",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "verifyText") {
        console.log("Context menu clicked, fetching selected text.");
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: getSelectedText
        }, (selection) => {
            if (chrome.runtime.lastError) {
                console.error("Error executing script: " + chrome.runtime.lastError.message);
            } else if (selection && selection[0] && selection[0].result) {
                console.log("Selected text: ", selection[0].result);
                chrome.storage.local.set({ selectedText: selection[0].result }, () => {
                    console.log("Selected text saved, opening popup.");
                    chrome.windows.create({
                        url: chrome.runtime.getURL("popup/popup.html"),
                        type: "popup",
                        width: 500,
                        height: 800
                    });
                });
            } else {
                console.error("No text selected or unable to fetch selected text.");
            }
        });
    }
});

function getSelectedText() {
    const selectedText = window.getSelection().toString();
    console.log("getSelectedText result: ", selectedText);
    return selectedText;
}
