var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update, render: render } );

function preload() {
    game.load.image('player', 'assets/player.png');
    game.load.image('wall', 'assets/wall.png');
}

var platforms;
var player;

function create() {
    //  We're going to be using physics, so enable the Arcade Physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);

    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = game.add.group();

    //  We will enable physics for any object that is created in this group
    platforms.enableBody = true;

    //  Now let's create two ledges
    var wall = platforms.create(250, 250, 'wall');
    wall.body.immovable = true;

    player = game.add.sprite(250, 150, 'player');
    //game.physics.enable(player, Phaser.Physics.ARCADE);
    //player.enableBody = true;
    //player.body.immovable = true;

    //  We need to enable physics on the player
    game.physics.arcade.enable(player);

    //  Player physics properties. Give the little guy a slight bounce.
    //player.body.gravity.y = 6000;
    player.body.collideWorldBounds = true;

    if (false) {
        game.physics.startSystem(Phaser.Physics.ARCADE);

        game.player_touching_wall = false;
        game.wall = game.add.sprite(250,250,'wall');
        game.player = game.add.sprite(150, 250, 'player');

        game.physics.enable([game.wall,game.player], Phaser.Physics.ARCADE);

        game.wall.name = 'wall';
        game.wall.body.immovable = true;
        game.wall.body.moves = false;

        game.player.name = 'mushroom';
        //game.player.body.velocity.x = 100;
        game.player.enableBody = true;

        // Add player.

        /*game.player.enableBody = true;
        game.physics.enable(game.player, Phaser.Physics.ARCADE);
        game.player.body.collideWorldBounds = true;*/
        //game.player.body.gravity.y = 3000;
    }
    cursors = game.input.keyboard.createCursorKeys();
}

function update() {
    var hitPlatform = game.physics.arcade.collide(player, platforms, wall_collision);

    player.body.velocity.x = 0
    player.body.velocity.y = 0

    var move = 500;
    if (cursors.left.isDown) {
        player.body.velocity.x -= move;
    } else if (cursors.right.isDown) {
        player.body.velocity.x += move;
    }

    if (cursors.up.isDown) {
        if (player.y > 0 ) {
            player.body.velocity.y -= move;
        }
    } else if (cursors.down.isDown) {
        //player.y += move;
        player.body.velocity.y = move;
    }
}

function render() {

}

function wall_collision() {
        //console.log(player.body);
}
