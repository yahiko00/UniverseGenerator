/// <reference path="universe.ts"/>
/// <reference path="Scripts/jquery/jquery.d.ts"/>

window.onload = () => {
  universe.draw();

  // Default value on parameters
  $("#seed").val(universe.seed.toString());
  if (universe.distribution == "uniform") $("#uniform").attr("checked", true);
  else if (universe.distribution == "gaussian") $("#gaussian").attr("checked", true);
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

  // Listeners on change
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
};

var hexDigits = new Array
  ("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f");

function hex(x) {
  return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
}

function rgb2hex(rgb: string): string {
  var match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  function hex(x) {
    return ("0" + parseInt(x).toString(16)).slice(-2);
  }
  return hex(match[1]) + hex(match[2]) + hex(match[3]);
}

function hex2rgb(hex: string): string {
  var r = parseInt(hex.substr(0, 2), 16);
  var g = parseInt(hex.substr(2, 2), 16);
  var b = parseInt(hex.substr(4, 2), 16);
  return "rgb (" + r + ", " + g + ", " + b + ")";
}

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
  var uniformHTML = <HTMLInputElement>document.getElementById("uniform");
  var gaussianHTML = <HTMLInputElement>document.getElementById("gaussian");

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
}

function changeConnectionLength(event: BaseJQueryEventObject) {
  var target = <HTMLInputElement>event.target;
  var value = parseFloat(target.value);
  universe.connectionLength = value / 100;
}

function changeBackgroundColor(event: BaseJQueryEventObject) {
  $("#layerLinks").css("backgroundColor", "#" + $("#backgroundColor").val());
}

function changeLocationFillColor(event: BaseJQueryEventObject) {
  $("circle").css("fill", "#" + $("#locationFillColor").val());
}

function changeLocationOutlineColor(event: BaseJQueryEventObject) {
  $("circle").css("stroke", "#" + $("#locationOutlineColor").val());
}

function changeLinkColor(event: BaseJQueryEventObject) {
  $("line").css("stroke", "#" + $("#linkColor").val());
}

function seedGenerate(event: BaseJQueryEventObject) {
  setSeed(event);
  universe.refresh();
}