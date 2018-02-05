'use strict';

var baseHeuristic = function (state) {
        var myp = state.sides[state.me].active[0].hp / state.sides[state.me].active[0].maxhp;
        var thp = state.sides[1 - state.me].active[0].hp / state.sides[1 - state.me].active[0].maxhp;
        let myTeam = state.sides[state.me].pokemon
        let opponentTeam = state.sides[1-state.me].pokemon
        return myp - 3 * thp - 0.3 * state.turn;
};

var betterHeuristic = function(state) {
    
    let myTeam = state.sides[state.me].pokemon
    let opponentTeam = state.sides[1-state.me].pokemon

    let myTeamHealth = 0
    for(let ind in myTeam){
        myTeamHealth+=myTeam[ind].hp/myTeam[ind].maxhp*100
    };
    let opponentTeamHealth = 0
    for(let ind=0; ind< opponentTeam.length; ind++){
        opponentTeamHealth+=opponentTeam[ind].hp/opponentTeam[ind].maxhp*100
    };
    opponentTeamHealth+=(6-opponentTeam.length)*100

    let myTeamDeath = 0
    for(let ind=0; ind < myTeam.length; ind++){
        if(myTeam[ind].hp <= 0) { myTeamDeath++; }
     };

    let opponentTeamDeath = 0
    for(let ind=0; ind < opponentTeam.length; ind++){
        if(opponentTeam[ind].hp <= 0) { opponentTeamDeath++; }
     };


    //  console.log("----------------player"+state.me+"--------------------------")
    // console.log("health: ", myTeamHealth, opponentTeamHealth);
    // console.log("num of deads:", myTeamDeath, opponentTeamDeath);

    return myTeamHealth/100-opponentTeamHealth/100 - 0.5*myTeamDeath + 0.5*opponentTeamDeath
};

exports.betterHeuristic = betterHeuristic;
exports.baseHeuristic = baseHeuristic;