const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const angle = 2 * Math.PI / 6; // 2 PI  rad = 360 degrees, 6 -> hexagon
const radius = 50;
const originToSide = radius * Math.sin(angle);
const minTileInRow = 3;
const maxTileInRow = 6;
const totalRowNumber = (maxTileInRow - minTileInRow) * 2 + 1

const tiles = new Array();
const fieldTypes = new Array();
const vertexRadiusArray = new Array();

let currentFieldColor = 'gray';
let currentMaterialType = '';
let currentStructureColor = 'yellow';

let lastXClick = 0;
let lastYClick = 0;

let currentStructureType = "cities";

function showNumberModal(x, y) {
    lastXClick = x;
    lastYClick = y;

    const modal = document.getElementById("modal");
    modal.style.display = "block";
    modal.style.left = x + "px";
    modal.style.top = y + "px";
}

function addTileNumber() {
    const tileNumber = document.getElementById("tileNumber");

    if (tileNumber.value < 2 || tileNumber.value > 12) {
        alert('Invalid number');
        return;
    }

    const tile = tiles.find(tile => ctx.isPointInPath(tile.path, lastXClick, lastYClick));
    if (tile) {
        tile.number = tileNumber.value;
        redraw();
    }

    modal.style.display = "none";
}

function init() {
    drawMap();
    drawInvisibleRadius();
}


init();

function drawInvisibleRadius() {
    tiles.forEach(tile => tile.coordinates.forEach(coord => {
        const path = new Path2D();
        path.arc(coord.x, coord.y, 10, 0, 2 * Math.PI);
        let circle = {
            shape: path,
            coordinates: {
                x: coord.x,
                y: coord.y
            }
        };
        vertexRadiusArray.push(circle);
    }));
}

function drawMap() {
    let tilesToDraw = minTileInRow;
    let xPositionFactor = maxTileInRow - minTileInRow;

    for (let i = 0; i < totalRowNumber; i++) {
        for (let j = 0; j < tilesToDraw; j++) {
            let x = xPositionFactor * radius * Math.sin(angle) + (j * 2 * (radius * Math.sin(angle)) + radius) + 10;
            let y = ((radius / 2) * i) + radius * (1 + i) + 10;
            let hex = drawHexagon(x, y);
            tiles.push(hex);
        }
        tilesToDraw = (i + 1) > totalRowNumber / 2 ? tilesToDraw - 1 : tilesToDraw + 1;
        xPositionFactor = (i + 1) > totalRowNumber / 2 ? xPositionFactor + 1 : xPositionFactor - 1;
    }
}

function selectMaterial(element, materialType) {
    const color = window.getComputedStyle(element, null).getPropertyValue('background-color');
    currentFieldColor = color;
    currentMaterialType = materialType;
}

function selectCity(element) {
    currentStructureType = "cities";
    const color = window.getComputedStyle(element, null).getPropertyValue('color');
    currentStructureColor = color;
}

function selectBuilding(element) {
    currentStructureType = "buildings";
    const color = window.getComputedStyle(element, null).getPropertyValue('color');
    currentStructureColor = color;
}

function drawHexagon(x, y) {
    const path = new Path2D();

    ctx.fillStyle = 'grey';
    const coords = new Array();
    for (let i = 0; i < 6; i++) {
        x = parseFloat((x + radius * Math.sin(angle * i)).toFixed(2));
        y = parseFloat((y + radius * Math.cos(angle * i)).toFixed(2));
        coords.push({ 'x': x, 'y': y });
        path.lineTo(x, y);
    }
    path.closePath();
    ctx.fill(path);

    const centerCoords = new Coordinate(
        (coords[0].x + coords[3].x) / 2,
        (coords[0].y + coords[3].y) / 2);

    return new Tile(path, 
        coords, 
        'gray',
        new Array(), 
        new Array(),
        centerCoords);
}

function changeTileInfo(canvas, event) {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

 

    const modal = document.getElementById("modal");
    if (event.target != modal) {
        modal.style.display = "none";
    }

    if (document.getElementById("numberRadio").checked) {
        showNumberModal(event.clientX, event.clientY);
    }


    if (document.getElementById("fieldRadio").checked) {
        drawField(x, y);
    }

    if (document.getElementById("cityRadio").checked) {
        let circleFound = vertexRadiusArray.find(circle => ctx.isPointInPath(circle.path, x, y));
        let circleCoords = circleFound.coordinates;
        drawStructure(x, y);
    }
}

