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
        topMargin: 40,
        fillColor: '#0055e1',
        strokeColor: '#0055e1',
        labelFormat: '%d',
        subLabel: 'month',
        subLabelMargin: 2,
        subLabelAttrs: {},
        labelInterval: 'day',
        hashLength: 2,
        fontSize: 10,
        scrollable: true,
        scrollInterval: 7,
        animated: false,
        tooltips: false,
        markToday: false,
        sections: null,
        floatingSectionLabels: true,
        sectionLabelAttrs: {},
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

    t.events.sort(t.sortEvents);
    if(t.sections != null){
        t.sections.sort(t.sortEvents);
    }


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

    t.eventsHeight = t.eventRows.length * (t.barMargin + t.barHeight);
    t.totalHeight = t.dateLabelHeight + t.eventsHeight + t.topMargin;

    t.paper = Raphael(t.myCanvas, t.totalWidth, t.totalHeight);
    t.paperElem = t.myCanvas.childNodes[0];

    // DRAWING
    t.circleRadius = t.barHeight / 2;

    // drawing sections
    if(t.sections != null){
        t.sectionLabelSet = t.paper.set();

        for(var i = 0; i < t.sections.length; i++){
            var section = t.sections[i];
            var startX = (section[0][0].getTime() - t.startTime) * t.pixelRatio;
            var endX = (section[0][1].getTime() - t.startTime) * t.pixelRatio;
            var elem = t.paper.rect(startX, 0, endX, t.totalHeight);
            elem.attr('stroke-width', 0);
            elem.attr('fill', section[2]);

            var text = t.paper.text(startX + 10, 10, section[1]);
            text.attr('text-anchor', 'start');
            text.attr(t.sectionLabelAttrs);
            text.data('left-bound', startX + 10);
            text.data('right-bound', endX);
            t.sectionLabelSet.push(text);
        }
    }

    // drawing events
    for(var row = 0; row < t.eventRows.length; row++){
        var upperY = t.totalHeight - t.dateLabelHeight - (row + 1) * (t.barMargin + t.barHeight);
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

    var dateLineY = t.totalHeight - t.dateLabelHeight;
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
            label.attr({'text': label.attr('text') + '\n' + formatDate(curDate, '%b').toUpperCase(),
                        'font-size': t.fontSize + 2,
                        'y': bottomHashY + t.fontSize + 5});
            var bbox = label.getBBox();
            var labelBox = t.paper.rect(bbox.x - 2, bbox.y - 2, bbox.width + 4, bbox.height + 4);
            labelBox.attr('fill', '90-#f4f4f4-#e8e8e8');
            labelBox.insertBefore(label);
        }

        if(curDate.getDate() == 1 && t.subLabel == 'month'){
            var subLabel = t.paper.text(x, subLabelY, formatDate(curDate, '%b').toUpperCase()).attr('font-size', t.fontSize);
            subLabel.attr(t.subLabelAttrs);
        }
    }

    t.isMoving = false;
    t.goToPixel = function(finalLeft) {
        /*
          I tried several implementations here, including:
          - moving the left of the canvas within a wrapper (current strategy)
          - animating setViewbox using getAnimationFrame
          - animating each individual element using getAnimation frame

          - animating floating content using getAnimation (current strategy)
          - animating floating content using raphael.animate
          This solution is by far the smoothest and doesn't have any asynchrony problems. There's some twitching going on with floating content, but it's not THAT bad
         */
        finalLeft = Math.min(finalLeft, 0);
        finalLeft = Math.max(finalLeft, t.wrapper.clientWidth - t.totalWidth);
        var left = getLeft(t.paperElem);

        if(t.isMoving) return;
        var movingLabels = [];
        if(t.sections != null && t.floatingSectionLabels){
            t.sectionLabelSet.forEach(function(label){
                if(label.data('left-bound') < -finalLeft && label.data('right-bound') > -finalLeft) {
                    movingLabels.push([label, label.attr('x'),
                                       -finalLeft - label.attr('x') + 10]);
                } else if(label.attr('x') != label.data('left-bound')) {
                    movingLabels.push([label, label.attr('x'), Math.max(
                            -finalLeft - label.attr('x') + 10,
                        label.data('left-bound') - label.attr('x'))]);
                }
            });
        }

        if(t.animated){
            t.isMoving = true;

            requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

            var start = Date.now();

            var elem = t.paperElem;
            function step(timestamp) {
                var progress = (timestamp - start) / 400;
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
    t.paperElem.style.left = - (t.defaultStartDate - t.startDate) * t.pixelRatio + 20;
    t.goToPixel(getLeft(t.paperElem));


    // CREATING THE NAVIGATION
    if(t.scrollable){
        t.scrollDistance = t.scrollInterval * DAY_IN_MILLISECONDS * t.pixelRatio;

        t.leftControl = document.createElement('div');
        t.leftControl.className = 'chronoline-left';
        t.leftControl.style.marginTop = t.topMargin + 'px';
        t.leftControl.onclick = function(){
            t.goToPixel(getLeft(t.paperElem) + t.scrollDistance);
            return false;
        };

        var leftIcon = document.createElement('div');
        leftIcon.className = 'chronoline-left-icon';
        t.leftControl.appendChild(leftIcon);
        t.wrapper.appendChild(t.leftControl);
        var controlHeight = Math.max(t.eventsHeight + t.dateLabelHeight / 2,
                                     t.leftControl.clientHeight);
        t.leftControl.style.height =  controlHeight + 'px';
        leftIcon.style.marginTop = (controlHeight - 15) / 2 + 'px';

        t.rightControl = document.createElement('div');
        t.rightControl.className = 'chronoline-right';
        t.rightControl.style.marginTop = t.topMargin + 'px';
        t.rightControl.onclick = function(){
            t.goToPixel(getLeft(t.paperElem) - t.scrollDistance);
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
        t.goToPixel(-(t.today.getTime() - t.startTime) * t.pixelRatio + t.wrapper.clientWidth / 2);
    };

    t.getLeftTime = function(){
        return Math.floor(t.startTime - getLeft(t.paperElem) / t.pixelRatio);
    };

    t.getRightTime = function(){
        return Math.floor(t.startTime - (getLeft(t.paperElem) - t.wrapper.clientWidth) / t.pixelRatio);
    };

}