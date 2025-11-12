// Append text to the existing content of the body
let xhr = new XMLHttpRequest();
xhr.open('GET', `${window.env.backendHost}/api/test`, true); // true for asynchronous
xhr.onload = function() {
    if (xhr.status >= 200 && xhr.status < 300) {        
        document.getElementById('content').innerHTML = xhr.responseText;
    } else {
        console.error('Request failed with status:', xhr.status);
    }
};
xhr.onerror = function() {
    console.error('Network error occurred.');
};
xhr.send(); // For GET requests, no data is sent in send()