//SEED = CryptoJS.MD5("" + new Date().getTime()).toString();
MAP_SIZE = 30;
SQUARE   = 400 / MAP_SIZE;
N_ITERATIONS = 4;
W_RATIO = 0.5;
H_RATIO = 0.5;
DISCARD_BY_RATIO = true;
D_GRID = true;
D_BSP = true;
D_ROOMS = false;
D_PATHS = false;
D_DOORS = true;

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function rectIntersect(r1, r2) {
    return !(
        r1.x > r2.x + r2.w ||
        r1.x + r1.w < r2.x ||
        r1.y > r2.y + r2.h ||
        r1.y + r1.h < r2.y
    )
}

var Point = function(x, y) {
    this.x = x;
    this.y = y;
}

var Room = function(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.center = new Point(Math.floor(this.x + this.w/2), Math.floor(this.y + this.h/2));
    this.hasPlayer = false;
}

/*Room.prototype.paint = function(c) {
    c.fillStyle = "#888";
    c.fillRect(this.x * SQUARE, this.y * SQUARE,
               this.w * SQUARE, this.h * SQUARE)
}*/

/*Room.prototype.drawPath = function(c, point) {
    c.beginPath();
    c.lineWidth   = SQUARE;
    c.strokeStyle = "#888";
    c.moveTo(this.center.x * SQUARE, this.center.y * SQUARE);
    c.lineTo(point.x * SQUARE, point.y * SQUARE);
    c.stroke();
}*/

var RoomContainer = function(x, y, w, h) {
    Room.call(this, x, y, w, h);
    this.room = undefined;
}

RoomContainer.prototype = Object.create(Room.prototype);
RoomContainer.prototype.constructor = RoomContainer;
/*RoomContainer.prototype.paint = function(c) {
    c.strokeStyle = "#0F0";
    c.lineWidth   = 2;
    c.strokeRect(this.x * SQUARE, this.y * SQUARE,
               this.w * SQUARE, this.h * SQUARE);
}*/

RoomContainer.prototype.growRoom = function() {
    var x, y, w, h;
    x = this.x + random(0, Math.floor(this.w/3));
    y = this.y + random(0, Math.floor(this.h/3));
    w = this.w - (x - this.x);
    h = this.h - (y - this.y);
    w -= random(0, w/3);
    h -= random(0, h/3);
    this.room = new Room(x, y, w, h);
}

var Tree = function( leaf ) {
    this.leaf = leaf;
    this.lchild = undefined;
    this.rchild = undefined;
}

Tree.prototype.print = function() {
    if (this.lchild !== undefined)
        this.lchild.print();
    if (this.rchild !== undefined)
        this.rchild.print();
}

Tree.prototype.getLeafs = function() {
    if (this.lchild === undefined && this.rchild === undefined)
        return [this.leaf];
    else
        return [].concat(this.lchild.getLeafs(), this.rchild.getLeafs());
}

Tree.prototype.getLevel = function(level, queue) {
    if (queue === undefined)
        queue = [];
    if (level == 1) {
        queue.push(this);
    } else {
        if (this.lchild !== undefined)
            this.lchild.getLevel(level-1, queue);
        if (this.rchild !== undefined)
            this.rchild.getLevel(level-1, queue);
    }
    return queue;
}

/*Room = function(x,y) {
    this.x = x;
    this.y = y;
}*/

/*Tree.prototype.paint = function(c) {
    var c = c;
    this.leaf.paint(c);
    if (this.lchild !== undefined)
        this.lchild.paint(c);
    if (this.rchild !== undefined)
        this.rchild.paint(c);
}*/

Map = function(width, height, c) {
    this.c = c;
    this.width = width;
    this.height = height;
    this.rooms = [];

    // Create the grid.
    this.grid = [];
    for (var i=0; i< MAP_SIZE + 1; i++) {
        var row = [];
        for (j=0; j< MAP_SIZE + 1; j++) {
            row.push('0');
        }
        this.grid.push(row);
    }
    this.init();
}

