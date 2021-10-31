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
      hname: way,
      value: value,
      begin: way_begin,
      end: way_end,
    });
  }
  data = initAdjacencyMatrix(new_ways, nodes);
  console.log(data);
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
    adjacencyMatrix[row][col] = way[1].value;
    console.log(rowName + " -> " + colName + " = " + way[1].value);
  }

  return {
    matrix: adjacencyMatrix,
    ways: waysArray,
    nodes: nodesArray,
  };
}
