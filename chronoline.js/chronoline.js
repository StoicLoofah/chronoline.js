var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatDate(date, formatString){
    // done in the style of c's strftime
    // TODO slowly adding in new parts to this
    // note that this also doesn't escape things properly. sorry
    var ret = formatString;
    if(formatString.indexOf('%d') != -1){
        var dateNum = date.getDate().toString();
        if(dateNum.length < 2)
            dateNum = '0' + dateNum;
        ret = ret.replace('%d', dateNum);
    }
    if(formatString.indexOf('%b') != -1){
        var month = monthNames[date.getMonth()].substring(0, 3);
        ret = ret.replace('%b', month);
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

function Chronoline(domElement, events, options) {
    DAY_IN_MILLISECONDS = 86400000;

    var defaults = {
        defaultStartDate: null,
        startDate: null,
        endDate: null,
        visibleSpan: 2592000000,  // in milliseconds,
        barHeight: 8,  //
        barMargin: 4,  //
        dateLabelHeight: 50, //
        topMargin: 10,
        fillColor: '#0055e1',
        strokeColor: '#0055e1',
        labelFormat: '%d',
        subLabel: 'month',
        subLabelMargin: 2,
        labelInterval: 'day',
        hashLength: 2,
        fontSize: 10,
        scrollable: true,
        scrollInterval: 7,
        animated: false,  // requires jQuery
        tooltips: false,
        markToday: false
    }
    var t = this;

    // FILL DEFAULTS
    for(var attrname in defaults){ t[attrname] = defaults[attrname];}
    for(var attrname in options){ t[attrname] = options[attrname];}

    t.domElement = domElement;

    t.wrapper = document.createElement('div');
    t.wrapper.className = 'chronoline-wrapper';
    t.domElement.appendChild(t.wrapper);

    t.events = events;

    // SORT THE DATES SO I CAN POSITION THEM
    t.events.sort(function(a, b){
        a = a[0];
        b = b[0];

        var aEnd = a[a.length - 1].getTime();
        var bEnd = b[b.length - 1].getTime();
        if(aEnd != bEnd){
            return aEnd - bEnd;
        }
        return a[0].getTime() - b[0].getTime();
    });

    // SPLIT THE DATES INTO THE ROW THAT THEY BELONG TO
    // TODO
    // this is a greedy algo that definitely isn't optimal
    // it at least needs to find the latest row that still fits
    // this, however, may cause very strange behavior (everything being on the 2nd line),
    // so I'm going to prefer this in the short term
    t.eventRows = [[]];
    t.rowLastDates = [0];

    for(var i = 0; i < t.events.length; i++){
        var found = false;
        var startTime = t.events[i][0][0].getTime();
        for(var j = 0; j < t.eventRows.length; j++){
            if(t.rowLastDates[j] < startTime){
                t.eventRows[j].push(t.events[i]);
                t.rowLastDates[j] = getEndDate(t.events[i][0]).getTime();
                found = true;
                break;
            }
        }
        if(!found){
            t.eventRows.push([t.events[i]]);
            t.rowLastDates.push(getEndDate(t.events[i][0]).getTime());
        }
    }

    // CALCULATING MORE THINGS
    t.myCanvas = document.createElement('div');
    t.myCanvas.className = 'chronoline-canvas';
    t.wrapper.appendChild(t.myCanvas);

    t.today = new Date(Date.now());
    t.today.setHours(0);
    t.today.setMinutes(0);
    t.today.setSeconds(0);
    t.today.setMilliseconds(0);

    if(t.defaultStartDate == null){
        t.defaultStartDate = t.today;
    }

    if(t.startDate == null){
        t.startDate = t.events[0][0][0];
    }
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

    // this ratio converts a time into a pixel position
    t.pixelRatio = t.wrapper.clientWidth / t.visibleSpan;
    t.totalWidth = t.pixelRatio * (t.endDate - t.startDate);

    t.totalHeight = t.dateLabelHeight + t.eventRows.length * (t.barMargin + t.barHeight) + t.topMargin;

    t.paper = Raphael(t.myCanvas, t.totalWidth, t.totalHeight);
    t.paperElem = t.myCanvas.childNodes[0];
    t.paperElem.style.left = - (t.defaultStartDate - t.startDate) * t.pixelRatio + 20 + 'px';

    // DRAWING
    t.circleRadius = t.barHeight / 2;

    // drawing events
    for(var row = 0; row < t.eventRows.length; row++){
        var upperY = t.topMargin + t.totalHeight - t.dateLabelHeight - (row + 1) * (t.barMargin + t.barHeight);
        for(var col = 0; col < t.eventRows[row].length; col++){
            var event = t.eventRows[row][col];
            var startX = (event[0][0].getTime() - t.startTime) * t.pixelRatio;
            var elem = null;
            if(event[0].length == 1){  // it's a single point
                elem = t.paper.circle(startX, upperY + t.circleRadius, t.circleRadius).attr('fill', t.fillColor).attr('stroke', t.strokeColor);
            } else {  // it's a range
                var width = (getEndDate(event[0]) - event[0][0]) * t.pixelRatio;
                // left rounded corner
                t.paper.circle(startX, upperY + t.circleRadius, t.circleRadius).attr('fill', t.fillColor).attr('stroke', t.strokeColor);
                // right rounded corner
                t.paper.circle(startX + width, upperY + t.circleRadius, t.circleRadius).attr('fill', t.fillColor).attr('stroke', t.strokeColor);
                elem = t.paper.rect(startX, upperY, width, t.barHeight).attr('fill', t.fillColor).attr('stroke', t.strokeColor);

            }

            elem.attr('title', event[1]);
            if(t.tooltips){
                $(elem.node).parent().qtip({
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

                });
            }
        }
    }

    var dateLineY = t.topMargin + t.totalHeight - t.dateLabelHeight;
    t.paper.path('M0,' + dateLineY + 'L' + t.totalWidth + ',' + dateLineY);

    // date labels
    var bottomHashY = dateLineY + t.hashLength;
    var subLabelY = bottomHashY + t.fontSize * 2 + t.subLabelMargin;
    var curDate = t.startDate;
    while(curDate < t.endDate){
        curDate = new Date(curDate.getTime() + DAY_IN_MILLISECONDS);
        var x = (curDate.getTime() - t.startTime) * t.pixelRatio;
        t.paper.path('M' + x + ',' + dateLineY + 'L' + x + ',' + bottomHashY);

        var label = t.paper.text(x, bottomHashY + t.fontSize, formatDate(curDate, '%d'));
        label.attr('font-size', t.fontSize);
        if(t.markToday && curDate.getTime() == t.today.getTime()){
            label.attr('text', label.attr('text') + '\n' + formatDate(curDate, '%b').toUpperCase());
            label.attr('font-size', t.fontSize + 2);
            label.attr('y', bottomHashY + t.fontSize + 5);
            var bbox = label.getBBox();
            var labelBox = t.paper.rect(bbox.x - 2, bbox.y - 2, bbox.width + 4, bbox.height + 4);
            labelBox.attr('fill', '90-#f4f4f4-#e8e8e8');
            labelBox.insertBefore(label);
        }
        if(curDate.getDate() == 1 && t.subLabel == 'month'){
            var subLabel = t.paper.text(x, subLabelY, formatDate(curDate, '%b').toUpperCase()).attr('font-size', t.fontSize);
        }
    }

    // CREATING THE NAVIGATION
    if(t.scrollable){
        t.scrollDistance = t.scrollInterval * DAY_IN_MILLISECONDS * t.pixelRatio;

        t.leftArrow = document.createElement('div');
        t.leftArrow.className = 'chronoline-left';
        t.leftArrow.onclick = function(){
            var left = Math.min(getLeft(t.paperElem) + t.scrollDistance, 0);

            if(t.animated){
                jQuery(t.paperElem).animate({left: left});
            } else {
                t.paperElem.style.left = left + 'px';
            }
            return false;
        };

        var leftArrowIcon = document.createElement('div');
        leftArrowIcon.className = 'chronoline-left-icon';
        t.leftArrow.appendChild(leftArrowIcon);
        t.wrapper.appendChild(t.leftArrow);

        var iconMargin = (t.totalHeight - 10) / 2;
        leftArrowIcon.style.marginTop = iconMargin + 'px';

        t.rightArrow = document.createElement('div');
        t.rightArrow.className = 'chronoline-right';
        t.rightArrow.onclick = function(){
            var left = Math.max(getLeft(t.paperElem) - t.scrollDistance, t.wrapper.clientWidth - t.totalWidth );
            if(t.animated){
                jQuery(t.paperElem).animate({left: left});
            } else {
                t.paperElem.style.left = left + 'px';
            }
            return false;
        };

        var rightArrowIcon = document.createElement('div');
        rightArrowIcon.className = 'chronoline-right-icon';
        t.rightArrow.appendChild(rightArrowIcon);
        t.wrapper.appendChild(t.rightArrow);
        rightArrowIcon.style.marginTop = iconMargin + 'px';

    }

}