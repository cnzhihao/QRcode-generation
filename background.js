// background.js
// 目前不需要执行任何操作，但文件必须存在 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openPopup') {
    chrome.action.openPopup();
  }
}); 