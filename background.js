// background.js
// 目前不需要执行任何操作，但文件必须存在 

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openPopup') {
    chrome.action.openPopup();
  }
}); 

/* 
如何安装:
1. 打开 Edge 浏览器，访问 edge://extensions/
2. 开启"开发人员模式"
3. 点击"加载解压缩的扩展"
4. 选择包含扩展文件的文件夹
*/ 