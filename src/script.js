
(function () {

  /*INIT*/
  window.CP && (window.CP.PenTimer.MAX_TIME_IN_LOOP_WO_EXIT = 60000);
  var svg = document.getElementsByTagName("svg")[0];
  var body = document.getElementsByTagName("body")[0];
  var g = svg.querySelector("g");
  var WIDTH, COLS, ROWS, TOTAL;
  var parameters;//this object controls the teams' behaviors with parameters
  var origin;//center of screen.
  var maxFactor;//max screen dimension.
  var visitedClasses = ["solid1a", "solid2a", "solid3a", "solid4a"];
  var selectedClasses = ["purple", "blue", "green", "red"];
  var unexploredRemaining;
  var unexplored = $('#unexplored')
  body.addEventListener("click", async function (ev) {

    $(".lds-dual-ring").show()
    let reset = chance(.8);//leaves the explorers in same place if false 
    if (reset) {
      init()
    } else {
      $('rect').removeClass("blocker").removeClass(visitedClasses).removeClass(selectedClasses).css("fill", "");
      maze(false);
    }
  });

  body.onload = ()=>{init(true)}
  body.onresize = ()=>{init(false)}
  /*END INIT SECTION*/

  async function init(firstTime) {
    
    buildGrid();
    Object.keys(parameters).forEach(k => parameters[k].abort = true);    
    if(!firstTime)await delay(1500);
    $('rect').removeClass("blocker").removeClass(visitedClasses).removeClass(selectedClasses).css("fill", "");
    Object.keys(parameters).forEach(k => parameters[k].abort = false);
    maze(true);
  }
  
  function setWindowValues(options) {

    maxFactor = Math.max(body.clientWidth, body.clientHeight);    
    let minWidth = maxFactor > 3000 ? 17 : maxFactor > 2000 ? 14 : maxFactor > 1500 ? 12 : maxFactor > 950 ? 10 : maxFactor > 760 ? 7 : 5;
    let maxWidth = maxFactor > 2500 ? 35 : maxFactor > 2000 ? 30 : maxFactor > 950 ? 25 : maxFactor > 760 ? 20 : 15;
    WIDTH = getRandomInt(minWidth,maxWidth)
    COLS = Math.floor(body.clientWidth / WIDTH);
    ROWS = Math.floor(body.clientHeight / WIDTH);
    COLS++;
    ROWS++
    TOTAL = ROWS * COLS;
    
   if(TOTAL<=10) {
      console.log("No width on body element detected!?")  
      ROWS = Math.floor(2000/30)
      COLS = Math.floor(2000/30)
      TOTAL = COLS * ROWS
    }
    console.log(`setWindowValues(): cell WIDTH was ${WIDTH}, max dimension was: ${maxFactor}, total cells was ${TOTAL}`);
    $("#count").text(`Map size:${TOTAL}`)
  }

  /*this function also sets the initial behavior parameters*/
  function buildGrid(options) {
    
    setWindowValues(options);
    $('rect').remove()
    $("#unexplored").text(`--`)
    buildBoxes("red",gutter=pick([0,1,2]));
    origin = getTarget(Math.floor(ROWS / 2), Math.floor(COLS / 2));
    let randomColor = chance(.3)
    let singleColor = !randomColor && chance(.3)

    parameters = {
      "randomColor":randomColor,
      "singleColor":singleColor,
      "fillColor":tinycolor.random().saturate(40).toHexString(),
      "green": {
        key: "green",//yellow
        explorerFactor: Math.random(),
        randomMoveFactor: Math.random(),
        carefulFactor: Math.random(),
        visitedClass: "solid2a",
        fillColor:tinycolor.random().saturate(40).toHexString()
      },
      "blue": {
        key: "blue",
        explorerFactor: Math.random(),
        randomMoveFactor: Math.random(),
        carefulFactor: Math.random(),
        visitedClass: "solid1a",
        fillColor:tinycolor.random().saturate(40).toHexString()
      },
      "red": {
        key: "red",
        explorerFactor: Math.random(),
        randomMoveFactor: Math.random(),
        carefulFactor: Math.random(),
        visitedClass: "solid4a",
        fillColor:tinycolor.random().saturate(40).toHexString(),
        get complement() {
          return comp(this.fillColor)
        }
      },
      "purple": {
        key: "purple",
        explorerFactor: Math.random(),
        randomMoveFactor: Math.random(),
        carefulFactor: Math.random(),
        visitedClass: "solid3a",
        fillColor:tinycolor.random().saturate(40).toHexString()
      } };
  }

  /*MAIN function, calls the maze builder, and defines & places the explorers (if firstTime==true)*/
  async function maze(firstTime) {
 
    let time = TOTAL > 10000 ? 0 : TOTAL > 8000 ? 10 : TOTAL > 6000 ? 20 : TOTAL > 4000 ? 30 : TOTAL > 1000 ? 35 : 40;
    
    origin = getTarget(Math.floor(ROWS / 2), Math.floor(COLS / 2));
    let globalIndex = 0;
    let clearCenter = chance();
    let clearPerimeter = !clearCenter && chance(.75)
    let mazeColor = chance(.3) ? "blue" : chance(.3) ? "red" : tinycolor.random().toHexString();
    
    //for whatever maze we're drawing, calculate parameters and call that function.
    let rando = Math.random();
    let pureBlankSpaceInstead = chance(.08);
    if(!pureBlankSpaceInstead) {
      if (rando<.25) { //RANDOM MAZE
        let allowedAsWalls = .27 + Math.random()*.2;
        randomMaze(allowedAsWalls, clearCenter, clearPerimeter, mazeColor);
      } else if (rando<.5) { //10 PRINT MAZE
        let eliminatePercent = .05 + Math.random()*.25;
        tenPrintMaze(eliminatePercent, clearCenter, clearPerimeter, mazeColor);
      } else if(rando<.75) { //SYMMETRIC MAZE
        let mod1 = getRandomInt(3,10)
        let mod2;
        do{mod2 = getRandomInt(3,10)} while(mod2==mod1)
        let baselineEliminate = (mod1<=4||mod2<=4) ? .15 : .05  //because we're putting a wall every mod1 and every mod2 cell, if this sum is low, the wall density will be higher, so need to remove more squares to make it navigable.
        let eliminatePercent = baselineEliminate + Math.random()*.22;
        symmetricMaze(eliminatePercent,mod1,mod2,clearCenter,clearPerimeter,mazeColor)
      } else { //CIRCULAR MAZE

        let gaps = []
        let gapWidth = getRandomInt(100,200)
        let stripeWidth = getRandomInt(50,gapWidth*.45);
        let baseLimit = .45;
        for(let i=0; i<10; i++){
          gaps.push(gapWidth*i)
        }
        circularMaze(baseLimit+Math.random()*.2, gaps, stripeWidth, mazeColor)
      }
    }

    unexploredRemaining = $('rect').not('.blocker').length
    $("#unexplored").text(`Unexplored tiles:${unexploredRemaining}`)
    await delay(1000);   
    
    //now, activate the mappers and let them go
    let placeInCenter = clearCenter || (!clearCenter && !clearPerimeter)
    if (firstTime) {
      if (pureBlankSpaceInstead || !placeInCenter) {  //place on perimeter
        for (let i = 0; i < 4; i++) {
          lostSquare(getTarget(1, 1), time, undefined, "south", "blue");
          lostSquare(getTarget(1, COLS-1), time, undefined, "west", "green");
          lostSquare(getTarget(ROWS-1, 1), time, undefined, "north", "red");
          lostSquare(getTarget(ROWS-1, COLS-1), time, undefined, "north", "purple");
        }
      }
      
      if (!pureBlankSpaceInstead && placeInCenter) {
        let r = origin.getAttribute("row");
        let c = origin.getAttribute("col");
        for (let i = 0; i < 4; i++) {  //place in center
          lostSquare(getTarget(r, c), time, undefined, "south", "blue");
          lostSquare(getTarget(r, c), time, undefined, "west", "green");
          lostSquare(getTarget(r, c), time, undefined, "north", "red");
          lostSquare(getTarget(r, c), time, undefined, "north", "purple");
        }
      }
    }
    $('.lds-dual-ring').hide();
    
    //the "explorer" function that defines how the squares move
    //lastblockedDirection not being used.
    async function lostSquare(target, time, lastBlockedDirection, direction, classId) {
      if (parameters[classId].abort) {
        return false;
      }
      globalIndex++;

      //update to hopefully better parameters every once in a while.  keep the best two, set worst to randomized, set second worst to that of best performer.  reset the counts after the update.
      if (globalIndex % 3000 == 0) {

        let params = Object.values(parameters).filter(val=>typeof val=="object")
        let sorted = params.sort((a, b) => {return b.count - a.count})
        parameters[sorted[2].key].explorerFactor = parameters[sorted[0].key].explorerFactor;
        parameters[sorted[2].key].randomMoveFactor = parameters[sorted[0].key].randomMoveFactor;
        parameters[sorted[2].key].carefulFactor = parameters[sorted[0].key].carefulFactor;
        parameters[sorted[3].key].carefulFactor = Math.random();
        parameters[sorted[3].key].explorerFactor = Math.random();
        parameters[sorted[3].key].randomMoveFactor = Math.random();

        console.log(`Keeping ${sorted[0].key}(${sorted[0].count}) and ${sorted[1].key}(${sorted[1].count}), setting ${sorted[2].key}(${sorted[2].count}) to best setting, randomizing ${sorted[3].key}(${sorted[3].count})`);
        Object.values(parameters).filter(val=>typeof val=="object").forEach(p => p.count = 0);

      }

      let currentTargetExplored = visitedClasses.some(cl => target.classList.contains(cl));
      target.classList.remove("base");
      target.classList.add(classId);
      
      let currentPoint = new Point(target.getAttribute("row"), target.getAttribute("col"));
      let nextPoint = getNextPointInDirection(currentPoint, direction);
      let nextTarget = getTarget(nextPoint.row, nextPoint.col);

      //update color and increment count only if not explored:
      if (!currentTargetExplored) {
        target.classList.remove("blocker");
        $(unexplored).text(`Unexplored tiles:${--unexploredRemaining}`)
        parameters[classId].count ? parameters[classId].count++ : parameters[classId].count = 1;
        target.classList.add(parameters[classId].visitedClass);
        if(parameters.randomColor) $(target).css("fill", parameters[classId].fillColor)
        if(parameters.singleColor) $(target).css("fill", parameters.fillColor)
      }
      
      await delay(time);
      target.classList.remove(classId);

      //main logic branch to decide where to move:
      if (!nextTarget || nextTarget.classList.contains("blocker")) {

        let newDirection = getRandomDirection(direction);
        lostSquare(target, time, lastBlockedDirection, newDirection, classId);
      } else {
        //nextTarget is not blocked
        let nextHasBeenExplored = visitedClasses.some(cl => nextTarget.classList.contains(cl));

        //if next target has been explored, and we're an 'explorer', possibly retry randomly OR check adjacent squares 
        if (nextHasBeenExplored && chance(parameters[classId].explorerFactor)) {

          let beCareful = chance(parameters[classId].carefulFactor);
          if (beCareful) {

            let els = getSurroundingPoints(currentPoint).map(p => ({ "direction": p.type, "target": getTarget(p.row, p.col) }));
            let valid = els.filter(el => el.target && !["blocker", ...visitedClasses].some(cl => el.target.classList.contains(cl)));
            if (valid.length > 0) {
              lostSquare(valid[0].target, time, lastBlockedDirection, valid[0].direction, classId);
            } else {
              //we checked adjacent tiles, but there were no unexplored tiles available, just go into nextTarget
              chance(parameters[classId].randomMoveFactor) ?
              lostSquare(nextTarget, time, lastBlockedDirection, getRandomDirection(undefined), classId) :
              lostSquare(nextTarget, time, lastBlockedDirection, direction, classId);
            }

          } else { //we're an explorer, next has been explored already, but we're not carefully checking adjacent tiles (so what to do?) => either try a random *different* move from this same square, or proceed grudgingly into the explored square.
            
            if (chance(parameters[classId].randomMoveFactor)) {
              //tring new direction on same target:
              let newDirection = getRandomDirection();
              lostSquare(target, time, lastBlockedDirection, newDirection, classId);
            } else {
              //next is explored but not blocked now we're doing a random move. 'direction' at this point is valid (send in undefined for that param)
              lostSquare(nextTarget, time, lastBlockedDirection, direction, classId);
            }

          }

        } else {//unexplored or we don't care about unexplored tiles.
          //no loops => sometimes move randomly anyway
          if (Math.random() < parameters[classId].randomMoveFactor) {
            lostSquare(nextTarget, time, lastBlockedDirection, getRandomDirection(undefined), classId);
          } else {
            lostSquare(nextTarget, time, lastBlockedDirection, direction, classId);
          }
        }

      }
    }

  }

  /*MAZE building functions*/
  function tenPrintMaze(limit, clearCenter, clearPerimeter, color) {

    let modulus = 3;
    for (let i = 0; i <= TOTAL; i++) {
      let row = Math.floor(i / COLS);
      let col = i % COLS;
      let el = getTarget(row, col);
      if (!el) {console.log(`tenPrintMaze found no element at ${i}, returning false`);
        return false;}

      let x = el.getAttribute("x");
      let y = el.getAttribute("y");
      let distance = centerDistance(x,y)

      let distanceRequirement = clearCenter ? distance > getRandomInt(40, 100) : clearPerimeter ? distance < maxFactor/1.8 : true;
      if (distanceRequirement && row % modulus == 0) {
        if (col % modulus == 0) {

          let leftToRight = Math.random() > .5;
          let els;
          if (leftToRight) {
            els = [el, getTarget(row + 1, col + 1), getTarget(row + 2, col + 2)];
          } else {
            els = [getTarget(row + 2, col), getTarget(row + 1, col + 1), getTarget(row, col + 2)];
          }
          [...els].forEach(el => el && Math.random() > limit && $(el).addClass("blocker").css("fill", color));

        }
      } else {
          //skip this square
      }
    }
  }

  function randomMaze(allow, clearCenter, clearPerimeter, color) {
    console.log("random")
    for (let i = 0; i < TOTAL; i++) {
      let row = Math.floor(i / COLS);
      let col = (i % COLS);
      let el = getTarget(row, col);
     if (!el) {console.log(`randomMaze found no element at ${i}, returning false`);
               return false;}
      let x = el.getAttribute("x");
      let y = el.getAttribute("y");
      let distance = centerDistance(x,y)
      //let farEnoughFromCorner = (row + col) > 5 && (row+col) < (ROWS+COLS-5)
      let distanceRequirement = clearCenter ? distance > getRandomInt(40, 200) : clearPerimeter ? distance < maxFactor/1.8 : true;

      if (distanceRequirement && Math.random() < allow) {
        $(el).addClass("blocker").css("fill", color);
      }

    }
  }

  function symmetricMaze(limit, mod1, mod2, clearCenter, clearPerimeter, color) {
    //wall every nth (mod1 and mod2)
    for (let i = 0; i < TOTAL; i++) {
      let row = Math.floor(i / COLS);
      let col = (i % COLS);
      let el = getTarget(row, col);
      if (!el) {console.log(`symmetricMaze found no element at ${i}, returning false`);
        return false;}
      let x = el.getAttribute("x");
      let y = el.getAttribute("y");
      let distance = centerDistance(x,y)
      let distanceRequirement = clearCenter ? distance > getRandomInt(40, 300) 
      : clearPerimeter ? distance < getRandomInt(400, 1000) : true;

      if (distanceRequirement && (i%mod1==0 ||i%mod2==0) && Math.random() > limit) {
        $(el).addClass("blocker").css("fill", color);
      }
    }
  }
 
  function circularMaze(limit, gaps, stripeWidth, color) {
   
    console.log(`circularMaze(): gaps were ${gaps} and strip width was ${stripeWidth}`)
    for (let i = 0; i < TOTAL; i++) {
      let row = Math.floor(i / COLS);
      let col = (i % COLS);
      let el = getTarget(row, col);
      if (!el) {console.log(`circularMaze found no element at ${i}, returning false`);
        return false;}
      let x = el.getAttribute("x");
      let y = el.getAttribute("y");
      let distance = centerDistance(x,y)
      let distanceRequirement = distance > 70 && gaps.some(g=>Math.abs(g-distance)<stripeWidth)
       
      if (distanceRequirement && Math.random() > limit ) {
        $(el).addClass("blocker").css("fill", color)
      }
    }
  }

  /* helpers */
  function getSurroundingPoints(from) {
    let newPoints = [];
    let p = from;
    newPoints.push(new Point(p.row + 1, p.col, "south"));
    newPoints.push(new Point(p.row - 1, p.col, "north"));
    newPoints.push(new Point(p.row, p.col + 1, "east"));
    newPoints.push(new Point(p.row, p.col - 1, "west"));
    return newPoints;
  }

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  function centerDistance(fromX, fromY) {
    return Math.sqrt(Math.pow(origin.getAttribute("x") - fromX, 2) + Math.pow(origin.getAttribute("y") - fromY, 2));
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function chance(limit = .5) {
    return Math.random() < limit;
  }

  function buildBoxes(color, gutter) {
    gutter = gutter === undefined ? 1 : gutter;
    for (var row = 0; row < ROWS; row++) {
      for (var col = 0; col < COLS; col++) 
      {
        let x = WIDTH * col;
        let y = WIDTH * row;
        drawSquare(row, col, x, y, WIDTH - gutter, WIDTH - gutter, color);
      }
    }
  }

  function Point(row, col, type) {
    this.col = parseInt(col);
    this.row = parseInt(row);
    this.type = type;
  }

  function getNextPointInDirection(point, direction) {
    let row = point.row;
    let col = point.col;
    switch (direction) {
      case "north":
        return new Point(row - 1, col);
        break;
      case "south":
        return new Point(row + 1, col);
        break;
      case "east":
        return new Point(row, col + 1);
        break;
      case "west":
        return new Point(row, col - 1);
        break;
      case "northeast":
        return new Point(row - 1, col + 1);
        break;
      case "southeast":
        return new Point(row + 1, col + 1);
        break;
      case "northwest":
        return new Point(row - 1, col - 1);
        break;
      case "southwest":
        return new Point(row + 1, col - 1);
        break;}

  }

  function getRandomDirection(not) {

    if(not==undefined) {
      let r = Math.random()
      return r < .25 ? "north" : r < .5 ? "south" : r < .75 ? "west" : "east"
    }
    let preferEastOrWest = not == "south" || not == "north";
    let backwards = preferEastOrWest ? ["north", "south"].filter(d=>d!=not)[0] : ["east", "west"].filter(d=>d!=not)[0]
    var generate = () => {
      let seed = Math.random();
      //if(seed>.5 && prefer) return prefer;
      if (preferEastOrWest) {
        return seed < .4 ? "east" : seed < .8 ? "west" : backwards
      } else {
        return seed < .4 ? "north" : seed < .8 ? "south" : backwards
      }

    };
    let which = generate();
    //while (not && which == not) {
    //  which = generate();
    //}
    return which;
  }

  function getRandomDirectionAny(not) {
      /*unused*/
    var generate = () => {
      return pick(directions);
    };
    let which = generate();
    while (not && which == not) {
      which = generate();
    }
    return which;
  }

  function getTarget(row, col) {
    return document.querySelector(`rect[col='${col}'][row='${row}']`);
  }

  function delay(ms) {
    return new Promise(done => setTimeout(() => {
      done();
    }, ms));
  }

  function drawSquare(row, col, x, y, w, h, color) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("row", row);
    rect.setAttribute("col", col);
    rect.setAttribute("width", w);
    rect.setAttribute("height", h);
    g.appendChild(rect);

  }
})("Visit me at sweaverD.com!");