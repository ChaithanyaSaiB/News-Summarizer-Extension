// Configuration
const CONFIG = {
    formSelector: 'form',
    inputSelector: '#apiKey',
    statusSelector: '#status',
    storageKey: 'apiKey',
    successMessage: 'Options saved.',
    messageTimeout: 750
  };
  
  // DOM Utility functions
  const DOM = {
    getElement: selector => document.querySelector(selector),
    getValue: selector => DOM.getElement(selector).value,
    setText: (selector, text) => DOM.getElement(selector).textContent = text
  };
  
  // Storage functions
  const Storage = {
    set: (key, value) => new Promise(resolve => chrome.storage.sync.set({ [key]: value }, resolve))
  };
  
  // UI functions
  const UI = {
    showStatus: (message, duration) => {
      DOM.setText(CONFIG.statusSelector, message);
      setTimeout(() => DOM.setText(CONFIG.statusSelector, ''), duration);
    }
  };
  
  // Main functionality
  const saveApiKey = async (event) => {
    event.preventDefault();
    const apiKey = DOM.getValue(CONFIG.inputSelector);
    await Storage.set(CONFIG.storageKey, apiKey);
    UI.showStatus(CONFIG.successMessage, CONFIG.messageTimeout);
  };
  
  // Event listeners
  const initializeEventListeners = () => {
    DOM.getElement(CONFIG.formSelector).addEventListener('submit', saveApiKey);
  };
  
  // Initialize the application
  initializeEventListeners();