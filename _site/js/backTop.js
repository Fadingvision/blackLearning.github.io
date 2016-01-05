var myNameSpace = {};
    myNameSpace.util = (function() {
        function BackTop(el, opts) {
            opts = opts || {};
            this.speed = opts.speed || BackTop.DEFAULTS.speed;
            this.mode = opts.mode || BackTop.DEFAULTS.mode;
            this.position = opts.position || BackTop.DEFAULTS.position;
            this.el = (typeof el === 'string') ? document.getElementById(el) : el;
            this.timer = null;
            this.stop = true;
            var that = this;
            this.el.onclick = function() {
                if (that.mode === 'move') {
                    that._scrollToTop();
                } else {
                    that._goToTop();
                }
            };

            window.onscroll = function() {
                //返回过程中用户可操作停止滚动
                if (that.stop) {
                    clearInterval(that.timer);
                }
                that.stop = true;
                // 滚动条高度大于可视区时隐藏按钮
                that._checkPositon();
            };
        }
        // 默认参数
        // 公有静态成员 
        BackTop.DEFAULTS = {
            speed: 30,
            mode: 'move', // move为运动返回顶部，go为直接返回顶部
            position: document.documentElement.clientHeight || document.body.clientHeight // 出现返回顶部按钮的位置
        };

        BackTop.prototype = {
            // _下划线用来向用户表明不应该检查或修改该方法
            // 滚动到顶部.. 
            _scrollToTop: function() {
            	var that = this;
                this.timer && clearInterval(this.timer);
                this.timer = setInterval(function() {
                    var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
                    if (scrollTop != 0) {
                        that.stop = false;
                        var speed = Math.ceil(scrollTop / 5); // math.ceil让滚动条能最终滚动到0
                        scrollTop -= speed;
                        document.documentElement.scrollTop = scrollTop;
                        document.body.scrollTop = scrollTop;
                    } else {
                        clearInterval(that.timer);
                        that.timer = null;
                    }
                }, this.speed);
            },
            _goToTop: function() {
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
            },
            _checkPositon: function() {
                // 滚动条高度大于可视区时隐藏按钮
                var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
                if (scrollTop > this.position) {
                    this.el.style.display = "block";
                } else {
                    this.el.style.display = "none";
                }
            }
        };
        return {
            BackTop: BackTop
        };
    })();
