chronoline.js
=============

chronoline.js is a library for making a chronology timeline out of events on a horizontal timescale.

Currently, chronoline.js only requires raphael.js to function. jQuery/qTip2 are used to provide nicer tooltips, but these aren't required.

To use it, provide a target element and an array of dates (possible ranges) with event descriptions, and it will render the contents of the timeline.

There are a variety of options provided, which you can see in the JavaScript itself. They are currently (and will likely always be) quite idiosyncratic and represent the degrees of control needed for the projects this has been used for.

Usage
-----
See the example for actual use. At its core, chronoline.js requires an element to land in and events.
```javascript
// events are in an array and are each represented with an array laid out as
// [ [STARTDATE, ENDDATE_OPTIONAL], TOOLTIP_TITLE_STRING, TOOLTIP_DESCRIPTION_OPTIONAL, SECTION_ID_OPTIONAL ]
var events = [
[[new Date(2011, 2, 31)], "2011 Season Opener", "", 0],
[[new Date(2012, 1, 29)], "Spring Training Begins", "", 2],
[[new Date(2012, 3, 9), new Date(2012, 3, 11)], "Atlanta Braves @ Houston Astros", "", 1]
];

var timeline = new Chronoline(document.getElementById("target1"), events, {});
```

Other thoughts:
* sections are optional but fairly helpful. You likely will also want to provide a unique section id for each section and also label the events according to which section they belong to


Implementation notes
--------------------
* "px" is for pixels, "ms" is for milliseconds. Time is tracked by milliseconds (as Dates do in JS), and this is converted into pixels to be displayed
* most aesthetics are options. Much other functionality can be modified by providing functions, such as the scrolling intervals
* the smallest resolution you can get is days. In fact, all time information is stripped out of incoming dates
* all calculations are done in UTC. I encountered some problems with time zones, and the easiest solution was to ignore them. This is presumably okay because we're not maintaining time zone information anyways
* labels and hashes are only drawn as necessary. There are some pretty severe performance concerns (at least in FF in Ubuntu)

Support
-------
I mostly don't know what versions of various components are required. So far, I have used:
* raphael.js: 2.1.0
* jQuery: 1.7.2
* qTip2: 04/24/12 nightly

Browser support is:
* Internet Explorer 8+
* Firefox 12+
* Chrome 18+

Credits
-------
* Built by and for [Zanbato](https://zanbato.com). [Ping us](https://zanbato.com/careers/) if you're interested in working with us!
* Developed by [Kevin Leung](http://kevinleung.com)
* Designed by [Deny Khoung](http://twitter.com/#!/denykhoung)