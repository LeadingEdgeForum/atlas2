/*jshint esversion: 6 */

function calculateMapName(initialText, username, userpurpose){
  var initialSummary = initialText;
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
