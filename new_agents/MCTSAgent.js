'use strict';

var Pokemon = require('../zarel/battle-engine').BattlePokemon;
var BattleSide = require('../zarel/battle-engine').BattleSide;

class Node{
    constructor(gameState, parent, simulationsRunned, simulationsWon, baseMove) {
        this.gameState = gameState;
        this.parent = parent;
        this.childs = [];
        this.simulationsRunned = simulationsRunned;
        this.simulationsWon = simulationsWon;
        this.baseMove = baseMove;
    }
    count() {
        return this.simulationsWon / this.simulationsRunned + Math.sqrt(2 * Math.log(this.parent.simulationsRunned / this.simulationsRunned))
    }

    wonPercentage() {
        return this.simulationsWon / this.simulationsRunned;
    }
}


class MyAgent{

    findRoot(node) {
        if (node.parent === null) {
            return node;
        } else {
            return this.findRoot(node.parent);
        }
    }

    findLeaf(node) {
        if (node.childs.length === 0) {
            return node;
        } else {
            let childs = node.childs;
            let bestChild = childs[0];
            for (let child in childs) {
                if (bestChild.count() < childs[child].count()) {
                    bestChild = childs[child];
                }
            }
            return this.findLeaf(bestChild)
        }
    }

    evaluate(node, state) {
        if (state === undefined) {
            state = node.state;
        }
        let won = 0;
        let myHp = this.getHp(state[this.myId].pokemon);
        let hisHp = this.getHp(state[this.hisId].pokemon);
        let root = this.findRoot(node);
        if (root.hisHp - hisHp > root.myHp - myHp) {
            won = 1;
        }
        node.simulationsRunned += 1;
        node.simulationsWon += won;
        while (node.parent !== null) {
            node = node.parent;
            node.simulationsRunned += 1;
            node.simulationsWon += won;
        }
    }

    getHp(pokemons) {
        let hp = 0;
        for (let pok in pokemons) {
            hp += parseFloat(pokemons[pok].hp) / parseFloat(pokemons[pok].maxhp)
        }
        return hp;
    }

    digEvaluation(node) {
        let state = node.gameState.copy();
        let hisHp = this.getHp(state[this.hisId].pokemon);
        let myHp = this.getHp(state[this.myId].pokemon);
        let j = 0;
        while (myHp > 0 && hisHp > 0) {
            j ++;
            if (j===10) {
                // console.log("really don't know what happend");
                break;
            }
            let myOptions = this.getOptions(state, this.myId);
            let hisOptions = this.getOptions(state, this.hisId);
            let myChoice = Math.floor(Math.random() * Object.keys(myOptions).length);
            let hisChoice = Math.floor(Math.random() * Object.keys(hisOptions).length);
            let myOption;
            let hisOption;
            let i = 0;
            for (myOption in myOptions) {
                if (i === myChoice) break;
                ++i;
            }
            i = 0;
            for (hisOption in hisOptions) {
                if (i === hisChoice) break;
                ++i;
            }
            if (myOption !== undefined) state.choose(this.myId, myOption);
            // else state[this.myId].currentRequest = 'move';
            if (hisOption !== undefined) state.choose(this.hisId, hisOption);
            // else state[this.hisId].currentRequest = 'move';
            hisHp = this.getHp(state[this.hisId].pokemon);
            myHp = this.getHp(state[this.myId].pokemon);
        }
        this.evaluate(node, state);
    }

    expanse(node) {
        let myOptions = this.getOptions(node.gameState, this.myId);
        let hisOptions = this.getOptions(node.gameState, this.hisId);
        if (Object.keys(hisOptions) === 0 || Object.keys(myOptions) === 0) {
            this.evaluate(node)
        } else {
            for (let myOption in myOptions) {
                for (let hisOption in hisOptions) {
                    let childState = node.gameState.copy();
                    childState.choose(this.myId, myOption);
                    childState.choose(this.hisId, hisOption);
                    let child = new Node(childState, node, 0, 0, myOptions[myOption]);
                    this.digEvaluation(child);
                    node.childs.push(child)
                }
            }
        }
    }

    expanseRoot(node) {
        let myOptions = this.getOptions(node.gameState, this.myId);
        let hisOptions = this.getOptions(node.gameState, this.hisId);
        if (Object.keys(hisOptions) === 0 || Object.keys(myOptions) === 0) {
            this.evaluate(node)
        } else {
            for (let myOption in myOptions) {
                let childState = node.gameState.copy();
                childState.choose(this.myId, myOption);
                childState.baseMove = myOption;
                let child = new Node(childState, node, 0, 0, myOptions[myOption]);
                node.childs.push(child);
                for (let hisOption in hisOptions) {
                    let grandChildState = childState.copy();
                    childState.choose(this.hisId, hisOption);
                    let grandChild = new Node(grandChildState, child, 0, 0, myOptions[myOption]);
                    this.digEvaluation(grandChild);
                    child.childs.push(grandChild)
                }
            }
        }
    }

    getOptions(state, player) {
        if (typeof (player) == 'string' && player.startsWith('p')) {
            player = parseInt(player.substring(1)) - 1;
        }
        return Tools.parseRequestData(state.sides[player].getRequestData());
    }

    decide(gameState, options, mySide, forceSwitch) {
        var state = gameState.copy();
        state.p1.currentRequest = 'move';
        state.p2.currentRequest = 'move';
        this.myId = mySide.id;
        this.hisId = gameState.p1.id === this.myId ? gameState.p2.id : gameState.p1.id;
        var myNr = parseInt(this.myId.substring(1)) - 1;
        var hisNr = parseInt(this.hisId.substring(1)) - 1;
        let myHp = this.getHp(state[this.myId].pokemon)
        let hisHp = this.getHp(state[this.hisId].pokemon)

        var root = new Node(state, null, 0, 0, options[0])
        root.myHp = myHp;
        root.hisHp = hisHp;
        this.expanseRoot(root);
        for (var i = 0; i < 10; ++i) {
            var leaf = this.findLeaf(root);
            this.expanse(leaf);
        }

        var bestChild = root.childs[0];
        for (var child in root.childs) {
            if (root.childs[child].wonPercentage() > bestChild.wonPercentage()) {
                bestChild = root.childs[child];
            }
        }

        console.log(bestChild.baseMove.choice);
        return bestChild.baseMove.choice;



        // for (option in options) {
        //     console.log(state.getDamage(state.p1.active[0], state.p2.active[0], options[option].id, false));
        // }

    }

    digest(line) {

    }

    assumePokemon(pname, plevel, pgender, side) {
        var template = Tools.getTemplate(pname);
        var nSet = {
            species: pname,
            name: pname,
            level: plevel,
            gender: pgender,
            evs: {
                hp: 85,
                atk: 85,
                def: 85,
                spa: 85,
                spd: 85,
                spe: 85
            },
            ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
            nature: "Hardy",
            moves: [],
        };
        for (var moveid in template.randomBattleMoves) {
            nSet.moves.push(toId(template.randomBattleMoves[moveid]));
        }
        var basePokemon = new Pokemon(nSet, side);
        // If the species only has one ability, then the pokemon's ability can only have the one ability.
        // Barring zoroark, skill swap, and role play nonsense.
        // This will be pretty much how we digest abilities as well
        if (Object.keys(basePokemon.template.abilities).length == 1) {
            basePokemon.baseAbility = toId(basePokemon.template.abilities['0']);
            basePokemon.ability = basePokemon.baseAbility;
            basePokemon.abilityData = { id: basePokemon.ability };
        }
        return basePokemon;
    }
}

exports.Agent = MyAgent