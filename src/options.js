(function() {

	/*
	 * Track pageview
	 */
	chrome.runtime.sendMessage({
		action:	'trackPageview',
		page:	'options.html'
	});

	/*
	 * Locale
	 */
	var elements = document.getElementsByTagName('*');
	for (var i= 0, ilen=elements.length; i<ilen; i++) {
		var element = elements[i];
		if (element.dataset && element.dataset.message) {
			element.innerText = chrome.i18n.getMessage(element.dataset.message);
		}
	}

	/*
	 * Fields
	 */

	/*
	 * Statistics
	 */
	var statisticsField = document.getElementById('statistics');

	// populate
	chrome.storage.sync.get('statistics', function(items) {
		statisticsField.checked = !!items.statistics;
	});

	// change
	statisticsField.addEventListener('change', function(e) {

		// disabling option
		if (!this.checked) {

			// track event before saving the setting so we can see how many people disable it
			chrome.runtime.sendMessage(
				{
					action:	'trackEvent',
					args:	['Settings', 'Statistics', '0']
				},
				function() {

					console.log('disabling statistics');

					// save setting
					chrome.storage.sync.set({
						'statistics': false
					});

				}
			);
		}
		// enabling option
		else {

			console.log('enabling statistics');

			// save setting
			chrome.storage.sync.set({
				'statistics': true
			}, function() {

				// send tracking after the setting is saved so it is sent
				chrome.runtime.sendMessage(
					{
						action:	'trackEvent',
						args:	['Settings', 'Statistics', '1']
					}
				)
			});
		}

	}, this);

	/*
	 * Update tab
	 */
	var updateTabField = document.getElementById('hide_update_tab');

	// populate
	chrome.storage.sync.get('hide_update_tab', function(items) {
		updateTabField.checked = !!items.hide_update_tab;
	});

	// change
	updateTabField.addEventListener('change', function(e) {

		// do not show
		if (this.checked) {

			console.log('disabling update tab');

			// save setting
			chrome.storage.sync.set({
				'hide_update_tab': true
			});

			// send tracking after the setting is saved so it is sent
			chrome.runtime.sendMessage(
				{
					action:	'trackEvent',
					args:	['Settings', 'HideUpdateTab', '1']
				}
			);

		}
		else {

			console.log('enabling update tab');

			// save setting
			chrome.storage.sync.set({
				'hide_update_tab': false
			});

			// send tracking after the setting is saved so it is sent
			chrome.runtime.sendMessage(
				{
					action:	'trackEvent',
					args:	['Settings', 'HideUpdateTab', '0']
				}
			);

		}

	});

})();