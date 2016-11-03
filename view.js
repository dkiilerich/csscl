View = function() {
    google.load('visualization', '1.0', {'packages':['corechart']});

    this.NUMBER_OF_DICE = 2;
    this.game_ = new Game(this.NUMBER_OF_DICE);
    this.players_ = document.getElementById('players');

    this.addPlayerBtn_ = document.getElementById('addPlayerBtn');

    this.counts_ = document.getElementById('counts');1
    this.times_ = document.getElementById('times');

    this.data_ = document.getElementById('dataDiv');
    this.toggleDataButton_ = document.getElementById('toggleDataBtn');

    this.voice_ = null;
    window.speechSynthesis.onvoiceschanged = function() {
        _view.voice_ = speechSynthesis.getVoices().filter(function(voice) { return voice.name == 'Google UK English Female'; })[0];
    };
    this.playedOneMinuteWarning_ = false;

    this.AddPlayer();

    google.setOnLoadCallback(
        (function(self) {
            return function() {
                self.onLoad_();
            }
        })(this));
};

View.prototype.AddPlayer = function() {
    var playerId = this.players_.children.length;

    var newPlayerLabel = document.createElement('label');
    newPlayerLabel.innerHTML = 'Player ' + (playerId + 1) + '&nbsp';

    var newPlayerInput = document.createElement('input');
    newPlayerInput.setAttribute('type', 'text');
    newPlayerInput.setAttribute('onkeypress', 'if (event.keyCode == 13) _view.AddPlayer()');
    var inputId = 'player' + playerId;
    newPlayerInput.setAttribute('id', inputId);

    var newPlayerFieldset = document.createElement('fieldset');
    newPlayerFieldset.appendChild(newPlayerLabel);
    newPlayerFieldset.appendChild(newPlayerInput);

    this.addPlayerBtn_.parentNode.removeChild(this.addPlayerBtn_);
    newPlayerFieldset.appendChild(this.addPlayerBtn_);

    this.players_.appendChild(newPlayerFieldset);
    document.getElementById(inputId).focus();
};

View.prototype.Start = function() {
    document.getElementById('setup').style.display = 'none';
    for (var i = 0; i < this.players_.children.length; i++) {
        var playerName = document.getElementById('player' + i).value;
        if (playerName.length > 0) {
            this.game_.AddPlayer(playerName);
        }
    }
    document.getElementById('gameplay').style.display = 'block';
    document.getElementById('rollBtn').focus();

    document.onkeypress = function(e) {
        var key = String.fromCharCode(e.keyCode).toLowerCase();
        if (key == 'u') {
            _view.Undo();
        }
    };
};

View.prototype.Roll = function() {
    this.updateView_(this.game_.NewTurn())

    this.updateTime_();
    setInterval(
        (function(self) {
            return function() {
                self.updateTime_();
            }
        })(this),
        1000);
};

View.prototype.Undo = function() {
    this.updateView_(this.game_.UndoTurn());
}

View.prototype.ToggleData = function() {
    if (this.data_.style.display == 'none') {
        var dataText = document.getElementById('dataText');
        dataText.innerHTML = this.game_.GetData();
        this.data_.style.display = 'block';
        var height = dataText.scrollHeight;
        dataText.setAttribute('style', 'height:' + height + 'px');
    } else {
        this.data_.style.display = 'none';
    }
    this.updateVisibility_();
}

View.prototype.onLoad_ = function() {
    this.prepareCharts_();
    this.analytics_();
}

View.prototype.prepareCharts_ = function() {
    var fontSize = parseInt(
        document.defaultView.getComputedStyle(document.getElementById('player'))
            .getPropertyValue('font-size'),
        10);

    this.ROLLS_CHART_OPTIONS = {
        title: 'Rolls',
        fontSize: fontSize * 0.75,
        legend: {position: 'none'},
        chartArea: {left: '20%', height: '100%'},
    };
    this.rollsChart_ = new google.visualization.BarChart(this.counts_);

    this.TIMES_CHART_OPTIONS = {
        title: '',
        fontSize: fontSize * 0.35,
        chartArea: {left: '5%', top: '10%', height: '100%'},
    };
    this.timesChart_ = new google.visualization.PieChart(this.times_);
}

