// Register context menu
chrome.contextMenus.onClicked.addListener(async ({ selectionText }) => {
  chrome.tabs.create({
    url: await generateUrl(selectionText),
    selected: true,
  });
});

chrome.runtime.onInstalled.addListener(() => chrome.contextMenus.create({
  id: 'translate-selection',
  contexts: ['selection'],
  title: 'Translate with DeepL "%s"'
}));

// Activate popup
chrome.runtime.onInstalled.addListener(() => {
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

const getFromStorage = keys => new Promise((resolve) =>
  chrome.storage.sync.get(keys, result => resolve(result)));

const generateUrl = async (selectedText) => {
  const {
    sourceLang = 'en',
    targetLang = 'de',
  } = await getFromStorage(['sourceLang', 'targetLang']);

  return selectedText === ""
    ? `https://www.deepl.com/translator#${sourceLang}/${targetLang}`
    : `https://www.deepl.com/translator#${sourceLang}/${targetLang}/${selectedText}`;
};