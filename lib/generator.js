var seedrandom = require('seedrandom');

var randomRange = function (min, max, rng) {
  return (min + rng() * (max - min));
};

var getTileIdForName = function (tiles, name) {
  for (var t = 0; t < tiles.length; t++) {
    if (tiles[t].name == name) {
      return t;
    }
  }
  return false;
};

var getRandomTileIdFromNameList = function (list, tiles, rng) {
  var name = list[Math.floor(randomRange(0, list.length, rng))];
  console.log(name);
  return getTileIdForName(tiles, name);
};

var Generator = function (data) {
  this.width = data.width;
  this.height = data.height;

  this.tiles = data.tiles;

  this.seed = data.seed;

  this.rng = seedrandom(this.seed);

  this.commands = [];
  this.validators = [];

  this.addReplace = function (source, target, percent) {
    this.commands.push({
      command: 'replace',
      data: {
        source: source,
        target: target,
        percent: percent
      }
    });
    return this;
  };

  this.addAreaFactor = function (min, max) {
    this.validators.push({
      command: 'areaFactor',
      min: min,
      max: max
    });
  };

  this.run = function (maxTurns) {
    var isValid;
    for (var t = 0; t < maxTurns; t++) {
      console.log('RUN', t);
      this.seed = Math.random();
      this.rng = seedrandom(this.seed);
      this.reset();
      isValid = true;
      var checkResult;
      for (var c = 0; c < this.commands.length; c++) {
        this[this.commands[c].command](this.commands[c].data.source, this.commands[c].data.target, this.commands[c].data.percent);
      }
      for (var v = 0; v < this.validators.length; v++) {
        if (isValid) {
          checkResult = this[this.validators[v].command]();
          if (checkResult < this.validators[v].min) {
            isValid = false;
          } else if (checkResult > this.validators[v].max) {
            isValid = false;
          }
        }
      }

      if (isValid) {
        this.print();
        return this.seed;
      }
    }

    return false;
  };

  this.data = [];

  this.reset = function () {
    for (var x = 0; x < this.width; x++) {
      for (var y = 0; y < this.height; y++) {
        this.data[y * this.width + x] = 0; //getRandomTileIdFromNameList(['sand', 'tree', 'wall'], this.tiles, this.rng);
      }
    }
  };

  this.replace = function (source, target, percent) {
    var sourceId = getTileIdForName(this.tiles, source);
    var targetId = getTileIdForName(this.tiles, target);

    var counter = 0;
    var x;
    var y;

    var positions = [];

    for (x = 0; x < this.width; x++) {
      for (y = 0; y < this.height; y++) {
        if (this.data[y * this.width + x] == sourceId) {
          positions.push(y * this.width + x);
          counter++;
        }
      }
    }

    var rng = this.rng;

    positions.sort(function () {
      return rng() - 0.5;
    });

    for (var p = 0; p < counter * percent / 100; p++) {
      this.data[positions[p]] = targetId;
    }

    return this;
  };

  this.areaFactor = function () {
    var maxFactor = (this.width - 1) * (this.height - 1) * 2;
    var factor = 0;
    for (var x = 0; x < this.width - 1; x++) {
      for (var y = 0; y < this.height - 1; y++) {
        if (this.data[y * this.width + x] == this.data[y * this.width + x + 1]) {
          factor++;
        }
        if (this.data[y * this.width + x] == this.data[y + 1 * this.width + x]) {
          factor++;
        }
      }
    }

    return Math.round(factor / maxFactor * 100);
  };

  this.print = function () {
    console.log('--------------');
    var line;
    for (var x = 0; x < this.width; x++) {
      line = '';
      for (var y = 0; y < this.height; y++) {
        line += this.tiles[this.data[y * this.width + x]].symbol;
      }
      console.log(line);
    }
  };

  console.log(this.data);

  console.log('generator created', this.width, this.height);
};

module.exports = function (width, height) {
  return new Generator(width, height);
};