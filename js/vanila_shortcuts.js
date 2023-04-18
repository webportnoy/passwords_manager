/**
 * Vanila JS shortcuts
 * 
 * QQ("button").on("click", app.print );
 * Q(".btnSign").classList.toggle("active");
 * Q(".btnSign").trigger("click");
 * QQ("a").addClass("link");
 * Q(".element").css(); // Вернет все стили
 * Q(".element").css("left"); // 0px
 * Q(".element").css("left", "50px"); // Установит node.style.left = "50px"
 * QQ(".element").css("left", "50px"); // Всем элементам задать node.style.left = "50px"
 * QQ("input,textarea").addStopEvent("input",700).on("inputstop", ajaxSearchStart);
 * QQ(".slider").addSwipeEvents().on("swipeleft", onSwipeFunc );
 */
var Q = ( expr, con ) => (con || document).querySelector(expr),
	QQ = ( expr, con ) => (con || document).querySelectorAll(expr),
	CE = (e)=>document.createElement(e),
	NP = Node.prototype,
	NLP = NodeList.prototype,
	WP = Window.prototype;
NP.on = WP.on = addEventListener;
NP.off = WP.off = removeEventListener;
NP.trigger = WP.trigger = function(ev){this.dispatchEvent(new Event(ev,{"cancelable":true}));};
NP.delegate = WP.delegate = function(s,ev,f){this.on(ev,function(e,t){t=e.target.closest(s);t&&f(e);});};
NP.siblings = function(expr="*"){return this.parentNode.childNodes.toArray().filter(e=>e.nodeType==1&&this!==e&&e.matches(expr));};
NP.css = function(prop, val){val && (this.style[prop] = val);return prop ? getComputedStyle(this)[prop] : getComputedStyle(this);};
NP.toggleCss = function(prop, val1, val2="none"){this.css( prop, this.css(prop) == val1 ? val2 : val1 );}
NP.isVisible = function(){return !!this.offsetHeight;}
NP.index = function(expr){return this.parentNode.querySelectorAll((expr||this.tagName)).toArray().indexOf(this);}
NP.toggleClass = function(c){this.classList.toggle(c);};
NP.addClass = function(c){this.classList.add(c);};
NP.removeClass = function(c){this.classList.remove(c);};
NP.addStopEvent = function(ev,sens=100,t){this.on(ev,()=>{clearTimeout(t);t=setTimeout(()=>this.trigger(`${ev}stop`),sens)})};
NP.addSwipeEvents = function(sens=70){let o=this,x,dX,y,dY,ev,t=(e)=>e.changedTouches[0],gX=(e)=>1*(t(e).screenX),gY=(e)=>1*(t(e).screenY);o.on('touchstart',(e)=>{x=gX(e);y=gY(e);});o.on('touchend',(e)=>{dX=gX(e)-x;dY=gY(e)-y;ev=dX<(-1*sens)?"left":(dX>sens?"right":(dY<(-1*sens)?"up":(dX>sens?"down":"")));if(ev)o.trigger(`swipe${ev}`)});return this;};
NLP.on = function(ev,cb){this.forEach((o)=>o.on(ev,cb))};
NLP.off = function(ev,cb){this.forEach((o)=>o.off(ev,cb))};
NLP.css = function(prop, val){this.forEach((o)=>o.css(prop, val))};
NLP.trigger = function(ev){this.forEach((o)=>o.trigger(ev))};
NLP.toggleClass = function(c){this.forEach((o)=>o.classList.toggle(c))};
NLP.addClass = function(c){this.forEach((o)=>o.classList.add(c))};
NLP.removeClass = function(c){this.forEach((o)=>o.classList.remove(c))};
NLP.toArray = function(){return Array.from(this)};
NLP.visible = function(){return this.toArray().filter(e=>e.isVisible());};
NLP.hidden = function(){return this.toArray().filter(e=>!e.isVisible());};
NLP.addStopEvent = function(ev,sens=100){this.forEach((o)=>{o.addStopEvent(ev,sens)});return this;};
NLP.addSwipeEvents = function(sens=70){this.forEach((o)=>{o.addSwipeEvents(sens);});return this;};