(function() {

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
