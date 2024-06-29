// Replace with your OpenAI API key
const openai_apiKey = "sk-proj-fb5UrDsbSTDfQkYqRbrwT3BlbkFJFCxfPpdQAka4rhyvlDB8"; // Replace this is a Test Key
const stripePaymentLink = "https://buy.stripe.com/test_bIY8zKcwI8Qb8c8eUU"
const apiGatewayUrl = "https://z2867xo68i.execute-api.us-east-2.amazonaws.com/default/StoreVeraUsers"

document.addEventListener('DOMContentLoaded', function () {
    // Authenticate the user with Google
    authenticateUser();
});

document.getElementById('payButton').addEventListener('click', () => {
    const paymentLink = stripePaymentLink
    chrome.tabs.create({ url: paymentLink });
});

function storeUserEmail(email) {
    console.log('Calling Lambda with :', email);

    fetch(apiGatewayUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email, timestamp: new Date().toISOString(), subscription_status: "New User"})
    })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function authenticateUser() {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
        const authStatusElement = document.getElementById('auth-status');
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
        } else {
            // Retrieve the user's profile information
            getUserInfo();
        }
    });
}

async function checkUserSubscription(email) {
    try {
        const response = await fetch(`${apiGatewayUrl}?email=${email}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log("Full response is", response);

        const data = await response.json();
        console.log("Parsed data is", data);

        if (data) {
            // User exists.
            if (data.subscription_status !== 'active') {
                // Redirect to Stripe payment link
                const paymentLink = stripePaymentLink;
                chrome.tabs.create({ url: paymentLink });
            } else {
                console.log('Subscription is active');
            }
        } else {
            // User does not exist, create user
            storeUserEmail(email);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function getUserInfo() {
    chrome.identity.getAuthToken({ interactive: false }, function (token) {
        if (chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError);
            return;
        }

        // Construct the API request
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json');
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.onload = function () {
            if (xhr.status === 200) {
                // Parse the user info JSON
                const userInfo = JSON.parse(xhr.responseText);
                const emailElement = document.getElementById('user-email');
                if (userInfo.email) {
                    console.log('email:', userInfo.email);
                    emailElement.textContent = `${userInfo.email}`;
                    checkUserSubscription(userInfo.email);
                } else {
                    emailElement.textContent = 'Email not available';
                }
            } else {
                console.error(`Failed to fetch user info: ${xhr.statusText}`);
            }
        };

        xhr.onerror = function () {
            console.error('Network error');
        };

        xhr.send();
    });

    initializePopupContent()
}

function initializePopupContent() {
    // Retrieve the selected text from storage
    chrome.storage.local.get(['selectedText', 'url'], async function (result) {
        const selectedText = result.selectedText || 'No text selected';
        const pageUrl = result.url || 'No URL available';

        // Populate the popup with dynamic data
        document.getElementById('url').innerText = pageUrl;
        document.getElementById('quote').innerText = selectedText;

        // Call the function to update the popup with dynamic data
        updateDynamicData(selectedText);
    });
}

async function updateDynamicData(selectedText) {
    // Call OpenAI to summarize the quote
    //const summarizedQuote = await summarizeQuoteWithOpenAI(selectedText);

    matchedCategory = await evaluateCategory(selectedText);

    // Pick the sites from the matched category. Else look up on all
    // Load JSON data from the local extension directory
    const responseJSON = await fetch('../categoryDictionary.json');
    const categoryData = await responseJSON.json();


    // Extract all URLs from the JSON data
    const allowedSites = [];
    let matchedAtLeastOneCategory = false
    for (const category in categoryData) {
        if (category === matchedCategory) {
            for (const siteName in categoryData[category]) {
                allowedSites.push(categoryData[category][siteName].URL);
            }
            matchedAtLeastOneCategory = true
        }
    }

    if (matchedAtLeastOneCategory === false) {
        for (const category in categoryData) {
            for (const siteName in categoryData[category]) {
                allowedSites.push(categoryData[category][siteName].URL);
            }
        }
    }

    // Call OpenAI to summarize the quote
    jsonData = await evaluateAccuracy(selectedText, allowedSites);

    console.log("The jsonData for populating dynamic content = ", jsonData)
    let summary = jsonData.summary
    let sitesCheckedCount = jsonData.sitesChecked
    let sitesVerifiedCount = jsonData.sitesVerified
    //const checkedSitesList = jsonData.checkedSites
    const verificationDetailsList = jsonData.verificationDetails
    const targetSiteCount = verificationDetailsList.length

    document.getElementById('verified-count').innerText = targetSiteCount;

    let validationCount = 0
    sitesVerifiedCount = 0
    sitesCheckedCount = verificationDetailsList.length

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
            sitesVerifiedCount = sitesVerifiedCount + 1
        }
    });

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

    // Update the CSS to show the circle color based on the Score
    var scoreElement = document.getElementById('accuracy-score');
    var score = parseInt(accuracyScore); // Get the score as an integer
    var scoreCircleCSS = scoreElement.parentNode; // This is the .score-circle div
    if (score >= 80) {
        scoreCircleCSS.style.borderColor = '#4caf50'; // Green for scores 80 and above
    } else if (score >= 50) {
        scoreCircleCSS.style.borderColor = '#ffeb3b'; // Yellow for scores 50 to 79
    } else {
        scoreCircleCSS.style.borderColor = '#f44336'; // Red for scores below 50
    }


    summary = "According to <b>" + validationCount + " verified sources </b>." + summary

    document.getElementById('summary').innerHTML = summary;
}

async function evaluateCategory(quote) {
    // Load JSON data from the local extension directory
    const responseJSON = await fetch('../categoryDictionary.json');
    const categoryData = await responseJSON.json();

    console.log("Eval categoryData ", categoryData)

    // Extract all URLs from the JSON data
    const allowedSites = [];
    const allCategories = [];
    for (const category in categoryData) {
        allCategories.push(category);
    }
    console.log("Eval allCategories ", allCategories)

    try {
        // OpenAI API endpoint
        const url = 'https://api.openai.com/v1/chat/completions';

        let prompt = `What is the category of this statemnent:\n\n${quote}\n\nPick one Category from among these categories: ${allCategories.join(', ')}. Only return the name of the Category`;

        console.debug("OpenAI API prompt: ", prompt);

        const body = JSON.stringify({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a helpful assistant that can find the right category that and text belong to" },
                { role: "user", content: prompt }
            ],
            max_tokens: 3500
        });

        console.debug("OpenAI API Body: ", JSON.stringify(body, null, 2));

        // Request headers
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openai_apiKey}`
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        let matchedCategory
        console.debug("OpenAI API responseData: ", JSON.stringify(responseData, null, 2));

        if (responseData && responseData.choices) {
            matchedCategory = responseData.choices[0].message.content
            // Remove Markdown code block syntax to isolate the JSON string
            matchedCategory = matchedCategory.replace(/```json\n|\n```/g, '');

            console.debug("OpenAI API verifiedResponseData String: ", matchedCategory);
        }

        return matchedCategory;

    } catch (error) {
        console.error("Error fetching OpenAI API response:", error);
        return 'Error summarizing the text.';
    }
}

async function evaluateAccuracy(quote, allowedSites) {

    try {

        /*
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
        */

        // OpenAI API endpoint
        const url = 'https://api.openai.com/v1/chat/completions';

        let prompt = `Verify authenticity of this statement:\n\n${quote}\n\nInclude the count of sites where the information was verified as well as how many sites you checked. Only use these sites: ${allowedSites.join(', ')}`;

        console.debug("OpenAI API prompt: ", prompt);

        const body = JSON.stringify({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a helpful assistant that verifies information by citing multiple sources. You only return a JSON response" },
                { role: "user", content: `Verify authenticity of this statement:: Supreme Court appears to side with Biden admin in abortion case, according to draft briefly posted on website. Include the count of sites where the information was verified as well as how many sites you checked. Include the count of sites where the information was verified as well as how many sites you checked. ` },
                {
                    role: "system", content: `{
        "checkedSites": [
            "site url",
            "site url",
            "site url",
            "site url"
        ],
        "verificationDetails": [
            {
                "source": "SOme Site 1",
                "verified": "True"
                "details": "Reports indicate that the Supreme Court seems poised to side with the Biden administration on a key abortion-related case concerning the Emergency Medical Treatment and Labor Act (EMTALA)."
            },
            {
                "source": "SOme Site 2",
                "verified": "False"
            },
            {
                "source": "SOme Site 3",
                "verified": "True"
                "details": "Highlighted that the Supreme Court appeared likely to support the Biden administration in this dispute."
            }
        ],
        "sitesChecked": 6,
        "sitesVerified": 4,
        "summary": "The Supreme Court appears to side with Biden admin in a key abortion case. Information verified across multiple credible sources."
    }`},
                { role: "user", content: prompt }
            ],
            max_tokens: 1200
        });

        console.debug("OpenAI API Body: ", JSON.stringify(body, null, 2));

        // Request headers
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openai_apiKey}`
        };

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
