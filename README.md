# Biu
A simple css danmaku plugin.  
[Demo](https://sdjdd.github.io/Biu/demo/index.html)

## 开始使用
```js
var biu = new Biu({
    el: '.danmaku-area'
});

biu.load({
    time: 0,
    text: 'Hello world!'
});

biu.play();
```

## 初始化
### el
- **类型：** `string`
- **说明：** 作为弹幕容器的DOM元素。

### config
- **类型：** `Object`
- **说明：** Biu的配置数据，包含：  
`speed` 弹幕速度（毫秒），表示弹幕从出现到消失所用的时间，默认6000。

### style
- **类型：** `Object`
- **说明：** 弹幕元素的样式，包含：  
`fontSize` 弹幕字号，默认25px。  
`fontFamily` 弹幕字体，默认SimHei。  
`opacity` 弹幕透明度，默认1。  
用户可提供其他有效的参数修改弹幕元素的样式，但并非所有样式都会被应用，由Biu统一管理的样式将会再次覆盖用户的设置。
