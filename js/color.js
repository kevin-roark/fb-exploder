/* thanks henry */

function v() {
  return Math.floor(Math.random() * 256);
}

module.exports.randomColor = function() {
  return "rgb(" + v() + "," + v() + ", " + v() + ")";
};

module.exports.randomBrightColor = function() {
  var key = Math.floor(Math.random() * 6);

  if (key === 0)
    return "rgb(" + "0,255," + v() + ")";
  else if (key === 1)
    return "rgb(" + "0," + v() + ",255)";
  else if (key === 2)
    return "rgb(" + "255, 0," + v() + ")";
  else if (key === 3)
    return "rgb(" + "255," + v() + ",0)";
  else if (key === 4)
    return "rgb(" + v() + ",255,0)";
  else
    return "rgb(" + v() + ",0,255)";
};
