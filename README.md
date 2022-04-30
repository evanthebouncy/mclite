# mclite_rendering
rendering for mclite

## overview
mclite is a light version of the minecraft game where one can only mine materials and craft items.
there is no movements in this game.

## the game

### state
the state consists of (inventory, holding, crafting\_table, crafting\_result)
- inventory : a mapping of item\_id -> quantity over all discoverable items, quantity <= MAX_AMT
- holding : 1 item the agent is currently holding
- crafting\_table : the 3 x 3 crafting table of 9 slots, represented as an array containing item\_id or empty for each slot
- crafting\_result : the outcome of crafting should the items on the crafting\_table follow a valid recipe

## tech-tree
refer to tech-tree.json for crafting