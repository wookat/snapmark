chrome.action.onClicked.addListener(async () => {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(undefined, { format: 'png' });
    await chrome.storage.local.set({ pendingCapture: dataUrl });
    await chrome.tabs.create({ url: chrome.runtime.getURL('app/index.html') });
  } catch (e) {
    console.error('SnapMark capture failed:', e);
  }
});
