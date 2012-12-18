tweets2list
===========

A jquery plugin for styling a Twitter timeline widget.

The Twitter timeline widget is great for easily adding your twitter feed to your website. 
However it's lack of styling and customisation options make it unsuitable for many website designs.

Introducing tweets2list.js
--------------------------

tweets2list.js is a jquery plugin that addresses the drawbacks of using the standard Twitter timeline
widget. It does this by cloning the widget contents into the DOM of your web page and adding an API.
This gives you the ability to style it fully with your own CSS, and customise the functionality with
a simple set of API functions.

Demo
----

[A demo of this plugin](http://www.garycottington.co.uk/tweets2list/demo) is available.

How it works
------------

The plugin works by using a hidden Twitter timeline widget as its data source (rather than interfacing
directly with the Twitter API).

The Twitter timeline contents are loaded into an iframe. tweets2list.js clones this content into a 
target div element on your web page. It then, periodically, looks for updates to the source
timeline in order to update the cloned content.

You cannot normally modify the css of the source timeline as it resides in an iframe. But because the
plugin makes a copy in the local DOM this gives you full control of the CSS.

Installation
------------

Create your Twitter timeline widget via your Twitter account (Settings->Widgets).

Download the tweets2list files.

Include the jquery library in the head of your web page.
```
<script type="text/javascript" src="http://code.jquery.com/jquery-1.8.0.min.js"></script>
```

Add a div to your web page for the source timeline widget, and make it hidden.
```
<div id="input" style="display:none;"></div>
```

Copy and paste the code provided by Twitter for your timeline widget into your input div.

Add a div to your web page for the output of tweets2list.
```
<div id="output"></div>
```

At the bottom of your page, just before the closing body tag, include the tweets2list script.
```
<script src="jquery-tweets2list-0.3.2.min.js"></script>
```

Below this add the following code to create your tweets2list instance.
```
<script type="text/javascript">
	$(function() {
		// Create a new instance of tweets2list (required)
		var t = new Tweets2List(); 
		
		// Set some custom tweets2list properties (optional)
		t.set('quantity',10);
		
		// Assign the input and output divs (required)
		t.connect('input','output');
		
		// Get the tweets (required)
		t.get();
	});
</script>
```

That's it for the basic configuration.
If you experience problems you should first check that you have correctly specified your domain
names in your Twitter Timeline widget settings. Make sure that you specify your domain names with and without 
the www prefix.

tweets2list API
===============

This plugin provides a function called set() which enables the configuration of a number of its properties.

The format of the set() function is set(property_name,value)
For example, t.set('header',false)

It is recommended that you use the set() function before calling connect() and get(), as shown in the
installation instructions above.

set() function properties
-------------------------

**Property: actions**  
Valid values: true, false  
Purpose: Shows or hides the action links below each tweet.  
Default value: true

**Property: date**  
Valid values: true, false  
Purpose: Shows or hides the time/date for each tweet.  
Default value: true

**Property: footer**  
Valid values: true, false  
Purpose: Shows or hides the footer of the twitter timeline.  
Default value: true

**Property: header**  
Valid values: true, false  
Purpose: Shows or hides the header of the twitter timeline.  
Default value: true

**Property: language**  
Valid values: en  
Purpose: Reserved for future use.  
Default value: en

**Property: loading_message**  
Valid values: String  
Purpose: The message displayed in your output div while the tweets are loaded.  
Default value: Loading Tweets...

**Property: loading_attempts**  
Valid values: Number  
Purpose: The number of attempts that tweets2list will make to load the tweets, before timing out.  
Default value: 10

**Property: loading_timer**  
Valid values: Number  
Purpose: The time, in milliseconds, between each loading attempt.  
Default value: 2000

**Property: profile**  
Valid values: true, false  
Purpose: Shows or hides the avatar/profile for each tweet.  
Default value: true

**Property: quantity**  
Valid values: Number from 1-20  
Purpose: The initial number of tweets to display.  
Default value: 20

**Property: refresh**  
Valid values: true, false  
Purpose: Whether to keep the cloned list up to date with new tweets or not.  
Default value: true

**Property: twitter_down**  
Valid values: String  
Purpose: The message to display if the Twitter timeline fails to load.  
Default value: Twitter feed is unavailable.

**Property: update_timer**  
Valid values: Number  
Purpose: The time, in milliseconds, between each refresh of the tweets2list timeline.  
Default value: 20000

**Property: verbose**  
Valid values: true, false  
Purpose: Show or hide tweets2list warning/error messages.  
Default value: true

Developer Notes
===============

This plugin cannot copy the 'Follow' button that is part of the Twitter timeline widget. If you need one
though, simply add it to your web page in the normal way. The demo shows an example of this.

This plugin has been tested on Chrome, Firefox, IE9, IE8 and IE7.