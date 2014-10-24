/// <reference path="Scripts/rng/rng.ts"/>
/// <reference path="Scripts/delaunay/delaunay.d.ts"/>
/// <reference path="Scripts/namegen/namegen.ts"/>

class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  } // constructor
} // Point

class Place extends Point {
  static ID: number = 0;
  id: string;
  name: string
  links: Place[];
  isVisited: boolean;

  constructor(x: number, y: number, name: string) {
    super(x, y);
    this.id = "place" + Place.ID++;
    this.name = name;
    this.links = [];
    this.isVisited = false;
  }

  addLink(neighbour: Place) {
    // Check neighbour is not already linked
    for (var i = 0; i < this.links.length; i++) {
      if (this.links[i].id == neighbour.id) {
        return;
      }
    } // for i

    this.links.push(neighbour);
    neighbour.links.push(this);
  } // addLink

  delLink(neighbour: Place) {
    for (var i = 0; i < this.links.length; i++) {
      if (this.links[i].id == neighbour.id) {
        this.links.splice(i, 1);
        neighbour.delLink(this);
        return;
      }
    } // for i
  } // delLink
} // Place

class Universe {
  dimX: number;
  dimY: number;
  maxPlaces: number; // number of locations
  places: Place[];
  margin: number; // margin in % where no place can appear
  gap: number; // minimal distance between two locations
  gapSq: number;
  connectionLength: number; // maximal connection length in % (must be > gap)
  connectionLengthSq: number;
  topologyType: string;
  topology: Topology;
  distribution: string;
  nameGen: NameGenerator;
  seed: number;

  rngPlace: SeededRNG;
  rngName: SeededRNG;

  constructor(dimX: number, dimY: number, maxPlaces: number,
    margin: number, gap: number, connectionLength: number, topologyType: string = "plane", distribution: string = "uniform", seed: number = Date.now()) {
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
  reset() {
    switch (this.topologyType) {
      case "plane":
        this.topology = new TopologyPlane(this.dimX, this.dimY);
        break;
      case "cylinder":
        this.topology = new TopologyCylinder(this.dimX, this.dimY);
        break;
      default:
        this.topology = new TopologyPlane(this.dimX, this.dimY);
    } // switch

    this.rngPlace = new SeededRNG(this.seed, "xorshift", this.distribution);
    this.rngName = new SeededRNG(this.seed, "xorshift", "uniform");
    this.nameGen = new NameGeneratorElite(this.rngName);
  } // reset

  // *************************
  // Generate places and links
  generate() {
    console.time("Generate");
    this.reset();

    /////////////////////
    // Creation of places
    Place.ID = 0;
    this.places = [];
    var vertices: number[][] = [];
    var i = 0;
    var pos = new Point(0, 0);
    while (i < this.maxPlaces) {
      if (this.distribution == "gaussian") {
        pos.x = 0.5 + (0.5 - this.margin) * this.rngPlace.rand() / 3;
        pos.y = 0.5 + (0.5 - this.margin) * this.rngPlace.rand() / 3;
      }
      else { // uniform
        pos.x = this.margin + (1 - 2 * this.margin) * this.rngPlace.rand();
        pos.y = this.margin + (1 - 2 * this.margin) * this.rngPlace.rand();
      }

      if (this.isValidLocation(pos)) {
        this.places.push(new Place(pos.x, pos.y, this.nameGen.randName()));
        vertices.push([pos.x, pos.y]);
        i++;
      }
    } // while

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
    } // for i

    //////////////////////////
    // Conditional Alpha Shape
    var origin = this.places[0];

    // Process the first place as a special case
    origin.links.sort((a: Place, b: Place) => { return distanceSq(origin, b) - distanceSq(origin, a) });
    for (var j = 0; j >= origin.links.length; j++) {
      var neighbour = origin.links[j];
      if (distanceSq(origin, neighbour) > this.connectionLengthSq && origin.links.length > 1) {
        origin.links.splice(j, 1);
        j--;
      }
    } // for j

    // Process the other places
    for (i = 1; i < this.places.length; i++) {
      var place = this.places[i];

      place.links.sort((a: Place, b: Place) => { return distanceSq(place, b) - distanceSq(place, a) });

      for (var j = 0; j < place.links.length; j++) {
        var neighbour = place.links[j];

        if (distanceSq(place, neighbour) > this.connectionLengthSq) {
          // Backup links
          var placeLinksOld = place.links.slice(0); // clone
          var neighbourLinksOld = neighbour.links.slice(0); // clone

          // Delete too long links
          place.delLink(neighbour);
          j--;

          // Restore deleted links if connexity is lost
          if (!this.isPath(place, origin) || !this.isPath(neighbour, origin)) {
            place.links = placeLinksOld;
            neighbour.links = neighbourLinksOld
            j++;
          }
        }

      } // for j
    } // for i

    console.timeEnd("Generate");
  } // generate

