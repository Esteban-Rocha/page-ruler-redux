(function() {
    /*
     * Track pageview
     */
    chrome.runtime.sendMessage({
        action:	'trackPageview',
        page:	location.pathname + location.hash
    });

    /*
     * Locale
     */
    var p = document.querySelector('p');

    switch (location.hash) {
		case '#local':
			p.innerText = chrome.i18n.getMessage('errorLocal');
			break;
		case '#webstore':
			p.innerText = chrome.i18n.getMessage('errorWebStore');
			break;
    }

})();