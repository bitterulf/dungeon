var seedrandom = require('seedrandom');
var PNGImage = require('png-image');
var _ = require('underscore');

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

var loopTiles = function(obj, width, height, fn) {
  for (x = 0; x < width; x++) {
    for (y = 0; y < height; y++) {
      fn.apply(obj, [x, y]);
    }
  }
};

var index = function(obj, x, y)
{
  return y * obj.width + x;
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

  this.addReplaceInner = function (source, target, percent) {
    this.commands.push({
      command: 'replaceInner',
      data: {
        source: source,
        target: target,
        percent: percent
      }
    });
    return this;
  };

  this.addGrow = function (source, target, percent) {
    this.commands.push({
      command: 'grow',
      data: {
        source: source
      }
    });
    return this;
  };

  this.addLittleGrow = function (source, target, percent) {
    this.commands.push({
      command: 'littleGrow',
      data: {
        source: source
      }
    });
    return this;
  };

  this.addAreaFactor = function (min, max) {
    this.validators.push({
      command: 'areaFactor',
      min: min,
      max: max,
      data: {}
    });
  };

  this.addAreaCount = function (min, max, data) {
    this.validators.push({
      command: 'areaCount',
      min: min,
      max: max,
      data: data
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
        this[this.commands[c].command](this.commands[c].data);
      }
      for (var v = 0; v < this.validators.length; v++) {
        if (isValid) {
          checkResult = this[this.validators[v].command](this.validators[v].data);
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
    loopTiles(this, this.width, this.height, function(x, y) {
      this.data[index(this, x, y)] = 0;
    });
  };

  this.replace = function (data) {
    var source = data.source;
    var target = data.target;
    var percent = data.percent;
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

  this.replaceInner = function (data) {
    var source = data.source;
    var target = data.target;
    var percent = data.percent;
    var sourceId = getTileIdForName(this.tiles, source);
    var targetId = getTileIdForName(this.tiles, target);

    var counter = 0;
    var x;
    var y;

    var positions = [];

    for (x = 0; x < this.width; x++) {
      for (y = 0; y < this.height; y++) {
        if (this.data[y * this.width + x] == sourceId) {
          if (x - 1 >= 0 && y - 1 >= 0 && x + 1 < this.width && y + 1 < this.height) {
            if (
              this.data[(y-1) * this.width + (x-1)] == sourceId &&
              this.data[(y-1) * this.width + (x)] == sourceId &&
              this.data[(y-1) * this.width + (x+1)] == sourceId &&
              this.data[(y) * this.width + (x-1)] == sourceId &&
              this.data[(y) * this.width + (x)] == sourceId &&
              this.data[(y) * this.width + (x+1)] == sourceId &&
              this.data[(y+1) * this.width + (x-1)] == sourceId &&
              this.data[(y+1) * this.width + (x)] == sourceId &&
              this.data[(y+1) * this.width + (x+1)] == sourceId
            ) {
              positions.push(y * this.width + x);
              counter++;
            }
          }
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

  this.littleGrow = function (data) {
    var source = data.source;
    var sourceId = getTileIdForName(this.tiles, source);

    var growPositions = [];

    for (var x = 0; x < this.width - 1; x++) {
      for (var y = 0; y < this.height - 1; y++) {
        if (this.data[y * this.width + x] == sourceId) {
          if (x-1 >=0) {
            growPositions.push((y) * this.width + (x-1));
          }

          if (y-1 >=0) {
            growPositions.push((y-1) * this.width + (x));
          }

          if (y+1 <this.height) {
            growPositions.push((y+1) * this.width + (x));
          }

          if (x+1 <this.width) {
            growPositions.push((y) * this.width + (x+1));
          }
        }
      }
    }

    growPositions = _.uniq(growPositions);

    for (var p = 0; p < growPositions.length; p++) {
      this.data[growPositions[p]] = sourceId;
    }

    return this;
  };

  this.grow = function (data) {
    var source = data.source;
    var sourceId = getTileIdForName(this.tiles, source);

    var growPositions = [];

    for (var x = 0; x < this.width - 1; x++) {
      for (var y = 0; y < this.height - 1; y++) {
        if (this.data[y * this.width + x] == sourceId) {
          if (x-1 >=0) {
            if (y-1 >=0) {
              growPositions.push((y-1) * this.width + (x-1));
            }
            growPositions.push((y) * this.width + (x-1));
            if (y+1 <this.height) {
              growPositions.push((y+1) * this.width + (x-1));
            }
          }

          if (y-1 >=0) {
            growPositions.push((y-1) * this.width + (x));
          }

          if (y+1 <this.height) {
            growPositions.push((y+1) * this.width + (x));
          }

          if (x+1 <this.width) {
            if (y-1 >=0) {
              growPositions.push((y-1) * this.width + (x+1));
            }
            growPositions.push((y) * this.width + (x+1));
            if (y+1 <this.height) {
              growPositions.push((y+1) * this.width + (x+1));
            }
          }
        }
      }
    }

    growPositions = _.uniq(growPositions);

    for (var p = 0; p < growPositions.length; p++) {
      this.data[growPositions[p]] = sourceId;
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

  this.areaCount = function(tileNames) {
    var sourceIds = [];

    var tiles = this.tiles;

    _.each(tileNames, function(tileName) {
      sourceIds.push(getTileIdForName(tiles, tileName));
    });

    var areas = [];
    var area = [];
    var globalVisited = [];
    var visited = [];
    var todo = [];
    var id;
    var areaCounter = 0;

    var t;

    for (var x = 0; x < this.width; x++) {
      for (var y = 0; y < this.height; y++) {
        if (_.indexOf(sourceIds, this.data[y * this.width + x]) != -1 && _.indexOf(globalVisited, y * this.width + x) == -1) {
          id = y * this.width + x;
          visited = [];
          todo = [];

          visited.push(id);
          globalVisited.push(id);

          if (x-1 >=0 && _.indexOf(sourceIds, this.data[y * this.width + (x - 1)]) != -1 && _.indexOf(globalVisited, y * this.width + (x-1)) == -1) {
            todo.push({y: y, x: x-1});
            globalVisited.push(y * this.width + (x-1));
          }

          if (y-1 >=0 && _.indexOf(sourceIds, this.data[(y-1) * this.width + x]) != -1 && _.indexOf(globalVisited, (y-1) * this.width + x) == -1) {
            todo.push({y: y-1, x: x});
            globalVisited.push((y-1) * this.width + x);
          }

          if (y+1 <this.height && _.indexOf(sourceIds, this.data[(y+1) * this.width + x]) != -1 && _.indexOf(globalVisited, (y+1) * this.width + x) == -1) {
            todo.push({y: y+1, x: x});
            globalVisited.push((y+1) * this.width + x);
          }

          if (x+1 <this.width && _.indexOf(sourceIds, this.data[y * this.width + (x + 1)]) != -1 && _.indexOf(globalVisited, y * this.width + (x+1)) == -1) {
            todo.push({y: y, x: x+1});
            globalVisited.push(y * this.width + (x+1));
          }

          while (todo.length) {
            t = todo.shift();

            if (t.x-1 >=0 && _.indexOf(sourceIds, this.data[t.y * this.width + (t.x - 1)]) != -1 && _.indexOf(globalVisited, t.y * this.width + (t.x-1)) == -1) {
              todo.push({y: t.y, x: t.x-1});
              globalVisited.push(t.y * this.width + (t.x-1));
            }
            if (t.y-1 >=0 && _.indexOf(sourceIds, this.data[(t.y-1) * this.width + t.x]) != -1 && _.indexOf(globalVisited, (t.y-1) * this.width + t.x) == -1) {
              todo.push({y: t.y-1, x: t.x});
              globalVisited.push((t.y-1) * this.width + t.x);
            }

            if (t.y+1 <this.height && _.indexOf(sourceIds, this.data[(t.y+1) * this.width + t.x]) != -1 && _.indexOf(globalVisited, (t.y+1) * this.width + t.x) == -1) {
              todo.push({y: t.y+1, x: t.x});
              globalVisited.push((t.y+1) * this.width + t.x);
            }

            if (t.x+1 <this.width && _.indexOf(sourceIds, this.data[t.y * this.width + (t.x + 1)]) != -1 && _.indexOf(globalVisited, t.y * this.width + (t.x+1)) == -1) {
              todo.push({y: t.y, x: t.x+1});
              globalVisited.push(t.y * this.width + (t.x+1));
            }
          }

          areaCounter++;
        }
      }
    }

    console.log('yaaaahhh', areaCounter);

    return areaCounter;
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

  this.savePng = function (path, cb) {
    var image = PNGImage.createImage(this.width, this.height);
    var tile;

    this.print();

    for (var x = 0; x < this.width; x++) {
      for (var y = 0; y < this.height; y++) {
        tile = this.tiles[this.data[y * this.width + x]];
        image.setAt(y, x, tile.r, tile.g, tile.b, 100);
      }
    }

    image.writeImage(path, function () {
      cb();
    });
  };

  console.log(this.data);

  console.log('generator created', this.width, this.height);
};

module.exports = function (width, height) {
  return new Generator(width, height);
};
