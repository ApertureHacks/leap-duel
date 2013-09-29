var stage = new Kinetic.Stage({
  container: 'container',
    width: 800,
    height: 300
});
var layerOne = new Kinetic.Layer();
var layerTwo = new Kinetic.Layer();
var layerThree = new Kinetic.Layer();
var layerFour = new Kinetic.Layer();

var blastLeft = new Image();
blastLeft.src = '/sprites/left-blast.png';

var blastRight = new Image();
blastRight.src = '/sprites/right-blast.png';

var simpleText = new Kinetic.Text({
    x: stage.getWidth() / 2,
    y: 15,
    text: 'Waiting for Players',
    fontSize: 30,
    fontFamily: 'Calibri',
    fill: 'green'
});

var p1HealthText = new Kinetic.Text({
  x: 20,
  y: 20,
  text: "P1: 100/100",
  fontSize: 20,
  fontFamily: 'Calibri',
  fill: 'black'
});

var p2HealthText = new Kinetic.Text({
  x: stage.getWidth() - 200,
  y: 20,
  text: "P2: 100/100",
  fontSize: 20,
  fontFamily: 'Calibri',
  fill: 'black'
});

var playerOne = new Image();
playerOne.onload = function(){
  var player = new Kinetic.Image({
    x: 0,
    y: stage.getHeight() - 100,
    image: playerOne,
    width: 50,
    height: 100,
  });

  layerOne.add(player);
  stage.add(layerOne);
  console.log("playerOne loaded.");
};

var playerTwo = new Image();
playerTwo.onload = function(){
  var player = new Kinetic.Image({
    x: stage.getWidth() - 50,
    y: stage.getHeight() - 100,
    image: playerTwo,
    width: 50,
    height: 100,
  });

  layerTwo.add(player);
  stage.add(layerTwo);
  console.log("playerTwo loaded.");
};

// to align text in the middle of the screen, we can set the
// shape offset to the center of the text shape after instantiating it
simpleText.setOffset({
  x: simpleText.getWidth() / 2
});

// add the shapes to the layer
layerOne.add(simpleText);
stage.add(layerOne);

var socket = io.connect('/');

socket.emit('join', function(data){});

socket.on('start', function(data){
  var playerId = data.player;
  console.log('you are player ' + playerId);
  console.log("recieved start signal.");
  simpleText.remove();

  layerFour.add(p1HealthText);
  layerFour.add(p2HealthText);
  stage.add(layerFour);

  playerOne.src = '/sprites/left-ready.png';
  playerTwo.src = '/sprites/right-ready.png';

  //Leap motion detection
  var controller = new Leap.Controller({enableGestures: true});
  controller.loop(function(frame) {
    var gestures = frame.gestures;
    gestures.forEach(function(e) {
      if(e.type === "screenTap") {
        socket.emit('request-attack', {});
      } else if(e.type === "swipe") {
        socket.emit('request-block', {});
      }
    });
  });

  window.onkeydown = function(e){
    var code = (e.keyCode ? e.keyCode : e.which);
    switch(code){
      case 65:
        socket.emit('request-block', {});
        break;
      case 83:
        socket.emit('request-attack', {});
        break;
    }
  };

  socket.on('block', function(data){
    console.log("Activating block on player " + data.player);
    if (data.player == 1) {
      playerOne.src = '/sprites/left-block.png';
    } else {
      playerTwo.src = '/sprites/right-block.png';
    }
  });

  socket.on('attack', function(data) {
    var blast;
    var anim;
    console.log("Activating attack on player " + data.player);
    if (data.player == 1) {
      playerOne.src = '/sprites/left-attack.png';
      blast = new Kinetic.Image({
        x: 50,
        y: stage.getHeight() - 100,
        image: blastRight,
        width: 100,
        height: 50
      });

      layerThree.add(blast);
      stage.add(layerThree);

      anim = new Kinetic.Animation(function(frame) {
        blast.setX(frame.time * (stage.getWidth() - 100) / 1000);
      }, layerThree);

      anim.start();

      setTimeout(function(){
        blast.remove();
      }, 1000);
    } else {
      playerTwo.src = '/sprites/right-attack.png';
      blast = new Kinetic.Image({
        x: stage.getWidth() - 150,
        y: stage.getHeight() - 100,
        image: blastLeft,
        width: 100,
        height: 50
      });

      layerThree.add(blast);
      stage.add(layerThree);

      anim = new Kinetic.Animation(function(frame) {
        blast.setX(stage.getWidth() - 100 - (frame.time * (stage.getWidth() - 100) / 1000));
      }, layerThree);

      anim.start();

      setTimeout(function(){
        blast.remove();
      }, 1000);
    }
  });

  socket.on('hit', function(data) {
    console.log("Activating hit on player " + data.player);
    console.log("data hp is " + data.hp);
    layerFour.remove();
    if (data.player == 1) {
      playerOne.src = '/sprites/left-hit.png';
      p1HealthText.setText("P1: " + data.hp + "/100");
      layerFour.add(p1HealthText);
    } else {
      playerTwo.src = '/sprites/right-hit.png';
      p2HealthText.setText("P2: " + data.hp + "/100");
      layerFour.add(p2HealthText);
    }
    stage.add(layerFour);
  });

  socket.on('end', function(data){
    layerOne.remove();
    layerTwo.remove();
    layerThree.remove();
    layerFour.remove();

    var endText = new Kinetic.Text({
      x: stage.getWidth()/2,
      y: stage.getHeight()/2,
      text: data.loser == playerId ? "Defeat" : "Victory",
      fontSize: 30,
      fontFamily: "Calibri",
      fill: data.loser == playerId ? "red" : "green"
    });

    layerFour.add(endText);
    stage.add(layerFour);
  });

  socket.on('ready', function(data) {
    console.log("Activating ready on player " + data.player);
    if (data.player == 1) {
      playerOne.src = '/sprites/left-ready.png';
    } else {
      playerTwo.src = '/sprites/right-ready.png';
    }
  });
});
