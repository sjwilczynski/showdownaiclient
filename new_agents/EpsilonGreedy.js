'use strict';
var heuristics = require('../heuristics');
var Pokemon = require('../zarel/battle-engine').BattlePokemon;
var deepcopy = require('deepcopy');

class MyEpsilonGreedyAgent {
    constructor() { 
        this.name = 'EpsGreedy';}

    fetch_random_key(obj) {
        var temp_key, keys = [];
        for (temp_key in obj) {
            if (obj.hasOwnProperty(temp_key)) {
                keys.push(temp_key);
            }
        }
        return keys[Math.floor(Math.random() * keys.length)];
    }

    decideGreedy(gameState, options, mySide) {
        let maxMoveVal = 0
        let maxMoveName = ''
        let opponentActive = gameState.sides[1 - mySide.n].active;
        for(let option in options){
            let newState = gameState.copy()
            if(option.startsWith('move')){
                let actualMoveVal = newState.getDamage(mySide.active[0], opponentActive[0], options[option].id, false)
                if(actualMoveVal>maxMoveVal) {
                    maxMoveVal = actualMoveVal;
                    maxMoveName = option
                }
            }
            else if(option.startsWith('switch')) {
                let thresholdToSwitch = 2*maxMoveVal
                let pokemonIndex = parseInt(option.split(" ")[1]) - 1
                let nextPokemon = newState.sides[mySide.n].pokemon[pokemonIndex]
                for(let move in nextPokemon.getMoves(null, false)){
                    let moveID = nextPokemon.moves[move]
                    let actualMoveVal = newState.getDamage(nextPokemon, opponentActive[0], moveID, false)
                    if(actualMoveVal>maxMoveVal && actualMoveVal>thresholdToSwitch) {
                        maxMoveVal =  actualMoveVal
                        maxMoveName = option
                    }

                }
            }
        }
    // console.log(maxMoveName);
    return maxMoveName
    }

    decide(gameState, options, mySide) {
        var choose = Math.random();
        if (choose<0.1) {
            var choice = this.fetch_random_key(options);
        }
        else {
            var choice = this.decideGreedy(gameState, options, mySide);
        }

        if (choice.startsWith('switch')) {
            console.log(this.name + ': ' + choice, '(' + gameState[mySide.id].pokemon[choice[7] - 1].getDetails().split(',')[0] + ')');
        } else {
            console.log(this.name + ': ' + choice);
        }
        return choice;
    }

    assumePokemon(pname, plevel, pgender, side) {
        var nSet = {
            species: pname,
            name: pname,
            level: plevel,
            gender: pgender,
            evs: { hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 0 },
            ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
            nature: "Hardy"
        };
        var basePokemon = new Pokemon(nSet, side);

        if (Object.keys(basePokemon.template.abilities).length == 1) {
            basePokemon.baseAbility = toId(basePokemon.template.abilities['0']);
            basePokemon.ability = basePokemon.baseAbility;
            basePokemon.abilityData = { id: basePokemon.ability };
        }
        return basePokemon;
    }

    digest(line) {
    }

    getTeam(format) {
    }
}

exports.Agent = MyEpsilonGreedyAgent;