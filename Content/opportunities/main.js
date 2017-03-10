/// <reference path="/Content/lib/base-widget.js" />

define(["jquery", "base-widget"], function ($, baseWidget) {
	var _b,
		picklists = [],
		currentResults = [],
		statusInterval = null,
		statusIntervalCounter = 0,
		formData = {
			tsi: null,
			max: null,
			QueryString: null,
			TownPostcode: null,
			UserPostcode: null,
			Distance: null,
			Activity: null,
			ClientGroup: null,
			Times: []
		};
	$(function () {
		_b = new baseWidget("opportunities");
		getPicklists(loadInitialTemplate);
	});

	function getPicklists(callback) {
		url = _b.apiUrl + 'picklists/opportunities';
		$.ajax({
			url: url,
			method: 'GET',
			success: function (data) {
				picklists = data;
				if (callback) {
					callback();
				}
			}
		}).fail(function(response, status, xhr){
			console.log("Failed to GET", url);
			console.log(response, status, xhr);
		});
	}

	function loadInitialTemplate() {
		_b.renderTemplate('opportunity-search.htm', picklists, null, formData, searchBindings);
	}

	function searchBindings(success) {
		_b.body.find('#mw-search').off('click').on('click', function () {
			doSearch();
		});

		_b.body.find('#mw-show-hide-opening-times').on('click', function () {
			_b.body.find('.mw-times').toggleClass('hide');
		});

		_b.body.find('#mw-keyword').on('keyup', function () {
			if ($(this).val() == 'GetStatus') {
				if (statusInterval == null) {
					statusInterval = window.setInterval(GetStatus, 1000);
					GetStatus();
					_b.body.find('.status-counter').removeClass('hide');
				}
			} else {
				if (statusInterval != null) {
					window.clearInterval(statusInterval);
					statusInterval = null;
					statusIntervalCounter = 0;
					_b.body.find('.status-counter').addClass('hide');
				}
			}
		});
	}

	function GetStatus() {
		_b.body.find('.status-counter-seconds').text(statusIntervalCounter);
		if (statusIntervalCounter > 0) {
			statusIntervalCounter--;
		} else {
			$.ajax({
				url: _b.apiUrl + 'status',
				method: 'POST',
				success: function (locks) {
					var results = _b.body.find('.mw-results');
					_b.renderTemplate('status.htm', locks, results, null, null);
				},
				error: function (response, status, xhr) {
					//alert(response);
					console.log("Failed to POST", _b.apiUrl + "status");
					console.log(response, status, xhr);
				}
			});
			statusIntervalCounter = 10;
		}
	}

	function doSearch(url) {
		if ($('[data-tsi').length > 0) {
			formData.tsi = $('[data-tsi]').data('tsi');
		}
		var resultsContainer = _b.body.find('.mw-results');
		//If we are not passed a search url to use, use the base url and send 
		//our search form data. Urls are passed when we are doing a next/previous
		//page query.
		data = url ? {} : formData;
		url = url || _b.apiUrl + 'opportunities';
		$.ajax({
			url: url,
			method: 'GET',
			data: data,
			success: function (response) {
				currentResults = response;
				_b.renderTemplate('opportunity-results.htm', response, resultsContainer, null, resultsBindings);
			},
			error: function (response, status, xhr) {
				console.log("Failed to GET", url, data);
				console.log(response, status, xhr);
			}
		})
	}

	function resultsBindings(success) {
		$('.mw-results [data-toggle="collapse"]').on('click', function (e) {
			var target = $(this).data('target');
			$(target).toggleClass('hide');
			e.preventDefault();
		});

		$('.mw-results [data-toggle="tab"]').on('click', function (e) {
			var $this = $(this);
			$this.addClass('active').siblings('[data-toggle="tab"]').removeClass('active');
			var target = $($this.data('target'));
			target.removeClass('hide').siblings('.tab').addClass('hide');
			e.preventDefault();
		});

		$('.mw-results [data-search]:not(.disabled a)').on('click', function (e) {
			doSearch($(this).data('search'));
			e.preventDefault();
		});

		$('#mw-expand-collapse-all').on('click', function (e) {
			var results = $('.mw-results .panel-collapse');
			var open = results.not('.hide').length;
			if (open < results.length) {
				results.removeClass('hide');
			} else {
				results.addClass('hide');
			}
			e.preventDefault();
		});

		$('.mw-results [data-toggle="print"]').on('click', function (e) {
			var id = $(this).data('id');
			$(currentResults.Results).each(function (i, o) {
				if (id === o.Document.Id) {
					var temp = $('<div />');
					_b.renderTemplate('opportunity-print.htm', o.Document, temp, null, function () {
						var frame = $('<iframe></iframe>', {
							'src': 'about:blank',
							'border': '0',
							'id': 'temp-print'
						}).css({
							'width': '800px',
							'height': '800px',
							'visibility': 'hidden'
						}).appendTo('body');

						var iframe = frame.get(0).contentWindow;

						iframe.document.write(temp.html());
						iframe.focus();
					});
				}
			});
			e.preventDefault();
		});
	}
});