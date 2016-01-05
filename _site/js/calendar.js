;(function(window, undefined){
	var Calendar = function(calendarBox, year, month){
		var now = new Date();
		this.year = year || now.getFullYear();
		this.month = month || now.getMonth() + 1;
		this.day = now.getDate();
		this.calendar = calendarBox;
		this.init();
	};
	Calendar.prototype = {
		init: function(){
			var _that = this,
				prevMonth = document.getElementById('prevMonth'),
				nextMonth = document.getElementById('nextMonth'),
				prevYear = document.getElementById('prevYear'),
				nextYear = document.getElementById('nextYear');

			this.showCalendar(this.year, this.month, this.day);
			prevMonth.onclick = function(){
				_that.changeMonth('prev');
			};
			nextMonth.onclick = function(){
				_that.changeMonth('next');
			};
			prevYear.onclick = function(){
				_that.changeYear('prev');
			};
			nextYear.onclick = function(){
				_that.changeYear('next');
			};
			this.dateBox.onclick = function(event) {
				var event = event || window.event,
				target = event.target || event.srcElement;
				if(target.tagName.toLowerCase() === 'td'){
					var day = parseInt(target.innerHTML, 10);
					_that.changeDay(day);
				}
			};
			this.dateYear.onblur = function() {
				if(/^[0-9]{4}$/g.test(this.value)){
					_that.year = parseInt(this.value);
					_that.showCalendar(_that.year, _that.month, _that.day);
				} else {
					alert("请输入正确的年份！(四位数字)");
					this.value = _that.year + '';
					return false;
				}
			};
			this.dateMonth.onblur = function() {
				if(/^(0?[[1-9]|1[0-2])$/g.test(this.value)){
					_that.month = parseInt(this.value);
					_that.showCalendar(_that.year, _that.month, _that.day);
				} else {
					alert("请输入正确的月份！");
					this.value = _that.month + '';
					return false;
				}
			};

		},
		showCalendar: function(year, month, day){
			this.dateBox = this.calendar.getElementsByTagName('tbody')[0];
			this.dateTable = this.dateBox.getElementsByTagName('td');
			this.dateYear = document.getElementById('dateYear');
			this.dateMonth = document.getElementById('dateMonth');
			var len = this.dateTable.length,
				i = this.weekCaculate(year, month),
				daysNum = this.DaysCaculate(year, month), 
				countNum = 1,
				currentNum = this.clearCalendar();
			

			// 设置日期
			for (; i < len; i++) {
				this.dateTable[i].innerHTML = countNum + '';
				if(currentNum === countNum){
					this.dateTable[i].className = 'current';
				}
				if( countNum === daysNum){
					break;
				}else{
					countNum++;
				}
			}
			// 设置年月
			dateYear.value = year;
			dateMonth.value = month;
		},
		// 清空日期
		clearCalendar: function() {
			var dateBox = this.dateBox,
				dateTable = this.dateTable,
				len = dateTable.length,
				currentNum;
			for (var j = 0; j < len; j++) {
				if(dateTable[j].className === 'current'){
					currentNum = parseInt(dateTable[j].innerHTML, 10);
				}
				dateTable[j].innerHTML = "";
				dateTable[j].className = "";
			}

			currentNum = currentNum || new Date().getDate();
			return currentNum;
		},
		// 判断闰年
		isLeapYear: function(y){
			return (y > 0) && !(y % 4) && ((y % 100) || (y % 400));
		},
		// 判断一个月的天数
		DaysCaculate: function(year,month){
			if( typeof month !== 'number' && (month < 0 || month > 12) ){
				return false;
			}
			switch(month){
				case 1:
				case 3:
				case 5:
				case 7:
				case 8:
				case 10:
				case 12:
					return 31;
				case 2:
					return (this.isLeapYear(year) ? 29 : 28);
				default:
					return 30;
			}
		},
		// 判断1号是星期几
		weekCaculate: function(year,month){
			var date = new Date();
			date.setFullYear(year);
			date.setMonth(month-1);
			date.setDate(1);
			return date.getDay();
		},

		// 切换月份
		changeMonth: function(direction){
			if(direction === 'next') {
				if(this.month < 12){
					this.month += 1;
					this.showCalendar(this.year, this.month);
				}else{
					this.month = 1;
					this.year += 1;
					this.showCalendar(this.year, this.month);
				}
			}else if(direction === 'prev') {
				if(this.month > 1){
					this.month -= 1;
					this.showCalendar(this.year, this.month);
				}else{
					this.month = 12;
					this.year -= 1;
					this.showCalendar(this.year, this.month);
				}
			}
			
		},
		// 切换年份
		changeYear: function(direction) {
			if(direction === 'next') {
				this.year += 1;
				this.showCalendar(this.year, this.month);
			}else if(direction === 'prev') {
				this.year -= 1;
				this.showCalendar(this.year, this.month);
			}
		},
		// 切换天数
		changeDay: function(day){
			var dateBox = this.dateBox,
				dateTable = this.dateTable,
				week = this.weekCaculate(this.year, this.month),
				daysNum = this.DaysCaculate(this.year, this.month), 
				len = week + daysNum;
			for (var i = week; i < len; i++) {
				if(dateTable[i].className === 'current'){
					dateTable[i].className = "";
				}
			}
			for (var i = week; i < len; i++) {
				if(parseInt(dateTable[i].innerHTML, 10) === day){
					dateTable[i].className = 'current';
				}
			}
		}
	};
	window.Calendar = Calendar;

})(window);