Map.prototype.init = function() {
    var main_room = new RoomContainer(0, 0, MAP_SIZE, MAP_SIZE);
    this.room_tree = this.split_room(main_room, N_ITERATIONS);
    this.growRooms();
}

Map.prototype.split_room = function(room, iter) {
    var Root = new Tree(room);
    //room.paint(document.getElementById('viewport').getContext('2d'));
    if (iter != 0) {
        var sr = this.random_split(room);

        Root.lchild = this.split_room(sr[0], iter-1);
        Root.rchild = this.split_room(sr[1], iter-1);
    }
    return Root;
}

Map.prototype.random_split = function (room) {
    var r1, r2;
    if (random(0, 1) == 0) {
        // Vertical
        r1 = new RoomContainer(
            room.x, room.y,             // r1.x, r1.y
            random(1, room.w), room.h   // r1.w, r1.h
        )
        r2 = new RoomContainer(
            room.x + r1.w, room.y,      // r2.x, r2.y
            room.w - r1.w, room.h       // r2.w, r2.h
        )
        if (DISCARD_BY_RATIO) {
            var r1_w_ratio = r1.w / r1.h
            var r2_w_ratio = r2.w / r2.h
            if (r1_w_ratio < W_RATIO || r2_w_ratio < W_RATIO) {
                return this.random_split(room);
            }
        }

        // Check if the wall is placed where the wall ends on the top
        // And check if the wall is placed where the wall ends on the bottom.
        if (this.grid[r2.y][r2.x] == '2' || this.grid[r2.y + r2.h][r2.x] == '2') {
            // Wall is placed on a door, try to place a new one.
            return this.random_split(room);
        }

        // Add a door in the wall.
        var y = r2.y + Math.floor(r2.h / 2);
        this.grid[y][r2.x] = '2';
    } else {
        // Horizontal
        r1 = new RoomContainer(
            room.x, room.y,             // r1.x, r1.y
            room.w, random(1, room.h)   // r1.w, r1.h
        )
        r2 = new RoomContainer(
            room.x, room.y + r1.h,      // r2.x, r2.y
            room.w, room.h - r1.h       // r2.w, r2.h
        )
        if (DISCARD_BY_RATIO) {
            var r1_h_ratio = r1.h / r1.w;
            var r2_h_ratio = r2.h / r2.w;
            if (r1_h_ratio < H_RATIO || r2_h_ratio < H_RATIO) {
                return this.random_split(room);
            }
        }

        // Check if the wall is placed where the wall ends on the left.
        // And check if the wall is placed where the wall ends on the right.
        if (this.grid[r2.y][r2.x] == '2' || this.grid[r2.y][r2.x + r2.w] == '2') {
            // Wall is placed on a door, try to place a new one.
            return this.random_split(room);
        }

        // Add a door in the wall.
        var x = r2.x + Math.floor(r2.w / 2);
        this.grid[r2.y][x] = '2';
    }

    return [r1, r2];
}

Map.prototype.growRooms = function() {
    var leafs = this.room_tree.getLeafs();

    for (var i = 0; i < leafs.length; i++) {
        // Add top and bottom wall to the grid.
        for (var x=leafs[i].x; x < leafs[i].x + leafs[i].w; x++) {
            // top wall
            if (this.grid[leafs[i].y][x] == '0') {
                this.grid[leafs[i].y][x] = '1';
            }
            // bottom wall
            if (this.grid[leafs[i].y + leafs[i].h][x] == '0') {
                this.grid[leafs[i].y + leafs[i].h][x] = '1';
            }
        }

        // Add left and right wall to the grid.
        for (var y=leafs[i].y;y <= leafs[i].y + leafs[i].h;y++) {
            // left wall
            if (this.grid[y][leafs[i].x] == '0') {
                this.grid[y][leafs[i].x] = '1';
            }
            // right wall
            if (this.grid[y][leafs[i].x + leafs[i].w] != '2') {
                this.grid[y][leafs[i].x + leafs[i].w] = '1';
            }
        }

        leafs[i].growRoom();
        this.rooms.push(leafs[i].room);
    }
}

