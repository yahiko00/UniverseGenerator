/// <reference path="Scripts/rng/rng.ts"/>
/// <reference path="Scripts/delaunay/delaunay.d.ts"/>
/// <reference path="Scripts/namegen/namegen.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
function distance(p1, p2) {
    return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
}

var Point = (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.prototype.distance = function (p) {
        return distance(this, p);
    };
    return Point;
})();

var Place = (function (_super) {
    __extends(Place, _super);
    function Place(x, y, name) {
        _super.call(this, x, y);
        this.id = "place" + ID++;
        this.name = name;
        this.links = [];
    }
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
        this.connectionLength = connectionLength;
        this.distribution = distribution;
        this.seed = seed;
        this.rngPlace = new SeededRNG(this.seed, 4, this.distribution == "gaussian" ? 1 : 0);
        this.rngName = new SeededRNG(this.seed, 4, 0);
        this.nameGen = new NameGeneratorElite(this.rngName);

        this.generate();
    }
    // *************************
    // Generate places and links
    Universe.prototype.generate = function () {
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
            if (p0.distance(p1) < this.connectionLength)
                p0.links.push(p1);
            if (p0.distance(p2) < this.connectionLength)
                p0.links.push(p2);
            if (p1.distance(p0) < this.connectionLength)
                p1.links.push(p0);
            if (p1.distance(p2) < this.connectionLength)
                p1.links.push(p2);
            if (p2.distance(p0) < this.connectionLength)
                p2.links.push(p0);
            if (p2.distance(p1) < this.connectionLength)
                p2.links.push(p1);
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

            if (pos.distance(place) < this.gap) {
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
    return Universe;
})();

var ID = 0;
//# sourceMappingURL=universe.js.map
