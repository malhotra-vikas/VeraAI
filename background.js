chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "verifyText",
        title: "Verify by Vera",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "verifyText") {
        console.log("Context menu clicked, fetching selected text and URL.");
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: getSelectedTextAndUrl
        }, (results) => {
            if (chrome.runtime.lastError) {
                console.error("Error executing script: " + chrome.runtime.lastError.message);
            } else if (results && results[0] && results[0].result) {
                const { selectedText, url } = results[0].result;
                console.log("Selected text: ", selectedText);
                console.log("Page URL: ", url);
                chrome.storage.local.set({ selectedText, url }, () => {
                    console.log("Selected text and URL saved, opening popup.");
                    chrome.windows.create({
                        url: chrome.runtime.getURL("popup/popup.html"),
                        type: "popup",
                        width: 700,
                        height: 500
                    });
                });
            } else {
                console.error("No text selected or unable to fetch selected text and URL.");
            }
        });
    }
});

function getSelectedTextAndUrl() {
    const selectedText = window.getSelection().toString();
    const url = window.location.href;
    console.log("getSelectedText result: ", selectedText);
    console.log("getUrl result: ", url);
    return { selectedText, url };
}