View.prototype.analytics_ = function() {
    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

    ga('create', 'UA-46817264-2', 'logikhaus.net');
    ga('send', 'pageview');
}

View.prototype.updateView_ = function(turn) {
    this.updateResults_(turn);
    this.updateVisibility_();
    this.drawCharts_();
}

View.prototype.updateResults_ = function(turn) {
    if (turn != null) {
        var total = 0;
        for (var i = 0; i < this.NUMBER_OF_DICE; i++) {
            document.getElementById('die' + (i + 1)).innerHTML = turn.dice[i];
            total += turn.dice[i];
        }
        document.getElementById('total').innerHTML = total;
        var speech = new SpeechSynthesisUtterance(total);
        speech.voice = this.voice_;
        speechSynthesis.speak(speech);

        document.getElementById('player').innerHTML = turn.player;

        document.getElementById('roundNumber').innerHTML = this.game_.Round();
    }
}

View.prototype.updateVisibility_ = function() {
    if (this.data_.style.display == 'none') {
        this.toggleDataButton_.innerHTML = 'Show Data';
    } else {
        this.toggleDataButton_.innerHTML = 'Hide Data';
    }

    var undo = document.getElementById('undoBtn');
    var live = document.getElementById('live');
    var statistics = document.getElementById('statistics');
    if (this.game_.Turns().length === 0) {
        undo.style.display = 'none';
        live.style.display = 'none';
        statistics.style.display = 'none';
    } else {
        undo.style.display = 'block';
        live.style.display = 'block';
        statistics.style.display = 'block';
    }
}

View.prototype.drawCharts_ = function() {
    this.drawRollsChart_();
    this.drawTimesChart_();
}

View.prototype.drawRollsChart_ = function() {
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Result');
    data.addColumn('number', 'Count');

    var counts = this.game_.GetCounts();
    for (var i = this.NUMBER_OF_DICE; i < counts.length; i++) {
        data.addRow([i.toString(), counts[i]]);
    }

    var view = new google.visualization.DataView(data);
    view.setColumns([0, 1,
        {
            calc: 'stringify',
            sourceColumn: 1,
            type: 'string',
            role: 'annotation'
        }]);

    this.rollsChart_.draw(view, this.ROLLS_CHART_OPTIONS);
}

View.prototype.drawTimesChart_ = function() {
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Player');
    data.addColumn('number', 'Time');

    var times = this.game_.GetTimes();
    for (var property in times) {
        if (times.hasOwnProperty(property)) {
            data.addRow([property, Math.floor(times[property])]);
        }
    }

    this.timesChart_.draw(data, this.TIMES_CHART_OPTIONS);
}

View.prototype.updateTime_ = function() {
    var turns = this.game_.Turns();
    var elapsed = new Date(Date.now() - turns[turns.length - 1].time);

    var elapsedMinutes = elapsed.getUTCMinutes();
    if (elapsedMinutes < 10) {
        elapsedMinutes = '0' + elapsedMinutes;
    }

    var elapsedSeconds = elapsed.getUTCSeconds();
    if (elapsedSeconds < 10) {
        elapsedSeconds = '0' + elapsedSeconds;
    }

    document.getElementById('timer').innerHTML = elapsedMinutes + ':' + elapsedSeconds;

    if ((elapsed / 1000 > 30) && !this.playedOneMinuteWarning_) {
        this.playedOneMinuteWarning_ = true;
        var speech = new SpeechSynthesisUtterance('one minutes remaining');
        speech.voice = this.voice_;
        speechSynthesis.speak(speech);
    }
}

var _view = new View();