INPUT_NODES = "input-nodes";
INPUT_WAYS = "input-ways";
INPUT_FILES = "input-files";

// main function to generate reaport
let defineNetwork = async () => {
  let nodesInput = document.getElementById(INPUT_NODES).files[0];
  let waysInput = document.getElementById(INPUT_WAYS).files[0];
  let nodes = await readFromFile(nodesInput);
  let ways = await readFromFile(waysInput);
  initGraphReadingForm(ways, nodes);
};

// update ways object with begin and end
function updateWaysBasedOnGraph(ways, nodes) {
  var new_ways = [];

  for (var [way, value] of Object.entries(ways)) {
    var begin_elem = document.getElementById(way + "_begin");
    var end_elem = document.getElementById(way + "_end");
    var way_begin = begin_elem.options[begin_elem.selectedIndex].text;
    var way_end = end_elem.options[end_elem.selectedIndex].text;
    new_ways.push({
      edge: way,
      len: value,
      begin: way_begin,
      end: way_end,
    });
  }
  data = initAdjacencyMatrix(new_ways, nodes);
  // linearEquation();
}

/* ********************************************************* */
/* PREPARE DATA FUNCTIONS */
/* ********************************************************* */

// reading file and return its content
function readFromFile(file) {
  return new Promise((resolve, reject) => {
    let content = "";
    const reader = new FileReader();
    reader.onloadend = function (e) {
      content = e.target.result;
      const result = JSON.parse(content);
      resolve(result);
    };
    reader.onerror = function (e) {
      reject(e);
    };
    reader.readAsText(file);
  });
}

// generate form for read connection graph
function initGraphReadingForm(ways, nodes) {
  initWaysSelectSubForms(ways);
  for (way in ways) {
    initOptionToWaySelectSubForm(nodes, way, "_begin");
    initOptionToWaySelectSubForm(nodes, way, "_end");
  }
  addConfirmNetworkButton(ways, nodes);
  document.getElementById(INPUT_FILES).classList.remove("center-div");
}

// part of connection graph, add empty select
function initWaysSelectSubForms(ways) {
  let html = "";
  for (way in ways) {
    html += "<label>Wprowadź przebieg odcinka " + way + ":";
    html += '<select class="way_select" id=' + way + "_begin" + "></select>";
    html += '<select class="way_select" id=' + way + "_end" + "></select>";
    html += "</label><br />";
  }
  document.getElementById(INPUT_FILES).innerHTML = html;
}

// part od connection graph, add confirm button
function addConfirmNetworkButton(ways, nodes) {
  var myDiv = document.getElementById(INPUT_FILES);
  var myButton = document.createElement("BUTTON");
  myButton.innerHTML = "Button";
  myButton.onclick = function () {
    updateWaysBasedOnGraph(ways, nodes);
  };
  myDiv.appendChild(myButton);
}

// part of connection graph, add options to select
function initOptionToWaySelectSubForm(nodes, way, type) {
  var selectForm = document.getElementById(way + type);
  for (var node in nodes) {
    var element = document.createElement("option");
    element.textContent = node;
    element.value = node;
    selectForm.appendChild(element);
  }
}

// find index based on name in nodes array
function findIndexBasedOnName(pname, array) {
  for (node of array) {
    var node_name = node[0];
    if (node_name == pname) {
      return node[2];
    }
  }
}

// init original adjacency matrix of leveling network
function initAdjacencyMatrix(ways, nodes) {
  var numOfNodes = Object.keys(nodes).length;
  let adjacencyMatrix = Array(numOfNodes)
    .fill()
    .map(() => Array(numOfNodes).fill(0));

  var i = 0;
  let nodesArray = Object.entries(nodes);
  for (node of nodesArray) {
    node.push(i++);
  }
  let waysArray = Object.entries(ways);

  for (way of waysArray) {
    var rowName = way[1].begin;
    var colName = way[1].end;
    var row = findIndexBasedOnName(rowName, nodesArray);
    var col = findIndexBasedOnName(colName, nodesArray);
    adjacencyMatrix[row][col] = way[1].len;
    console.log(rowName + " -> " + colName + " = " + way[1].len);
  }

  let edges = [];
  for (way of waysArray) {
    var edge = [];
    edge.push(way[1].edge);
    edge.push(way[1].len);
    edge.push(way[1].begin);
    edge.push(way[1].end);
    edge.push(Number(way[0]));
    edges.push(edge);
  }
  console.log(edges);

  return {
    matrix: adjacencyMatrix,
    edges: edges,
    nodes: nodesArray,
  };
}

/* ********************************************************* */
/* MATRIX MANIPULATION FUNCTIONS */
/* ********************************************************* */

// matrix methods
function transpose(matrix) {
  return matrix[0].map((col, i) => matrix.map((row) => row[i]));
}

