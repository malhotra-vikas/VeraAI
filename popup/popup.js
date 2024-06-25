document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get(['selectedText'], function(result) {
        const selectedTextElement = document.getElementById('selected-text');
        selectedTextElement.innerText = result.selectedText || 'No text selected';

        if (!result.selectedText) {
            document.getElementById('verify-button').disabled = true;
        }
    });

    document.getElementById('verify-button').addEventListener('click', function() {
        // Mock verification process
        document.getElementById('verification-results').style.display = 'block';
        document.getElementById('accuracy-score').innerText = '82%';
        document.getElementById('verified-quote').innerText = '“Trump Media stock completely untethered to fundamental value”';
        
        const sources = [
            { url: 'https://www.marketwatch.com/investing/stock/djt', references: 14 },
            { url: 'https://www.axios.com/2024/04/09/trump-truth-social', references: 15 },
            { url: 'https://www.bloomberg.com/quote/DJT:US', references: 14 },
            { url: 'https://www.barrons.com/articles/djt-truth-social', references: 13 }
        ];
        
        const sourceList = document.getElementById('source-list');
        sourceList.innerHTML = '';
        sources.forEach(source => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = source.url;
            a.target = '_blank';
            a.innerText = source.url;
            li.appendChild(a);
            li.appendChild(document.createTextNode(` References found: ${source.references}`));
            sourceList.appendChild(li);
        });
        
        document.getElementById('summary').innerHTML = 'According to <strong>287</strong> verified sources, the stock price for DJT has moved only in the range of 4% in the past few days.';
    });
});
