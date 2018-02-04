'use strict';

var Pokemon = require('../zarel/battle-engine').BattlePokemon;
var deepcopy = require('deepcopy');

// All Showdown AI Agents need 4 methods.

// decide takes in an approximation of the current gamestate, an associative array keyed by choices with choice details as value, and a string to remind you what side you are
// decide should return one of the keys in the array of choices.

// assumepokemon takes a name, level, gender, and the side of the pokemon in order to generate a best-guess estimate of the opponent's stats (which is hidden information)

// digest(line) is a way for you to customize how your agent deals with incoming information.  It doesn't have to do anything, but it can

// getTeam(format) should return the team that the agent plans on using.  This is only relevant if playing in a non-random format.

// All agents should also come with an assumptions object, which will guide how the InterfaceLayer deals with various aspects of hidden information.

class MyEpsilonGreedyAgent {
    constructor() { this.name = 'EpsGreedy' }

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
        var maxDamage = 0;
        var bOption = '';
        var oppactive = gameState.sides[1 - mySide.n].active;
        for (var option in options) {
            var nstate = deepcopy(gameState);
            if (option.startsWith('move')) {
                var cDamage = nstate.getDamage(mySide.active[0], oppactive[0], options[option].id, false);

                if (cDamage && cDamage > maxDamage) {
                    // console.log(mySide.active[0].name + "'s " + options[option].move + " is expected to deal " + cDamage + " damage to " + oppactive[0].name);
                    maxDamage = cDamage;
                    bOption = option;
                }
            }
            else if (option.startsWith('switch')) {
                var pIndex = parseInt(option.split(" ")[1]) - 1;
                for (var move in nstate.sides[mySide.n].pokemon[pIndex].getMoves(null, false)) {
                    var mID = (nstate.sides[mySide.n].pokemon[pIndex].moves[move]);
                    var cDamage = nstate.getDamage(mySide.pokemon[pIndex], oppactive[0], mID, false);

                    if (cDamage && cDamage > maxDamage) {
                        // console.log(mySide.pokemon[pIndex].name + "'s " + mID + " is expected to deal " + cDamage + " damage to " + oppactive[0].name);
                        maxDamage = cDamage;
                        bOption = option;
                    }
                }

            }
            if (maxDamage == 0) {
                bOption = option;
                maxDamage = 1;
            }
        }
        // console.log(bOption);
        return bOption;
    }

    decide(gameState, options, mySide) {
        var choose = Math.random();
        if (choose<0.1) {
            var choice = this.fetch_random_key(options);
            return choice;
        }
        else {
            return this.decideGreedy(gameState, options, mySide);
        }

    }
    // A function that takes in a pokemon's name as string and level as integer, and returns a BattlePokemon object.
    // Assumption Engine is designed to fill in the blanks associated with partial observability.
    // This engine in particular assumes perfect IVs and 100 EVs across the board except for speed, with 0 moves.
    // Other assumption systems can be used as long as they implement assume(pokemon, level)
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

    digest(line) {
    }

    getTeam(format) {
    }
}

exports.Agent = MyEpsilonGreedyAgent;