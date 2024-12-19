// Import commands.js using ES2015 syntax:
import './commands';

// Hide fetch/XHR requests from command log
const topWindow = window.top;
if (topWindow && topWindow.document) {
  const style = topWindow.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  topWindow.document.head.appendChild(style);
}
