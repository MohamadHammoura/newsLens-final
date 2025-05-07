// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const detectionToggle = document.getElementById('toggleDetection');
    const lengthSelector = document.getElementById('responseLength');
    const addSiteForm = document.getElementById('addSiteForm');
    const customSiteInput = document.getElementById('customSite');
  
    // Load saved preferences
    chrome.storage.local.get(['detectionEnabled', 'responseLength', 'customSites'], ({ detectionEnabled = true, responseLength = 'medium', customSites = [] }) => {
      detectionToggle.checked = detectionEnabled;
      lengthSelector.value = responseLength;
    });
  
    // Toggle detection state
    detectionToggle.addEventListener('change', () => {
      chrome.storage.local.set({ detectionEnabled: detectionToggle.checked });
    });
  
    // Update response length preference
    lengthSelector.addEventListener('change', () => {
      chrome.storage.local.set({ responseLength: lengthSelector.value });
    });
  
    // Add custom site
    addSiteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const site = customSiteInput.value.trim();
      if (!site) return;
  
      chrome.storage.local.get('customSites', ({ customSites = [] }) => {
        if (!customSites.includes(site)) {
          const updatedSites = [...customSites, site];
          chrome.storage.local.set({ customSites: updatedSites }, () => {
            customSiteInput.value = '';
            alert(`Added ${site} to monitored sites.`);
          });
        }
      });
    });
  
    // Gather Perspective - trigger detection + one-time analysis
    document.getElementById('analyze').addEventListener('click', async () => {
      chrome.storage.local.set({ detectionEnabled: true });
  
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { type: 'runAnalysis' });
    });
  
    // Open in App
    document.getElementById('openApp').addEventListener('click', () => {
      chrome.storage.local.get("lastArticle", ({ lastArticle }) => {
        if (!lastArticle) return;
        const params = new URLSearchParams(lastArticle);
          window.open(`http://localhost:5173/?${params.toString()}`, '_blank');

      });
    });
  });
  