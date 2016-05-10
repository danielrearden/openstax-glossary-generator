var parser = new DOMParser();
var serializer = new XMLSerializer();

// Set up the CodeMirror on page load
function addMirror() {
    editor = CodeMirror(document.getElementById("bottomPanel"), {
        mode: "xml",
        lineNumbers: true,
        lineWrapping: true
    });
}


function generateClick(option) {
    // Retrieve file from file input and pass to generateGlossary() as string
    if (option == "file") {
        var f = document.getElementById("fileInput").files[0];

        if (f) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var contents = e.target.result;
                generateGlossary(contents);
            }
            reader.readAsText(f);
        } else {
            // Alert user if no file was selected
            alert("No file loaded. Please choose a file first.");
        }
    // Otherwise, use what's already in the editor
    } else {
        generateGlossary(editor.getDoc().getValue());
    }
}

function generateGlossary(myText) {
    // Get XML document from passed in string
    var xmlDoc = parser.parseFromString(myText, "text/xml");

    // Check if file even has content tags
    if (xmlDoc.getElementsByTagName("content").length == 0) {
        window.alert("Invalid file or text. Please check your input and try again.");
        return;
    }

    // If no glossary tag exists, make one!
    if (xmlDoc.getElementsByTagName("glossary").length < 1) {
        var makeGlossary = xmlDoc.createElement("glossary");
        xmlDoc.documentElement.appendChild(makeGlossary);
    }

    // Define references for nodes used throughout function
    var glossary = xmlDoc.getElementsByTagName("glossary")[0];
    var content = xmlDoc.getElementsByTagName("content")[0];
    var contentTerms = content.getElementsByTagName("term");


    // If the glossary already has definitions in it...
    if (glossary.hasChildNodes()) {

        // References to nodes within the glossary
        var glossaryTerms = glossary.getElementsByTagName("term");
        var notInGlossary = []; // definitions in content but not in glossary
        var newDefinitions = []; // definitions we're adding

        // Compare the terms in the content and the dictionary and generate
        // array of terms missing from the glossary
        for (var i = 0; i < contentTerms.length; i++) {
            var match = false;
            for (var j = 0; j < glossaryTerms.length; j++) {
                var c = contentTerms[i].firstChild.nodeValue;
                var g = glossaryTerms[j].firstChild.nodeValue;
                if (c.toUpperCase() == g.toUpperCase()) {
                    match = true;
                }
            }
            if (!match) {
                console.log("not matched ["+c+"] ["+g+"]");
                notInGlossary.push(contentTerms[i].cloneNode(true));
            }
        }

        // Generate a new definition and meaning for each term we're adding
        // to the glossary and add them to the newDefinitions array
        for (var i = 0; i < notInGlossary.length; i++) {
            var newDefinition = xmlDoc.createElement("definition");
            var newMeaning = xmlDoc.createElement("meaning");
            var newText = xmlDoc.createTextNode(" ");
            var newTerm = notInGlossary[i].cloneNode(true);
            var newID = generateID(newTerm.childNodes[0].nodeValue);

            newDefinition.setAttribute("id", "d" + newID);
            newTerm.setAttribute("id", "t" + newID);
            newMeaning.setAttribute("id", "m" + newID);
            newMeaning.appendChild(newText);

            newDefinition.appendChild(newTerm);
            newDefinition.appendChild(newMeaning);

            newDefinitions.push(newDefinition);
        }

        // Check whether the option to delete terms not tagged in the content
        // has been selected and set the deleteUnusedTerms boolean accordingly
        var deleteUnusedTerms = document.getElementById("deleteCheck").checked;

        // Add old definitions from the existing glossary to the newDefinitions.
        // If deleteUnusedTerms is true, only add ones that are tagged inside
        // the content by comparing against contentTerms
        for (var i = 0; i < glossaryTerms.length; i++) {
            var match = true;
            if (deleteUnusedTerms) {
                match = false;
                for (var j = 0; j < contentTerms.length; j++) {
                    var c = contentTerms[j].firstChild.nodeValue;
                    var g = glossaryTerms[i].firstChild.nodeValue;
                    if (c.toUpperCase() == g.toUpperCase()) {
                        match = true;
                        console.log("deleteUnusedTerms, matched ["+c+"] ["+g+"]");
                    }
                }
            }

            if (match) {
                var oldDefinition = glossary.getElementsByTagName("definition")[i];
                var newID = generateID(glossaryTerms[i].childNodes[0].nodeValue);
                oldDefinition.setAttribute("id", "d" + newID);
                oldDefinition.getElementsByTagName("term")[0].setAttribute("id", "t" + newID);
                oldDefinition.getElementsByTagName("meaning")[0].setAttribute("id", "m" + newID);

                newDefinitions.push(oldDefinition);
            }
        }

        // The newDefinitions array now includes both old and new entries so
        // it needs to be sorted according to the term names
        newDefinitions.sort(function(a, b) {
            aa = a.getElementsByTagName("term")[0].childNodes[0].nodeValue.toUpperCase();
            bb = b.getElementsByTagName("term")[0].childNodes[0].nodeValue.toUpperCase();
            if (aa > bb) {
                return 1;
            }
            if (aa < bb) {
                return -1;
            }
            return 0;
        });

        // Add our newly sorted definitions into a new glossary element and
        // replace the existing glossary with our new one
        var replacementGlossary = xmlDoc.createElement("glossary");
        for (var i = 0; i < newDefinitions.length; i++) {
            replacementGlossary.appendChild(newDefinitions[i]);
        }
        xmlDoc.documentElement.replaceChild(replacementGlossary, glossary);

        // If the glossary was empty...
    } else {

        // For each term tagged inside content, make a new empty definition
        // and append it to our blank glossary
        for (var i = 0; i < contentTerms.length; i++) {
            var newDefinition = xmlDoc.createElement("definition");
            var newMeaning = xmlDoc.createElement("meaning");
            var newText = xmlDoc.createTextNode(" ");
            var newTerm = contentTerms[i].cloneNode(true);
            var newID = generateID(newTerm.childNodes[0].nodeValue);

            newDefinition.setAttribute("id", "d" + newID);
            newTerm.setAttribute("id", "t" + newID);
            newMeaning.setAttribute("id", "m" + newID);
            newMeaning.appendChild(newText);

            newDefinition.appendChild(newTerm);
            newDefinition.appendChild(newMeaning);

            glossary.appendChild(newDefinition);
        }
    }

    // Now that the glossary has been either added to or built from scratch,
    // we go through all the terms inside content and set the target-id for each
    // to match the ones we generated for the glossary
    for (var i = 0; i < contentTerms.length; i++) {
        var newID = generateID(contentTerms[i].childNodes[0].nodeValue);
        contentTerms[i].setAttribute("id", "c" + newID);
        console.log("my name is " + contentTerms[i].childNodes[0].nodeValue);
        console.log("my parent is: "+ contentTerms[i].parentNode.nodeName);
        if (contentTerms[i].parentNode.nodeName == "link") {
            contentTerms[i].parentNode.setAttribute("target-id", "d" + newID);
            contentTerms[i].parentNode.setAttribute("xmlns", "http://cnx.rice.edu/cnxml");
            console.log("matched to LINK, assigned target-id " + "d" + newID);
        } else {
            console.log("LINK not found, making new element");
            var newLink = xmlDoc.createElement("link");
            newLink.setAttribute("target-id", "d" + newID);
            newLink.setAttribute("xmlns", "http://cnx.rice.edu/cnxml");
            contentTerms[i].parentNode.insertBefore(newLink, contentTerms[i]);
            newLink.appendChild(contentTerms[i]);
        }
    }

    // Set the CodeMirror value to the document and format the output
    editor.getDoc().setValue(serializer.serializeToString(xmlDoc));
    var totalLines = editor.lineCount();
    var totalChars = editor.getDoc().getValue().length;
    editor.autoFormatRange({
        line: 0,
        ch: 0
    }, {
        line: totalLines,
        ch: totalChars
    });

}

