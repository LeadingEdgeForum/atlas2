/*jshint esversion: 6 */

function calculateMapName(initialText, name, isSubmap){
  var initialSummary = initialText;
  if(isSubmap){
    return name + ' (submap)';
  }
  if(name && name.length > 0){
    return name;
  }
  return initialSummary;
}

export {calculateMapName};
