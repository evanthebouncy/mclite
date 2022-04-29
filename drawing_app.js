// BEGIN global variables ============

// number of items in the inventory
// you can reset this by reset_render(items)
var N_ITEMS = 20;

// set CANV_WIDTH to half of the screen width
var CANV_WIDTH = window.innerWidth / 2;
// set CANV_HEIGHT to all of the screen height times 0.95
var CANV_HEIGHT = window.innerHeight * 0.95;

// the konva stage
var stage = null;
// the dynamic conva layer for rendering items
var layer = null;
var static_layer = null;

// for layout on the robot_and_table region
// update this each time we make a new robot_and_table image
// relative offsets from robot_and_table_img_x, robot_and_table_img_y for the table and held items
var POS_ITEM_HOLD = [84.5, 32.5];
var POS_ITEM_RESULT = [65.7, 62.0];
var POS_CRAFT_SLOTS = [
    [29.2, 34.2],
    [38.3, 37.7],
    [48.5, 42.5],
    [22.4, 42.1],
    [31.9, 46.3],
    [42.7, 51.3],
    [14.9, 50.6],
    [25.6, 55.3],
    [35.8, 60.7],
];
var CRAFT_ITEM_RADIUS = 4.8;

// the following layout params need to be computed from the window size
// location of the foreground image
var ROBOT_AND_TABLE_X;
var ROBOT_AND_TABLE_Y;
var ROBOT_AND_TABLE_W;
// a list of (x,y) coordinates for every n_items
// this is a list of "safe" locations for the inventory items, i.e. no collision with the robot or table
// radius of the items so no collision occurs
var ITEM_RADIUS = 0;
// coordinates for all the items
var INVENTORY_LOCS = [];
var HOLD_LOC = [];
var RESULT_LOC = [];
var SLOT_LOCS = [];
var ASSETS = {};

// END global variables ======================

// BEGIN layout computation ===============

// some geometry computation on the bound of the foreground of robot+table
// and relative item size so it is consistent
function compute_layout_params() {
    var n_items = N_ITEMS;

    // set CANV_WIDTH to half of the screen width
    CANV_WIDTH = window.innerWidth / 2;
    // set CANV_HEIGHT to all of the screen height times 0.95
    CANV_HEIGHT = window.innerHeight * 0.95;

    var robot_and_table_scale = 0.1;
    var [item_radius_foreground, item_radius_background, layout_params] = compute_item_radius(n_items, robot_and_table_scale);

    while (item_radius_foreground < item_radius_background && robot_and_table_scale < 1) {
        robot_and_table_scale += 0.05;
        [item_radius_foreground, item_radius_background, layout_params] = compute_item_radius(n_items, robot_and_table_scale);
    }
 
    ITEM_RADIUS = Math.min(item_radius_foreground, item_radius_background);
    INVENTORY_LOCS = layout_params.inventory_locs;
    ROBOT_AND_TABLE_X = layout_params.robot_and_table_img_x;
    ROBOT_AND_TABLE_Y = layout_params.robot_and_table_img_y;
    ROBOT_AND_TABLE_W = layout_params.robot_and_table_img_width;

    // compute the locations of the robot and table items
    HOLD_LOC = [ROBOT_AND_TABLE_X + POS_ITEM_HOLD[0] * ROBOT_AND_TABLE_W / 100, ROBOT_AND_TABLE_Y + POS_ITEM_HOLD[1] * ROBOT_AND_TABLE_W / 100];
    RESULT_LOC = [ROBOT_AND_TABLE_X + POS_ITEM_RESULT[0] * ROBOT_AND_TABLE_W / 100, ROBOT_AND_TABLE_Y + POS_ITEM_RESULT[1] * ROBOT_AND_TABLE_W / 100];
    SLOT_LOCS = POS_CRAFT_SLOTS.map(function(pos) {
        return [ROBOT_AND_TABLE_X + pos[0] * ROBOT_AND_TABLE_W / 100, ROBOT_AND_TABLE_Y + pos[1] * ROBOT_AND_TABLE_W / 100];
    });
}