function generateID(text) {
    text = text.toUpperCase();
    var id = "";

    for (var i = 0; i < text.length; i++) {
        id += (text.charCodeAt(i)).toString();
    }
    
    id = id.substr(0,40);

    return id;
}

function exportClick() {
    var content = editor.getDoc().getValue();
    var a = document.createElement("a");
    var blob = new Blob([content], {
        "type": "application/octet-stream"
    });

    a.href = window.URL.createObjectURL(blob);
    a.download = "module.txt";
    a.click();

    // Alternative method
    //uriContent = "data:application/octet-stream," + encodeURIComponent(content);
    //window.open(uriContent, "NewGlossary");

    // This will open a new tab with the xml displayed
    //uriContent = "data:text/xml," + encodeURIComponent(content);
    //window.open(uriContent, "NewGlossary");
}

function mergeTerms() {
    var workingCode = parser.parseFromString(editor.getDoc().getValue(), "text/xml");

    if (workingCode.getElementsByTagName("glossary") == 0) {
        window.alert("Invalid file or text. Please check your input and try again.");
        return;
    }

    var glossary = workingCode.getElementsByTagName("glossary")[0];
    var content = workingCode.getElementsByTagName("content")[0];

    var keep = document.getElementById("textKeep").value.trim();
    console.log("keep "+keep);
    var merge = document.getElementById("textMerge").value.trim();
    console.log("merge "+merge);

    if (!keep || !merge) {
        window.alert("Please check your IDs and try again.");
        return;
    }

    console.log("post extraction");
    keep = extractID(keep);
    console.log("keep "+keep);
    merge = extractID(merge);
    console.log("merge "+merge);

    if (keep == merge) {
        window.alert("Same ID entered in both fields.");
        return;
    }

    var mergeDefinition = workingCode.getElementById("d" + merge);
    var keepDefinition = workingCode.getElementById("d" + keep);
    if (!mergeDefinition || !keepDefinition) {
        window.alert("Please check your IDs and try again.");
        return;
    }
    // Delete the "merged" definition
    mergeDefinition.parentNode.removeChild(mergeDefinition);

    var keepTerm = workingCode.getElementById("t" + keep);
    var keepTermName = keepTerm.childNodes[0].nodeValue;
    var mergeTerm = workingCode.getElementById("c" + merge);

    // If the merged term exists in the content, change it's info
    if (mergeTerm) {
        mergeTerm.childNodes[0].nodeValue = keepTermName;
        mergeTerm.setAttribute("id", "c" + keep);
        mergeTerm.parentNode.setAttribute("target-id", "d" + keep);
    }

    // Clear fields
    document.getElementById("textKeep").value = "";
    document.getElementById("textMerge").value = "";

    //Update editor text to reflect changes
    editor.getDoc().setValue(serializer.serializeToString(workingCode));
}

function extractID(myID) {
    // Check to see if ID entered begins with something other than 0 - 9
    if (myID.charCodeAt(0) > 57 || myID.charCodeAt(0) < 48) {
        return myID.substring(1);
    }
    return myID;
}
