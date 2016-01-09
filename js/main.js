$(function(){
	// 调用日历
	var calendar = $('#calendar')[0];
	new Calendar(calendar);

	// 侧边栏固定
	var $scrollPos = $('#scrollPos');
	// 距离页面顶部和左边的位置
	var sideBarLeft = $scrollPos.offset().left;
	var sideBartop = $scrollPos.offset().top;
	$(window).scroll(function(){
		var top = $(document).scrollTop();
		if(top > sideBartop){
			$scrollPos.css({position: 'fixed', left: sideBarLeft, top: 5, width: 360});
		} else {
			$scrollPos.css({position: 'static', width: 'auto'});
		}
	});

	// 回到顶部调用
	new myNameSpace.util.BackTop('backTop', {
		speed: 30,   // 滚动速度，mode为'move'时有效 
		mode: 'move', // move为运动返回顶部，go为直接返回顶部
		position: document.documentElement.clientHeight || document.body.clientHeight // 出现返回顶部按钮的位置
	});

	var $imgs = $('.post-pic img');

	for (var i = 0, len = $imgs.length; i < len; i++) {
		if($imgs.eq(i).attr('src') === ''){
			$imgs.eq(i).remove();
		}
	}
});