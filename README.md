chronoline.js
=============

chronoline.js is a library for making a chronology timeline out of events on a horizontal timescale.

Currently, chronoline.js only requires raphael.js to function. jQuery/qTip2 are used to provide nicer tooltips, but these aren't required.

To use it, provide a target element and an array of dates (possible ranges) with event descriptions, and it will render the contents of the timeline.

There are a variety of options provided, which you can see in the JavaScript itself. They are currently (and will likely always be) quite idiosyncratic and represent the degrees of control needed for the projects this has been used for.

A few notes on implementation:
* the smallest resolution you can get is days. In fact, all time information is stripped out of incoming dates
* all calculations are done in UTC. I encountered some problems with time zones, and the easiest solution was to ignore them. This is presumably okay because we're not maintaining time zone information anyways
* labels and hashes are only drawn as necessary. There are some pretty severe performance concerns (at least in FF in Ubuntu)