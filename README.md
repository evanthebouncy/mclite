# mclite_rendering
rendering for mclite

## overview
mclite is a light version of the minecraft game where one can only mine materials and craft items.
there is no movements in this game.

## the game

### state
the state consists of (inventory, holding, crafting\_table, crafting\_result)
- inventory : a mapping of item\_id -> quantity over all discoverable items, quantity <= MAX_AMT
    - adding items is capped at MAX_AMT, any overshoot is discarded
- holding : 1 item the agent is currently holding
- crafting\_table : the 3 x 3 crafting table of 9 slots, represented as an array containing item\_id or empty for each slot
- crafting\_result : the outcome of crafting should the items on the crafting\_table follow a valid recipe

### action
the agent can carry out the following actions
- hold(item\_id) : remove 1 quantity of item\_id from inventory and put it in holding
    - if already holding another item, return the other item to inventory
    - if attempting to hold an item not in inventory, Error
- mine(item\_id) : attempting to mine a material item
    - different materials require different tools to be held, specified in mining-logic.js
    - if a material cannot be mined with held tool, Error
    - if a material can be mined with held tool
        - the tool breaks (remove from holding)
        - add YIELD\_AMT of item\_id to inventory, see mining-logic.js
- place(slot\_id) : put the held item into corresponding slot on crafting\_table
    - if slot already occupied, evict that item to inventory, and put the held item
    - if not currently holding any item, Error
- collect : collect the crafting result and add it to inventory
    - if crafting\_result is empty, Error
- clear : return held item and items on crafting\_table back to the inventory

## tech-tree
refer to tech-tree.json for crafting