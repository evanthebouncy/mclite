console.log("this is the usage of the drawing app");

// on document ready
$(document).ready(function() {

    var inventory_size = null;
    var all_asset_ids = null;
    

    // just randomize a fake inventory, do not need to read this too carefully
    function make_random_inventory() {

        // fake an inventory of <inventory_size> items, with quantity 0 through 20, chosen from all_asset_ids
        var inventory = [];
        for (var i = 0; i < inventory_size; i++) {
            // choose a random asset id
            var asset_id = Math.floor(Math.random() * all_asset_ids.length);
            // choose a random amount between 0 to 20
            var quantity = Math.floor(Math.random() * 20);
            // add to inventory
            inventory.push({
                "asset_id": all_asset_ids[asset_id],
                "quantity": quantity,
            });
        }

        // fake a random item or null
        function fake_item() {
            var random_asset_id = Math.floor(Math.random() * all_asset_ids.length);
            var actual_asset_id = all_asset_ids[random_asset_id];
            if (Math.random() < 0.5) {
                return actual_asset_id;
            } else {
                return null;
            }
        }

        // fake durability or null
        function fake_durability() {
            if (Math.random() < 0.5) {
                return Math.floor(Math.random() * 5) + 1;
            } else {
                return null;
            }
        }

        var hold_id = fake_item();
        var hold_durability = fake_durability();
        if (hold_id == null) {
            hold_durability = null;
        }

        var hold = {
            asset_id: hold_id,
            durability: hold_durability,
        };

        var result = fake_item();
        var slots = [];
        for (var i = 0; i < 9; i++) {
            slots.push(fake_item());
        }

        var fake_items = {
            hold: hold,
            result: result,
            slots: slots,
            inventory: inventory,
        };

        $("#example_item_json").text(JSON.stringify(fake_items, null, 2));
        
        return fake_items;

    }

    // bind event to the randomize_layout button
    $("#randomize_layout").click(function() {

        // get the number of inventory size, randomly between 10 and 50;
        inventory_size = Math.floor(Math.random() * (50 - 10 + 1)) + 10;

        // randomize a set of assets, putting it to be 2x of the inventory size to account for 
        // un-discovered item might have a different asset, i.e. 17.png 17_undiscovered.png
        all_asset_ids = [];
        // pick a random set of n_items from range (0 to 100), no repeats
        for (var i = 0; i < inventory_size * 2; i++) {
            var item = Math.floor(Math.random() * 100);
            while (all_asset_ids.includes(item)) {
                item = Math.floor(Math.random() * 100);
            }
            all_asset_ids.push(item);
        }
        // log the asset list
        $("#asset_list").text(JSON.stringify(all_asset_ids, null, 2));

        // force the drawing_app to 
        // 1. recompute the rendering parameters (it will do a search for the best layout)
        // 2. draw the robot_and_table picture (load the asset)
        // 3. load relevant asset pictures for the set of items
        // note : I feel this function can be slow, so call it only when necessary
        // for example :
        // 1. you should also call this on window resize
        // 2. you should also call this when you change the asset list
        // 3. you should call this when you change the number of item kinds in the inventory (i.e. 4 slots to 20 slots)
        reset_render(inventory_size, all_asset_ids);

    });

    // bind event to the randomize_item button
    $("#randomize_items").click(function() {
        var random_items = make_random_inventory();
        $("#example_item_json").text(JSON.stringify(random_items, null, 2));

        // render the items
        // call this every time the program state of "items" changes
        render_items(random_items);

    });


});