/*jshint esversion: 6 */

function calculateMapName(username, userpurpose){
  var initialSummary = "Create a new map"
  if(username && username.length > 0){
    initialSummary = "As " + username + ", I want to ";
    if(userpurpose && userpurpose.length > 0){
      initialSummary += userpurpose + ".";
    } else {
      initialSummary += "...";
    }
  }
  return initialSummary;
};

export {calculateMapName};
