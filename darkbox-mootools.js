  function ambicolor(image, samplestep) {
    if (samplestep == undefined) { samplestep = 1; }
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    var canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var mean = [0,0,0], cnt = 0;

    for (var x = 0; x < canvasData.width; x+=samplestep) {
      for (var y = 0; y < canvasData.height; y+=samplestep) {
        // Index of the pixel in the array
        var idx = (x + y * canvas.width) * 4;

        // Add values to the array
        mean[0] += canvasData.data[idx + 0];
        mean[1] += canvasData.data[idx + 1];
        mean[2] += canvasData.data[idx + 2];

        cnt++;
      }
    }

    var rgb = Math.round(mean[2]/cnt) | (Math.round(mean[1]/cnt) << 8) | (Math.round(mean[0]/cnt) << 16);
    return rgb.toString(16);
  }

var Darkbox = new Class({
  Implements : [Events, Options],
  options    : {
    prefix        : 'darkbox',
    onBuilt       : function(){},
    onClose       : function(){},
    onImageLoaded : function(){},
    onAnimationComplete : function(){},
  },

  initialize: function(container, options) {
    this.setOptions(options);
    this.container = $(container);
    this.start();
  },

  build: function() {
    this.darkbox = new Element('div',  { 'class' : this.c('frame') });
    this.shadow  = new Element('div',  { 'class' : this.c('shadow') }).fade('hide').inject(this.darkbox);
    this.canvas  = new Element('div',  { 'class' : this.c('canvas') }).inject(this.shadow, 'after');
    this.button  = new Element('div',  { 'class' : this.c('button') }).inject(this.canvas);

    this.darkbox.inject(document.body);
    this.fireEvent('onBuilt', this.darkbox);
  },

  // Инициализируем и показываем
  start: function(container) {
    // Копируем контекст
    var that = this;

    // Вешаем обработчик на ссылки
    this.container.getElements('a').addEvent('click', function(e) {
      e.stop();

      that.build();
      that.darkbox.addClass(that.c('frame-on'))
      that.shadow.set('tween', { duration : 300 }).fade(0.6);

      new Element('img', { src : this.get('href'), title : this.get('title') })
        .inject(that.canvas)
        .addEvent('load', function() {
          that.fireEvent('onImageLoaded', that.darkbox)
          that.animate.apply(that, [this]); // this == image
        });

      // Внимательно слушаем клавишу Esc
      document.addEvent('keydown', function(e) {
        if (e.key == 'esc') that.hide.apply(that);
      });
    });
  },

  animate: function(image) {
    var imageWidth  = image.getWidth();
    var imageHeight = image.getHeight();
    var frameWidth  = this.darkbox.getWidth() - 40;
    var frameHeight = this.darkbox.getHeight() - 40;

    // Вписываем картинку в размер окна,
    // если она шире, чем окно
    if (imageWidth > frameWidth) {
      imageWidth = frameWidth;
      image.setStyle('width', imageWidth + 'px');

      while (image.getHeight() > frameHeight) {
        image.setStyle('width', imageWidth + 'px');
        imageWidth--;
      }

      imageHeight = image.getHeight();
    }

    // Вписываем картинку в размер окна,
    // если она выше, чем окно
    if (imageHeight > frameHeight) {
      imageHeight = frameHeight;
      image.setStyle('height', imageHeight + 'px');

      while(image.getWidth() > frameWidth) {
        image.setStyle('height', imageHeight + 'px');
        imageHeight--;
      }

      imageWidth = image.getWidth();
    } 

    // Анимируем загрузчик до размеров картинки
    // и одновременно смещаем к центру
    var eff = new Fx.Morph(this.canvas, {
      duration   : 300,
      transition : Fx.Transitions.Sine.easeOut,
      onComplete : function() {
        // После завершения анимации показываем кнопку и картинку
        this.canvas.addClass(this.c('canvas-done'));
        this.button.addClass(this.c('button-on'));
        this.button.addClass(this.c(Browser.Platform.mac ? 'button-left' : 'button-right'));
        this.canvas.addClass(this.c('canvas-load'));

        image.fade('hide')
          .set('tween', {
            duration   : 50,
            onComplete : function() {
              // Вешаем события для закрытия картинки
              this.fireEvent('onAnimationComplete', this.darkbox);
              [this.shadow, this.button].each(function(o) { o.addEvent('click', this.hide.bind(this)) }, this)
          }.bind(this)})
        .fade('in');
      }.bind(this)
    });

    eff.start({
      'width'       : imageWidth,
      'margin-left' : -imageWidth / 2,
      'height'      : imageHeight,
      'margin-top'  : -imageHeight / 2
    });
  },

  c: function(className) {
    return this.options.prefix + '-' + className
  },

  hide: function() {
    this.fireEvent('onClose', this.darkbox);
    this.darkbox.destroy();
  }
});

