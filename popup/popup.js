console.debug("popup.js script loaded.");

// Replace with your OpenAI API key
const apiKey = ""; // Replace this is a Test Key

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
    //const summarizedQuote = await summarizeQuoteWithOpenAI(selectedText);

    // Call OpenAI to summarize the quote
    jsonData = await evaluateAccuracy(selectedText, dynamicData);
    let summary = jsonData.summary
    const sitesCheckedCount = jsonData.sitesChecked
    const sitesVerifiedCount = jsonData.sitesVerified
    const checkedSitesList = jsonData.checkedSites
    const verificationDetailsList = jsonData.verificationDetails
    const targetSiteCount = checkedSitesList.length

    let accuracyScore = (sitesVerifiedCount / sitesCheckedCount) * 100;

    if (sitesCheckedCount === 0) {
        accuracyScore = 0
    }

    // Rounding the accuracy score to the nearest whole number
    accuracyScore = Math.round(accuracyScore);

    // Format as percentage
    accuracyScore = accuracyScore + "%"

    console.debug("VERA accuracyScore : ", accuracyScore);

    // Populate the popup with dynamic data
    document.getElementById('accuracy-score').innerText = accuracyScore;
    document.getElementById('verified-count').innerText = targetSiteCount;

    let validationCount = 0

    const sourceList = document.getElementById('source-list');
    sourceList.innerHTML = ''; // Clear existing sources if any
    verificationDetailsList.forEach(detail => {
        const verifiedStatus = detail.verified
        if (verifiedStatus === "True") {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = detail.source;
            a.target = '_blank';
            a.innerText = detail.source;
            li.appendChild(a);
            li.appendChild(document.createTextNode(` Verfied: ${detail.verified}`));
            sourceList.appendChild(li);
            validationCount = validationCount + 1 
        }
    });

    summary = "According to <b>" + validationCount + " verified sources </b>." + summary

    document.getElementById('summary').innerHTML = summary;
}


async function evaluateAccuracy(quote) {

    try {

        // Load JSON data from the local extension directory
        const responseJSON = await fetch('../categoryDictionary.json');
        const categoryData = await responseJSON.json();


        // Extract all URLs from the JSON data
        const allowedSites = [];
        for (const category in categoryData) {
            for (const siteName in categoryData[category]) {
                allowedSites.push(categoryData[category][siteName].URL);
            }
        }
        
        
        // OpenAI API endpoint
        const url = 'https://api.openai.com/v1/chat/completions';

        let prompt = `Verify authenticity of this statement:\n\n${quote}\n\nInclude the count of sites where the information was verified as well as how many sites you checked. Only use these sites: ${allowedSites.join(', ')}`;

        console.debug("OpenAI API prompt: ", prompt);

        const body = JSON.stringify({
            model: "gpt-4o",
            messages: [
                {role: "system", content: "You are a helpful assistant that verifies information by citing multiple sources. You only return a JSON response"},
                { role: "user", content: `Verify authenticity of this statement:: Supreme Court appears to side with Biden admin in abortion case, according to draft briefly posted on website. Include the count of sites where the information was verified as well as how many sites you checked. Include the count of sites where the information was verified as well as how many sites you checked. ` },
                {role: "system", content: `{
        "checkedSites": [
            "site url",
            "site url",
            "site url",
            "site url"
        ],
        "verificationDetails": [
            {
                "source": "Politico",
                "verified": "True"
                "details": "Reports indicate that the Supreme Court seems poised to side with the Biden administration on a key abortion-related case concerning the Emergency Medical Treatment and Labor Act (EMTALA)."
            },
            {
                "source": "theSkimm",
                "verified": "False"
            },
            {
                "source": "NY1",
                "verified": "True"
                "details": "Highlighted that the Supreme Court appeared likely to support the Biden administration in this dispute."
            }
        ],
        "sitesChecked": 6,
        "sitesVerified": 4,
        "summary": "The Supreme Court appears to side with Biden admin in a key abortion case. Information verified across multiple credible sources."
    }`},
                { role: "user", content:  prompt}
            ],
            max_tokens: 1200
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
        let verifiedResponseData
        let jsonData
        console.debug("OpenAI API responseData: ", JSON.stringify(responseData, null, 2));

        if (responseData && responseData.choices) {
            verifiedResponseData = responseData.choices[0].message.content
            // Remove Markdown code block syntax to isolate the JSON string
            verifiedResponseData = verifiedResponseData.replace(/```json\n|\n```/g, '');

            console.debug("OpenAI API verifiedResponseData String: ", verifiedResponseData);

            jsonData = JSON.parse(verifiedResponseData);
        }

        if (jsonData) [
            console.debug("OpenAI API jsonData to process : ", JSON.stringify(jsonData, null, 2))
        ]

        return jsonData;

    } catch (error) {
        console.error("Error fetching OpenAI API response:", error);
        return 'Error summarizing the text.';
    }
}