/// <reference path="../rng/rng.ts"/>

interface NameGenerator {
  randName(): string;
} // NameGenerator

class NameGeneratorElite implements NameGenerator {
  rng: SeededRNG;
  pairs: string;
  
  constructor(rng: SeededRNG) {
    this.rng = rng;
    this.pairs = "..lexegezacebiso"
                 "usesarmaindirea."
                 "eratenberalaveti"
                 "edorquanteisrion";
  } // constructor
  
  randName(): string {
    var pair1 = 2 * Math.floor(this.rng.rand() * (this.pairs.length / 2));
    var pair2 = 2 * Math.floor(this.rng.rand() * (this.pairs.length / 2));
    var pair3 = 2 * Math.floor(this.rng.rand() * (this.pairs.length / 2));
    var pair4 = 2 * Math.floor(this.rng.rand() * (this.pairs.length / 2));

    var name = "";
    name += this.pairs.substr(pair1, 2);
    name += this.pairs.substr(pair2, 2);
    name += this.pairs.substr(pair3, 2);
    name += this.pairs.substr(pair4, 2);
    name = name.replace(/[.]/g, "");
    
    return name;
  } // randName
} // NameGeneratorElite