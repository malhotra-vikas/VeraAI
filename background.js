chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "verifyText",
        title: "Verify by Vera",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "verifyText") {
        chrome.windows.create({
            url: chrome.runtime.getURL("popup/popup.html"),
            type: "popup",
            width: 300,
            height: 400
        });
    }
});
