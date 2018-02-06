'use strict';

var Pokemon = require('../zarel/battle-engine').BattlePokemon;
var BattleSide = require('../zarel/battle-engine').BattleSide;

class Node{
    constructor(gameState, parent, simulationsRunned, simulationsWon, baseMove, user, deep) {
        this.gameState = gameState;
        this.parent = parent;
        this.childs = [];
        this.simulationsRunned = simulationsRunned;
        this.simulationsWon = simulationsWon;
        this.baseMove = baseMove;
        this.eps = 0.00001;
        this.user = user;
        this.deep = deep;
    }

    count() {
        let simWon = (this.user === Node.myId)? this.simulationsWon : 1 - this.simulationsWon;
        let simRunned = this.simulationsRunned + this.eps;
        return simWon / simRunned + Math.sqrt(2 * Math.log(this.parent.simulationsRunned) / simRunned)
    }

    wonPercentage() {
        return this.simulationsWon / this.simulationsRunned;
    }
}


class MyAgent{
    constructor(log, iterationsAmount, maxDeep) {
        this.iterationsAmount = iterationsAmount;
        this.maxDeep = maxDeep;
        this.name = 'our_MCTS';
        this.log = log;
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
        if (Node.rootHisHp - hisHp > Node.rootMyHp - myHp) {
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

    oppId(id) {
        return id === this.myId ? this.hisId : this.myId;
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
        let options = this.getOptions(state, node.user);
        let choice = Math.floor(Math.random() * Object.keys(options).length);
        if (choice !== undefined) state.choose(node.user, Object.keys(options)[choice]);

        let hisHp = this.getHp(state[this.hisId].pokemon);
        let myHp = this.getHp(state[this.myId].pokemon);
        for (let j = 0; j < this.maxDeep - node.deep; ++j) {
            if (this.getHp(state[this.hisId].pokemon) === 0 || this.getHp(state[this.myId].pokemon) === 0) {
                break;
            }

            let myOptions = this.getOptions(state, this.myId);
            let hisOptions = this.getOptions(state, this.hisId);

            let myChoice = Math.floor(Math.random() * Object.keys(myOptions).length);
            let hisChoice = Math.floor(Math.random() * Object.keys(hisOptions).length);

            let myOption = Object.keys(myOptions)[myChoice];
            let hisOption = Object.keys(hisOptions)[hisChoice];

            if (myOption !== undefined) state.choose(this.myId, myOption);
            // else state[this.myId].currentRequest = 'move';
            if (hisOption !== undefined) state.choose(this.hisId, hisOption);
            // else state[this.hisId].currentRequest = 'move';
        }
        this.evaluate(node, state);
    }

    expanse(node) {
        let options = this.getOptions(node.gameState, node.user);

        if (Object.keys(options).length === 0) {
            let childState = node.gameState.copy();
            let child = new Node(childState, node, 0, 0, "move", this.oppId(node.user), node.deep + 1);
            node.childs.push(child)
        } else {
            for (let option in options) {
                let childState = node.gameState.copy();
                childState.choose(node.user, option);
                let child = new Node(childState, node, 0, 0, option, this.oppId(node.user), node.deep + 1);
                node.childs.push(child)
            }
        }
        let randomChild = Math.floor(Math.random() * node.childs.length);
        this.digEvaluation(node.childs[randomChild]);
    }

    getOptions(state, player) {
        if (typeof (player) === 'string' && player.startsWith('p')) {
            player = parseInt(player.substring(1)) - 1;
        }
        return Tools.parseRequestData(state.sides[player].getRequestData());
    }

    decide(gameState, options, mySide) {
        let state = gameState.copy();
        state.p1.currentRequest = 'move';
        state.p2.currentRequest = 'move';
        this.myId = mySide.id;
        this.hisId = gameState.p1.id === this.myId ? gameState.p2.id : gameState.p1.id;
        Node.myId = this.myId;

        if (Object.keys(this.getOptions(state, this.myId)).length === 0 || Object.keys(this.getOptions(state, this.hisId)).length === 0) {
            console.log("MY: ", this.getOptions(state, this.myId));
            console.log("his: ", this.getOptions(state, this.hisId));
        }


        Node.rootMyHp = this.getHp(state[this.myId].pokemon);
        Node.rootHisHp = this.getHp(state[this.hisId].pokemon);

        let root = new Node(state, null, 0, 0, "move", this.myId, 0);

        for (var i = 0; i < this.iterationsAmount; ++i) {
            var leaf = this.findLeaf(root);
            this.expanse(leaf);
        }

        var bestChild = root.childs[0];
        for (var child in root.childs) {
            if (root.childs[child].wonPercentage() > bestChild.wonPercentage()) {
                bestChild = root.childs[child];
            }
        }
        let choice = bestChild.baseMove;
        if (this.log) {
            if (choice.startsWith('switch')) {
                console.log(this.name + ': ' + choice, '(' + gameState[mySide.id].pokemon[choice[7] - 1].getDetails().split(',')[0] + ')');
            } else {
                console.log(this.name + ': ' + choice);
            }
        }
        return choice;
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