/// <reference path="Scripts/rng/rng.ts"/>
/// <reference path="Scripts/delaunay/delaunay.d.ts"/>
/// <reference path="Scripts/namegen/namegen.ts"/>

function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
} // distance

class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  } // constructor

  distance(p: Point): number {
    return distance(this, p);
  } // distance
} // Point

class Place extends Point {
  id: string;
  name: string
  links: Place[];

  constructor(x: number, y: number, name: string) {
    super(x, y);
    this.id = "place" + ID++;
    this.name = name;
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
  distribution: string;
  nameGen: NameGenerator;
  seed: number;

  rngPlace: SeededRNG;
  rngName: SeededRNG;

  constructor(dimX: number, dimY: number, maxPlaces: number,
    margin: number, gap: number, connectionLength: number, distribution: string = "uniform", seed: number = Date.now()) {
    this.dimX = dimX;
    this.dimY = dimY;
    this.maxPlaces = maxPlaces;
    this.margin = margin;
    this.gap = gap;
    this.connectionLength = connectionLength;
    this.distribution = distribution;
    this.seed = seed;
    this.rngPlace = new SeededRNG(this.seed, 4, this.distribution == "gaussian" ? 1 : 0); // Xorshift
    this.rngName = new SeededRNG(this.seed, 4, 0); // Xorshift
    this.nameGen = new NameGeneratorElite(this.rngName);

    this.generate();
  }

  // *************************
  // Generate places and links
  generate() {
    console.time("Generate");
    // Initialization of RNGs
    this.rngPlace.randomSeed = this.seed;
    this.rngName.randomSeed = this.seed;

    // Creation of places
    this.places = [];
    var vertices: number[][] = [];
    var i = 0;
    var pos = new Point(0, 0);
    while (i < this.maxPlaces) {
      if (this.distribution == "uniform") {
        pos.x = this.margin + (1 - 2 * this.margin) * this.rngPlace.rand();
        pos.y = this.margin + (1 - 2 * this.margin) * this.rngPlace.rand();
      }
      else {
        pos.x = 0.5 + (0.5 - this.margin) * this.rngPlace.rand() / 3;
        pos.y = 0.5 + (0.5 - this.margin) * this.rngPlace.rand() / 3;
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
} // Universe

var ID: number = 0;
