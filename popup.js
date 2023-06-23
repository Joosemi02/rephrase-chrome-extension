'use strict';

const langSelectElement = document.getElementById("lang-select");

chrome.storage.sync.get(['lang'], (result) => {
  if (typeof result.lang !== "undefined") {
    langSelectElement.value = result.lang;
  } else {
    langSelectElement.value = 'en';
  }
});

langSelectElement.addEventListener('change', () => {
  const lang = langSelectElement.value;
  chrome.storage.sync.set({ lang }, () => {
    console.log('Language is ' + lang);
  });
});
