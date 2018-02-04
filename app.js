global.Tools = require('./zarel/tools');
global.toId = Tools.getId;
Tools.includeData();

var OfflineGame = require('./OfflineGame').OfflineGame;
var InterfaceLayer = require('./interfaceLayer').InterfaceLayer;
var OTLAgent = require('./agents/OTLAgent').Agent;
var QLearningAgent = require('./agents/QLearner').Agent;
var MLQAgent = require('./agents/MLQLearner').Agent;
var RandomAgent = require('./agents/RandomAgent').Agent;
var BFSAgent = require('./agents/BFSAgent').Agent;
var MinimaxAgent = require('./agents/MinimaxAgent').Agent;
var SPAgent = require('./agents/TypeSelector').Agent;
var PMMAgent = require('./agents/PBFS').Agent;
var MyMiniMaxAgent = require('./new_agents/MiniMaxAgent').Agent

try {
    require.resolve('./zarel/config/config');
} catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') throw err; // should never happen
    
    console.log("config.js doesn't exist - creating one with default settings...");
    fs.writeFileSync(path.resolve(__dirname, 'config/config.js'),
        fs.readFileSync(path.resolve(__dirname, 'config/config-example.js'))
    );
} finally {
    global.Config = require('./zarel/config/config');
}

    
function done() {
    console.log('Now that process.stdin is paused, there is nothing more to do.');
    process.exit();
}

process.stdin.on('data', function (text) {
    if (text === 'quit\n') {
        done();
    }
});
var scores = [];

console.time('gametime');
for (var i = 0; i < 1; i++) {
    var game = new OfflineGame();
    scores.push(game.playGames(new MyMiniMaxAgent(), new RandomAgent(), 1, 'competitive'));
}
console.timeEnd('gametime');
console.log(scores);
//process.exit(0)