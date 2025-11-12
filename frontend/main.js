// Append text to the existing content of the body
let xhr = new XMLHttpRequest();
xhr.open('GET', `${window.env.backendHost}/api/test`, true); // true for asynchronous
xhr.setRequestHeader("Content-Type", "application/json");
xhr.onload = function() {
    document.getElementById('content').innerHTML = xhr.responseText ?? xhr.status;
};
xhr.onerror = function(e) {
    document.getElementById('content').innerHTML = `API request failed ${e.target?.error ?? e.message ?? e}`;
};
xhr.send(); // For GET requests, no data is sent in send()