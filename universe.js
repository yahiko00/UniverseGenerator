/// <reference path="Scripts/rng/rng.ts"/>
/// <reference path="Scripts/delaunay/delaunay.d.ts"/>
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
    function Place(x, y) {
        _super.call(this, x, y);
        this.id = "place" + ID++;
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

        this.generate();
    }
    // *************************
    // Generate places and links
    Universe.prototype.generate = function () {
        console.time("Generate");

        // Creation of RNG
        this.rng = new SeededRNG(this.seed, 4, this.distribution == "gaussian" ? 1 : 0);

        // Creation of places
        this.places = [];
        var vertices = [];
        var i = 0;
        var pos = new Point(0, 0);
        while (i < this.maxPlaces) {
            if (this.distribution == "uniform") {
                pos.x = this.margin + (1 - 2 * this.margin) * this.rng.rand();
                pos.y = this.margin + (1 - 2 * this.margin) * this.rng.rand();
            } else {
                pos.x = 0.5 + (0.5 - this.margin) * this.rng.rand() / 3;
                pos.y = 0.5 + (0.5 - this.margin) * this.rng.rand() / 3;
            }

            if (this.isValidLocation(pos)) {
                this.places.push(new Place(pos.x, pos.y));
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

    // *******************************
    // Draw the world in HTML/SVG
    Universe.prototype.draw = function () {
        var radius = 5;
        var layerPlaces = document.getElementById("layerPlaces");
        var layerLinks = document.getElementById("layerLinks");

        layerPlaces.setAttribute("width", this.dimX.toString());
        layerPlaces.setAttribute("height", this.dimY.toString());
        layerPlaces.innerHTML = "";
        layerLinks.setAttribute("width", this.dimX.toString());
        layerLinks.setAttribute("height", this.dimY.toString());
        layerLinks.innerHTML = "";

        for (var i = 0; i < this.places.length; i++) {
            var place = this.places[i];

            var cx = Math.round(this.dimX * place.x);
            var cy = Math.round(this.dimY * place.y);

            // Draw a location
            var element = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            layerPlaces.appendChild(element);
            element.setAttribute("id", place.id);
            element.setAttribute("cx", cx.toString());
            element.setAttribute("cy", cy.toString());
            element.setAttribute("r", radius.toString());

            for (var j = 0; j < place.links.length; j++) {
                var link = place.links[j];

                // Draw the link only if has not been drawn before
                var drawnLink = document.getElementById(link.id + place.id);
                if (!drawnLink) {
                    var linkX = Math.round(this.dimX * link.x);
                    var linkY = Math.round(this.dimY * link.y);
                    var d = distance(new Point(cx, cy), new Point(linkX, linkY));

                    var x1 = cx;
                    var y1 = cy;
                    var x2 = linkX;
                    var y2 = linkY;

                    // Draw a link
                    var element = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    layerLinks.appendChild(element);
                    element.setAttribute("id", place.id + link.id);
                    element.setAttribute("x1", x1.toString());
                    element.setAttribute("y1", y1.toString());
                    element.setAttribute("x2", x2.toString());
                    element.setAttribute("y2", y2.toString());
                }
            }
        }
    };

    // ***********************************
    // Regenerate the universe and draw it
    Universe.prototype.refresh = function () {
        universe.generate();
        universe.draw();
    };
    return Universe;
})();

var ID = 0;
var universe = new Universe(800, 600, 400, 0.050, 0.020, 0.068);
//# sourceMappingURL=universe.js.map
