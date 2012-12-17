/*
 * jQuery Tweets2List v0.3.2 - 17 December, 2012
 *
 * TERMS OF USE - jQuery Tweets2List
 * 
 * Open source under the BSD License. 
 * 
 * Copyright © Gary Cottington
 * All rights reserved.
 * Author - Gary Cottington (garycottington.co.uk)
 * 
 * Redistribution and use in source and binary forms, with or without modification, 
 * are permitted provided that the following conditions are met:
 * 
 * Redistributions of source code must retain the above copyright notice, this list of 
 * conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice, this list 
 * of conditions and the following disclaimer in the documentation and/or other materials 
 * provided with the distribution.
 * 
 * Neither the name of the author nor the names of contributors may be used to endorse 
 * or promote products derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 * COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
 * GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
 * AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
 * OF THE POSSIBILITY OF SUCH DAMAGE. 
 *
*/


function Tweets2List() {

	// Core properties
	var _tweets = 0;									// Number of tweets loaded	
	var _timerID;										// ID of Timer used to poll the twitter timeline
	var _loadingTimerID;								// ID of Timer used to load the initial timeline
	var _attempts = 0;									// Number of poll attempts
	var _source;										// The id of the source container		
	var _dest;											// The id of the destination container to output to
	var _lastTweetID;									// The id of the tweet at the top of the list
	var _connected = false;								// Whether the tweets2list output and input divs were successfully validated
	var _IE7 = navigator.userAgent.toLowerCase().indexOf('msie 7') > -1;
	
	// Configurable properties
	var _numListItems = 20;								// The number of list items to output (maximum allowed is 20)
	var _timeout = 10;									// The number of attempts to load the tweets before timing out
	var _twitterDown = 'Twitter feed is unavailable.';	// The message to display if Twitter is down
	var _loadingMessage = 'Loading Tweets...';			// The message to display while tweets are being loaded
	var _loadingPollTime = 2000;						// The time between attempts to load the tweets from the timeline widget
	var _verbose = true;								// Error mesages are displayed on screen if this is set to true
	var _header = true;									// Whether the heading for the timeline is displayed or not
	var _footer = true;									// Whether the footer for the timeline is displayed or not
	var _dates = true;									// Whether the dates are shown with each tweet or not
	var _actions = true;								// Whether the actions are displayed for each tweet or not
	var _profile = true;								// Whether the author profile is displayed with each tweet or not
	var _updatePollTime = 20000;						// The time betwen polls of the timeline widget looking for updates
	var _language = 'en';								// Language used for localisation of Date updates
	var _refresh = true;								// Whether to keep the cloned list up to date or not
	
	// Browser notes
	// This plugin has been tested with IE7,IE8,IE9,FF and Chrome
	// NB. Reference to the twitter widget id of #twitter-widget-0 is used. 
	// This id is only used to make this plugin compatible with IE7. Other browsers do not need this id in order to work,
	// so it can be removed if you are not supporting IE7. This currently limits this plugin to one twitter timeline.
	
	
	Date.prototype.getMonthNameShort = function(lang) {
		lang = lang && (lang in Date.locale) ? lang : 'en';
		return Date.locale[lang].month_names_short[this.getMonth()];
	};
	
	Date.locale = {
		en: { month_names_short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] }
	};
	
	this.clear = function(source,dest) {
		// Deletes all tweets2list elements from the output div
		$('#'+_dest+' .tweets2list_header').remove();
		$('#'+_dest+' .tweets2list_content').remove();
		$('#'+_dest+' .tweets2list_footer').remove();		
	};
	
	this.connect = function(source,dest) {
		// save the source and destination container ids
		_source = source
		_dest = dest;
		
		// validate the potential connection
		if($('#'+_source).length > 0 && $('#'+_dest).length > 0) {
			_connected = true;
		} else {
			warn('Connect failed. One or both of the divs specified are not present.');	
		}
		
		// output the loading message
		$('#'+_dest).append('<div class="tweets2list_loading">'+_loadingMessage+'</div>');
		
	};

    this.get = function() {
		
		if(_connected) {

			// poll the source timeline looking for tweets
			_loadingTimerID = setInterval(function(){
				_attempts++;
				
				// get the number of tweets loaded
				_tweets = numTweets();
				if(_tweets >0 ) {
					// stop the timer
					clearInterval(_loadingTimerID);
					
					// make sure that the number of tweets being copied does not exceed what is loaded
					if(_numListItems > _tweets) {
						_numListItems = _tweets;	
					}
					
					// remove the loading message
					$('#'+_dest+' .tweets2list_loading').remove();
					
					// write the header
					writeHeader();
					
					// write the tweets to our local list
					writeList();	
					
					// write the footer
					writeFooter();
					
					// Start the timer that polls the timeline looking for updates
					_timerID = setInterval(function(){
						refreshList();
					}, _updatePollTime);
				}
				
				// test for the number of polls attempted
				if(_attempts>_timeout) {
					// give up - assume the twitter timeline failed to load
					clearInterval(_loadingTimerID);
					$('#'+_dest).html(_twitterDown);
				}
			}, _loadingPollTime);
		} else {
			warn('Call to get() failed. A valid connect() has not been established.');	
		}
		
    };

	var numTweets = function() {
		
		// Returns the number of tweets loaded into the timeline
		if(_IE7) {
			return $('#'+_source+' iframe').contents().find('#twitter-widget-0 li.tweet').length;
		} else {
			return $('#'+_source+' iframe').contents().find('li.tweet').length;
		}
		
	};
	
	var refreshList = function() {
		
		// This function updates the time values on the tweets, and inserts any new tweets that have been posted
		// since the initial get() was made
		
		// Declare some variables for holding date and time values
		var dt;
		var dtNow = new Date();
		var dtTweet;
		var diff;
		var days;
		var secs;
		var mins;
		var hrs;
		var newTime = '';
		var update = false;
		
		// get the tweet list
		var tw = $('.tweets2list_tweets li.tweet');
			
		// First stage is to update the time values against each tweet	
		// Loop through the tweets in our tweets2list list
		for(i=1;i<=_numListItems;i++) {
			// Get the time value
			dt = tw.eq(i-1).find('a.permalink').data('datetime');
			
			// Is the existing time value displayed in hours or minutes? Only these recent tweets will need their time updating.
			if(tw.eq(i-1).find('a.permalink abbr').length > 0) {
				update = true;
			} else {
				update = false;	
			}
			
			// update the time or date value if it has changed
			if(update) {
				// convert it to a date object
				dtTweet = dateFromTweetDateString(dt);
				
				// convert to a friendly date string
				newTime = String(dtTweet.getDate()) + ' ' + dtTweet.getMonthNameShort(_language);
				
				// Is the date less than 24 hours ago? If so, convert to a friendly time value
				diff = dtNow - dtTweet;
				days = Math.round(diff/(1000*60*60*24));			
				if(days <=1) {
					secs = Math.floor(Math.abs(diff / 1000));
					mins = Math.floor(secs/60);
					hrs = Math.floor(mins/60);
					
					if(secs<60) {
						newTime = secs+'<abbr title="seconds">s</abbr>';	
					} else if(mins<60) {
						newTime = mins+'<abbr title="minutes">m</abbr>';	
					} else if(hrs<24) {
						newTime = hrs+'<abbr title="hours">h</abbr>';	
					}
				}
				
				// Update the time tag on the tweet
				if(tw.eq(i-1).find('a.permalink time').length>0) {
					tw.eq(i-1).find('a.permalink time').html(newTime);
				} else {
					tw.eq(i-1).find('a.permalink').html(newTime);
				}
				
			} else {
				// stop processing, as all other tweets will be older and not need their time values updated
				break;	
			}
		}
		
		// Second stage is to look for new tweets that have been added to the timeline
		
		// declare a variable for holding the tweet id
		var tweetID;
		
		// declare a variable for holding temporary data
		var d = '';
		
		// declare a variable for holding any new tweets that need to be inserted into our list
		var h = '';
		
		// declare a boolean for indicating whther new tweets were found
		var hasNewTweets = false;
		
		// declare a variable for holding the id of the top tweet in the timeline
		var topTweet;
		
		// declare a variable for tracking the number of new tweets added
		var numNewTweets = 0;
		
		// get the number of tweets loaded
		_tweets = numTweets();
		
		// get the timeline tweet list
		var tw;
		if(_IE7) {
			tw = $('#'+_source+' iframe').contents().find('#twitter-widget-0 li.tweet');
		} else {
			tw = $('#'+_source+' iframe').contents().find('li.tweet');
		}
		
		// loop through the tweets from the twitter timeline
		if(_refresh) {
			for(i=1;i<=_tweets;i++) {
				// get the tweet id
				tweetID = tw.eq(i-1).data('tweet-id');
				
				// save the top tweet id for the end of this loop
				if(i==1) {
					topTweet = tweetID;	
				}
				
				// Does it match the tweet id from the top of our cloned list?
				if (tweetID == _lastTweetID) {
					// stop processing
					break;
				} else {
					// get the new tweet markup
					d = tw.eq(i-1).html();
					
					// add it to our output stream
					if(d.length > 0) {
						hasNewTweets = true;
						numNewTweets++;
						h = h+'<li class="tweet" data-tweet-id="'+tweetID+'">'+d+'<div style="clear:both;"></div></li>';
					}
				}
			}
			
			// Save the id of the most recent tweet, and insert the new tweets into our list
			if(hasNewTweets) {
				_lastTweetID = topTweet;
				$('#'+_dest+' .tweets2list_tweets').prepend(h);
				_numListItems = _numListItems + numNewTweets;
			}
		}
		
	};
	
	var writeList = function() {
		
		// Reads the tweets from the timeline and outputs them to a <ol> list
		// in the destination div
		
		// declare the variable that will hold our output string
		var h = '<ol class="tweets2list_tweets">';
		
		// declare a variable for holding temporary data
		var d = '';
		
		// declare a variable for holding the tweet id
		var tweetID;
		
		// get the tweet list
		var tw;
		if(_IE7) {
			tw = $('#'+_source+' iframe').contents().find('#twitter-widget-0 li.tweet');
		} else {
			tw = $('#'+_source+' iframe').contents().find('li.tweet');
		}
		
		// Loop through the tweets in the timeline and extract the elements we need
		for(i=1;i<=_numListItems;i++) {
			// Get the tweet
			d = tw.eq(i-1).html();
			tweetID = tw.eq(i-1).data('tweet-id');

			// Add it to our output stream
			if(d) {
				h = h+'<li class="tweet" data-tweet-id="'+tweetID+'">'+d+'<div style="clear:both;"></div></li>';
			}
			
			// Save the id of the most recent tweet. This will be used later when looking for new tweets.
			if(i==1) {
				_lastTweetID = tweetID;
			}
		}
		
		// close the <ol> tag
		h = h+'</ol>';
		
		// wrap the list in a div so that additional formatting can be applied (such as limiting the height and making it scrollable)
		h = '<div class="tweets2list_content">'+h+'</div>';
		
		// Apply user-defined customisation
		if(!_dates) {
			// hide the date of the tweet
			h=h.replace(/<time/g,'<time style="display:none;"');
		}
		if(!_actions) {
			// hide the footer of the tweet
			h=h.replace(/<div class="footer/g,'<div style="display:none;" class="footer');
		}
		if(!_profile) {
			// hide the author profile
			h=h.replace(/<div class="header/g,'<div style="display:none;" class="header');
		}
		
		// write the data to the destination div
		$('#'+_dest).append(h);
	};
	
	var writeHeader = function() {
		
		// Reads the heading from the timeline and uses this to write a header
		// to our output stream
		
		// declare variables for holding temporary data
		var d = '';
		
		// declare a variable to hold the intitial visiblility state
		var v = 'block';
		if(!_header) {
			v = 'none';
		}
		
		// Get the heading from the twitter timeline
		if(_IE7) {
			d = $('#'+_source+' iframe').contents().find('#twitter-widget-0 .timeline-header h1').html();
		} else {
			d = $('#'+_source+' iframe').contents().find('.timeline-header h1').html();
		}
		
		// wrap the heading in our own heading markup
		d = '<div class="tweets2list_header" style="display:'+v+';"><h2>'+d+'</h2></div>';
		
		// write the data to the destination div
		$('#'+_dest).append(d);

	};
	
	var writeFooter = function() {
		
		// Reads the footer from the timeline and uses this to write a footer
		// to our output stream
		
		// declare a variable for holding temporary data
		var d = '';
		
		// declare a variable to hold the intitial visiblility state
		var v = 'block';
		if(!_header) {
			v = 'none';
		}
		
		// Get the footer from the twitter timeline
		if(_IE7) {
			d = $('#'+_source+' iframe').contents().find('#twitter-widget-0 .timeline-footer').html();
		} else {
			d = $('#'+_source+' iframe').contents().find('.timeline-footer').html();
		}
		
		// wrap the heading in our own footer markup
		d = '<div class="tweets2list_footer" style="display:'+v+';">'+d+'</div>';
		
		// write the data to the destination div
		$('#'+_dest).append(d);
		
	};
	
	var warn = function(msg) {
		
		// Show an alert message
		if(_verbose) {
			alert('Tweet2List error: '+msg);	
		}
	}
	
	var dateFromTweetDateString = function(ds) {
		
		// The date string attached to a tweet isn't compatible with date conversions in IE
		// so it needs to be run through this function first to obtain the date object
		
		var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
		var d = ds.match(new RegExp(regexp));
	
		var offset = 0;
		var time;
		var date = new Date(d[1], 0, 1);
	
		if (d[3]) { date.setMonth(d[3] - 1); }
		if (d[5]) { date.setDate(d[5]); }
		if (d[7]) { date.setHours(d[7]); }
		if (d[8]) { date.setMinutes(d[8]); }
		if (d[10]) { date.setSeconds(d[10]); }
		if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
		if (d[14]) {
			offset = (Number(d[16]) * 60) + Number(d[17]);
			offset *= ((d[15] == '-') ? 1 : -1);
		}
	
		offset -= date.getTimezoneOffset();
		time = (Number(date) + (offset * 60 * 1000));
		date.setTime(Number(time));
		
		return date;
		
	}
	
	this.set = function(property,val) {
		
		// Enables class properties to be set by the web page, providing full customisation of this plugin
		switch(property) {
			case 'actions':
				if(val == false) {
					_actions = false;
					$('#'+_dest+' .tweets2list_tweets li .footer').hide();
				} else {
					_actions = true;
					$('#'+_dest+' .tweets2list_tweets li .footer').show();
				}
			  	break;
			case 'date':
				if(val == false) {
					_dates = false;
					$('#'+_dest+' .tweets2list_tweets time').hide();
				} else {
					_dates = true;
					$('#'+_dest+' .tweets2list_tweets time').show();
				}
			  	break;
			case 'footer':
				if(val == false) {
					_footer = false;
					$('#'+_dest+' .tweets2list_footer').hide();
				} else {
					_footer = true;
					$('#'+_dest+' .tweets2list_footer').show();
				}
			  	break;
			case 'header':
				if(val == false) {
					_header = false;
					$('#'+_dest+' .tweets2list_header').hide();
				} else {
					_header = true;
					$('#'+_dest+' .tweets2list_header').show();
				}
			  	break;
			case 'language':
				_language = val;
			  	break;
			case 'loading_message':
				_loadingMessage = val;
			  	break;
			case 'loading_attempts':
				if($.isNumeric(val)) {
					_timeout = val;
				} else {
					warn(property+ ' must be assigned a numeric value.');	
				}
			  	break;
			case 'loading_timer':
				if($.isNumeric(val)) {
					_loadingPollTime = val;
				} else {
					warn(property+ ' must be assigned a numeric value.');	
				}
			  	break;
			case 'profile':
				if(val == false) {
					_profile = false;
					$('#'+_dest+' .tweets2list_tweets .header').hide();
				} else {
					_profile = true;
					$('#'+_dest+' .tweets2list_tweets .header').show();
				}
			  	break;
			case 'quantity':
				if($.isNumeric(val)) {
					if(val <1) {
						_numListItems = 1;	
					} else if(val > 20) {
						_numListItems = 20;
					} else {
						_numListItems = val;
					}
				} else {
					warn(property+ ' must be assigned a numeric value between 1 and 20.');	
				}
			  	break;
			case 'refresh':
				if(val == false) {
					_refresh = false;
				} else {
					_refresh = true;
				}
			  	break;
			case 'twitter_down':
				_twitterDown = val;
			  	break;
			case 'update_timer':
				if($.isNumeric(val)) {
					_updatePollTime = val;
				} else {
					warn(property+ ' must be assigned a numeric value.');	
				}
			  	break;
			case 'verbose':
				if(val == false) {
					_verbose = false;
				} else {
					_verbose = true;
				}
			  	break;
			default:
				warn(property+ ' is not a valid property.');
				break;
		}
	};
   
}
