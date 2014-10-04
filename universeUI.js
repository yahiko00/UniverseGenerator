/// <reference path="universe.ts"/>
/// <reference path="Scripts/jquery/jquery.d.ts"/>
window.onload = function () {
    universe.draw();

    // Default value on parameters
    $("#seed").val(universe.seed.toString());
    if (universe.distribution == "uniform")
        $("#uniform").attr("checked", "checked");
else if (universe.distribution == "gaussian")
        $("#gaussian").attr("checked", "checked");
    $("#width").val(universe.dimX.toString());
    $("#height").val(universe.dimY.toString());
    $("#places").val(universe.maxPlaces.toString());
    $("#margin").val((100 * universe.margin).toFixed(2).toString());
    $("#gap").val((100 * universe.gap).toFixed(2).toString());
    $("#connection").val((100 * universe.connectionLength).toFixed(2).toString());
    $("#backgroundColor").val(rgb2hex($("#layerLinks").css("backgroundColor")));
    $("#locationFillColor").val(rgb2hex($("circle").css("fill")));
    $("#locationOutlineColor").val(rgb2hex($("circle").css("stroke")));
    $("#linkColor").val(rgb2hex($("line").css('stroke')));

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
    $("circle").css("fill", "#" + $("#locationFillColor").val());
}

function changeLocationOutlineColor(event) {
    $("circle").css("stroke", "#" + $("#locationOutlineColor").val());
}

function changeLinkColor(event) {
    $("line").css("stroke", "#" + $("#linkColor").val());
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