function countCards() {
    const diceNumber = document.getElementById("diceRoll").value;

    const playerCards = new Map();
    const tilesFound = tiles.filter(tile => tile.number == diceNumber);
    tilesFound.forEach(tile => {
        tile.cities.forEach(city => {
            const cardsMap = playerCards.get(city.color);
            if (cardsMap) {
                const cardQuantity = cardsMap.get(tile.material);
                if (cardQuantity) {
                    cardsMap.set(tile.material, cardQuantity + 1);
                } else {
                    cardsMap.set(tile.material, 1);
                }
            } else {
                const cardsQuantity = new Map();
                cardsQuantity.set(tile.material, 1);
                playerCards.set(city.color, cardsQuantity);
            }
        });

        tile.buildings.forEach(building => {
            const cardsMap = playerCards.get(building.color);
            if (cardsMap) {
                const cardQuantity = cardsMap.get(tile.material);
                if (cardQuantity) {
                    cardsMap.set(tile.material, cardQuantity + 2);
                } else {
                    cardsMap.set(tile.material, 2);
                }
            } else {
                const cardsQuantity = new Map();
                cardsQuantity.set(tile.material, 2);
                playerCards.set(building.color, cardsQuantity);
            }
        });
    });

    const result = document.getElementById("result");
    result.innerHTML = "";

    playerCards.forEach((cardCountMap, player) => {
        result.innerHTML += "<div>";
        result.innerHTML += "<div class=\"rectangle\" style=\"background: " + player + "\"></div>";
        cardCountMap.forEach((quantity, material) => {
            result.innerHTML += "<div>" + material + ": " + quantity + "</div>"
        });
        result.innerHTML += "</div>";
    });
}

function drawStructure(x, y) {
    const structureType = currentStructureType;
    let circleFound = vertexRadiusArray.find(circle => ctx.isPointInPath(circle.path, x, y));
    if (circleFound) {
        let isSameStructure = undefined;
        tiles.forEach(tile => {
            let structureIndex = tile.cities.findIndex(structure => structure.coordinates.x == circleFound.coordinates.x
                && structure.coordinates.y == circleFound.coordinates.y);
            if (structureIndex >= 0) {
                if (tile.cities[structureIndex].color == currentStructureColor) {
                    isSameStructure = true;
                }
                tile.cities.splice(structureIndex, 1);
                return;
            }
            structureIndex = tile.buildings.findIndex(structure => structure.coordinates.x == circleFound.coordinates.x
                && structure.coordinates.y == circleFound.coordinates.y);
            if (structureIndex >= 0) {
                if (tile.buildings[structureIndex].color == currentStructureColor) {
                    isSameStructure = true;
                }
                tile.buildings.splice(structureIndex, 1);
                return;
            }

        });

        if (isSameStructure) {
            redraw();
            return;
        }

        let circleCoords = circleFound.coordinates;
        const structure = {};
        structure.coordinates = circleCoords;
        structure.color = currentStructureColor;


        tilesToUpdate = tiles.filter(tile => {
            const tileFound = tile.coordinates.find(coord => isPointInsideCircle(coord, structure.coordinates));
            if (tileFound) {
                return true;
            }
            return false
        });
        if (tilesToUpdate) {
            tilesToUpdate.forEach(tile => tile[structureType].push(structure));
        }

        redraw();
    }
}

function drawField(x, y) {
    const tile = tiles.find(tile => ctx.isPointInPath(tile.path, x, y));
    if (tile) {
        tile.color = currentFieldColor;
        tile.material = currentMaterialType;
        ctx.fillStyle = currentFieldColor;
        ctx.fill(tile.path);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    redraw();
}

function isPointInsideCircle(coord, circleCoords) {
    if (Math.abs(coord.x - circleCoords.x) < 0.1 && Math.abs(coord.y - circleCoords.y) < 0.1) {
        return true;
    }
    return false;
}

function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    tiles.forEach(tile => {
        ctx.fillStyle = tile.color;
        ctx.fill(tile.path);
        if (tile.number) {
            ctx.font = 'bold 40px Calibri'
            ctx.fillStyle = 'black';
            ctx.fillText(tile.number, tile.center.coordinates.x - 13, tile.center.coordinates.y + 10);
        }
    });

    tiles.flatMap(tile => tile.cities).forEach(city => {
        ctx.font = '20px FontAwesome';
        ctx.fillStyle = city.color;
        const cityCoords = city.coordinates;
        ctx.fillText('\ue3af', cityCoords.x - 11, cityCoords.y + 5);
    });

    tiles.flatMap(tile => tile.buildings).forEach(building => {
        ctx.font = '20px FontAwesome';
        ctx.fillStyle = building.color;
        const buildingCoords = building.coordinates;
        ctx.fillText('\uf1ad', buildingCoords.x - 11, buildingCoords.y + 5);
    });
}