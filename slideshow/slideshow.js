(function() {
	if (Function.prototype.bind !== 'function'){
		Function.prototype.bind = function(bind) {
			var self = this;
			return function () {
				var args = Array.prototype.slice.call(arguments);
				return self.apply(bind || null, args);
			};
		}
	}
})();

(function(){

	var transform = xtag.prefix.js + 'Transform',
		currentTimeout = 0,
		getState = function(el){
			var selected = xtag.query(el, 'x-slides > x-slide[selected="true"]')[0] || 0;
			return [selected ? xtag.query(el, 'x-slides > x-slide').indexOf(selected) : selected, el.firstElementChild.children.length - 1];
		},
		validSlide = function(el,index){
			if (index < 0) return 0;
			var slides = getState(el)[1];
			if (index > slides) {
				return slides;
			}
			return index;
		},
		slide = function(el, index){
			var slides = xtag.toArray(el.firstElementChild.children);
			slides.forEach(function(slide){ slide.removeAttribute('selected'); });
			slides[index || 0].setAttribute('selected', true);
			el.firstElementChild.style[transform] = 'translate'+ (el.getAttribute('data-orientation') || 'x') + '(' + (index || 0) * (-100 / slides.length) + '%)';
			el.setAttribute('data-slide', index+1 || 0);
		},
		init = function(toSelected){
			var slides = this.firstElementChild;
			if (!slides || !slides.children.length || slides.tagName.toLowerCase() != 'x-slides') return;
			
			var	children = xtag.toArray(slides.children),
				size = 100 / (children.length || 1),
				orient = this.getAttribute('data-orientation') || 'x',
				style = orient == 'x' ? ['width', 'height'] : ['height', 'width'];
			
			xtag.skipTransition(slides, function(){
				slides.style[style[1]] =  '100%';
				slides.style[style[0]] = children.length * 100 + '%';
				slides.style[transform] = 'translate' + orient + '(0%)';
				children.forEach(function(slide){				
					slide.style[style[0]] = size + '%';
					slide.style[style[1]] = '100%';
				});
			});
			
			if (toSelected) {
				var selected = slides.querySelector('[selected="true"]');
				if (selected) {
					slides.style[xtag.prefix.js+'TransitionDuration'] = '0.00000000000001s';
					slide(this, children.indexOf(selected) || 0);
				}
			};
		},
		play = function(loop) {
			if (currentTimeout != 0) stop();
			var next = function() {
				var slide = getState(this);
				interval = this.getAttribute('data-interval') || 2000;
				if (slide[0] >= slide[1] && !loop) {
					return;
				};
				this.xtag.slideNext.call(this);
				return currentTimeout = setTimeout(next.bind(this),interval);
			};
			return currentTimeout = setTimeout(next.bind(this), this.getAttribute('data-interval') || 2000);
		},
		stop = function() {
			clearTimeout(currentTimeout);
			currentTimeout = 0;
		};

	xtag.register('x-slideshow', {
 		onInsert: function() {
			var autoplay = this.getAttribute('data-autoplay'), 
			start = this.getAttribute('data-slide') - 1;
			init.call(this);
			if (start != undefined) {
				slide(this, start);
			}
			if (autoplay != undefined) {
				play.call(this, this.getAttribute('data-loop') != undefined);
			}
 		},
		events:{
			'transitionend': function(e){
				if (e.target == this) xtag.fireEvent(this, 'slideend');
			}
		},
		getters: {
			'data-interval': function(){
				return this.getAttribute('data-interval');
			},
			'data-loop' : function() {
				return this.getAttribute('data-loop') != undefined;
			},
			'data-slide': function(){
				return this.getAttribute('data-slide');
			}
		},
		setters: {
			'data-orientation': function(value){
				this.setAttribute('data-orientation', value.toLowerCase());
				init.call(this, true);
			},
			'data-interval': function(value){
				this.setAttribute('data-interval', value);
			},
			'data-slide': function(value){
				value = validSlide(this, value-1);
				stop.call(this);
				slide.call(this, this, value);
				this.setAttribute('data-slide', value+1);
			}
		},
		methods: {
			slideNext: function(){
				var shift = getState(this);
				shift[0]++;
				slide(this, shift[0] > shift[1] ? 0 : shift[0]);
			},
			play: function(){
				play.call(this, this.getAttribute('data-loop') != undefined);	
			},
			stop: function(){
				stop.call(this);
			},
		}
	});

	xtag.register('x-slide', {
		onInsert: function(){
			var ancestor = this.parentNode.parentNode;
			if (ancestor.tagName.toLowerCase() == 'x-slideshow') init.call(ancestor, true);
		}
	});
	
})();