Map.prototype.clear = function() {
    this.c.fillStyle = "#000";
    this.c.fillRect(0, 0, this.width, this.height);
}

Map.prototype.drawGrid = function() {
    var c = this.c
    c.beginPath()
    c.strokeStyle = "rgba(255,255,255,0.4)"
    c.lineWidth = 1;
    for (var i = 0; i < MAP_SIZE; i++) {
        c.moveTo(i * SQUARE, 0)
        c.lineTo(i * SQUARE, MAP_SIZE * SQUARE)
        c.moveTo(0, i * SQUARE)
        c.lineTo(MAP_SIZE * SQUARE, i * SQUARE)
    }
    c.stroke();
    c.closePath();
}

Map.prototype.drawTiles = function() {
    var tileData = [];
    var x = 0;
    var y = 0;

    for (var i=0; i < this.grid.length; i++) {
        var row = [];
        for (var j=0; j < this.grid[i].length; j++) {
            var tile = {};
            tile.x = x;
            tile.y = y;

            switch (this.grid[i][j]) {
                case '0':
                    // floor
                    tile.color = 'green';
                    break;
                case '1':
                    // wall
                    tile.color = 'red';
                    break;
                case '2':
                    // door
                    tile.color = 'purple';
                    break;
                case '3':
                    // player
                    tile.color = 'white';
                    break;
                case '4':
                    // coin
                    tile.color = 'yellow';
                    break;
            }
            tileData.push(tile);
            x += 1;
        }
        x = 0;
        y += 1;
    }

    var svg = d3.select("body").append("svg")
                                .attr("width", 1000)
                                .attr("height", 1000);

    var rectangles = svg.selectAll("rect")
                         .data(tileData)
                         .enter()
                         .append("rect");

    var rectangleAttributes = rectangles
                      .attr("x", function (d) { return d.x * 20; })
                      .attr("y", function (d) { return d.y * 20; })
                      .attr("height", 20)
                      .attr("width", 20)
                      .style("fill", function(d) {  return d.color; })
                      .style('stroke', 'white')
                      .attr('stroke-width', '0.1');
}

// Place a player in the center of a random room.
Map.prototype.placePlayer = function() {
    var random = Math.floor(Math.random() * this.rooms.length);
    var room = this.rooms[random];
    this.rooms[random].hasPlayer = true;
    this.grid[room.center.y][room.center.x] = '3';
}

Map.prototype.placeCoins = function(){
    for(var i=0;i<this.rooms.length;i++) {
        if (!this.rooms[i].hasPlayer) {
            this.grid[this.rooms[i].y + Math.floor(Math.random() * this.rooms[i].h +1)][this.rooms[i].x + Math.floor(Math.random() * this.rooms[i].w)+1] = '4';
            //console.log(this.rooms[i]);
            //console.log(Math.floor(Math.random() * this.rooms[i].h));
            //console.log(Math.floor(Math.random() * this.rooms[i].w));
        }
    }
}

/*Map.prototype.drawContainers = function() {
    this.room_tree.paint(this.c)
}*/

/*Map.prototype.drawRooms = function() {
    for (var i = 0; i < this.rooms.length; i++)
        this.rooms[i].paint(this.c)
}*/

Map.prototype.paint = function() {
    this.clear()
    /*if (D_BSP)
        this.drawContainers();
    if (D_ROOMS)
        this.drawRooms();
    if (D_PATHS)
        this.drawPaths(this.room_tree);
    if (D_GRID)
        this.drawGrid();*/

    this.placePlayer();
    this.placeCoins();
    this.drawTiles();
    //console.log(this.rooms);
}

var map;

function debug(stuff) {
    $('#debug ul li.active').removeClass('active')
    $('#debug ul').prepend("<li class='active'>"+stuff+"</li>")
}

