/// <reference path="Scripts/rng/rng.ts"/>
/// <reference path="Scripts/delaunay/delaunay.d.ts"/>
/// <reference path="Scripts/namegen/namegen.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Point = (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    return Point;
})();

var Place = (function (_super) {
    __extends(Place, _super);
    function Place(x, y, name) {
        _super.call(this, x, y);
        this.id = "place" + ID++;
        this.name = name;
        this.links = [];
        this.isVisited = false;
    }
    Place.prototype.addLink = function (neighbour) {
        for (var i = 0; i < this.links.length; i++) {
            if (this.links[i].id == neighbour.id) {
                return;
            }
        }

        this.links.push(neighbour);
    };

    Place.prototype.delLink = function (neighbour) {
        for (var i = 0; i < this.links.length; i++) {
            if (this.links[i].id == neighbour.id) {
                this.links.splice(i, 1);
            }
        }
    };
    return Place;
})(Point);

var Universe = (function () {
    function Universe(dimX, dimY, maxPlaces, margin, gap, connectionLength, distribution, seed) {
        if (typeof distribution === "undefined") { distribution = "uniform"; }
        if (typeof seed === "undefined") { seed = Date.now(); }
        this.dimX = dimX;
        this.dimY = dimY;
        this.maxPlaces = maxPlaces;
        this.margin = margin;
        this.gap = gap;
        this.gapSq = gap * gap;
        this.connectionLength = connectionLength;
        this.connectionLengthSq = connectionLength * connectionLength;
        this.distribution = distribution;
        this.seed = seed;
        this.rngPlace = new SeededRNG(this.seed, "xorshift", this.distribution);
        this.rngName = new SeededRNG(this.seed, "xorshift", "uniform");
        this.nameGen = new NameGeneratorElite(this.rngName);

        this.generate();
    }
    // *************************
    // Generate places and links
    Universe.prototype.generate = function () {
        console.time("Generate");

        // Initialization of RNGs
        this.rngPlace.reset(this.seed);
        this.rngName.reset(this.seed);

        /////////////////////
        // Creation of places
        ID = 0;
        this.places = [];
        var vertices = [];
        var i = 0;
        var pos = new Point(0, 0);
        while (i < this.maxPlaces) {
            if (this.distribution == "gaussian") {
                pos.x = 0.5 + (0.5 - this.margin) * this.rngPlace.randNorm() / 3;
                pos.y = 0.5 + (0.5 - this.margin) * this.rngPlace.randNorm() / 3;
            } else {
                pos.x = this.margin + (1 - 2 * this.margin) * this.rngPlace.rand();
                pos.y = this.margin + (1 - 2 * this.margin) * this.rngPlace.rand();
            }

            if (this.isValidLocation(pos)) {
                this.places.push(new Place(pos.x, pos.y, this.nameGen.randName()));
                vertices.push([pos.x, pos.y]);
                i++;
            }
        }

        /////////////////////////
        // Delaunay Triangulation
        var triangles = Delaunay.triangulate(vertices);

        for (i = 0; i < triangles.length; i += 3) {
            var p0 = this.places[triangles[i + 0]];
            var p1 = this.places[triangles[i + 1]];
            var p2 = this.places[triangles[i + 2]];
            p0.addLink(p1);
            p0.addLink(p2);
            p1.addLink(p0);
            p1.addLink(p2);
            p2.addLink(p0);
            p2.addLink(p1);
        }

        //////////////////////////
        // Conditional Alpha Shape
        var origin = this.places[0];

        // Process the first place as a special case
        origin.links.sort(function (a, b) {
            return distanceSq(origin, b) - distanceSq(origin, a);
        });
        for (var j = 0; j >= origin.links.length; j++) {
            var neighbour = origin.links[j];
            if (distanceSq(origin, neighbour) > this.connectionLengthSq && origin.links.length > 1) {
                origin.links.splice(j, 1);
                neighbour.delLink(origin);
            }
        }

        for (i = 1; i < this.places.length; i++) {
            var place = this.places[i];

            place.links.sort(function (a, b) {
                return distanceSq(place, b) - distanceSq(place, a);
            });

            for (var j = 0; j < place.links.length; j++) {
                var neighbour = place.links[j];

                if (distanceSq(place, neighbour) <= this.connectionLengthSq) {
                    break;
                }

                // Backup links
                var placeLinksOld = place.links.slice(0);
                var neighbourLinksOld = neighbour.links.slice(0);

                // Delete too long links
                place.links.splice(j, 1);
                neighbour.delLink(place);

                // Restore deleted links if connexity is lost
                if (!this.isPath(place, origin) || !this.isPath(neighbour, origin)) {
                    place.links = placeLinksOld;
                    neighbour.links = neighbourLinksOld;
                }
            }
        }

        console.timeEnd("Generate");
    };

    Universe.prototype.generateOld = function () {
        console.time("Generate");

        // Initialization of RNGs
        this.rngPlace.randomSeed = this.seed;
        this.rngName.randomSeed = this.seed;

        // Creation of places
        this.places = [];
        var vertices = [];
        var i = 0;
        var pos = new Point(0, 0);
        while (i < this.maxPlaces) {
            if (this.distribution == "uniform") {
                pos.x = this.margin + (1 - 2 * this.margin) * this.rngPlace.rand();
                pos.y = this.margin + (1 - 2 * this.margin) * this.rngPlace.rand();
            } else {
                pos.x = 0.5 + (0.5 - this.margin) * this.rngPlace.rand() / 3;
                pos.y = 0.5 + (0.5 - this.margin) * this.rngPlace.rand() / 3;
            }

            if (this.isValidLocation(pos)) {
                this.places.push(new Place(pos.x, pos.y, this.nameGen.randName()));
                vertices.push([pos.x, pos.y]);
                i++;
            }
        }

        // Delaunay Triangulation
        var triangles = Delaunay.triangulate(vertices);

        for (i = 0; i < triangles.length; i += 3) {
            var p0 = this.places[triangles[i + 0]];
            var p1 = this.places[triangles[i + 1]];
            var p2 = this.places[triangles[i + 2]];
            /*if (distanceSq(p0, p1) < this.connectionLengthSq)*/ p0.links.push(p1);
            /*if (distanceSq(p0, p2) < this.connectionLengthSq)*/ p0.links.push(p2);
            /*if (distanceSq(p1, p0) < this.connectionLengthSq)*/ p1.links.push(p0);
            /*if (distanceSq(p1, p2) < this.connectionLengthSq)*/ p1.links.push(p2);
            /*if (distanceSq(p2, p0) < this.connectionLengthSq)*/ p2.links.push(p0);
            /*if (distanceSq(p2, p1) < this.connectionLengthSq)*/ p2.links.push(p1);
        }

        for (i = 0; i < this.places.length; i++) {
            var place = this.places[i];

            place.links.sort(function (a, b) {
                return distanceSq(place, a) - distanceSq(place, b);
            });

            for (var j = place.links.length - 1; j >= 0; j--) {
                var neighbour = place.links[j];
                if (distanceSq(place, neighbour) > this.connectionLengthSq && place.links.length > 1)
                    place.links.pop();
            }
        }

        console.timeEnd("Generate");
    };

    // ********************************
    // Check the validity of a location
    Universe.prototype.isValidLocation = function (pos) {
        if (!(pos.x > this.margin && pos.x < 1 - this.margin && pos.y > this.margin && pos.y < 1 - this.margin)) {
            return false;
        }

        for (var i = 0; i < this.places.length; i++) {
            var place = this.places[i];

            if (distanceSq(pos, place) < this.gapSq) {
                return false;
            }
        }

        return true;
    };

    // ***********************************
    // Return a place with its ID
    Universe.prototype.getPlace = function (id) {
        for (var i = 0; i < this.places.length; i++) {
            var place = this.places[i];
            if (place.id == id) {
                return place;
            }
        }
        return null;
    };

    // ********************
    // Check Path existence
    Universe.prototype.isPath = function (start, end) {
        var visited = [];
        for (var i = 0; i < this.places.length; i++) {
            this.places[i].isVisited = false;
        }

        visited.push(start);

        while (visited.length > 0) {
            var p = visited.pop();
            if (!p.isVisited) {
                p.isVisited = true;
                for (var i = 0; i < p.links.length; i++) {
                    var neighbour = p.links[i];
                    if (neighbour.id == end.id) {
                        return true;
                    }
                    visited.push(neighbour);
                }
            }
        }

        return false;
    };
    return Universe;
})();

function distanceSq(p1, p2) {
    return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
}

function distance(p1, p2) {
    return Math.sqrt(distanceSq(p1, p2));
}

var ID = 0;
//# sourceMappingURL=universe.js.map
