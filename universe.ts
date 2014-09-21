/// <reference path="Scripts/delaunay/delaunay.d.ts"/>

function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
} // distance

class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  distance(p: Point): number {
    return distance(this, p);
  } // distance
} // Point

class Place extends Point {
  id: string;
  links: Place[];

  constructor(x: number, y: number) {
    super(x, y);
    this.id = "place" + ID++;
    this.links = [];
  }
} // Place

class Universe {
  dimX: number;
  dimY: number;
  maxPlaces: number; // number of locations
  places: Place[];
  margin: number; // margin in % where no place can appear
  gap: number; // minimal distance between two locations
  connectionLength: number; // maximal connection length in % (must be > gap)

  constructor(dimX: number, dimY: number, maxPlaces: number,
    margin: number, gap: number, connectionLength: number) {
    this.dimX = dimX;
    this.dimY = dimY;
    this.maxPlaces = maxPlaces;
    this.margin = margin;
    this.gap = gap;
    this.connectionLength = connectionLength;

    this.generate();
  }

  // *************************
  // Generate places and links
  generate() {
    console.time("Generate");
    // Creation of places
    this.places = [];
    var vertices: number[][] = [];
    var i = 0;
    var pos = new Point(0, 0);
    while (i < this.maxPlaces) {
      pos.x = this.margin + (1 - 2 * this.margin) * Math.random();
      pos.y = this.margin + (1 - 2 * this.margin) * Math.random();

      if (this.isValidLocation(pos)) {
        this.places.push(new Place(pos.x, pos.y));
        vertices.push([pos.x, pos.y]);
        i++;
      }
    } // while

    // Delaunay Triangulation
    var triangles = Delaunay.triangulate(vertices);

    for (i = 0; i < triangles.length; i += 3) {
      var p0 = this.places[triangles[i + 0]];
      var p1 = this.places[triangles[i + 1]];
      var p2 = this.places[triangles[i + 2]];
      if (p0.distance(p1) < this.connectionLength) p0.links.push(p1);
      if (p0.distance(p2) < this.connectionLength) p0.links.push(p2);
      if (p1.distance(p0) < this.connectionLength) p1.links.push(p0);
      if (p1.distance(p2) < this.connectionLength) p1.links.push(p2);
      if (p2.distance(p0) < this.connectionLength) p2.links.push(p0);
      if (p2.distance(p1) < this.connectionLength) p2.links.push(p1);
    } // for i
    console.timeEnd("Generate");
  } // generate

  // ********************************
  // Check the validity of a location
  isValidLocation(pos: Point): boolean {
    if (!(pos.x > this.margin && pos.x < 1 - this.margin &&
      pos.y > this.margin && pos.y < 1 - this.margin)) {
      return false;
    }

    for (var i = 0; i < this.places.length; i++) {
      var place = this.places[i];

      if (pos.distance(place) < this.gap) {
        return false;
      }
    } // for i

    return true;
  } // isValidLocation

  // *******************************
  // Draw the world in HTML/SVG
  draw() {
    var radius = 5;
    var layerPlaces = <HTMLElement>document.getElementById("layerPlaces");
    var layerLinks = <HTMLElement>document.getElementById("layerLinks");

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
      } // for j
    } // for i
  } // draw

  // ***********************************
  // Regenerate the universe and draw it
  refresh() {
    universe.generate();
    universe.draw();
  } // refresh
} // Universe

var ID: number = 0;
var universe = new Universe(800, 600, 400, 0.050, 0.020, 0.068);
