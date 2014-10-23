Universe Generator
==================

Random Generation of Universes

This program has been implemented in TypeScript (and thus produce Javascript files).

The main algorithm is based on Delaunay Triangulation. I used an implementation made by ironwallaby (https://github.com/ironwallaby).

A live demo is available here: http://yahiko.co.nf/universeGenerator/

Here is a short explanation of parameters in the user interface :

- Seed                         : number generating the universe.
- Distribution                 : distribution of the locations.
- Width (px)                   : width of the universe in pixels.
- Height (px)                  : height of the universe in pixels.
- Number of Locations          : number of locations generated.
- Margin (%)                   : margin from border without any location.
- Gap (%)                      : minimal distance between locations in %.
- Connection Length (%)        : maximal length of connections in %.
- Background color (RGB)       : background color of the universe.
- Location fill color (RGB)    : color of locations.
- Location outline color (RGB) : outline color of location
- Link color (RGB)             : color of links.

This software is released into the public domain.
