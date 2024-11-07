/**
 * Configuration object for the application.
 * @constant {Object}
 */
const CONFIG = {
    CHAR_LIMIT: 10000,
    API_ENDPOINT: 'https://api.cohere.ai/v1/chat',
    WEBSITES: {
        'www.washingtonpost.com': {
            selector: 'p[data-qa="subheadline"]',
            styles: {}
        },
        'www.wsj.com': {
            selector: 'div[class*="article-header"]',
            styles: {
                classList: ["css-ie7xtk"],
                margin: "220px 0px 20px 0px"
            }
        }
    }
};

/**
 * Utility functions for DOM manipulation.
 * @namespace
 */
const DOMUtils = {
    /**
     * Check if an element is hidden.
     * @param {HTMLElement} el - The element to check.
     * @returns {boolean} True if the element is hidden, false otherwise.
     */
    isHidden(el) {
        const style = window.getComputedStyle(el);
        return style.display === 'none' || style.visibility === 'hidden';
    },

    /**
     * Get visible text from the document.
     * @returns {string} The visible text content.
     */
    getVisibleText() {
        const body = document.querySelector('#content') || document.querySelector('main') || document.body;
        const walker = document.createTreeWalker(
            body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    return !this.isHidden(node.parentElement) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }
            }
        );

        let visibleText = '';
        let node;
        while ((node = walker.nextNode()) && visibleText.length < CONFIG.CHAR_LIMIT) {
            visibleText += node.nodeValue.trim() + '\n';
        }

        return visibleText.trim();
    },

    /**
     * Split a string by a given pattern.
     * @param {string} inputString - The string to split.
     * @param {string} [pattern='\n\n### '] - The pattern to split by.
     * @returns {string[]} An array of split strings.
     */
    splitStringByPatterns(inputString, pattern = '\n\n### ') {
        return inputString.split(new RegExp(pattern, 'g'));
    }
};

/**
 * Manages UI operations.
 * @namespace
 */
const UIManager = {
    /**
     * Create a header element.
     * @returns {HTMLElement} The created header element.
     */
    createHeader() {
        const header = document.createElement("div");
        Object.assign(header.style, {
            backgroundColor: "#4946ab",
            padding: "5px"
        });
        return header;
    },

    /**
     * Create a paragraph element with the given text.
     * @param {string} text - The text content for the paragraph.
     * @returns {HTMLElement} The created paragraph element.
     */
    createParagraph(text) {
        const p = document.createElement("p");
        p.textContent = text;
        Object.assign(p.style, {
            margin: "30px 30px",
            fontSize: "large",
            color: "white",
            textAlign: "justified",
            fontFamily: "Verdana, Geneva, sans-serif"
        });
        return p;
    },

    /**
     * Display the summarized text on the webpage.
     * @param {string} text - The text to display.
     */
    display(text) {
        const header = this.createHeader();
        const fragment = document.createDocumentFragment();
        
        DOMUtils.splitStringByPatterns(text).forEach(summaryheading => {
            fragment.appendChild(this.createParagraph(summaryheading));
        });
        
        header.appendChild(fragment);

        const websiteName = window.location.host;
        const config = CONFIG.WEBSITES[websiteName];

        if (config) {
            const targetElement = document.querySelector(config.selector);
            if (targetElement) {
                Object.assign(header.style, config.styles);
                if (config.styles.classList) {
                    header.classList.add(...config.styles.classList);
                }
                targetElement.insertAdjacentElement('afterend', header);
            } else {
                console.log('Target element not found');
            }
        } else {
            console.log('Website not supported');
        }
    }
};

/**
 * Manages API operations.
 * @namespace
 */
const APIManager = {
    /**
     * Summarize the given text using the API.
     * @param {string} text - The text to summarize.
     */
    summarize(text) {
        chrome.storage.sync.get('apiKey', key => {
            if (!key.apiKey) {
                UIManager.display("Please set an API key in News Summarizer > Options. You can get one from https://dashboard.cohere.ai/api-keys");
                return;
            }

            fetch(CONFIG.API_ENDPOINT, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-type": "application/json",
                    "Authorization": `Bearer ${key.apiKey}`,
                    "Request-Source": "news-summarizer"
                },
                body: JSON.stringify({
                    message: text,
                    preamble: `Generate response in the following format
                    
                    Key Point: <Single line key point from the page>
                    
                    <Report the rest of article based on type of information and choose your own headings as shown above to summarize article>

                    ### <Heading>: <Para>

                    Remember to generate a short para under each heading in the format shown above
                    `,
                    temperature: 0.01
                })
            })
            .then(response => response.json())
            .then(response => {
                UIManager.display(response.text || "There was an error: " + response.message);
            })
            .catch(error => {
                console.error('Error:', error);
                UIManager.display("An error occurred while fetching the summary.");
            });
        });
    }
};

/**
 * Main application object.
 * @namespace
 */
const App = {
    /**
     * Initialize the application.
     */
    init() {
        chrome.storage.sync.get('apiKey', key => {
            if (key.apiKey === undefined) {
                UIManager.display("Please set an API key in News Summarizer > Options. You can get one from https://dashboard.cohere.ai/api-keys");
            } else {
                const truncatedVisibleText = DOMUtils.getVisibleText();
                console.log(truncatedVisibleText);
                APIManager.summarize(truncatedVisibleText);
            }
        });
    }
};

// Initialize the application
App.init();