function compute_item_radius(n_items, robot_and_table_scale) {
    // first find out if CANV_WIDTH or CANV_HEIGHT is smaller
    var smaller_side = Math.min(CANV_WIDTH, CANV_HEIGHT);

    // take half of the smaller side (robot_and_table is square)
    var robot_and_table_img_width = smaller_side * robot_and_table_scale;

    // the robot_and_table_img will be on bottom left of the screen
    var robot_and_table_img_x = 0;
    var robot_and_table_img_y = CANV_HEIGHT - robot_and_table_img_width;
    
    let robot_bnd_x = robot_and_table_img_width;
    let robot_bnd_y = CANV_HEIGHT - robot_and_table_img_width;
    var [inv_radius, inv_locs] = get_inventory_locations(n_items, robot_bnd_x, robot_bnd_y);

    var foreground_radius = robot_and_table_img_width * CRAFT_ITEM_RADIUS / 100;

    // console.log('inv_radius: ' + inv_radius);
    var layout_params = {
        robot_and_table_img_width: robot_and_table_img_width,
        robot_and_table_img_x: robot_and_table_img_x,
        robot_and_table_img_y: robot_and_table_img_y,
        inventory_locs: inv_locs,
    }

    return [foreground_radius, inv_radius, layout_params];
}

// cute code to find out where to render the inventory items using search
function get_inventory_locations(n_items, robot_bnd_x, robot_bnd_y) {

    // draw inventory as a fake isometric grid
    let dir1 = [Math.sqrt(3), 1];
    let dir2 = [-Math.sqrt(3), 1];
    let gap = 2;

    let inventory_item_radius = 200;

    function get_list_valid_locations(inv_item_radius) {
        let valid_locations = [];
        var low_id_range = -10;
        var high_id_range = 20;
        let radius = inv_item_radius;
        for (let i = low_id_range; i <= high_id_range; i++) {
            for (let j = low_id_range; j <= high_id_range; j++) {
                // get the equivalent x,y coordinates
                let x = (i * dir1[0] + j * dir2[0]) * inv_item_radius * gap;
                let y = (i * dir1[1] + j * dir2[1]) * inv_item_radius * gap;
    
                // check if a circle of (x,y,radius) is outside the canvas
                if (x + radius > CANV_WIDTH || y + radius > CANV_HEIGHT || x - radius < 0 || y - radius < 0) {
                    continue;
                }
                // check if a circle of (x,y,radius) is inside the robot and table region
                if (x - radius < robot_bnd_x && y + radius > robot_bnd_y) {
                    continue;
                }
                // add to the list of valid locations
                valid_locations.push([x, y]);
            }
        }
        return valid_locations;
    }

    // get the list of valid locations
    var valid_locations = get_list_valid_locations(inventory_item_radius);
    
    // while the list of valid locations is less than n_items,
    // keep decreasing the inventory scale until we have enough
    while (valid_locations.length < n_items) {

        inventory_item_radius *= 0.95;
        valid_locations = get_list_valid_locations(inventory_item_radius);
    }

    return [inventory_item_radius, valid_locations];
}

// END layout computation ===========

// diagnostic for the foreground, draw circles
function foreground_diagnostic() {

    // draw the hold item, use circle as placeholder
    var hold_item_circle = new Konva.Circle({
        x: HOLD_LOC[0],
        y: HOLD_LOC[1],
        radius: ITEM_RADIUS,
        stroke: '#555',
        strokeWidth: 3,
    });
    layer.add(hold_item_circle);

    // draw the result item, use circle as placeholder
    var result_item_circle = new Konva.Circle({
        x: RESULT_LOC[0],
        y: RESULT_LOC[1],
        radius: ITEM_RADIUS,
        stroke: '#555',
        strokeWidth: 3,
    });
    layer.add(result_item_circle);

    // draw the crafting slots
    for (let i = 0; i < SLOT_LOCS.length; i++) {
        var slot_circle = new Konva.Circle({
            x: SLOT_LOCS[i][0],
            y: SLOT_LOCS[i][1],
            radius: ITEM_RADIUS,
            stroke: '#555',
            strokeWidth: 3,
        });
        layer.add(slot_circle);
    }

}
// diagnostic for the background, draw circles
function background_diagnostic() {
    var n_items = N_ITEMS;
    // draw a circle as stand-in for the inventory items
    for (let i = 0; i < n_items; i++) {
        var circle = new Konva.Circle({
            x: INVENTORY_LOCS[i][0],
            y: INVENTORY_LOCS[i][1],
            radius: ITEM_RADIUS,
            stroke: '#555',
            // 3 pt stroke
            strokeWidth: 3,
            listening: false,
        });
        layer.add(circle);
        // add a text label for i
        var text = new Konva.Text({
            x: INVENTORY_LOCS[i][0],
            y: INVENTORY_LOCS[i][1],
            text: i+1,
            // fairly big font
            fontSize: ITEM_RADIUS*0.8,
        });
        // center the text in the circle
        text.offsetX(text.getWidth()/2);
        text.offsetY(text.getHeight()/2);

        layer.add(text);
    }
}

