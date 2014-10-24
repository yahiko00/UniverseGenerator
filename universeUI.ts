/// <reference path="universe.ts"/>
/// <reference path="Scripts/jquery/jquery.d.ts"/>

class UniverseUI extends Universe {
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
      element.setAttribute("class", "place");
      element.setAttribute("id", place.id);
      element.setAttribute("cx", cx.toString());
      element.setAttribute("cy", cy.toString());
      element.setAttribute("r", radius.toString());

      for (var j = 0; j < place.links.length; j++) {
        var link = place.links[j];

        // Draw the link only if has not been drawn before
        var drawnLinkA = document.getElementById(place.id + link.id);
        var drawnLinkB = document.getElementById(link.id + place.id);
        if (!drawnLinkA && !drawnLinkB) {
          var linkX = Math.round(this.dimX * link.x);
          var linkY = Math.round(this.dimY * link.y);

          var x1 = cx;
          var y1 = cy;
          var x2 = linkX;
          var y2 = linkY;

          // Draw a link
          var element = document.createElementNS("http://www.w3.org/2000/svg", "line");
          layerLinks.appendChild(element);
          element.setAttribute("class", "link");
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
    $(".place").on("mouseenter", tooltipPlaceShow);
    $(".place").on("mouseleave", tooltipPlaceHide);
  } // refresh
} // UniverseUI

window.onload = () => {
  universe.draw();

  // Default value on parameters
  $("#seed").val(universe.seed.toString());
  if (universe.topologyType == "cylinder") $("#topoCylinder").prop("checked", true);
  else $("#topoPlane").prop("checked", true);
  if (universe.distribution == "gaussian") $("#distGaussian").prop("checked", true);
  else $("#distUniform").prop("checked", true);
  $("#width").val(universe.dimX.toString());
  $("#height").val(universe.dimY.toString());
  $("#places").val(universe.maxPlaces.toString());
  $("#margin").val((100 * universe.margin).toFixed(2).toString());
  $("#gap").val((100 * universe.gap).toFixed(2).toString());
  $("#connection").val((100 * universe.connectionLength).toFixed(2).toString());
  $("#backgroundColor").val(rgb2hex($("#layerLinks").css("backgroundColor")));
  $("#locationFillColor").val(rgb2hex($(".place").css("fill")));
  $("#locationOutlineColor").val(rgb2hex($(".place").css("stroke")));
  $("#linkColor").val(rgb2hex($(".link").css('stroke')));

  // Listeners
  $("#seed").on("change", changeSeed);
  $("#distUniform").on("change", changeDistribution);
  $("#distGaussian").on("change", changeDistribution);

  $("#seedTime").on("click", setSeed);
  $("#width").on("change", changeDimX);
  $("#height").on("change", changeDimY);
  $("#places").on("change", changeMaxPlaces);
  $("#margin").on("change", changeMargin);
  $("#gap").on("change", changeGap);
  $("#connection").on("change", changeConnectionLength);
  $("#backgroundColor").on("change", changeBackgroundColor);
  $("#locationFillColor").on("change", changeLocationFillColor);
  $("#locationOutlineColor").on("change", changeLocationOutlineColor);
  $("#linkColor").on("change", changeLinkColor);

  $("#generate").on("click", generate);
  $("#seedGenerate").on("click", seedGenerate);

  $(".place").on("mouseenter", tooltipPlaceShow);
  $(".place").on("mouseleave", tooltipPlaceHide);
};

var hexDigits = new Array
  ("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f");

function hex(x) {
  return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
}

function rgb2hex(rgb: string): string {
  if (rgb) {
    var match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

    if (match) {
      return hex(match[1]) + hex(match[2]) + hex(match[3]);
    }
    else {
      return colourNameToHex(rgb); // IE
    }
  }
  else {
    return hex(0) + hex(0) + hex(0);
  }

  function hex(x) {
    return ("0" + parseInt(x).toString(16)).slice(-2);
  }
}

function hex2rgb(hex: string): string {
  var r = parseInt(hex.substr(0, 2), 16);
  var g = parseInt(hex.substr(2, 2), 16);
  var b = parseInt(hex.substr(4, 2), 16);
  return "rgb (" + r + ", " + g + ", " + b + ")";
}

function colourNameToHex(colour: string): string {
  var colours = {
    "aliceblue": "f0f8ff", "antiquewhite": "faebd7", "aqua": "00ffff", "aquamarine": "7fffd4", "azure": "f0ffff",
    "beige": "f5f5dc", "bisque": "ffe4c4", "black": "000000", "blanchedalmond": "ffebcd", "blue": "0000ff", "blueviolet": "8a2be2", "brown": "a52a2a", "burlywood": "deb887",
    "cadetblue": "5f9ea0", "chartreuse": "7fff00", "chocolate": "d2691e", "coral": "ff7f50", "cornflowerblue": "6495ed", "cornsilk": "fff8dc", "crimson": "dc143c", "cyan": "00ffff",
    "darkblue": "00008b", "darkcyan": "008b8b", "darkgoldenrod": "b8860b", "darkgray": "a9a9a9", "darkgreen": "006400", "darkkhaki": "bdb76b", "darkmagenta": "8b008b", "darkolivegreen": "556b2f",
    "darkorange": "ff8c00", "darkorchid": "9932cc", "darkred": "8b0000", "darksalmon": "e9967a", "darkseagreen": "8fbc8f", "darkslateblue": "483d8b", "darkslategray": "2f4f4f", "darkturquoise": "00ced1",
    "darkviolet": "9400d3", "deeppink": "ff1493", "deepskyblue": "00bfff", "dimgray": "696969", "dodgerblue": "1e90ff",
    "firebrick": "b22222", "floralwhite": "fffaf0", "forestgreen": "228b22", "fuchsia": "ff00ff",
    "gainsboro": "dcdcdc", "ghostwhite": "f8f8ff", "gold": "ffd700", "goldenrod": "daa520", "gray": "808080", "green": "008000", "greenyellow": "adff2f",
    "honeydew": "f0fff0", "hotpink": "ff69b4",
    "indianred ": "cd5c5c", "indigo": "4b0082", "ivory": "fffff0", "khaki": "f0e68c",
    "lavender": "e6e6fa", "lavenderblush": "fff0f5", "lawngreen": "7cfc00", "lemonchiffon": "fffacd", "lightblue": "add8e6", "lightcoral": "f08080", "lightcyan": "e0ffff", "lightgoldenrodyellow": "fafad2",
    "lightgrey": "d3d3d3", "lightgreen": "90ee90", "lightpink": "ffb6c1", "lightsalmon": "ffa07a", "lightseagreen": "20b2aa", "lightskyblue": "87cefa", "lightslategray": "778899", "lightsteelblue": "b0c4de",
    "lightyellow": "ffffe0", "lime": "00ff00", "limegreen": "32cd32", "linen": "faf0e6",
    "magenta": "ff00ff", "maroon": "800000", "mediumaquamarine": "66cdaa", "mediumblue": "0000cd", "mediumorchid": "ba55d3", "mediumpurple": "9370d8", "mediumseagreen": "3cb371", "mediumslateblue": "7b68ee",
    "mediumspringgreen": "00fa9a", "mediumturquoise": "48d1cc", "mediumvioletred": "c71585", "midnightblue": "191970", "mintcream": "f5fffa", "mistyrose": "ffe4e1", "moccasin": "ffe4b5",
    "navajowhite": "ffdead", "navy": "000080",
    "oldlace": "fdf5e6", "olive": "808000", "olivedrab": "6b8e23", "orange": "ffa500", "orangered": "ff4500", "orchid": "da70d6",
    "palegoldenrod": "eee8aa", "palegreen": "98fb98", "paleturquoise": "afeeee", "palevioletred": "d87093", "papayawhip": "ffefd5", "peachpuff": "ffdab9", "peru": "cd853f", "pink": "ffc0cb", "plum": "dda0dd", "powderblue": "b0e0e6", "purple": "800080",
    "red": "ff0000", "rosybrown": "bc8f8f", "royalblue": "4169e1",
    "saddlebrown": "8b4513", "salmon": "fa8072", "sandybrown": "f4a460", "seagreen": "2e8b57", "seashell": "fff5ee", "sienna": "a0522d", "silver": "c0c0c0", "skyblue": "87ceeb", "slateblue": "6a5acd", "slategray": "708090", "snow": "fffafa", "springgreen": "00ff7f", "steelblue": "4682b4",
    "tan": "d2b48c", "teal": "008080", "thistle": "d8bfd8", "tomato": "ff6347", "turquoise": "40e0d0",
    "violet": "ee82ee",
    "wheat": "f5deb3", "white": "ffffff", "whitesmoke": "f5f5f5",
    "yellow": "ffff00", "yellowgreen": "9acd32"
  };

  if (typeof colours[colour.toLowerCase()] != 'undefined') {
    return colours[colour.toLowerCase()];
  }

  return "";
} // colorNameToHex


function changeSeed(event: BaseJQueryEventObject) {
  var target = <HTMLInputElement>event.target;
  var value = parseInt(target.value);
  universe.seed = value;
}

function setSeed(event: BaseJQueryEventObject) {
  var seedHTML = <HTMLInputElement>document.getElementById("seed");
  seedHTML.value = Date.now().toString();
  event.target = seedHTML;
  changeSeed(event);
}

function changeDistribution(event: BaseJQueryEventObject) {
  var uniformHTML = <HTMLInputElement>document.getElementById("distUniform");
  var gaussianHTML = <HTMLInputElement>document.getElementById("distGaussian");

  if (uniformHTML.checked) universe.distribution = "uniform";
  else if (gaussianHTML.checked) universe.distribution = "gaussian";
}

function changeDimX(event: BaseJQueryEventObject) {
  var target = <HTMLInputElement>event.target;
  var value = parseInt(target.value);
  universe.dimX = value;
}

function changeDimY(event: BaseJQueryEventObject) {
  var target = <HTMLInputElement>event.target;
  var value = parseInt(target.value);
  universe.dimY = value;
}

function changeMaxPlaces(event: BaseJQueryEventObject) {
  var target = <HTMLInputElement>event.target;
  var value = parseInt(target.value);
  universe.maxPlaces = value;
}

function changeMargin(event: BaseJQueryEventObject) {
  var target = <HTMLInputElement>event.target;
  var value = parseFloat(target.value);
  universe.margin = value / 100;
}

function changeGap(event: BaseJQueryEventObject) {
  var target = <HTMLInputElement>event.target;
  var value = parseFloat(target.value);
  universe.gap = value / 100;
  universe.gapSq = universe.gap * universe.gap;
}

function changeConnectionLength(event: BaseJQueryEventObject) {
  var target = <HTMLInputElement>event.target;
  var value = parseFloat(target.value);
  universe.connectionLength = value / 100;
  universe.connectionLengthSq = universe.connectionLength * universe.connectionLength;
}

function changeBackgroundColor(event: BaseJQueryEventObject) {
  $("#layerLinks").css("backgroundColor", "#" + $("#backgroundColor").val());
}

function changeLocationFillColor(event: BaseJQueryEventObject) {
  $(".place").css("fill", "#" + $("#locationFillColor").val());
}

function changeLocationOutlineColor(event: BaseJQueryEventObject) {
  $(".place").css("stroke", "#" + $("#locationOutlineColor").val());
}

function changeLinkColor(event: BaseJQueryEventObject) {
  $(".link").css("stroke", "#" + $("#linkColor").val());
}

function generate(event: BaseJQueryEventObject) {
  $(".place").remove();
  $(".link").remove();
  universe.refresh();
}

function seedGenerate(event: BaseJQueryEventObject) {
  setSeed(event);
  generate(event);
}

function tooltipPlaceShow(event: BaseJQueryEventObject) {
  var target = event.target;
  var id = target["id"];
  var name = universe.getPlace(id).name;
  var tooltip = document.createElement("div");
  tooltip.innerHTML = name.substr(0, 1).toUpperCase() + name.substr(1);
  tooltip.setAttribute("class", "tooltip");
  tooltip.setAttribute("style", "position: absolute; " +
    "top: " + (event.pageY - 25).toString() + "px; " +
    "left: " + (event.pageX).toString() + "px;");
  document.body.appendChild(tooltip);
}

function tooltipPlaceHide(event: BaseJQueryEventObject) {
  $(".tooltip").remove();
}

var universe = new UniverseUI(800, 600, 400, 0.000, 0.020, 1.0);
//var universe = new UniverseUI(800, 600, 400, 0.050, 0.020, 0.068);
//var universe = new UniverseUI(320, 200, 10, 0.050, 0.020, 0.068); // DEBUG