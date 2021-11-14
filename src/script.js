INPUT_NODES = "input-nodes";
INPUT_WAYS = "input-ways";
INPUT_FILES = "input-files";

// main function which initate entire application
let defineNetwork = async () => {
  let nodes = await readFromFile(document.getElementById(INPUT_NODES).files[0]);
  let ways = await readFromFile(document.getElementById(INPUT_WAYS).files[0]);
  makeGraphAndMakeCalculations(ways, nodes);
};

// init forms to generate adj matrix for leveling network
function makeGraphAndMakeCalculations(ways, nodes) {
  initAllInputsForMatrixForms(ways);
  for (way in ways) {
    addOptionsToPickEdgePoints(nodes, way, "_begin");
    addOptionsToPickEdgePoints(nodes, way, "_end");
  }
  initButtonToMakeCalculations(ways, nodes);
}

// update ways object with begin and end
function generateMatrixBasedOnForms(ways, nodes) {
  raw_data = prepareCleanDataForObservationEquations(
    AddEndsForEdgesIn(ways),
    nodes
  );
  raw_data = fillHeightInMeasuredPoints(raw_data);
  prepareLinearEquations(raw_data);

  // linearEquation();
}

/* ********************************************************* */
/* MAIN ALGORITHM */
/* ********************************************************* */

let P = Array(5)
  .fill()
  .map(() => Array(5).fill(0));
P[0][0] = 2500;
P[1][1] = 2500;
P[2][2] = 2500;
P[3][3] = 2500;
P[4][4] = 2500;

// actual algorithm
function mainAlgorithmFunction(A, L, H) {
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
  let dx = X.map(function (num, idx) {
    return num - H[idx];
  });
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
  let f = A.length - A[0].length;
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

  showFinalResult(V, dx, s1, s2, m0, mh, mX);
}

function showFinalResult(v, x, s1, s2, m0, mh, mX) {
  let html = "<div class='center-div'>";

  html += '<div class="column">';
  html += "<h3>Obliczone wielkości</h3>";
  html += "<p>Poprawki dla przewyższeń</p>" + printNiceArray(v);
  html += "<p>Poprawki dla wyznaczonych punktów</p>" + printNiceArray(x);
  html += "<p>Estymator współczynnika wariancji</p>";
  html += '<p style="color: bisque">m<sub>0</sub> = ' + m0 + "</p>";
  html += "</div>";

  html += '<div class="column">';
  html += "<h3>Analiza dokładności</h3>";
  html += "<p>Kontrola wyrównania</p>";
  html += '<p style="color: bisque">S1 = ' + s1 + "</p>";
  html += '<p style="color: bisque">S2 = ' + s2 + "</p>";
  html += "<p>Średnie błędy wyrównanych odcinków</p>" + printNiceArray(mh);
  html += "<p>Średnie błędy wyrównanych punktów</p>" + printNiceArray(mX);
  html += "</div>";

  html += "</div>";
  document.getElementById(INPUT_FILES).innerHTML = html;
}

function printNiceArray(arr) {
  let html = '<p style="color: bisque">{ <br />';
  for (item of arr) {
    html += "&nbsp;&nbsp;" + item + "<br />";
  }
  html += "}</p>";
  return html;
}

/* ********************************************************* */
/* MATRIX MANIPULATION FUNCTIONS */
/* ********************************************************* */

function transpose(matrix) {
  return matrix[0].map((col, i) => matrix.map((row) => row[i]));
}

