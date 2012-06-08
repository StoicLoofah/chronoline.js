chronoline.js
=============

chronoline.js is a library for making a chronology timeline out of events on a horizontal timescale. You can see a demo at http://stoicloofah.github.com/chronoline.js/

Currently, chronoline.js only requires raphael.js to function. jQuery is used to provide nicer tooltips (using qTip2) and dragging support, but these aren't required.

To use it, provide a target element and an array of dates (possible ranges) with event descriptions, and it will render the contents of the timeline.

There are a variety of options provided, which you can see in the JavaScript itself. They are currently (and will likely always be) quite idiosyncratic and represent the degrees of control needed for the projects this has been used for.If you would like to use it for yourself, go ahead and fork, file bugs in GitHub, or submit pull requests. Documentation is somewhat shoddy, and I'm happy to improve it as desired.

Usage
-----
See the example for actual use. At its core, chronoline.js requires events and a DOM element to land in. Here's a quick rundown through the format of those:
```javascript
// events are in an associative array with an array of dates and a title that are the actual dots and bars in the timeline
var events = [
{dates: [new Date(2011, 2, 31)],
 title: "2011 Season Opener",
 section: 0, //optional
 attrs: {} // optional
},
{dates: [new Date(2012, 1, 29)], title: "Spring Training Begins", section: 2},
{dates: [new Date(2012, 3, 9), new Date(2012, 3, 11)], title: "Atlanta Braves @ Houston Astros", section: 1}
];
```

Parameters
* dates: required. either a single date or a pair of dates if it covers a span of time.
* title: required. the hover text you get on the title.
* section: optional. If you choose to add sections (see below), then this will be the id of the section to associate this event with. Currently, this is only being used to correct hover states, but there may be more functionality in the future
* attrs: optional. any raphael.js attrs that you want applied to this specific element. If you have general attrs to apply to events, us the eventAttrs option to initializing Chronoline.

```javascript
// sections are represented by a background color over part of the timeline. They are optional
var sections = [
{dates: [new Date(2011, 2, 31), new Date(2011, 9, 28)],
 title: "2011 MLB Season",
 section: 0,
 attrs: {fill: "#d4e3fd"}
},
{dates: [new Date(2012, 2, 28), new Date(2012, 9, 3)],
 title: "2012 MLB Regular Season",
 section: 1,
 attrs: {fill: "#d4e3fd"}
},
{dates: [new Date(2012, 1, 29), new Date(2012, 3, 4)],
 title: "Spring Training",
 section: 2,
 attrs: {fill: "#eaf0fa"}
},
{dates: [new Date(2012, 9, 4), new Date(2012, 9, 31)],
 title: "2012 MLB Playoffs",
 section: 3,
 attrs: {fill: "#eaf0fa"}
}
];
```

Parameters
* dates: required. Similar to events, except that it requires 2 dates
* title: required. The title, which will appear at the top of the section
* section: optional. id of the section, to which events bind
* attrs: recommended. You should at least pass a fill color to it to distinguish it from nothing

```javascript
// actually creating the timeline. Also nessary
var timeline = new Chronoline(document.getElementById("target1"), events,
    {animated: true, sections: sections});
```

Parameters
1. dom element to drop the timeline into
2. the events array
3. options. See the defaults in chronoline.js to see all available options. There are a lot, and I only anticipate them growing.

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
* Internet Explorer 8+ (except the tooltips)
* Firefox 12+
* Chrome 18+

Credits
-------
* Built by and for [Zanbato](https://zanbato.com). [Ping us](https://zanbato.com/careers/) if you're interested in working with us!
* Developed by [Kevin Leung](http://kevinleung.com)
* Designed by [Deny Khoung](http://twitter.com/#!/denykhoung)
* Additional help from Dan Settel and Brandon Kwock
