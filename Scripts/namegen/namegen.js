/// <reference path="../rng/rng.ts"/>
var NameGeneratorElite = (function () {
    function NameGeneratorElite(rng) {
        this.rng = rng;
        this.pairs = "..lexegezacebiso";
        "usesarmaindirea.";
        "eratenberalaveti";
        "edorquanteisrion";
    } // constructor
    NameGeneratorElite.prototype.randName = function () {
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
    }; // randName
    return NameGeneratorElite;
})(); // NameGeneratorElite
//# sourceMappingURL=namegen.js.map