function multiply(a, b) {
  var aNumRows = a.length,
    aNumCols = a[0].length,
    bNumRows = b.length,
    bNumCols = b[0].length,
    m = new Array(aNumRows);
  for (var r = 0; r < aNumRows; ++r) {
    m[r] = new Array(bNumCols);
    for (var c = 0; c < bNumCols; ++c) {
      m[r][c] = 0;
      for (var i = 0; i < aNumCols; ++i) {
        m[r][c] += a[r][i] * b[i][c];
      }
    }
  }
  return m;
}

function times(a, num) {
  let res = Array(a.length)
    .fill()
    .map(() => Array(a[0].length).fill(0));
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a[0].length; j++) {
      res[i][j] = a[i][j] * num;
    }
  }
  return res;
}

function sub(a, b) {
  let res = Array(a.length)
    .fill()
    .map(() => Array(a[0].length).fill(0));
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a[0].length; j++) {
      res[i][j] = a[i][j] - b[i][j];
    }
  }
  return res;
}

function add(a, b) {
  let neg_b = times(b, -1);
  return sub(a, neg_b);
}

function inv(_A) {
  var temp,
    N = _A.length,
    E = [];

  for (var i = 0; i < N; i++) E[i] = [];

  for (i = 0; i < N; i++)
    for (var j = 0; j < N; j++) {
      E[i][j] = 0;
      if (i == j) E[i][j] = 1;
    }

  for (var k = 0; k < N; k++) {
    temp = _A[k][k];

    for (var j = 0; j < N; j++) {
      _A[k][j] /= temp;
      E[k][j] /= temp;
    }

    for (var i = k + 1; i < N; i++) {
      temp = _A[i][k];

      for (var j = 0; j < N; j++) {
        _A[i][j] -= _A[k][j] * temp;
        E[i][j] -= E[k][j] * temp;
      }
    }
  }

  for (var k = N - 1; k > 0; k--) {
    for (var i = k - 1; i >= 0; i--) {
      temp = _A[i][k];

      for (var j = 0; j < N; j++) {
        _A[i][j] -= _A[k][j] * temp;
        E[i][j] -= E[k][j] * temp;
      }
    }
  }

  for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) _A[i][j] = E[i][j];
  return _A;
}

/* ********************************************************* */
/* TESTING ALGORITHM IN EXAMPLE DATA  */
/* ********************************************************* */

// temporary values to implement algorithm
let A = [
  [1, 0, 0],
  [-1, 1, 0],
  [0, 1, 0],
  [0, 1, -1],
  [1, 0, -1],
];

let L = [[-102.498], [-4.768], [-107.288], [-2.961], [1.774]];

let P = Array(5)
  .fill()
  .map(() => Array(5).fill(0));
P[0][0] = 2500;
P[1][1] = 2500;
P[2][2] = 2500;
P[3][3] = 2500;
P[4][4] = 2500;

let H = [[102.498], [107.288], [104.327]];

// actual algorithm
function linearEquation() {
  // obliczenie macierzy (At * P * L)
  let At_P_L = multiply(multiply(transpose(A), P), L);
  console.log("AtPL -> " + At_P_L);

  // obliczenie macierzy (At * P * A) ^ (-1)
  let inv_At_P_A = inv(multiply(multiply(transpose(A), P), A));
  console.log("AtPA^-1 -> " + inv_At_P_A);

  // obliczenie wektora niewiadomych;
  let X = times(multiply(inv_At_P_A, At_P_L), -1);
  console.log("X -> " + X);

  // obliczenie poprawek do punktów
  let dx = sub(X, H);
  console.log("dX -> " + dx);

  // obliczenie poprawek do przewyższeń
  let V = add(multiply(A, X), L);
  console.log("V -> " + V);

  // kontrola poprawności wyrównania
  let s1 = multiply(multiply(transpose(V), P), V);
  let s2 = add(
    multiply(multiply(multiply(transpose(L), P), A), X),
    multiply(multiply(transpose(L), P), L)
  );
  console.log("s1 " + s1);
  console.log("s2 " + s2);

  // estymator współczynnika wariancji
  let f = A.length - H.length;
  let m0 = Math.sqrt(s1 / f);
  console.log("m0 " + m0);

  // macierz kowariancji wyrownanych punktow
  let Cx = times(inv_At_P_A, m0 * m0);
  console.log("Cx " + Cx);

  // srednie bledy wyrownanych punktow
  mX = [];
  for (let i = 0; i < Cx.length; ++i) {
    mX.push(Math.sqrt(Cx[i][i]));
  }
  console.log("mX " + mX);

  // macierz kowariancji wyrownanych odcinkow
  let Ch = times(multiply(A, multiply(inv_At_P_A, transpose(A))), m0 * m0);
  console.log("Ch " + Ch);

  // srednie błędy wyrównanych odcinków
  mh = [];
  for (let i = 0; i < Ch.length; ++i) {
    mh.push(Math.sqrt(Ch[i][i]));
  }
  console.log("mH " + mh);
}
