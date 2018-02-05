'use strict';

var Pokemon = require('../zarel/battle-engine').BattlePokemon;
var clone = require('../clone')
var BattleSide = require('../zarel/battle-engine').BattleSide;
var heuristics = require('../heuristics');

class MiniMaxAgent {
    constructor() { 
        this.name = 'my_minimax' 
        this.prune = 0
        this.force = 0
        this.count = 0
        this.evaluateState = heuristics.baseHeuristic
    
    }

    fetch_random_key(obj) {
        var temp_key, keys = [];
        for (temp_key in obj) {
            if (obj.hasOwnProperty(temp_key)) {
                keys.push(temp_key);
            }
        }
        return keys[Math.floor(Math.random() * keys.length)];
    }

    getOptions(state, player, options) {
        if (options != null){
            return options
        }
        return Tools.parseRequestData(state.sides[player].getRequestData());
    }


    minimax(gameState, options, player, depth){
        this.count++
        var best_my_action = null
        var best_opp_action = null
        if (depth == 0){
            return [null, this.evaluateState(gameState)]
        }
        var my_legal_actions = this.getOptions(gameState, player, options)
        if (Object.keys(my_legal_actions).length == 0){
            //force switch
            this.force++ 
            return [null, this.evaluateState(gameState)]
        }
        var opp_legal_actions = this.getOptions(gameState, 1-player, null)
        var my_value = Number.NEGATIVE_INFINITY
        if(Object.keys(opp_legal_actions).length == 0){
            //force switch
            this.force++ 
            return [this.fetch_random_key(my_legal_actions), this.evaluateState(gameState)]
        }
        for (var my_action in my_legal_actions){
            var opp_value = Number.POSITIVE_INFINITY
            for (var opp_action in opp_legal_actions){
                var nstate = gameState.copy()
                nstate.choose('p' + (player + 1), my_action)
                nstate.choose('p' + (1 - player + 1), opp_action)
                var value = this.minimax(nstate, null, player, depth-1)[1]
                if (value < opp_value){
                    opp_value = value
                    best_opp_action = opp_action
                }
                if(value < my_value){
                    //prune
                    this.prune++
                    break
                }
            }
            if (opp_value > my_value){
                best_my_action = my_action
                my_value = opp_value
            }
        }
        return [best_my_action, my_value]
    }


    decide(gameState, options, mySide, forceSwitch) {
        console.log(this.count, this.prune, this.force)
        var nstate = gameState.copy();
        nstate.p1.currentRequest = 'move';
        nstate.p2.currentRequest = 'move';
        nstate.me = mySide.n;
        this.mySID = mySide.n;
        this.mySide = mySide.id;

        var result = this.minimax(nstate, options, mySide.n, 2)[0]
        console.log(result)
        return result
        
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

    digest(line) {
    }
}

exports.Agent = MiniMaxAgent;