DAY_IN_MILLISECONDS = 86400000;

var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function stripTime(date){
    date.setUTCHours(0);
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
}

function formatDate(date, formatString){
    // done in the style of c's strftime
    // TODO slowly adding in new parts to this
    // note that this also doesn't escape things properly. sorry
    var ret = formatString;
    if(formatString.indexOf('%d') != -1){
        var dateNum = date.getUTCDate().toString();
        if(dateNum.length < 2)
            dateNum = '0' + dateNum;
        ret = ret.replace('%d', dateNum);
    }
    if(formatString.indexOf('%b') != -1){
        var month = monthNames[date.getUTCMonth()].substring(0, 3);
        ret = ret.replace('%b', month);
    }
    if(formatString.indexOf('%Y') != -1){
        ret = ret.replace('%Y', date.getUTCFullYear());
    }

    return ret;
}

function getLeft(elem){
    var leftString = elem.style.left;
    return parseInt(leftString.substring(0, leftString.length - 2));
}

function getEndDate(dateArray){
    return dateArray[dateArray.length - 1];
}

function isFifthDay(date){
    var day = date.getUTCDate();
    return (day == 1 || day % 5 == 0) && day != 30;
}

function isHalfMonth(date){
    var day = date.getUTCDate();
    return day == 1 || day == 15;
}

function prevMonth(date){
    var newDate = new Date(date.getTime() - DAY_IN_MILLISECONDS);
    return new Date(Date.UTC(newDate.getUTCFullYear(), newDate.getUTCMonth(), 1));
}

function nextMonth(date){
    var newDate = new Date(date.getTime() + DAY_IN_MILLISECONDS);
    return new Date(Date.UTC(newDate.getUTCFullYear(), newDate.getUTCMonth() + 1, 1));
}

function prevQuarter(date){
    var newDate = new Date(date - DAY_IN_MILLISECONDS);
    var month = newDate.getMonth();
    return new Date(Date.UTC(newDate.getUTCFullYear(), month - month % 3, 1));
}

function nextQuarter(date){
    var newDate = new Date(date.getTime() + DAY_IN_MILLISECONDS);
    var month = newDate.getUTCMonth();
    return new Date(Date.UTC(newDate.getUTCFullYear(), month - month % 3 + 3, 1));
}

function backWeek(date){
    return new Date(date - DAY_IN_MILLISECONDS * 7);
}

function forwardWeek(date){
    return new Date(date.getTime() + DAY_IN_MILLISECONDS * 7);
}