  generateOld() {
    console.time("GenerateOld1");
    this.reset();

    // Creation of places
    Place.ID = 0;
    this.places = [];
    var vertices: number[][] = [];
    var i = 0;
    var pos = new Point(0, 0);
    while (i < this.maxPlaces) {
      if (this.distribution == "gaussian") {
        pos.x = 0.5 + (0.5 - this.margin) * this.rngPlace.rand() / 3;
        pos.y = 0.5 + (0.5 - this.margin) * this.rngPlace.rand() / 3;
      }
      else { // uniform
        pos.x = this.margin + (1 - 2 * this.margin) * this.rngPlace.rand();
        pos.y = this.margin + (1 - 2 * this.margin) * this.rngPlace.rand();
      }

      if (this.isValidLocation(pos)) {
        this.places.push(new Place(pos.x, pos.y, this.nameGen.randName()));
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
      p0.addLink(p1);
      p0.addLink(p2);
      p1.addLink(p2);
    } // for i

    // Conditional Alpha Shape
    for (i = 0; i < this.places.length; i++) {
      var place = this.places[i];

      //place.links.sort((a: Place, b: Place) => { return distanceSq(place, b) - distanceSq(place, a) });

      for (var j = 0; j < place.links.length; j++) {
        var neighbour = place.links[j];

        if (distanceSq(place, neighbour) > this.connectionLengthSq &&
          place.links.length > 1 && neighbour.links.length > 1) {
          place.delLink(neighbour);
          j--;
        }
      } // for j
    } // for i

    console.timeEnd("GenerateOld1");
  } // generateOld1

  generateOld2() {
    console.time("GenerateOld2");
    this.reset();

    // Creation of places
    Place.ID = 0;
    this.places = [];
    var vertices: number[][] = [];
    var i = 0;
    var pos = new Point(0, 0);
    while (i < this.maxPlaces) {
      if (this.distribution == "gaussian") {
        pos.x = 0.5 + (0.5 - this.margin) * this.rngPlace.rand() / 3;
        pos.y = 0.5 + (0.5 - this.margin) * this.rngPlace.rand() / 3;
      }
      else { // uniform
        pos.x = this.margin + (1 - 2 * this.margin) * this.rngPlace.rand();
        pos.y = this.margin + (1 - 2 * this.margin) * this.rngPlace.rand();
      }

      if (this.isValidLocation(pos)) {
        this.places.push(new Place(pos.x, pos.y, this.nameGen.randName()));
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
      if (distanceSq(p0, p1) < this.connectionLengthSq) p0.links.push(p1);
      if (distanceSq(p0, p2) < this.connectionLengthSq) p0.links.push(p2);
      if (distanceSq(p1, p0) < this.connectionLengthSq) p1.links.push(p0);
      if (distanceSq(p1, p2) < this.connectionLengthSq) p1.links.push(p2);
      if (distanceSq(p2, p0) < this.connectionLengthSq) p2.links.push(p0);
      if (distanceSq(p2, p1) < this.connectionLengthSq) p2.links.push(p1);
    } // for i

    console.timeEnd("GenerateOld2");
  } // generateOld2

  // ********************************
  // Check the validity of a location
  isValidLocation(pos: Point): boolean {
    if (!(pos.x > this.margin && pos.x < 1 - this.margin &&
      pos.y > this.margin && pos.y < 1 - this.margin)) {
      return false;
    }

    for (var i = 0; i < this.places.length; i++) {
      var place = this.places[i];

      if (distanceSq(pos, place) < this.gapSq) {
        return false;
      }
    } // for i

    return true;
  } // isValidLocation

  // ***********************************
  // Return a place with its ID
  getPlace(id: string) {
    for (var i = 0; i < this.places.length; i++) {
      var place = this.places[i];
      if (place.id == id) {
        return place;
      }
    } // for i
    return null;
  } // getPlace

  // ********************
  // Check Path existence
  isPath(start: Place, end: Place): boolean {
    var visited: Place[] = []; // visited places
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
        } // for i
      }
    } // while

