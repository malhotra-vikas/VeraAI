console.debug("popup.js script loaded.");

document.addEventListener('DOMContentLoaded', function () {
    console.log("Popup DOM content loaded.");

    // Retrieve the selected text from storage
    chrome.storage.local.get(['selectedText', 'url'], async function (result) {
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

        // Call the function to update the popup with dynamic data
        updateDynamicData(dynamicData, selectedText);
    });
});

async function updateDynamicData(dynamicData, selectedText) {
    // Call OpenAI to summarize the quote
    const summarizedQuote = await summarizeQuoteWithOpenAI(selectedText);

    // Populate the popup with dynamic data
    document.getElementById('accuracy-score').innerText = '32%';

    const sourceList = document.getElementById('source-list');
    sourceList.innerHTML = ''; // Clear existing sources if any
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

    document.getElementById('summary').innerHTML = summarizedQuote;
}


async function summarizeQuoteWithOpenAI(quote) {
    try {
        // Replace with your OpenAI API key
        const apiKey = "SOME KEY"; // Replace this is a Test Key

        // OpenAI API endpoint
        const url = 'https://api.openai.com/v1/chat/completions';

        // Request payload
        const data = {
            prompt: `Summarize the following text:\n\n${quote}\n`,
            max_tokens: 100
        };
    
        const body = JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: `Summarize the following text:\n\n${quote}` }
            ],
            max_tokens: 200
        });
        
        console.debug("OpenAI API Body: ", JSON.stringify(body, null, 2));

        // Request headers
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };
        console.debug("OpenAI API Header: ", JSON.stringify(headers, null, 2));

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const responseData = await response.json();

        console.debug("OpenAI API response: ", JSON.stringify(responseData, null, 2));
        return responseData.choices[0].message.content;

    } catch (error) {
        console.error("Error fetching OpenAI API response:", error);
        return 'Error summarizing the text.';
    }
}
