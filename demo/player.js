var video = document.querySelector('.player video');
var biu = new Biu({
    el: '.danmaku'
});

danmakuData.forEach(function(v){
    biu.load({
        time: v.time,
        text: v.text,
        color: v.color,
        type: v.type
    });
});

video.onplay = function(){
    let ms = Math.round(this.currentTime * 1000);
    biu.play(ms);
}

video.onpause = function(){
    biu.pause();
}