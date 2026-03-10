const activePlayerIds = ['host_id', 'player2_id'];
const newLivesObj = { host_id: 0 };
const newCorrectGuesses = {};

const allDone = activePlayerIds.every((id) => {
    // If lives aren't defined for this player yet, assume 3
    const livesLeft = newLivesObj[id] !== undefined ? newLivesObj[id] : 3;
    const hasGuessed = newCorrectGuesses[id];
    console.log(`Checking ${id}: livesLeft=${livesLeft}, hasGuessed=${hasGuessed}, returning ${livesLeft <= 0 || hasGuessed}`);
    return livesLeft <= 0 || hasGuessed;
});

console.log("allDone:", allDone);