var initMap = function() {
    try {
        SQUARE = 400 / MAP_SIZE;
        //Math.seedrandom(SEED)
        var c = document.getElementById('viewport').getContext('2d');
        var time = new Date();
        map = new Map(400, 400, c);
        map.paint();
        var exectime = new Date().getTime() - time.getTime();
        debug("Map generated in " + exectime +" ms");
        return map.grid;
    } catch (exception) {
        debug(exception);
        // Regenerate map;
        initMap();
        /*c.fillStyle = "#000";
        c.fillRect(0,0,400,400);*/
    }
}

$(document).ready(function() {
    //initMap();
});


var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update: update });
var dungeon_height = 0;
var dungeon_width = 0;

function preload() {
    var dungeon = initMap();
    game.load.image('tilemap', 'assets/tilemap.png');
    game.load.image('player', 'assets/player.png');
    game.load.image('wall', 'assets/wall.png');
    game.dungeon = dungeon;
}


function create() {
    var data = '';

    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.wall_group = game.add.group();
    game.wall_group.enableBody = true;
    //game.wall_group.immovable = true;
    //game.physics.enable(game.wall_group);

    for (var y=0; y<game.dungeon.length; y++) {
        var row = [];
        for (var x=0; x<game.dungeon[y].length; x++) {
            switch (game.dungeon[y][x]) {
                case '0':
                    // floor
                    row.push(3);
                    break;
                case '1':
                    // wall
                    row.push(1);
                    var wall = game.add.sprite(x*50,y*50,'wall', 0, game.wall_group);
                    wall.enableBody = true;
                    wall.body.immovable = true;
                    game.physics.enable(wall);
                    game.wall_group.add(wall);
                    break;
                case '2':
                    // door
                    row.push(2);
                    break;
                case '3':
                    // player
                    row.push(4);
                    break;
                case '4':
                    // coin
                    row.push(0);
                    break;
            }
        }
        data += row.join() + "\n";
    }

    game.wall_group.setAll('body.immovable', true);
    game.wall_group.setAll('body.gravity', 500);

    // Calculate the dungeon dimension.
    dungeon_height = (game.dungeon.length * 50) ;
    dungeon_width = (game.dungeon[0].length * 50);

    game.world.setBounds(0, 0, dungeon_width, dungeon_height);

    // Add player.
    game.player = game.add.sprite(150, 250, 'player');
    game.player.enableBody = true;
    game.physics.enable(game.player, Phaser.Physics.ARCADE);
    game.player.body.collideWorldBounds = true;

    game.camera.follow(game.player);

    // ========= Old Tilemap shit ============
    //  Add data to the cache
    //game.cache.addTilemap('dynamicMap', null, data, Phaser.Tilemap.CSV);

    //  Create our map (the 50x50 is the tile size)
    //map = game.add.tilemap('dynamicMap', 50, 50);

    //  'tilemap' = cache image key, 50x50 = tile size
    //map.addTilesetImage('tilemap', 'tilemap', 50, 50);

    //  0 is important
    //layer = map.createLayer(0);

    //map.setCollisionBetween(1, 12);

    //  Scroll it
    //layer.resizeWorld();
    // ========= /Old Tilemap shit ============

    cursors = game.input.keyboard.createCursorKeys();
}

function update() {
    // Make the player collide with the wall group.
    game.physics.arcade.collide(game.player, game.wall_group, wall_collision);
    //game.physics.arcade.collide(game.player, game.wall);

    game.player.body.velocity.x = 0
    game.player.body.velocity.y = 0

    var move = 1000;

    if (cursors.left.isDown) {
        if (game.player.body.x > 0) {
            game.player.body.velocity.x -= move;
        }
    } else if (cursors.right.isDown) {
        if (game.player.body.x < dungeon_width) {
            game.player.body.velocity.x += move;
        }
    }

    if (cursors.up.isDown) {
        if ( game.player.body.y > 0 ) {
            game.player.body.velocity.y -= move;
        }
    } else if (cursors.down.isDown) {
        if (game.player.body.y < dungeon_height) {
            game.player.body.velocity.y += move;
        }
    }
}

function wall_collision() {
    //console.log('boom!');
}

// http://examples.phaser.io/_site/view_full.html?d=tilemaps&f=tile+callbacks.js&t=tile%20callbacks
