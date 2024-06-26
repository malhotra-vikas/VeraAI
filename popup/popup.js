document.addEventListener('DOMContentLoaded', function () {
    console.log("Popup DOM content loaded.");

    // Retrieve the selected text from storage
    chrome.storage.local.get(['selectedText', 'url'], function (result) {
        const selectedText = result.selectedText || 'No text selected';
        const pageUrl = result.url || 'No URL available';

        console.log("Retrieved selected text from storage: ", selectedText);
        console.log("Retrieved URL from storage: ", pageUrl);

        // Example dynamic data (replace with your actual data source)
        const dynamicData = {
            url: pageUrl,
            accuracyScore: '82%',
            quote: selectedText,
            sources: [
                { url: 'https://www.marketwatch.com/investing/stock/djt', references: 14 },
                { url: 'https://www.axios.com/2024/04/09/trump-truth-social', references: 15 },
                { url: 'https://www.bloomberg.com/quote/DJT:US', references: 14 },
                { url: 'https://www.barrons.com/articles/djt-truth-social', references: 13 }
            ],
            summary: 'According to <strong>287</strong> verified sources, the stock price for DJT has moved only in the range of 4% in the past few days.'
        };

        // Populate the popup with dynamic data
        document.getElementById('url').innerText = dynamicData.url;
        document.getElementById('quote').innerText = dynamicData.quote;

        setTimeout(() => {

            document.getElementById('accuracy-score').innerText = dynamicData.accuracyScore;

            const sourceList = document.getElementById('source-list');
            dynamicData.sources.forEach(source => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = source.url;
                a.target = '_blank';
                a.innerText = source.url;
                li.appendChild(a);
                li.appendChild(document.createTextNode(` References found: ${source.references}`));
                sourceList.appendChild(li);
            });

            document.getElementById('summary').innerHTML = dynamicData.summary;
        }, 5000); // 15000 milliseconds delay        
    });
});