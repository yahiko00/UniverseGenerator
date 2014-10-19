/// <reference path="universe.ts"/>
/// <reference path="Scripts/jquery/jquery.d.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var UniverseUI = (function (_super) {
    __extends(UniverseUI, _super);
    function UniverseUI() {
        _super.apply(this, arguments);
    }
    // *******************************
    // Draw the world in HTML/SVG
    UniverseUI.prototype.draw = function () {
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
            element.setAttribute("class", "place");
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
            }
        }
    };

    // ***********************************
    // Regenerate the universe and draw it
    UniverseUI.prototype.refresh = function () {
        universe.generate();
        universe.draw();
        $(".place").on("mouseenter", tooltipPlaceShow);
        $(".place").on("mouseleave", tooltipPlaceHide);
    };
    return UniverseUI;
})(Universe);

window.onload = function () {
    universe.draw();

    // Default value on parameters
    $("#seed").val(universe.seed.toString());
    if (universe.distribution == "gaussian")
        $("#gaussian").prop("checked", true);
    else
        $("#uniform").prop("checked", true);
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
    $("#uniform").on("change", changeDistribution);
    $("#gaussian").on("change", changeDistribution);

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

    $("#generate").on("click", universe.refresh);
    $("#seedGenerate").on("click", seedGenerate);

    $(".place").on("mouseenter", tooltipPlaceShow);
    $(".place").on("mouseleave", tooltipPlaceHide);
};

var hexDigits = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f");

function hex(x) {
    return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
}

function rgb2hex(rgb) {
    var match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return hex(match[1]) + hex(match[2]) + hex(match[3]);
}

function hex2rgb(hex) {
    var r = parseInt(hex.substr(0, 2), 16);
    var g = parseInt(hex.substr(2, 2), 16);
    var b = parseInt(hex.substr(4, 2), 16);
    return "rgb (" + r + ", " + g + ", " + b + ")";
}

function changeSeed(event) {
    var target = event.target;
    var value = parseInt(target.value);
    universe.seed = value;
}

function setSeed(event) {
    var seedHTML = document.getElementById("seed");
    seedHTML.value = Date.now().toString();
    event.target = seedHTML;
    changeSeed(event);
}

function changeDistribution(event) {
    var uniformHTML = document.getElementById("uniform");
    var gaussianHTML = document.getElementById("gaussian");

    if (uniformHTML.checked)
        universe.distribution = "uniform";
    else if (gaussianHTML.checked)
        universe.distribution = "gaussian";
}

function changeDimX(event) {
    var target = event.target;
    var value = parseInt(target.value);
    universe.dimX = value;
}

function changeDimY(event) {
    var target = event.target;
    var value = parseInt(target.value);
    universe.dimY = value;
}

function changeMaxPlaces(event) {
    var target = event.target;
    var value = parseInt(target.value);
    universe.maxPlaces = value;
}

function changeMargin(event) {
    var target = event.target;
    var value = parseFloat(target.value);
    universe.margin = value / 100;
}

function changeGap(event) {
    var target = event.target;
    var value = parseFloat(target.value);
    universe.gap = value / 100;
}

function changeConnectionLength(event) {
    var target = event.target;
    var value = parseFloat(target.value);
    universe.connectionLength = value / 100;
}

function changeBackgroundColor(event) {
    $("#layerLinks").css("backgroundColor", "#" + $("#backgroundColor").val());
}

function changeLocationFillColor(event) {
    $(".place").css("fill", "#" + $("#locationFillColor").val());
}

function changeLocationOutlineColor(event) {
    $(".place").css("stroke", "#" + $("#locationOutlineColor").val());
}

function changeLinkColor(event) {
    $(".link").css("stroke", "#" + $("#linkColor").val());
}

function seedGenerate(event) {
    setSeed(event);
    universe.refresh();
}

function tooltipPlaceShow(event) {
    var target = event.target;
    var id = target["id"];
    var name = universe.getPlace(id).name;
    var tooltip = document.createElement("div");
    tooltip.innerHTML = name.substr(0, 1).toUpperCase() + name.substr(1);
    tooltip.setAttribute("class", "tooltip");
    tooltip.setAttribute("style", "position: absolute; " + "top: " + (event.pageY - 25).toString() + "px; " + "left: " + (event.pageX).toString() + "px;");
    document.body.appendChild(tooltip);
}

function tooltipPlaceHide(event) {
    $(".tooltip").remove();
}

var universe = new UniverseUI(800, 600, 400, 0.050, 0.020, 0.068);
//var universe = new UniverseUI(320, 200, 30, 0.050, 0.020, 0.068); // DEBUG
//# sourceMappingURL=universeUI.js.map