// draw the robot and table
function render_background() {

    // big grassy background over everything
    // make the background i.e. body.css using assets/background.png
    var background_pattern = new Image();
    background_pattern.src = 'assets/background1.png';
    background_pattern.onload = function() {
        $('body').css('background-image', 'url(' + background_pattern.src + ')');
        // stretch the background to fill the whole screen
        $('body').css('background-size', 'cover');
    };

    // draw the robot and the crafting table on the layer
    var robot_and_table_img = new Image();
    robot_and_table_img.src = 'assets/robot_paper_square.png';
    robot_and_table_img.onload = function() {
        var robot_and_table = new Konva.Image({
            x: ROBOT_AND_TABLE_X,
            y: ROBOT_AND_TABLE_Y,
            image: robot_and_table_img,
            width: ROBOT_AND_TABLE_W,
            height: ROBOT_AND_TABLE_W,
        });
        static_layer.add(robot_and_table);
    };
}

// reset the render from scratch, do the following
// 1. recompute layout parameters
// 2. draw diagnostics
// 3. load assets
function reset_render(inventory_size, all_asset_ids) {
    console.log("resetting render");

    // destroy the world
    // delete the two layers
    if (layer != null) {
        layer.destroy();
    }
    if (static_layer != null) {
        static_layer.destroy();
    }
    // delete the stage itself
    if (stage != null) {
        stage.destroy();
    }

    // change this very important information
    N_ITEMS = inventory_size;
    // compute layout parameters from N_ITEMS and possibly resized window
    compute_layout_params();

    // remake the world
    // remake the stage
    stage = new Konva.Stage({
        container: 'konva-holder',
        width: CANV_WIDTH,
        height: CANV_HEIGHT,
    });
    // add a static layer to the stage
    static_layer = new Konva.Layer();
    stage.add(static_layer);
    // add a dynamic layer to the stage
    layer = new Konva.Layer();
    stage.add(layer);

    // render the background
    render_background();
    // draw diagnostics
    foreground_diagnostic();
    background_diagnostic();

    // load assets
    // for each asset id, load the image and add it to ASSETS
    all_asset_ids.forEach(function(asset_id) {
        var img = new Image();
        img.src = 'assets/icons/' + asset_id + '.png';
        img.onload = function() {
            ASSETS[asset_id] = img;
        }
    });
}

function render_single_item(asset_id, x, y){
    // draw the item
    var item = new Konva.Image({
        x: x - ITEM_RADIUS,
        y: y - ITEM_RADIUS,
        image: ASSETS[asset_id],
        width: ITEM_RADIUS*2,
        height: ITEM_RADIUS*2,
    });
    layer.add(item);
}

// diagnostic for the background, draw circles
function render_inventory(inventory) {
    // for every item in the inventory list
    for (let i = 0; i < inventory.length; i++) {
        let asset_id = inventory[i].asset_id;
        let quantity = inventory[i].quantity;
        render_single_item(asset_id, INVENTORY_LOCS[i][0], INVENTORY_LOCS[i][1]);

        // add a text label for the quantity
        var text = new Konva.Text({
            x: INVENTORY_LOCS[i][0],
            y: INVENTORY_LOCS[i][1],
            text: quantity,
            // fairly big font
            fontSize: ITEM_RADIUS*0.8,
        });
        // put text to lower-left of the item
        text.offsetX(text.getWidth() * Math.sqrt(3));
        text.offsetY(-text.getHeight());

        layer.add(text);
    }
}

function render_foreground_items (items) {
    let hold = items.hold;
    let result = items.result;
    let slots = items.slots;

    // draw the hold item
    if (hold.asset_id != null) {
        render_single_item(hold.asset_id, HOLD_LOC[0], HOLD_LOC[1]);
    }
    if (hold.durability != null) {
        // draw the durability
        var durability_text = new Konva.Text({
            x: HOLD_LOC[0],
            y: HOLD_LOC[1],
            text: hold.durability,
            // fairly big font
            fontSize: ITEM_RADIUS*0.8,
        });
        // put text on top of the item
        durability_text.offsetX(durability_text.getWidth()/2);
        durability_text.offsetY(durability_text.getHeight() * 3);
        layer.add(durability_text);
    }
    

    // draw the result item
    if (result != null) {
        render_single_item(result, RESULT_LOC[0], RESULT_LOC[1]);
    }

    // draw the slots
    for (let i = 0; i < slots.length; i++) {
        let slot = slots[i];
        if (slot != null) {
            render_single_item(slot, SLOT_LOCS[i][0], SLOT_LOCS[i][1]);
        }
    }
}

function render_items(items) {
    // clear the dynamic layer
    layer.removeChildren();

    render_inventory(items.inventory);
    render_foreground_items(items);
}
