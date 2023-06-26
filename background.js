// Add context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'explain-selection',
    contexts: ['selection'],
    title: 'Explain "%s"'
  });

  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {
            hostContains: '.'
          }
        })
      ],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});


chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (tab && tab.url && tab.url.startsWith('http')) {
    const explanation = await generateExplanation(info.selectionText);

    fetch('display.html')
      .then(response => response.text())
      .then(htmlString => {
        fetch('icon.svg')
          .then(response => response.text())
          .then(svgText => {
            // Process the SVG text
            const icon = svgText;
            htmlString = htmlString.replace('{explanation}', explanation).replace('{icon}', icon);

            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: showPopup,
              args: [htmlString],
            });
          })
          .catch(error => {
            console.error('Error fetching SVG:', error);
          });
      })
      .catch(error => {
        console.error('Error fetching display.html:', error);
      });
  }
});




function showPopup(htmlString) {
  // Create the popup element
  const popup = document.createElement('div');
  popup.id = 'popup';

  popup.innerHTML = htmlString;

  // Position the popup on top of the selected text
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const popupLeft = rect.left + scrollLeft;
  const popupTop = rect.top + scrollTop - popup.offsetHeight + 35;

  popup.style.position = 'absolute';
  popup.style.left = popupLeft + 'px';
  popup.style.top = popupTop + 'px';


  // Append the popup to the document body
  document.body.appendChild(popup);

  // Close the popup when clicking outside of it
  document.addEventListener('click', (event) => {
    if (!popup.contains(event.target)) {
      document.body.removeChild(popup);
    }
  });
}


const generateExplanation = async (selectedText) => {
  const { lang = 'en' } = await getFromStorage(['lang']);
  const apiKey = await fetchApiKey();
  return sendRequest(apiKey, selectedText);
};

const fetchApiKey = async () => {
  const response = await fetch('secret.json');
  const data = await response.json();
  return data.apiKey;
};

const sendRequest = (apiKey, selectedText) => {
  const openaiUrl = `https://api.openai.com/v1/chat/completions`;
  const send_message = {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: `Explain: ${selectedText}` }]
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  const options = {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(send_message)
  };

  return fetch(openaiUrl, options)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else if (response.status == 429) {
        return "OpenAI API limit reached"
      } else {
        console.log(response.json());
        throw new Error(response.status);
      }
    })
};

const getFromStorage = keys => new Promise((resolve) =>
  chrome.storage.sync.get(keys, result => resolve(result)));
