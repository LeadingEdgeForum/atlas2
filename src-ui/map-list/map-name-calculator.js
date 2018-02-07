/*jshint esversion: 6 */

function calculateMapName(initialText, name, isSubmap){
  var initialSummary = initialText;
  if(isSubmap == true){ //jshint ignore:line
    return name + ' (submap)';
  }
  if(name && name.length > 0){
    return name;
  }
  return initialSummary;
}

export {calculateMapName};
