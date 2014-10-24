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
        this.id = "place" + Place.ID++;
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
        neighbour.links.push(this);
    };

    Place.prototype.delLink = function (neighbour) {
        for (var i = 0; i < this.links.length; i++) {
            if (this.links[i].id == neighbour.id) {
                this.links.splice(i, 1);
                neighbour.delLink(this);
                return;
            }
        }
    };
    Place.ID = 0;
    return Place;
})(Point);

var Universe = (function () {
    function Universe(dimX, dimY, maxPlaces, margin, gap, connectionLength, topologyType, distribution, seed) {
        if (typeof topologyType === "undefined") { topologyType = "plane"; }
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
        this.topologyType = topologyType;
        this.distribution = distribution;
        this.seed = seed;

        this.generate();
    }
    // ***********************
    // Reset topology and RNGs
    Universe.prototype.reset = function () {
        switch (this.topologyType) {
            case "plane":
                this.topology = new TopologyPlane(this.dimX, this.dimY);
                break;
            case "cylinder":
                this.topology = new TopologyCylinder(this.dimX, this.dimY);
                break;
            default:
                this.topology = new TopologyPlane(this.dimX, this.dimY);
        }

        this.rngPlace = new SeededRNG(this.seed, "xorshift", this.distribution);
        this.rngName = new SeededRNG(this.seed, "xorshift", "uniform");
        this.nameGen = new NameGeneratorElite(this.rngName);
    };

    // *************************
    // Generate places and links
    Universe.prototype.generate = function () {
        var _this = this;
        console.time("Generate");
        this.reset();

        /////////////////////
        // Creation of places
        Place.ID = 0;
        this.places = [];
        var vertices = [];
        var i = 0;
        var pos = new Point(0, 0);
        while (i < this.maxPlaces) {
            if (this.distribution == "gaussian") {
                pos.x = 0.5 + (0.5 - this.margin) * this.rngPlace.rand() / 3;
                pos.y = 0.5 + (0.5 - this.margin) * this.rngPlace.rand() / 3;
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

        // DEBUG
        /*
        var minDist = Number.POSITIVE_INFINITY;
        for (var i = 0; i < this.places.length; i++) {
        var place1 = this.places[i];
        for (var j = i + 1; j < this.places.length; j++) {
        var place2 = this.places[j];
        minDist = Math.min(minDist, this.topology.distance(place1, place2));
        }
        }
        console.log("minDist = " + minDist.toString());
        */
        /////////////////////////
        // Delaunay Triangulation
        var triangles = Delaunay.triangulate(vertices);

        for (i = 0; i < triangles.length; i += 3) {
            var p0 = this.places[triangles[i + 0]];
            var p1 = this.places[triangles[i + 1]];
            var p2 = this.places[triangles[i + 2]];
            p0.addLink(p1);
            p0.addLink(p2);
            p1.addLink(p2);
        }

        //////////////////////////
        // Conditional Alpha Shape
        var origin = this.places[0];

        // Process the first place as a special case
        origin.links.sort(function (a, b) {
            return _this.topology.distanceSq(origin, b) - _this.topology.distanceSq(origin, a);
        });
        for (var j = 0; j >= origin.links.length; j++) {
            var neighbour = origin.links[j];
            if (this.topology.distanceSq(origin, neighbour) > this.connectionLengthSq && origin.links.length > 1) {
                origin.links.splice(j, 1);
                j--;
            }
        }

        for (i = 1; i < this.places.length; i++) {
            var place = this.places[i];

            place.links.sort(function (a, b) {
                return _this.topology.distanceSq(place, b) - _this.topology.distanceSq(place, a);
            });

            for (var j = 0; j < place.links.length; j++) {
                var neighbour = place.links[j];

                if (this.topology.distanceSq(place, neighbour) > this.connectionLengthSq) {
                    // Backup links
                    var placeLinksOld = place.links.slice(0);
                    var neighbourLinksOld = neighbour.links.slice(0);

                    // Delete too long links
                    place.delLink(neighbour);
                    j--;

                    // Restore deleted links if connexity is lost
                    if (!this.isPath(place, origin) || !this.isPath(neighbour, origin)) {
                        place.links = placeLinksOld;
                        neighbour.links = neighbourLinksOld;
                        j++;
                    }
                }
            }
        }

        console.timeEnd("Generate");
    };

    Universe.prototype.generateOld = function () {
        console.time("GenerateOld1");
        this.reset();

        // Creation of places
        Place.ID = 0;
        this.places = [];
        var vertices = [];
        var i = 0;
        var pos = new Point(0, 0);
        while (i < this.maxPlaces) {
            if (this.distribution == "gaussian") {
                pos.x = 0.5 + (0.5 - this.margin) * this.rngPlace.rand() / 3;
                pos.y = 0.5 + (0.5 - this.margin) * this.rngPlace.rand() / 3;
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

        // Delaunay Triangulation
        var triangles = Delaunay.triangulate(vertices);

        for (i = 0; i < triangles.length; i += 3) {
            var p0 = this.places[triangles[i + 0]];
            var p1 = this.places[triangles[i + 1]];
            var p2 = this.places[triangles[i + 2]];
            p0.addLink(p1);
            p0.addLink(p2);
            p1.addLink(p2);
        }

        for (i = 0; i < this.places.length; i++) {
            var place = this.places[i];

            for (var j = 0; j < place.links.length; j++) {
                var neighbour = place.links[j];

                if (this.topology.distanceSq(place, neighbour) > this.connectionLengthSq && place.links.length > 1 && neighbour.links.length > 1) {
                    place.delLink(neighbour);
                    j--;
                }
            }
        }

        console.timeEnd("GenerateOld1");
    };

    Universe.prototype.generateOld2 = function () {
        console.time("GenerateOld2");
        this.reset();

        // Creation of places
        Place.ID = 0;
        this.places = [];
        var vertices = [];
        var i = 0;
        var pos = new Point(0, 0);
        while (i < this.maxPlaces) {
            if (this.distribution == "gaussian") {
                pos.x = 0.5 + (0.5 - this.margin) * this.rngPlace.rand() / 3;
                pos.y = 0.5 + (0.5 - this.margin) * this.rngPlace.rand() / 3;
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

        // Delaunay Triangulation
        var triangles = Delaunay.triangulate(vertices);

        for (i = 0; i < triangles.length; i += 3) {
            var p0 = this.places[triangles[i + 0]];
            var p1 = this.places[triangles[i + 1]];
            var p2 = this.places[triangles[i + 2]];
            if (this.topology.distanceSq(p0, p1) < this.connectionLengthSq)
                p0.links.push(p1);
            if (this.topology.distanceSq(p0, p2) < this.connectionLengthSq)
                p0.links.push(p2);
            if (this.topology.distanceSq(p1, p0) < this.connectionLengthSq)
                p1.links.push(p0);
            if (this.topology.distanceSq(p1, p2) < this.connectionLengthSq)
                p1.links.push(p2);
            if (this.topology.distanceSq(p2, p0) < this.connectionLengthSq)
                p2.links.push(p0);
            if (this.topology.distanceSq(p2, p1) < this.connectionLengthSq)
                p2.links.push(p1);
        }

        console.timeEnd("GenerateOld2");
    };

    // ********************************
    // Check the validity of a location
    Universe.prototype.isValidLocation = function (pos) {
        if (!(pos.x > this.margin && pos.x < 1 - this.margin && pos.y > this.margin && pos.y < 1 - this.margin)) {
            return false;
        }

        for (var i = 0; i < this.places.length; i++) {
            var place = this.places[i];

            if (this.topology.distanceSq(pos, place) < this.gapSq) {
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

var TopologyPlane = (function () {
    function TopologyPlane(dimX, dimY) {
        this.dimX = dimX;
        this.dimY = dimY;
    }
    TopologyPlane.prototype.distanceSq = function (p1, p2) {
        return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
    };

    TopologyPlane.prototype.distance = function (p1, p2) {
        return Math.sqrt(this.distanceSq(p1, p2));
    };

    TopologyPlane.prototype.normalize = function (p) {
        var normPoint = new Point(p.x, p.y);
        return normPoint;
    };
    return TopologyPlane;
})();

var TopologyCylinder = (function () {
    function TopologyCylinder(dimX, dimY) {
        this.dimX = dimX;
        this.dimY = dimY;
    }
    TopologyCylinder.prototype.distanceSq = function (p1, p2) {
        var nwDistanceSq = (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
        var wDistanceXSq;
        if (p1.x <= p2.x) {
            wDistanceXSq = (p1.x - p2.x + this.dimX) * (p1.x - p2.x + this.dimX);
        } else {
            wDistanceXSq = (p2.x - p1.x + this.dimX) * (p2.x - p1.x + this.dimX);
        }
        var wDistanceSq = wDistanceXSq + (p1.y - p2.y) * (p1.y - p2.y);
        return Math.min(nwDistanceSq, wDistanceSq);
    };

    TopologyCylinder.prototype.distance = function (p1, p2) {
        return Math.sqrt(this.distanceSq(p1, p2));
    };

    TopologyCylinder.prototype.normalize = function (p) {
        var normPoint = new Point(p.x % this.dimX, p.y % this.dimY);
        return normPoint;
    };
    return TopologyCylinder;
})();
//# sourceMappingURL=universe.js.map
