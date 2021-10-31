let defineNetwork = async () => {
  let nodesInput = document.getElementById("input-nodes").files[0];
  let waysInput = document.getElementById("input-ways").files[0];
  let nodes = await parse(nodesInput);
  let ways = await parse(waysInput);
  console.log(nodes);
  console.log(ways);
};

function parse(file) {
  // Always return a Promise
  return new Promise((resolve, reject) => {
    let content = "";
    const reader = new FileReader();
    // Wait till complete
    reader.onloadend = function (e) {
      content = e.target.result;
      const result = JSON.parse(content);
      resolve(result);
    };
    // Make sure to handle error states
    reader.onerror = function (e) {
      reject(e);
    };
    reader.readAsText(file);
  });
}