function Chronoline(domElement, events, options) {

    var defaults = {
        defaultStartDate: null,  // the date furthest to the left on load. Defaults to today
        startDate: null,  // start of the timeline. Defaults to first event date
        endDate: null,  // end of the timeline. Defauls to the last event date

        visibleSpan: 2592000000,  // in milliseconds,

        topMargin: 40,  // overhead space on the canvas. useful for additional content
        eventHeight: 5,  // how tall event events are
        eventMargin: 4,  // how far apart the events are
        dateLabelHeight: 50, // how tall the bottom margin for the dates is
        hashLength: 4,  // length of the hash marks for the days
        minEventsHeight: 40,
        maxEventsHeight: 1000,

	hashColor: '#b8b8b8',

        eventAttrs: {
            fill: '#0055e1',
            stroke: '#0055e1',
            "stroke-width": 2
        },

        hashInterval: null,
        labelInterval: null,
        labelFormat: '%d',

        subLabel: 'month',
        subLabelMargin: 2,
        subLabelAttrs: {'font-weight': 'bold'},
        floatingSubLabels: true,

        fontAttrs: {
	    'font-size': 10,
	    fill: '#000000'
	},
        scrollable: true,
        scrollLeft: backWeek,
        scrollRight: forwardWeek,
        animated: false,

        tooltips: false,
        markToday: 'line',
        todayAttrs: {'stroke': '#484848'},

        sections: null,
        floatingSectionLabels: true,
        sectionLabelAttrs: {},
        sectionLabelsOnHover: true
    }
    var t = this;

    // FILL DEFAULTS
    for(var attrname in defaults){ t[attrname] = defaults[attrname];}
    for(var attrname in options){ t[attrname] = options[attrname];}

    t.domElement = domElement;

    t.wrapper = document.createElement('div');
    t.wrapper.className = 'chronoline-wrapper';
    t.domElement.appendChild(t.wrapper);

    // SORT THE DATES SO I CAN POSITION THEM
    t.sortEvents = function(a, b){
        a = a[0];
        b = b[0];

        var aEnd = a[a.length - 1].getTime();
        var bEnd = b[b.length - 1].getTime();
        if(aEnd != bEnd){
            return aEnd - bEnd;
        }
        return a[0].getTime() - b[0].getTime();
    };

    // need to get them to UTC
    for(var i = 0; i < events.length; i++){
        for(var j = 0; j < events[i][0].length; j++){
            stripTime(events[i][0][j]);
        }
    }
    t.events = events;
    t.events.sort(t.sortEvents);

    if(t.sections != null){
        for(var i = 0; i < t.sections.length; i++){
            for(var j = 0; j < t.sections[i][0].length; j++){
                stripTime(t.sections[i][0][j]);
            }
        }
        t.sections.sort(t.sortEvents);
    }


    // CALCULATING MORE THINGS
    t.myCanvas = document.createElement('div');
    t.myCanvas.className = 'chronoline-canvas';
    t.wrapper.appendChild(t.myCanvas);

    t.today = new Date(Date.now());
    stripTime(t.today);

    if(t.defaultStartDate == null){
        t.defaultStartDate = t.today;
    }

    if(t.startDate == null){
        t.startDate = t.events[0][0][0];
        for(var i = 1; i < t.events.length; i++)
            if(t.events[i][0][0] < t.startDate)
                t.startDate = t.events[i][0][0];
    }
    stripTime(t.startDate);

    if(t.startDate > t.defaultStartDate)
        t.startDate = t.defaultStartDate;
    t.startDate = new Date(t.startDate.getTime() - 86400000);
    t.startTime = t.startDate.getTime();

    if(t.endDate == null){
        t.endDate = getEndDate(t.events[0][0]);
        for(var i = 1; i < t.events.length; i++)
            if(getEndDate(t.events[i][0]) > t.endDate)
                t.endDate = getEndDate(t.events[i][0]);
    }
    if(t.endDate < t.defaultStartDate)
        t.endDate = t.defaultStartDate;
    t.endDate = new Date(t.endDate.getTime() + 86400000);
    stripTime(t.endDate);

    // this ratio converts a time into a pixel position
    t.visibleWidth = t.wrapper.clientWidth;
    t.pixelRatio = t.visibleWidth / t.visibleSpan;
    t.totalWidth = t.pixelRatio * (t.endDate.getTime() - t.startDate.getTime());
    t.maxLeftPixel = t.totalWidth - t.visibleWidth;

    t.pixelToMs = function(pixel){
        return t.startTime + pixel / t.pixelRatio;
    }
    t.msToPixel = function(ms){
        return (ms - t.startTime) * t.pixelRatio;
    }

    t.circleRadius = t.eventHeight / 2;

    // SPLIT THE DATES INTO THE ROW THAT THEY BELONG TO
    // TODO
    // this is a greedy algo that definitely isn't optimal
    // it at least needs to find the latest row that still fits
    // this, however, may cause very strange behavior (everything being on the 2nd line),
    // so I'm going to prefer this in the short term
    t.eventRows = [[]];
    t.rowLastPixels = [0];

    for(var i = 0; i < t.events.length; i++){
        var found = false;
        var startPixel = t.msToPixel(t.events[i][0][0].getTime()) - t.circleRadius;
        for(var j = 0; j < t.eventRows.length; j++){
            if(t.rowLastPixels[j] < startPixel){
                t.eventRows[j].push(t.events[i]);
                t.rowLastPixels[j] = t.msToPixel(getEndDate(t.events[i][0]).getTime()) + t.circleRadius;
                found = true;
                break;
            }
        }
        if(!found){
            t.eventRows.push([t.events[i]]);
            t.rowLastPixels.push(t.msToPixel(getEndDate(t.events[i][0]).getTime()) + t.circleRadius);
        }
    }

    // a few more calculations and creation

    t.eventsHeight = Math.max(Math.min(t.eventRows.length * (t.eventMargin + t.eventHeight), t.maxEventsHeight), t.minEventsHeight);
    t.totalHeight = t.dateLabelHeight + t.eventsHeight + t.topMargin;

    t.paper = Raphael(t.myCanvas, t.totalWidth, t.totalHeight);
    t.paperElem = t.myCanvas.childNodes[0];

    // DRAWING
    t.floatingSet = t.paper.set();
    t.sectionLabelSet = t.paper.set();
    // drawing sections
    if(t.sections != null){
        for(var i = 0; i < t.sections.length; i++){
            var section = t.sections[i];
            var startX = (section[0][0].getTime() - t.startTime) * t.pixelRatio;
            var width = (section[0][1] - section[0][0]) * t.pixelRatio;
            var elem = t.paper.rect(startX, 0, width, t.totalHeight);
            elem.attr('stroke-width', 0);
            elem.attr('stroke', '#ffffff');
            elem.attr('fill', section[2]);

            var sectionLabel = t.paper.text(startX + 10, 10, section[1]);
            sectionLabel.attr('text-anchor', 'start');
            sectionLabel.attr(t.sectionLabelAttrs);
            if(t.floatingSectionLabels){
                sectionLabel.data('left-bound', startX + 10);
                sectionLabel.data('right-bound', startX + width - sectionLabel.attr('width'));
                t.floatingSet.push(sectionLabel);
                t.sectionLabelSet.push(sectionLabel);
            }

            elem.data('label', sectionLabel);

            if(t.sectionLabelsOnHover){
                elem.hover(function(){this.data('label').animate({opacity: 1}, 200);},
                           function(){this.data('label').animate({opacity: 0}, 200);});
                sectionLabel.attr('opacity', 0);
            }

        }
    }

    t.sectionLabelSet.forEach(function(label){
        label.toFront();
    });

    // drawing events
    for(var row = 0; row < t.eventRows.length; row++){
        var upperY = t.totalHeight - t.dateLabelHeight - (row + 1) * (t.eventMargin + t.eventHeight);
        for(var col = 0; col < t.eventRows[row].length; col++){
            var event = t.eventRows[row][col];
            var startX = (event[0][0].getTime() - t.startTime) * t.pixelRatio;
            var elem = null;
            if(event[0].length == 1){  // it's a single point
                elem = t.paper.circle(startX, upperY + t.circleRadius, t.circleRadius).attr(t.eventAttrs);
            } else {  // it's a range
                var width = (getEndDate(event[0]) - event[0][0]) * t.pixelRatio;
                t.paper.circle(startX, upperY + t.circleRadius, t.circleRadius).attr(t.eventAttrs);  // left rounded corner
                t.paper.circle(startX + width, upperY + t.circleRadius, t.circleRadius).attr(t.eventAttrs);  // right rounded corner
                elem = t.paper.rect(startX, upperY, width, t.eventHeight).attr(t.eventAttrs);
            }

            elem.attr('title', event[1]);
            if(t.tooltips){
                $(elem.node).parent().qtip({
                    content: {
                        title: event[2]
                    },
                    position: {
			my: 'top left',
			target: 'mouse',
			viewport: $(window), // Keep it on-screen at all times if possible
			adjust: {
			    x: 10,  y: 10
			}
		    },
		    hide: {
			fixed: true // Helps to prevent the tooltip from hiding ocassionally when tracking!
		    },
                    style: {
                        classes: 'ui-tooltip-shadow ui-tooltip-dark ui-tooltip-rounded',
                    }
                });
            }
            if(t.sections != null && t.sectionLabelsOnHover){
                var originalIndex = event[3];
                var newIndex = 0;
                for(var i = 0; i < t.sections.length; i++){
                    if(t.sections[i][3] == originalIndex){
                        elem.data('sectionLabel', t.sectionLabelSet[i]);
                        break;
                    }
                }
                elem.hover(function(){this.data('sectionLabel').animate({opacity: 1}, 200);},
                           function(){this.data('sectionLabel').animate({opacity: 0}, 200);});
            }
        }
    }

    var dateLineY = t.totalHeight - t.dateLabelHeight;
    var baseline = t.paper.path('M0,' + dateLineY + 'L' + t.totalWidth + ',' + dateLineY);
    baseline.attr('stroke', t.hashColor);

    t.bottomHashY = dateLineY + t.hashLength;
    t.labelY = t.bottomHashY + t.fontAttrs['font-size'];
    t.subLabelY = t.bottomHashY + t.fontAttrs['font-size'] * 2 + t.subLabelMargin;

    // date labels
    t.drawLabelsHelper = function(startMs, endMs){
        for(var curMs = startMs; curMs < endMs; curMs += DAY_IN_MILLISECONDS){
            var curDate = new Date(curMs);
            var day = curDate.getUTCDate();
            var x = t.msToPixel(curMs);

            if(t.hashInterval == null || t.hashInterval(curDate)){
            var hash = t.paper.path('M' + x + ',' + dateLineY + 'L' + x + ',' + t.bottomHashY);
	    hash.attr('stroke', t.hashColor);
            }

            if(t.labelInterval == null || t.labelInterval(curDate)){
                var displayDate = String(day);
                if(displayDate.length == 1)
                    displayDate = '0' + displayDate;

                var label = t.paper.text(x, t.labelY, displayDate);
                label.attr(t.fontAttrs);
            }
            if(t.markToday && curMs == t.today.getTime()){
                if(t.markToday == 'labelBox'){
                    label.attr({'text': label.attr('text') + '\n' + formatDate(curDate, '%b').toUpperCase(),
                                'font-size': t.fontAttrs['font-size'] + 2,
                                'y': t.bottomHashY + t.fontAttrs['font-size'] + 5});
                    var bbox = label.getBBox();
                    var labelBox = t.paper.rect(bbox.x - 2, bbox.y - 2, bbox.width + 4, bbox.height + 4);
                    labelBox.attr('fill', '90-#f4f4f4-#e8e8e8');
                    labelBox.insertBefore(label);
                }else if(t.markToday == 'line'){
                    var line = t.paper.path('M' + x + ',0L' + x + ',' + dateLineY);
                    line.attr(t.todayAttrs);
                }
            }

            if(day == 1 && t.subLabel == 'month'){
                var subLabel = t.paper.text(x, t.subLabelY, formatDate(curDate, '%b').toUpperCase());
                subLabel.attr(t.fontAttrs);
                subLabel.attr(t.subLabelAttrs);
                if(t.floatingSubLabels){
                    subLabel.data('left-bound', x);
                    var endOfMonth = new Date(Date.UTC(curDate.getUTCFullYear(), curDate.getUTCMonth() + 1, 0));
                    subLabel.data('right-bound',
                                  Math.min((endOfMonth.getTime() - t.startTime) * t.pixelRatio - 5,
                                           t.totalWidth));
                    t.floatingSet.push(subLabel);
                }
            }
        }
    }

    t.drawnStartMs = null;
    t.drawnEndMs = null;
    t.drawLabels = function(leftPixelPos){
        var newStartPixel = Math.max(0, leftPixelPos - t.visibleWidth);
        var newEndPixel = Math.min(t.totalWidth, leftPixelPos + 2 * t.visibleWidth);

        var newStartDate = new Date(t.pixelToMs(leftPixelPos));
        newStartDate = new Date(Date.UTC(newStartDate.getUTCFullYear(), newStartDate.getUTCMonth(), 1));

        var newStartMs = newStartDate.getTime();
        var newEndDate = new Date(t.pixelToMs(Math.min(t.totalWidth, leftPixelPos + 2 * t.visibleWidth)));
        stripTime(newEndDate);
        var newEndMs = newEndDate.getTime();

        if(t.drawnStartMs == null){
            t.drawnStartMs = newStartMs;
            t.drawnEndMs = newEndMs;
            t.drawLabelsHelper(newStartMs, newEndMs);
        }else if(newStartMs > t.drawnEndMs){
            t.drawLabelsHelper(t.drawnEndMs, newEndMs);
            t.drawnEndMs = newEndMs;
        }else if(newEndMs < t.drawnStartMs){
            t.drawLabelsHelper(t.drawnStartMs, newStartMs);
            t.drawnStartMs = newStartMs;
        }else {
            if(newStartMs < t.drawnStartMs){
                t.drawLabelsHelper(newStartMs, t.drawnStartMs);
                t.drawnStartMs = newStartMs;
            }
            if(newEndMs > t.drawnEndMs){
                t.drawLabelsHelper(t.drawnEndMs, newEndMs);
                t.drawnEndMs = newEndMs;
            }
        }
    }

    t.isMoving = false;
    t.goToPixel = function(finalLeft) {
        /*
          finalLeft is negative

          I tried several implementations here, including:
          - moving the left of the canvas within a wrapper (current strategy)
          - animating setViewbox using getAnimationFrame
          - animating each individual element using getAnimation frame

          - animating floating content using getAnimation (current strategy)
          - animating floating content using raphael.animate
          This solution is by far the smoothest and doesn't have any asynchrony problems. There's some twitching going on with floating content, but it's not THAT bad
         */
        if(t.isMoving) return;

        finalLeft = Math.min(finalLeft, 0);
        finalLeft = Math.max(finalLeft, -t.maxLeftPixel);
        t.drawLabels(-finalLeft);
        var left = getLeft(t.paperElem);

        if(t.scrollable){
            if(finalLeft == 0){
                t.leftControl.style.display = 'none';
            } else {
                t.leftControl.style.display = '';
            }
            if(finalLeft == t.visibleWidth - t.totalWidth){
                t.rightControl.style.display = 'none';
            } else {
                t.rightControl.style.display = '';
            }
        }

        var movingLabels = [];
        var floatedLeft = -finalLeft + 5;
        t.floatingSet.forEach(function(label){
            // pin to the left side
            if(label.data('left-bound') < floatedLeft && label.data('right-bound') > floatedLeft) {
                movingLabels.push([label, label.attr('x'),
                                   floatedLeft - label.attr('x') + 10]);
            } else if(label.attr('x') != label.data('left-bound')) { // push it to where it should be
                movingLabels.push([label, label.attr('x'),
                    label.data('left-bound') - label.attr('x')]);
            }
        });

        if(t.animated){
            t.isMoving = true;

            requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function( callback ){
                window.setTimeout(callback, 1000 / 60);
              };

            var start = Date.now();

            var elem = t.paperElem;
            function step(timestamp) {
                var progress = (timestamp - start) / 200;
                var pos = (finalLeft - left) * progress + left;
                elem.style.left = pos + "px";

                for(var i = 0; i < movingLabels.length; i++){
                    movingLabels[i][0].attr('x', movingLabels[i][2] * progress + movingLabels[i][1]);
                }

                if (progress < 1) {
                    requestAnimationFrame(step);
                }else{
                    t.paperElem.style.left = finalLeft + "px";
                    for(var i = 0; i < movingLabels.length; i++){
                        movingLabels[i][0].attr('x', movingLabels[i][2] + movingLabels[i][1]);
                    }
                    t.isMoving = false;
                }
            }
            requestAnimationFrame(step);

        }else{
            t.paperElem.style.left = finalLeft + 'px';
            for(var i = 0; i < movingLabels.length; i++){
                movingLabels[i][0].attr('x', movingLabels[i][2] + movingLabels[i][1]);
            }
        }
    }

    t.goToDate = function(date, position){
        /* position is negative for left, 0 for middle, 1 for right */
        if(position < 0){

            t.goToPixel(-t.msToPixel(date.getTime()));
        } else if(position > 0){
            t.goToPixel(-t.msToPixel(date.getTime()) + t.visibleWidth);
        } else {
            t.goToPixel(-t.msToPixel(date.getTime()) + t.visibleWidth / 2);
        }
    }

    // CREATING THE NAVIGATION
    if(t.scrollable){
        t.leftControl = document.createElement('div');
        t.leftControl.className = 'chronoline-left';
        t.leftControl.style.marginTop = t.topMargin + 'px';
        t.leftControl.onclick = function(){
            t.goToDate(t.scrollLeft(new Date(t.pixelToMs(-getLeft(t.paperElem)))), -1);
            return false;
        };

        var leftIcon = document.createElement('div');
        leftIcon.className = 'chronoline-left-icon';
        t.leftControl.appendChild(leftIcon);
        t.wrapper.appendChild(t.leftControl);
        var controlHeight = Math.max(t.eventsHeight,
                                     t.leftControl.clientHeight);
        t.leftControl.style.height =  controlHeight + 'px';
        leftIcon.style.marginTop = (controlHeight - 15) / 2 + 'px';

        t.rightControl = document.createElement('div');
        t.rightControl.className = 'chronoline-right';
        t.rightControl.style.marginTop = t.topMargin + 'px';
        t.rightControl.onclick = function(){
            t.goToDate(t.scrollRight(new Date(t.pixelToMs(-getLeft(t.paperElem)))), -1);
            return false;
        };

        var rightIcon = document.createElement('div');
        rightIcon.className = 'chronoline-right-icon';
        t.rightControl.appendChild(rightIcon);
        t.wrapper.appendChild(t.rightControl);
        t.rightControl.style.height = t.leftControl.style.height;
        rightIcon.style.marginTop = leftIcon.style.marginTop;

    }

    t.goToToday = function(){
        t.goToDate(t.today, 0);
    };

    t.getLeftTime = function(){
        return Math.floor(t.startTime - getLeft(t.paperElem) / t.pixelRatio);
    };

    t.getRightTime = function(){
        return Math.floor(t.startTime - (getLeft(t.paperElem) - t.visibleWidth) / t.pixelRatio);
    };

    t.paperElem.style.left = - (t.defaultStartDate - t.startDate) * t.pixelRatio + 20 + 'px';
    t.goToPixel(getLeft(t.paperElem));
}
