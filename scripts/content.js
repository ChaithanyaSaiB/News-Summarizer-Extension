// Constants
const CHAR_LIMIT = 10000; // Assuming this was defined somewhere
const API_ENDPOINT = 'https://api.cohere.ai/v1/chat';

// Helper Functions
function isHidden(el) {
    const style = window.getComputedStyle(el);
    return (style.display === 'none' || style.visibility === 'hidden');
}

function getVisibleText() {
    const body = document.querySelector('#content') || document.querySelector('main') || document.body;
    const allTags = body.getElementsByTagName('*');
    let visibleText = [];
    let nChars = 0;

    for (let i = 0; i < allTags.length; i++) {
        const elem = allTags[i];
        if (!isHidden(elem)) {
            const text = $(elem).contents().filter(function() {
                return this.nodeType == Node.TEXT_NODE;
            })[0]?.nodeValue;

            if (text) {
                nChars += text.length + 1;
                if (nChars < CHAR_LIMIT) {
                    visibleText.push(text);
                } else {
                    break;
                }
            }
        }
    }
    return visibleText.join('\n');
}

function splitStringByPatterns(inputString, pattern = '\n\n### ') {
    const regex = new RegExp(pattern, 'g');
    return inputString.split(regex);
}

// UI Functions
function createHeader() {
    const header = document.createElement("div");
    header.style.backgroundColor = "#4946ab";
    header.style.padding = "5px";
    return header;
}

function createParagraph(text) {
    const p = document.createElement("p");
    p.textContent = text;
    p.style.margin = "30px 30px";
    p.style.fontSize = "large";
    p.style.color = "white";
    p.style.textAlign = "justified";
    p.style.fontFamily = "Verdana, Geneva, sans-serif";
    return p;
}

function display(text) {
    const header = createHeader();
    const listOfHeadings = splitStringByPatterns(text);

    listOfHeadings.forEach(summaryheading => {
        header.appendChild(createParagraph(summaryheading));
    });

    const websiteName = window.location.host;
    let targetElement;

    if (websiteName === 'www.washingtonpost.com') {
        targetElement = document.querySelector('p[data-qa="subheadline"]');
    } else if (websiteName === "www.wsj.com") {
        targetElement = document.querySelector('div[class*="article-header"]');
        header.classList = ["css-ie7xtk"];
        header.style.margin = "220px 0px 20px 0px";
    }

    if (targetElement) {
        targetElement.insertAdjacentElement('afterend', header);
    } else {
        console.log('Target element not found');
    }
}

// API Functions
function summarize(text) {
    chrome.storage.sync.get('apiKey', key => {
        if (!key.apiKey) {
            display("Please set an API key in Condense > Options. You can get one from https://dashboard.cohere.ai/api-keys");
            return;
        }

        const options = {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-type": "application/json",
                "Authorization": `Bearer ${key.apiKey}`,
                "Request-Source": "sandbox-condense"
            },
            body: JSON.stringify({
                message: text,
                preamble: `Generate response in the following format
                
                Key Point: <Single line key point from the page>
                
                <Report the rest of article based on type of information and choose your own headings as shown above to summarize article>

                <Heading>: <Para>

                Remember to generate a short para under each heading in the format shown above
                `,
                temperature: 0.01
            })
        };

        fetch(API_ENDPOINT, options)
            .then(response => response.json())
            .then(response => {
                if (response.text === undefined) {
                    display("There was an error: " + response.message);
                } else {
                    display(response.text);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                display("An error occurred while fetching the summary.");
            });
    });
}

// Main Function
function main() {
    chrome.storage.sync.get('apiKey', key => {
        if (key.apiKey === undefined) {
            display("Please set an API key in Condense > Options. You can get one from https://dashboard.cohere.ai/api-keys");
        } else {
            const truncatedVisibleText = getVisibleText();
            console.log(truncatedVisibleText);
            summarize(truncatedVisibleText);
        }
    });
}

// Initialize
main();