function multiply(a, b) {
  var aNumRows = a.length,
    aNumCols = a[0].length,
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
/* SOME BORING HELPING FUNCTIONS */
/* ********************************************************* */

// function to use stack data structure
function Stack() {
  this.stac = new Array();
  this.pop = function () {
    return this.stac.pop();
  };
  this.push = function (item) {
    this.stac.push(item);
  };
  this.isEmpty = function () {
    return this.stac.length < 1;
  };
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

// add options to form while making graph
function addOptionsToPickEdgePoints(nodes, way, type) {
  var selectForm = document.getElementById(way + type);
  for (var node in nodes) {
    var element = document.createElement("option");
    element.textContent = node;
    element.value = node;
    selectForm.appendChild(element);
  }
}

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

// using bfs find way between two points in adj matrix
function findPathUsingBFS(start_node_index, end_node_index, graph) {
  visited_nodes = new Array(graph.length);
  stack = new Stack();
  result_path = new Array(graph.length);
  for (let i = 0; i < visited_nodes.length; i++) {
    visited_nodes[i] = false;
  }
  for (let i = 0; i < result_path.length; i++) {
    result_path[i] = 0;
  }

  result_path[start_node_index] = -1;
  stack.push(start_node_index);
  visited_nodes[start_node_index] = true;
  var v;

  while (!stack.isEmpty()) {
    v = stack.pop();
    if (v == end_node_index) break;

    for (let j = 0; j < graph[v].length; j++) {
      if (graph[v][j] != 0) {
        if (visited_nodes[j] != true) {
          visited_nodes[j] = true;
          result_path[j] = v;
          stack.push(j);
        }
      }
    }
  }
  let final_path = new Array();
  final_path.push(end_node_index);
  while (v > -1) {
    final_path.push(v);
    v = result_path[v];
  }
  return final_path;
}

// init original adjacency matrix of leveling network
function prepareCleanDataForObservationEquations(ways, nodes) {
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

// init input for all edges in leveling network
function initAllInputsForMatrixForms(ways) {
  let html = "";
  for (way in ways) {
    html += "<label>Wprowadź przebieg odcinka " + way + ":";
    html += '<select class="way_select" id=' + way + "_begin" + "></select>";
    html += '<select class="way_select" id=' + way + "_end" + "></select>";
    html += "</label><br />";
  }
  document.getElementById(INPUT_FILES).innerHTML = html;
}

// init button with onclick whoch will be make calculations
function initButtonToMakeCalculations(ways, nodes) {
  var myDiv = document.getElementById(INPUT_FILES);
  var myButton = document.createElement("BUTTON");
  myButton.innerHTML = "Button";
  myButton.onclick = function () {
    generateMatrixBasedOnForms(ways, nodes);
  };
  myDiv.appendChild(myButton);
  document.getElementById(INPUT_FILES).classList.remove("center-div");
}

// prepare updated ways with begin and end
function AddEndsForEdgesIn(ways) {
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
  return new_ways;
}

// calculate delta height in desired path
function getDeltaHeightOnPath(path, nodes, edges) {
  let delta_h = 0;
  let start_id = 0;
  let end_id = 1;

  while (end_id != path.length) {
    let actual_node_name = nodes[path[start_id]][0];
    let next_node_name = nodes[path[end_id]][0];
    for (edge of edges) {
      let edge_begin = edge[2];
      let edge_end = edge[3];
      if (edge_begin == actual_node_name && edge_end === next_node_name) {
        delta_h -= edge[1];
        break;
      }
      if (edge_end == actual_node_name && edge_begin === next_node_name) {
        delta_h += edge[1];
        break;
      }
    }
    start_id += 1;
    end_id += 1;
  }
  return delta_h;
}

function fillHeightInMeasuredPoints(raw_data) {
  let reper_val = 0;
  let reper_key = 0;
  for (let i = 0; i < raw_data.nodes.length; i++) {
    if (raw_data.nodes[i][1] != null) {
      reper_key = i;
      reper_val = raw_data.nodes[reper_key][1];
      break;
    }
  }
  for (let i = 0; i < raw_data.nodes.length; i++) {
    if (raw_data.nodes[i][1] == null) {
      let path = findPathUsingBFS(reper_key, i, raw_data.matrix);
      let dh =
        reper_val + getDeltaHeightOnPath(path, raw_data.nodes, raw_data.edges);
      raw_data.nodes[i].push(dh);
    } else {
      raw_data.nodes[i].push(null);
    }
  }
  return raw_data;
}

function numberOfMeasuredPoints(raw_data) {
  let num = 0;
  for (let i = 0; i < raw_data.nodes.length; i++) {
    if (raw_data.nodes[i][3] != null) num += 1;
  }
  return num;
}

function prepareLinearEquations(raw_data) {
  let a_row_len = numberOfMeasuredPoints(raw_data);
  let a_column_len = raw_data.edges.length;
  let A_Matrix = new Array(a_column_len);
  let L_Matrix = new Array(a_column_len);
  let H_Matrix = raw_data.nodes
    .filter(function (el) {
      return el[1] == null;
    })
    .map(function (el) {
      return el[3];
    });

  for (let i = 0; i < a_column_len; i++) {
    A_Matrix[i] = new Array(a_row_len).fill(0);
    L_Matrix[i] = new Array(1).fill(0);
    L_Matrix[i][0] -= raw_data.edges[i][1];
  }

  for (let i = 0; i < a_column_len; i++) {
    let edge = raw_data.edges[i];
    let begin_node = edge[2];
    let end_node = edge[3];
    let beg_lines = includeToEquation(begin_node, raw_data, a_row_len);
    let end_lines = includeToEquation(end_node, raw_data, a_row_len);

    for (let j = 0; j < a_row_len; j++) {
      A_Matrix[i][j] += end_lines.eq_part[j];
      A_Matrix[i][j] -= beg_lines.eq_part[j];
    }
    L_Matrix[i][0] += end_lines.l_part[0];
    L_Matrix[i][0] -= beg_lines.l_part[0];
  }

  console.log(A_Matrix);
  console.log(L_Matrix);

  mainAlgorithmFunction(A_Matrix, L_Matrix, H_Matrix);
}

function includeToEquation(p_name, raw_data, size) {
  let point;
  for (let i = 0; i < raw_data.nodes.length; i++) {
    if (raw_data.nodes[i][0] === p_name) {
      point = raw_data.nodes[i];
      break;
    }
  }
  let eq_part = new Array(size).fill(0);
  let l_part = [];
  l_part.push(0);
  if (point[1] == null) {
    let ind = point[2] - 1;
    eq_part[ind] += 1;
  } else {
    l_part[0] += point[1];
  }
  return { eq_part, l_part };
}
