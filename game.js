Game = function(numberOfDice) {
    this.players_ = [];
    this.turns_ = [];
    this.currentPlayer_ = -1;
    this.numberOfDice_ = numberOfDice;
}

Game.prototype.AddPlayer = function(player) {
    this.players_.push(player);
}

Game.prototype.NumberOfPlayers = function() {
    return this.players_.length;
}

Game.prototype.NewTurn = function() {
    this.currentPlayer_++;
    if (this.currentPlayer_ === this.players_.length) {
        this.currentPlayer_ = 0;
    }

    var diceRoll = [];
    for (var i = 0; i < this.numberOfDice_; i++) {
        diceRoll.push(this.rollDie_());
    }

    var turn = {
        time: new Date(),
        player: this.players_[this.currentPlayer_],
        dice: diceRoll};
    this.turns_.push(turn);
    return turn;
}

Game.prototype.UndoTurn = function() {
    this.currentPlayer_--;
    if (this.currentPlayer_ === -1) {
        this.currentPlayer_ = this.players_.length - 1;
    }

    this.turns_.pop();
    var length = this.turns_.length;
    if (length >= 1) {
        return this.turns_[this.turns_.length - 1];
    } else {
        return null;
    }
}

Game.prototype.Round = function() {
    return Math.ceil(this.turns_.length / this.players_.length);
}

Game.prototype.Turns = function() {
    return this.turns_;
}

Game.prototype.GetCounts = function() {
    var counts = [];
    for (var i = this.numberOfDice_; i <= this.numberOfDice_ * 6; i++)
    {
        counts[i] = 0;
    }
    for (var i = 0; i < this.turns_.length; i++) {
        var dice = this.turns_[i].dice.reduce(function(a,b) {return a + b});
        counts[dice]++;
    }

    return counts;
}

Game.prototype.GetTimes = function() {
    var times = {};
    for (var i = 0; i < this.players_.length; i++) {
        times[this.players_[i]] = 0;
    }
    for (var i = 1; i < this.turns_.length; i++) {
        var currentTurn = this.turns_[i];
        var lastTurn = this.turns_[i - 1];
        var elapsed = currentTurn.time - lastTurn.time;
        times[lastTurn.player] += elapsed / 1000;
    }
    return times;
}

Game.prototype.GetData = function() {
    var data = 'Time, Round, Player, Dice\r\n';
    for (var i = 0; i < this.turns_.length; i++) {
        var turn = this.turns_[i];
        data += turn.time.toISOString() + ',' +
                Math.ceil((i + 1) / this.players_.length) + ',' +
                turn.player + ',' +
                turn.dice.reduce(function(a,b) {return a + b}) + '\r\n';
    }
    return data;
}

Game.prototype.rollDie_ = function() {
    return Math.floor(Math.random() * 6 + 1);
}