    return false;
  } // isPath
} // Universe

interface Topology {
  dimX: number;
  dimY: number;

  distanceSq(p1: Point, p2: Point): number;
  distance(p1: Point, p2: Point): number;
  normalize(p: Point): Point;
} // Topology

class TopologyPlane implements Topology {
  dimX: number;
  dimY: number;

  constructor(dimX: number, dimY: number) {
    this.dimX = dimX;
    this.dimY = dimY;
  } // constructor

  distanceSq(p1: Point, p2: Point): number {
    return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
  } // distanceSq

  distance(p1: Point, p2: Point): number {
    return Math.sqrt(this.distanceSq(p1, p2));
  } // distance

  normalize(p: Point): Point {
    var normPoint = new Point(p.x, p.y);
    return normPoint;
  } // normalize
} // TopologyPlane

class TopologyCylinder implements Topology {
  dimX: number;
  dimY: number;

  constructor(dimX: number, dimY: number) {
    this.dimX = dimX;
    this.dimY = dimY;
  } // constructor

  distanceSq(p1: Point, p2: Point): number {
    var nwDistanceSq = distanceSq(p1, p2); // non-wrap distance²
    var wDistanceSq: number; // wrap distance²
    var wDistanceXSq: number;
    if (p1.x <= p2.x) {
      wDistanceXSq = (p1.x - p2.x + this.dimX) * (p1.x - p2.x + this.dimX);
    }
    else {
      wDistanceXSq = (p2.x - p1.x + this.dimX) * (p2.x - p1.x + this.dimX);
    }
    var wDistanceSq = wDistanceXSq + (p1.y - p2.y) * (p1.y - p2.y);
    return Math.min(nwDistanceSq, wDistanceSq);
  } // distanceCylinderSq

  distance(p1: Point, p2: Point): number {
    return Math.sqrt(this.distanceSq(p1, p2));
  } // distanceCylinder

  normalize(p: Point): Point {
    var normPoint = new Point(p.x % this.dimX, p.y % this.dimY);
    return normPoint;
  } // normalize
} // TopologyCylinder

// ***********************************************

function distanceSq(p1: Point, p2: Point): number {
  return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
} // distanceSq

function distance(p1: Point, p2: Point): number {
  return Math.sqrt(distanceSq(p1, p2));
} // distance

function distanceCylinderSq(p1: Point, p2: Point, lrBound: Point): number {
  var nwDistanceSq = distanceSq(p1, p2); // non-wrap distance²
  var wDistanceSq: number; // wrap distance²
  var wDistanceXSq: number;
  if (p1.x <= p2.x) {
    wDistanceXSq = (p1.x - p2.x + lrBound.x) * (p1.x - p2.x + lrBound.x);
  }
  else {
    wDistanceXSq = (p2.x - p1.x + lrBound.x) * (p2.x - p1.x + lrBound.x);
  }
  var wDistanceSq = wDistanceXSq + (p1.y - p2.y) * (p1.y - p2.y);
  return Math.min(nwDistanceSq, wDistanceSq);
} // distanceCylinderSq

function distanceCylinder(p1: Point, p2: Point, lrBound: Point): number {
  return Math.sqrt(distanceCylinderSq(p1, p2, lrBound));
} // distanceCylinder
