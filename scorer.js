// Copyright (c) 2025 Brian Kircher
//
// Open Source Software: you can modify and/or share it under the terms of the
// BSD license file in the root directory of this project.

// The local storage object for saved matches.
const storage = window.localStorage;

// The information about each of the years.
let years = [];

// The year of the scoresheet that is currently loaded.
let currentYear = undefined;

// The JSON scoresheet that is currently loaded.
let scoresheet = undefined;

// Indicates when a panel back animation is active; used to keep a second one
// from starting while the first is active.
let panelAnimation = false;

// Controls the ability to edit the scoresheet (used for viewing saved
// scoresheets).
let readonly = false;

// The stack of dialogs that are open.
let dialogStack = [];

// Adapted from ios-pwa-splash <https://github.com/avadhesh18/iosPWASplash>
function
iosPWASplash(icon, color = "white")
{
  // Check if the provided 'icon' is a valid URL
  if((typeof icon !== "string") || (icon.length === 0))
  {
    throw new Error("Invalid icon URL provided");
  }

  // Calculate the device's width and height
  const deviceWidth = screen.width;
  const deviceHeight = screen.height;

  // Calculate the pixel ratio
  const pixelRatio = window.devicePixelRatio || 1;

  // Create two canvases and get their contexts to draw landscape and portrait
  // splash screens.
  const canvas = document.createElement("canvas");
  const canvas2 = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const ctx2 = canvas2.getContext("2d");

  // Create an image element for the icon
  const iconImage = new Image();

  iconImage.onerror = function ()
  {
    throw new Error("Failed to load icon image");
  };

  iconImage.src = icon;

  // Load the icon image.
  iconImage.onload = function ()
  {
    // Calculate the icon size based on the device's screen size.
    const min = Math.min(deviceWidth, deviceHeight) * pixelRatio;
    const iconSizew = (min * 3) / 5;
    const iconSizeh = (min * 3) / 5;

    canvas.width = deviceWidth * pixelRatio;
    canvas2.height = canvas.width;
    canvas.height = deviceHeight * pixelRatio;
    canvas2.width = canvas.height;
    ctx.fillStyle = color;
    ctx2.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx2.fillRect(0, 0, canvas2.width, canvas2.height);

    // Calculate the position to center the icon
    const x = (canvas.width - iconSizew) / 2;
    const y = (canvas.height - iconSizeh) / 2;
    const x2 = (canvas2.width - iconSizew) / 2;
    const y2 = (canvas2.height - iconSizeh) / 2;

    // Draw the icon with the calculated size
    ctx.drawImage(iconImage, x, y, iconSizew, iconSizeh);
    ctx2.drawImage(iconImage, x2, y2, iconSizew, iconSizeh);
    const imageDataURL = canvas.toDataURL("image/png");
    const imageDataURL2 = canvas2.toDataURL("image/png");

    // Create the first startup image <link> tag (splash screen)
    const link = document.createElement("link");
    link.setAttribute("rel", "apple-touch-startup-image");
    link.setAttribute("media", "screen and (orientation: portrait)");
    link.setAttribute("href", imageDataURL);
    document.head.appendChild(link);

    // Create the second startup image <link> tag (splash screen)
    const link2 = document.createElement("link");
    link2.setAttribute("rel", "apple-touch-startup-image");
    link2.setAttribute("media", "screen and (orientation: landscape)");
    link2.setAttribute("href", imageDataURL2);
    document.head.appendChild(link2);
  };
}

// Generate iOS splash screens from the favicon.
iosPWASplash("favicon.webp", "#000000");

// Extend JQuery by adding a showModal() method (mimic-ing the corresponding
// method in the standard DOM model).
$.fn.extend({showModal: function()
                        {
                          return this.each(function()
                                           {
                                             if(this.tagName === "DIALOG")
                                             {
                                               this.showModal();
                                             }
                                           });
                        }
            });

// Extend JQuery by adding a close() method (mimic-ing the corresponding method
// in the standard DOM model).
$.fn.extend({close: function()
                    {
                      return this.each(function()
                                       {
                                         if(this.tagName === "DIALOG")
                                         {
                                           this.close();
                                         }
                                       });
                    }
            });

// Hides the main panel.
function
hideMain()
{
  const main = $(".main");
  const saved = $(".saved");
  const scorer = $(".scorer");

  // Hide the main panel and disable the animation end event trigger.
  main.hide();
  main.off("animationend", hideMain);

  // Remove all the animation classes from the panels.
  main.removeClass("hide").removeClass("show").removeClass("uncover");
  saved.removeClass("hide").removeClass("show").removeClass("uncover");
  scorer.removeClass("hide").removeClass("show").removeClass("uncover");

  // Indicate that a panel animation is no longer active.
  panelAnimation = false;
}

// Hides the saved score panel.
function
hideSaved()
{
  const main = $(".main");
  const saved = $(".saved");
  const scorer = $(".scorer");

  // Hide the saved score panel and disable the animation end event trigger.
  saved.hide();
  saved.off("animationend", hideSaved);

  // Remove all the animation classes from the panels.
  main.removeClass("hide").removeClass("show").removeClass("uncover");
  saved.removeClass("hide").removeClass("show").removeClass("uncover");
  scorer.removeClass("hide").removeClass("show").removeClass("uncover");

  // Indicate that a panel animation is no longer active.
  panelAnimation = false;
}

// Hides the scorer panel.
function
hideScorer()
{
  const main = $(".main");
  const saved = $(".saved");
  const scorer = $(".scorer");

  // Hide the scorer panel and disable the animation end event trigger.
  scorer.hide();
  scorer.off("animationend", hideScorer);

  // Remove all the animation classes from the panels.
  main.removeClass("hide").removeClass("show").removeClass("uncover");
  saved.removeClass("hide").removeClass("show").removeClass("uncover");
  scorer.removeClass("hide").removeClass("show").removeClass("uncover");

  // Indicate that a panel animation is no longer active.
  panelAnimation = false;
}

// Shows a dialog.
function
showDialog(dialog, buttons = [])
{
  // Create an return a promise that is resolved when the dialog is closed.
  return(new Promise((resolve) =>
  {
    // Called when the dialog hide animation completes.
    function
    closeEnd(result)
    {
      // Remove the hide class (preparing the dialog for the next time it is
      // displayed).
      dialog.removeClass("hide");

      // Close the modal dialog.
      dialog.close();

      // Remove the end of animation event listener.
      dialog.off("animationend");

      // Remove this dialog from the stack.
      dialogStack.pop();

      // Remove the keydown event listener.
      $(document).off("keydown", keyDown);

      // Resolve the promise with the result of the dialog.
      resolve(result);
    }

    // Called when the dialog should be closed.
    function
    close(result)
    {
      // Add an end of animation event listener.
      dialog.on("animationend", () => closeEnd(result));

      // Add the hide class to the dialog, starting the close animation.
      dialog.addClass("hide");

      // Return false to prevent further event propagation.
      return(false);
    }

    // Called when there is a click (mouse or touch).
    function
    click(e)
    {
      const rect = e.target.getBoundingClientRect();

      // See if the click is outside the dialog box.
      if((rect.left > e.clientX) || (rect.right < e.clientX) ||
         (rect.top > e.clientY) || (rect.bottom < e.clientY))
      {
        // Close the dialog.
        close(-1);
      }
    }

    // Called when a key is pressed.
    function
    keyDown(e)
    {
      // Close the dialog if the escape key is pressed.
      if((e.key == "Escape") &&
         (dialogStack[dialogStack.length - 1] == dialog))
      {
        // Start the animated close of the dialog.
        close(-1);

        // Prevent any further handling of this keystroke.
        e.preventDefault();
      }
    }

    // Loop through the buttons in the dialog.
    for(let idx = 0; idx < buttons.length; idx++)
    {
      // Add the click handler to this button.
      let button = dialog.find(`#${buttons[idx][0]}`);
      button.off("click");
      button.on("click", () => close(buttons[idx][1]));
    }

    // Register the click handler for the backdrop.
    dialog.off("click");
    dialog.on("click", click);

    // Add a keydown listener to the document to override the default Escape
    // key handling for a modal dialog (which simply closes it, instead of
    // animating the close like needed here).
    $(document).on("keydown", keyDown);

    // Add this dialog to the dialog stack.
    dialogStack.push(dialog);

    // Show the dialog.
    dialog.showModal();

    // Scroll to the top of the dialog.
    dialog.scrollTop(0);
  }));
}

// Shows the about dialog.
function
showAbout()
{
  const dialog = $("dialog#about");

  // Shows a license dialog.
  function
  showLicense(id)
  {
    const license = $(`dialog${id}`);

    // Show the license dialog.
    showDialog(license, [ [ "ok", 0 ]]);

    // Return false to prevent further event propagation.
    return(false);
  }

  // Register the click handler for the license.
  dialog.find("#btn_license").off("click");
  dialog.find("#btn_license").on("click", () => showLicense("#license"));

  // Register the click handler for the JQuery license.
  dialog.find("#btn_jquery").off("click");
  dialog.find("#btn_jquery").on("click", () => showLicense("#jquery"));

  // Register the click handler for the Font Awesome license.
  dialog.find("#btn_fontawesome").off("click");
  dialog.find("#btn_fontawesome").on("click",
                                     () => showLicense("#fontawesome"));

  // Show the about dialog.
  showDialog(dialog, [ [ "ok", 0 ]]);
}

// Shows installation instructions for iOS.
function
showIOS()
{
  const dialog = $("dialog#ios_install");

  // Show the dialog.
  showDialog(dialog, [ [ "ok", 0 ]]);
}

// Shows installation instructions for Android.
function
showAndroid()
{
  const dialog = $("dialog#android_install");

  // Show the dialog.
  showDialog(dialog, [ [ "ok", 0 ]]);
}

// Shows a confirmation dialog, allowing the the user to respond with yes or
// no.
async function
showConfirm(message, yes = undefined, no = undefined, yesText = "Yes",
            noText = "No")
{
  const dialog = $("dialog#confirm");

  // Insert the provided message into the dialog.
  dialog.find("#message").html(message);

  // Set the text for the yes button.
  dialog.find("#yes").html(yesText);

  // Set the text for the no button.
  dialog.find("#no").html(noText);

  // Show the dialog and wait for its result.
  let result = await showDialog(dialog, [ [ "yes", 0 ], [ "no", 1 ]]);

  // If yes was selected and there is a function to call for it, call it now.
  if((result === 0) && (yes !== undefined))
  {
    yes();
  }

  // If no was selected and there is a function to call for it, call it now.
  if((result === 1) && (no !== undefined))
  {
    no();
  }
}

// Shows an alert dialog.
async function
showAlert(message)
{
  const dialog = $("dialog#alert");

  // Insert the provided message into the dialog.
  dialog.find("#message").html(message);

  // Show the dialog.
  await showDialog(dialog, [ [ "ok", 0 ] ]);
}

// Gets saved match details from the user.
async function
getDetails(accept = undefined)
{
  const dialog = $("dialog#details");

  // Reset the input field.
  dialog.find("input").val("");

  // Show the dialog and wait for its result.
  let result = await showDialog(dialog, [ [ "save", 1 ], [ "cancel", 0 ]]);

  // If the dialog was confirmed, and there is an accept callback function,
  // call it now.
  if((result === 1) && (accept !== undefined))
  {
    accept(dialog.find("input").val());
  }
}

// Shows the previous panel; this may be the saved score panel or the main
// panel, depending on how the user has navigated through the app.
function
showPrevious()
{
  const main = $(".main");
  const saved = $(".saved");
  const scorer = $(".scorer");

  // Ignore this if there is a panel animation active.
  if(panelAnimation)
  {
    return;
  }

  // See if the saved score panel is covered (meaning the scorer panel is being
  // used to show a saved score).
  if(saved.hasClass("cover"))
  {
    // Uncover the saved score panel.
    saved.show();
    saved.removeClass("cover").addClass("uncover").addClass("visible");

    // Hide the scorer panel.
    scorer.removeClass("visible").addClass("hide");
    scorer.on("animationend", hideScorer);

    // Reset the state of the saved score.
    $(".mission_sel button").removeClass("selected");

    // Compute the new score.
    computeScore();
  }

  // Otherwise, see if the saved score panel is being shown.
  else if(saved.hasClass("visible"))
  {
    // Uncover the main panel.
    main.show();
    main.removeClass("cover").addClass("uncover");

    // Hide the saved score panel.
    saved.removeClass("visible").addClass("hide");
    saved.on("animationend", hideSaved);
  }

  // Otherwise, the scorer panel is being shown.
  else
  {
    // Uncover the main panel.
    main.show();
    main.removeClass("cover").addClass("uncover");

    // Hide the scorer panel.
    scorer.removeClass("visible").addClass("hide");
    scorer.on("animationend", hideScorer);
  }

  // A panel animation is active.
  panelAnimation = true;
}

// Updates the list of saved scores in the saved score panel.
function
updateSaved()
{
  const saved = $(".saved");
  let year;

  // Remove all the previous saved matches in the panel.
  saved.find(".matches").empty();

  // Find all the saved matches in local storage.
  let keys = [];
  for(let idx = 0; idx < storage.length; idx++)
  {
    // Get this key.
    let key = storage.key(idx);

    // Ignore this key/value pair if it is not prefixed with "saved_".
    if(key.substring(0, 6) !== "saved_")
    {
      continue;
    }

    // Add this key to the list of keys.
    keys.push(key);
  }

  // See if there are any saved matches
  if(keys.length === 0)
  {
    // Indicate that there are no saved matches.
    saved.find(".matches").
      append(`<div class="tile_empty"><span>None</span></div>`);
  }
  else
  {
    // Sort the saved matches in descending order.
    keys.sort().reverse();

    // Loop through the saved matches.
    for(let idx = 0; idx < keys.length; idx++)
    {
      // Get the data for this saved match.
      let data = JSON.parse(storage.getItem(keys[idx]));

      // Loop through the available scoresheets, looking for this one.
      for(year = 0; year < years.length; year++)
      {
        if(years[year].year == data.year)
        {
          break;
        }
      }

      // Ignore this saved match if the scoresheet doesn't exist (shouldn't
      // happen).
      if(year == years.length)
      {
        continue;
      }

      // Convert the key, which is the time, into a date string in the current
      // locale.
      let date = new Date(parseInt(keys[idx].substring(6))).toLocaleString();

      // Construct the HTML for a tile to represent this saved match.
      let html = `<button class="tile" data-key="${keys[idx]}" ` +
                 `data-score="${data.score}" data-comment="${data.comment}" ` +
                 `aria-label="${years[year].name}, ${data.comment}, ` +
                 `score ${data.score}">` +
                 `  <div class="logo">` +
                 `    <img src="${years[year].logo}" alt="FLL game logo" />` +
                 `  </div>` +
                 `  <span class="title">` +
                 `    <span>${data.comment}</span>` +
                 `    <span>${date}</span>` +
                 `    <span>Score: ${data.score}</span>` +
                 `  </span>` +
                 `  <span class="arrow fa fa-chevron-right"></span>` +
                 `</button>`;

      // Insert this tile into the list of saved matches.
      saved.find(".matches").append(html);
    }

    // Add the click handlers for the saved scores.
    $(".saved .container .matches .tile").on("click", selectSaved);
  }
}

// Show the saved score panel.
function
showSaved()
{
  const main = $(".main");
  const saved = $(".saved");

  // Update the list of saved scores.
  updateSaved();

  // Cover the main panel.
  main.addClass("cover");
  main.on("animationend", hideMain);

  // Show the saved score panel.
  saved.show();
  saved.addClass("show").addClass("visible");
}

// Show the scorer panel.
function
showScorer()
{
  const main = $(".main");
  const saved = $(".saved");
  const scorer = $(".scorer");

  // See if the scorer panel is readonly.
  if(readonly)
  {
    // Disable/hide the reset and save buttons, and show the delete button.
    $(".scorer .header #reset").css("visibility", "hidden");
    $(".scorer .footer #save").hide();
    $(".scorer .footer #delete").show();

    // Show the details at the top of the scoresheet.
    $(".scorer .container .missions .details").show();
  }
  else
  {
    // Enable/show the reset and save buttons, and hide the delete button.
    $(".scorer .header #reset").css("visibility", "visible");
    $(".scorer .footer #save").show();
    $(".scorer .footer #delete").hide();

    // Hide the details at the top of the scoresheet.
    $(".scorer .container .missions .details").hide();
  }

  // See if the saved score panel is being shown.
  if(saved.hasClass("visible"))
  {
    // Cover the saved score panel.
    saved.removeClass("visible").addClass("cover");
    saved.on("animationend", hideSaved);
  }
  else
  {
    // Cover the main panel.
    main.addClass("cover");
    main.on("animationend", hideMain);
  }

  // Show the scorer panel.
  scorer.show();
  scorer.addClass("show").addClass("visible");

  // Scroll to the top of the scorer panel.
  scorer.find(".container .missions").scrollTop(0);
}

// Evaluates an expression from a scoresheet.
function
evaluate(statement, variables)
{
  // Add a space before and after the statement.
  let stmt = ` ${statement} `;

  // A poor-man's tokenization of the statement; replace all "punctuation" with
  // a space on either side of it.
  stmt = stmt.replace(/\(/g, " ( ");
  stmt = stmt.replace(/\)/g, " ) ");
  stmt = stmt.replace(/\+/g, " + ");
  stmt = stmt.replace(/-/g, " - ");
  stmt = stmt.replace(/\*/g, " * ");
  stmt = stmt.replace(/\//g, " / ");
  stmt = stmt.replace(/,/g, " , ");

  // Replace mathematical operators with the Javascript equivalents.
  stmt = stmt.replace(/ abs /g, " Math.abs ");
  stmt = stmt.replace(/ ceil /g, " Math.ceil ");
  stmt = stmt.replace(/ max /g, " Math.max ");
  stmt = stmt.replace(/ min /g, " Math.min ");

  // Loop through all the variables.
  for(const key in variables)
  {
    // Get the value for this variable.
    const value = variables[key];

    // Replace all instances of this variable within the statement with its
    // value.
    stmt = stmt.replace(new RegExp(` ${key} `, "g"), ` ${value} `);
  }

  // Evaluate the statement.
  let result = eval(stmt);

  // If there was something invalid in the statement (a math operator that
  // wasn't handled above, a variable that wasn't replaced because it either
  // doesn't exist or hasn't been set yet, and so on), the result will be Not a
  // Number.  In this case, change the result to zero.
  if(isNaN(result))
  {
    result = 0;
  }

  // Return the result, truncating it to an integer if it isn't already one.
  return(parseInt(result));
}

// Compute the score based on the scoresheet selections.
function
computeScore()
{
  let value, count, mission_score, pieces;
  let state = getScoresheet();
  let score = 0;

  // Get the list of game pieces from the scoresheet, if it exists.
  pieces = scoresheet.pieces;
  if(pieces === undefined)
  {
    pieces = [];
  }

  // Reset the count of used game pieces to zero.
  for(let idx = 0; idx < pieces.length; idx++)
  {
    pieces[idx].count = 0;
  }

  // Loop over the missions in this scoresheet.
  for(let idx = 0; idx < scoresheet.missions.length; idx++)
  {
    // Get this mission from the scoresheet.
    let mission = scoresheet.missions[idx];

    // Skip the Core Values/Gracious Professionalism "missions".
    if((mission.mission === "GP") || (mission.mission === "CV"))
    {
      continue;
    }

    // Clear and hide the error message for this mission.
    $(`#${mission.mission} .error`).hide();
    $(`#${mission.mission} .error .mission_error`).html("");

    // Loop through the items in this mission.
    value = 0;
    count = 1;
    mission_score = 0;
    for(let item = 0; item < mission.items.length; item++)
    {
      // Get the selector for this mission item.
      let sel = `${mission.mission}_${item + 1}`;

      // Add this selection to the combined value for the mission (used for
      // mission-wide scoring for more compilcated missions).
      if(state[sel] !== undefined)
      {
        value += state[sel] * count;
      }

      // Multiple the count by the number of choices for this mission item.
      if(mission.items[item].type === "yesno")
      {
        count *= 2;
      }
      else
      {
        count *= mission.items[item].choices["en_US"].length;
      }

      // See if this mission item uses tracked game pieces, and a selection has
      // been made.
      if((mission.items[item].pieces !== undefined) &&
         (state[sel] !== undefined))
      {
        // Loop through all the game pieces.
        for(let gamePiece = 0; gamePiece < pieces.length; gamePiece++)
        {
          // Loop through all the item's game pieces.
          for(let itemPiece = 0; itemPiece < mission.items[item].pieces.length;
              itemPiece++)
          {
            // See if this game piece matches the item's game piece, and there
            // have not already been too many of this game piece used.
            if((pieces[gamePiece].name ===
                mission.items[item].pieces[itemPiece].name) &&
               (pieces[gamePiece].count <= pieces[gamePiece].quantity))
            {
              // Increment the count of this game piece used.
              pieces[gamePiece].count +=
                mission.items[item].pieces[itemPiece].quantity[state[sel]];

              // See if there are now too many of this game piece in use.
              if(pieces[gamePiece].count > pieces[gamePiece].quantity)
              {
                // Add this error to the corresponding mission.
                $(`#${pieces[gamePiece].mission} .mission_error`).
                  append("There are too many " +
                         pieces[gamePiece].description["en_US"] + " in use.<br>");
                $(`#${pieces[gamePiece].mission} .error`).show();
              }
            }
          }
        }
      }

      // If there is not an item-specific score, or a selection has not been
      // made, there is nothing further to do with this item.
      if((mission.items[item].score === undefined)||
         (state[sel] === undefined))
      {
        continue;
      }

      // Increment the mission score and the overall score by the item-specific
      // score.
      mission_score += mission.items[item].score[state[sel]];
      score += mission.items[item].score[state[sel]];
    }

    // See if there is a mission-wide score.
    if(mission.score !== undefined)
    {
      // Increment the mission score and the overall score by the mission-wide
      // score.
      mission_score += mission.score[value];
      score += mission.score[value];
    }

    // See if this mission has constraints.
    if(mission.constraints !== undefined)
    {
      // Loop through the constraints for this mission.
      for(let item = 0; item < mission.constraints.length; item++)
      {
        // Evaluate this constraint.
        if(evaluate(mission.constraints[item].rule, state) < 0)
        {
          // The constraint failed, so show the error and add the text for this
          // constraint.
          $(`#${mission.mission} .error`).show();
          $(`#${mission.mission} .error .mission_error`).
            append(`${mission.constraints[item].description["en_US"]}<br>`);
        }
      }
    }

    // Save the mission score to the scoresheet state.
    state[`${mission.mission}`] = mission_score;
  }

  // Loop over the missions in this scoresheet.
  for(let idx = 0; idx < scoresheet.missions.length; idx++)
  {
    // Get this mission from the scoresheet.
    let mission = scoresheet.missions[idx];

    // Skip the Core Values/Gracious Professionalism "missions", as well as
    // missions that do not have a game-wide scoring rule.
    if((mission.mission === "GP") || (mission.mission === "CV") ||
       (mission.score_rule === undefined))
    {
      continue;
    }

    // Evaluate the game-wide scoring rule and add the result to the score.
    score += evaluate(mission.score_rule, state);
  }

  // Do not allow the score to be negative (applies to older games).
  if(score < 0)
  {
    score = 0;
  }

  // Update the scorer panel with the computed score.
  $(".scorer .container .footer .score").html(score);
}

// Toggles the state of a scoresheet item/button.
function
itemToggle(mission_sel, button)
{
  let select = true;

  // Do nothing if the scoresheet is read-only.
  if(readonly)
  {
    return;
  }

  // See if the button is currently selected.
  if($(button).hasClass("selected"))
  {
    select = false;
  }

  // Un-select all buttons for this mission selection.
  $(mission_sel + " button").removeClass("selected");

  // Select this button if it was not selected before.
  if(select)
  {
    $(button).addClass("selected");
  }

  // Compute the new score.
  computeScore();
}

// Loads a scoresheet.
async function
loadScoresheet(year, name)
{
  // There is nothing to be done if the scoresheet is already loaded.
  if(year === currentYear)
  {
    return;
  }

  // Called when the scoresheet data is loaded from the server.
  function
  loaded(data)
  {
    // Save the scoresheet for future use.
    currentYear = year;
    scoresheet = data;

    // Construct the HTML for the scoresheet starting with an empty string.
    let html = "";

    // Add an information box for saved scores (hiden by default).
    html += `<div class="details">` +
            `  <div>` +
            `  </div>` +
            `</div>`;

    // Get the locale from the response.
    let locale = data["locale"];

    // Get the missions from the scoresheet.
    let missions = data["missions"];

    // Loop through the missions.
    for(let i = 0; i < missions.length; i++)
    {
      // Get the JSON object for this mission, and the mission ID from that.
      let mission = missions[i];
      let mission_id = mission["mission"];

      // Skip this mission if it is the Core Valuaes/Gracious Professionalism
      // mission.
      if((mission_id === "CV") || (mission_id === "GP"))
      {
        continue;
      }

      // Get the name of the mission.  If it is not available in the current
      // locale, default to en_US.
      let name;
      if(mission["name"].hasOwnProperty(locale))
      {
        name = mission["name"][locale];
      }
      else
      {
        name = mission["name"]["en_US"];
      }

      // See if this mission has a no touch requirement (team equipment can not
      // be touching the mission model).
      let noTouch = mission.hasOwnProperty("no_touch");

      // Add the mission, ID, and name to the HTML.
      html += `<div id="${mission_id}" class="mission">`;
      html += `<div class="mission_id">`;
      html += `<span>${mission_id}</span>`;
      html += `</div>`;
      html += `<div class="mission_name">`;
      html += `<span>${name}</span>`;
      if(noTouch)
      {
        html += `<img class="no_touch" src="no_touch.webp" ` +
                `alt="No touch restriction" />`;
      }
      html += `</div>`;

      // Get the mission items and loop through them.
      let items = mission["items"];
      for(let j = 0; j < items.length; j++)
      {
        // Get the JSON object for this mission item, and the ID for it.
        let item = items[j];
        let item_id = item["id"];

        // Get the description for this mission item.  If the description is
        // not available in the current locale, default back to en_US.
        let description;
        if(item["description"].hasOwnProperty(locale))
        {
          description = item["description"][locale];
        }
        else
        {
          description = item["description"]["en_US"];
        }

        // Add the description of this item to the HTML.
        html += `<hr class="mission_item">`;
        html += `<div class="mission_desc">`;
        html += `<span>${description}</span>`;
        html += `</div>`;
        html += `<div id="${mission_id}_${item_id}" class="mission_sel">`;

        // See if this item has a yes/no selection.
        if(item["type"] === "yesno")
        {
          // Add a yes and no button to the selection HTML.
          html += `<button onclick="itemToggle('#${mission_id}_${item_id}', ` +
                  `this);">No</button>`;
          html += `<button onclick="itemToggle('#${mission_id}_${item_id}', ` +
                  `this);">Yes</button>`;
        }

        // Otherwise, see if this item has an enumeration selection.
        else if(item["type"] === "enum")
        {
          // Get the array of choices.  If they are not available in the current
          // locale, default back to en_US.
          let choices;
          if(item["choices"].hasOwnProperty(locale))
          {
            choices = item["choices"][locale];
          }
          else
          {
            choices = item["choices"]["en_US"];
          }

          // Loop through the item choices.
          for(let k = 0; k < choices.length; k++)
          {
            // Add a button for this choice to the HTML.
            html += `<button onclick="itemToggle('#${mission_id}_` +
                    `${item_id}', this);">${choices[k]}</button>`;
          }
        }

        // Otherwise, the selection type is unknown.
        else
        {
          html += `<button>ERROR!</button>`;
        }

        // End this item.
        html += `</div>`;
      }

      // Add the mission error message contaianer.
      html += `<div class="error">`;
      html += `<hr class="mission_item">`;
      html += `<div class="mission_error">`;
      html += `</div>`;
      html += `</div>`;

      // End this mission.
      html += `</div>`;
    }

    // Replace the score container body with the HTML scoresheet.
    $(".scorer .container .missions").html(html);
  }

  // Load the scoresheet from the server.
  await $.get(`seasons/${year}/scoresheet.json`, loaded);

  // Set the name of the game in the scorer header.
  $(".scorer .container .header .game").html(name).data("year", year);

  // Compute the score of the scoresheet.
  computeScore();
}

// Gets the JSON representation of the current scoresheet selections.
function
getScoresheet()
{
  var result = {};
  var idx;

  // Loop through all of the mission selections.
  for(var mission of $(".mission_sel"))
  {
    // Get all of the buttons for this selection.
    var buttons = $(mission).find("button");

    // Loop through all of the buttons.
    for(idx = 0; idx < buttons.length; idx++)
    {
      // See if this button is selected.
      if($(buttons[idx]).hasClass("selected"))
      {
        // Stop looking.
        break;
      }
    }

    // See if one of the buttons is selected.
    if(idx != buttons.length)
    {
      // Save the button selection into the scoresheet state.
      result[mission.id] = idx;
    }
  }

  // Return the scoresheet state.
  return(result);
}

// Resets the scoresheet selections.
function
resetScoresheet()
{
  function
  confirm()
  {
    // Un-select all buttons for all the mission selections.
    $(".mission_sel button").removeClass("selected");

    // Compute the new score.
    computeScore();
  }

  // Verify that the scoresheet should be reset.
  showConfirm("Are you sure you want to reset the scoresheet?", confirm)
}

// Saves the scoresheet.
function
saveScoresheet(e)
{
  // Called with the entered text when the user clicks OK.
  function
  save(text)
  {
    var result = getScoresheet();
    var date = new Date();

    // Add the text, year, and score to the JSON scoresheet.
    result.comment = text;
    result.year = $(".scorer .container .header .game").data("year");
    result.score = $(".scorer .container .footer .score").html();

    // Convert the scoresheet state into a JSON string and save it into local
    // storage.
    storage.setItem(`saved_${date.getTime()}`, JSON.stringify(result));

    // Show that the scoresheet has bden saved.
    showAlert("Scoresheet saved!");
  }

  // Get the match details from the user.
  getDetails(save);
}

// Called when a season is selected from the main panel.
async function
selectYear(e)
{
  let year = $(e.currentTarget).data("year");
  let name = $(e.currentTarget).data("name");

  // Load the scoresheet for this year.
  await loadScoresheet(year, name);

  // Show the scorer panel in modify mode.
  readonly = false;
  showScorer();
}

// Loads a saved scoresheet.
async function
selectSaved(e)
{
  const target = $(e.currentTarget);
  const state = JSON.parse(storage.getItem(target.data("key")));
  let year;

  // Loop through the available scoresheets, looking for this one.
  for(year = 0; year < years.length; year++)
  {
    if(state.year == years[year].year)
    {
      break;
    }
  }

  // Ignore this saved match if the scoresheet doesn't exist (shouldn't
  // happen).
  if(year == years.length)
  {
    return;
  }

  // Load the scoresheet for this year.
  await loadScoresheet(state.year, years[year].name);

  // Insert the saved match information into the scoresheet details.
  const details = $(".scorer .container .missions .details");
  let date =
    new Date(parseInt(target.data("key").substring(6))).toLocaleString();
  let html = `<span class="title">${state.comment}</span>` +
             `<span>${date}</span>`;
  details.find("div").html(html);

  // Copy the match details to the scoresheet.
  details.data("key", target.data("key"));
  details.data("score", state.score);
  details.data("comment", state.comment);

  // Un-select all buttons for all the mission selections.
  $(".mission_sel button").removeClass("selected");

  // Loop through all the keys in the saved scoresheet.
  let keys = Object.keys(state);
  for(let idx = 0; idx < keys.length; idx++)
  {
    // Get the DOM element that corresponds to this item.
    let select = $(`div#${keys[idx]}.mission_sel`);

    // Ignore this key if there is not a corresponding DOM element (as is the
    // case for the meta-data that is added to the saved scoresheets).
    if(select.length == 0)
    {
      continue;
    }

    // Select the corresponding button from this mission select.
    select.find("button").eq(state[keys[idx]]).addClass("selected");
  }

  // Re-compute the saved score.
  computeScore();

  // Show the scorer panel in read-only mode.
  readonly = true;
  showScorer();
}

// Deletes a saved scoresheet.
function
deleteSaved(e)
{
  const details = $(".scorer .container .missions .details");

  // Called when the delete has been confirmed by the user.
  function
  confirm()
  {
    // Remove this entry from the storage.
    storage.removeItem(details.data("key"));

    // Update and show the list of saved scores.
    updateSaved();
    showPrevious();
  }

  // Convert the save time from milliseconds to a locale-specific strign.
  const date = new Date(parseInt(details.data("key").substring(6))).
                     toLocaleString();

  // Show a confirmation dialog to ensure that the user wants to delete this
  // saved scoresheet.
  showConfirm(`${details.data("comment")}` +
              `<br>` +
              `${date}` +
              `<br>` +
              `Score: ${details.data("score")}` +
              `<br>` +
              `<br>` +
              `Are you sure you want to delete this scoresheet?`, confirm);

  // Return false to prevent further event propagation.
  return(false);
}

// Uploads saved scores from the client device.
function
upload()
{
  const input = $(".saved .container .header #file");
  let json;

  // Called when the contents of the file should be loaded into local storage.
  function
  load()
  {
    // Loop through the keys in the file.
    for(const key in json)
    {
      // SKip this entry if it is not a saved score.
      if(key.substring(0, 6) !== "saved_")
      {
        continue;
      }

      // Store the JSON value into local storage.
      storage.setItem(key, json[key]);
    }

    // Update the list of saved scores.
    updateSaved();
  }

  // Called when the current saved scores should be replaced/deleted.
  function
  replace()
  {
    // Loop through the items in local storage.
    for(let idx = 0; idx < storage.length; idx++)
    {
      // Get the key for this item.
      const key = storage.key(idx);

      // Skip this item if is not a saved score.
      if(key.substring(0, 6) !== "saved_")
      {
        continue;
      }

      // Remove this item from local storage.
      storage.removeItem(key);

      // Decrement the index so that new item in this index will be checked.
      idx--;
    }

    // Load the contents of the file.
    load();
  }

  // Called when the file contents have been read.
  function
  loaded(text)
  {
    // Parse the file as a JSON.
    try
    {
      json = JSON.parse(text);
    }
    catch
    {
      // Indicate that the file is invalid.
      showAlert("Invalid file!");

      // There is nothing further to do.
      return;
    }

    // Determine if the current saved scores should be kept/augmented or
    // deleted.
    showConfirm("Add to the current saved scores, or replace them?", load,
                replace, "Add", "Replace");
  }

  // Called when a file is selected for uploading.
  function
  selected()
  {
    // Get the information about the file.
    let file = input[0].files[0];

    // Create a file reader to read the contents of the file.
    let fr = new FileReader();

    // Set the function to call when the file contents have been read.
    fr.onload = function ()
    {
      loaded(fr.result);
    };

    // Read the file as text.
    fr.readAsText(file);
  }

  // Disable the change handler for the file select, if it exists.
  input.off("change");

  // Reset the value of the file select.
  input.val("");

  // Set the change handler for the file select.
  input.on("change", selected);

  // Click on the file select, triggering the file selector dialog.
  input.trigger("click");
}

// Downloads the saved scores to the client device.
function
download()
{
  let matches = {};

  // Loop through all the items in local storage.
  for(let idx = 0; idx < storage.length; idx++)
  {
    // Get the key for this item.
    const key = storage.key(idx);

    // Skip this item if it is not a saved score.
    if(key.substring(0, 6) !== "saved_")
    {
      continue;
    }

    // Add this saved score to the set of saved scores.
    matches[key] = storage.getItem(key);
  }

  // Convert the saved scores object into a JSON string.
  matches = JSON.stringify(matches);

  // Trigger a download of the resulting JSON string.
  Object.assign(document.createElement("a"),
                {
                  href: `data:text/json;base64,${window.btoa(matches)}`,
                  download: "scores.json"
                }).click();
}

// Called when the load of the DOM has completed.
async function
loaded()
{
  // Determine if the app is installed, and the platform it is running on.
  const ua = navigator.userAgent;
  const isIOS = ua.match(/iPhone|iPad|iPod/);
  const isAndroid = ua.match(/Android/);
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const isInstalled = !!(standalone || (isIOS && !ua.match(/Safari/)));

  // If the app is not installed, and this is a platform on which it makes
  // sense to install it (mobile), enable the button to provide the relevant
  // instructions.
  if(!isInstalled)
  {
    const buttons = $(".main .container .header .buttons");

    if(isIOS)
    {
      buttons.find(".empty2").hide();
      buttons.find("#ios_install").css("display", "flex");
    }
    else if(isAndroid)
    {
      buttons.find(".empty2").hide();
      buttons.find("#android_install").css("display", "flex");
    }
  }

  // Set the orientation lock to portrait. On some platforms (such as desktop),
  // orientation lock is not available, and will throw an exception. The catch
  // is to keep the browser's console quiet about it...it is a "don't care"
  // kind of error (it is prefered to have an orientation lock, but not a
  // requirement).
  if(screen.orientation.lock !== undefined)
  {
    screen.orientation.lock("portrait").catch(() => { });
  }

  // Called when the information for a given year is loaded.
  function
  yearLoad(data)
  {
    let season = data["year"];
    let year = season.substring(5);
    let logo = `seasons/${year}/${data["logo"]}`;
    let name = data["name"]["en_US"];

    // Construct the HTML for the tile that represents this year.
    let html = `<button class="tile" data-year="${year}" ` +
               `data-name="${name}" aria-label="${name}">` +
               `  <div class="logo">` +
               `    <img src="${logo}" alt="FLL game logo" />` +
               `  </div>` +
               `  <span class="title">${season} ${name}</span>` +
               `  <span class="arrow fa fa-chevron-right"></span>` +
               `</button>`;

    // Append the tile for this year to the main panel.
    $(".main .content").append(html);

    // Save the information about this year.
    years.push({ year, season, name, logo });
  }

  // Loop through the years, in reverse order (so the latest years appear first
  // in the list). Start with the year after this year; either it won't exist
  // (and will be silently ignored) or it will (in the case of being in year X
  // for a season that spans year X to X + 1, with the year being signified in
  // the scoresheets by X + 1).
  for(let year = new Date().getFullYear() + 1; year >= 2015; year--)
  {
    // Load the information about this year.
    await $.getJSON(`seasons/${year}/info.json`).
            done(yearLoad).catch(() => { });
  }

  // Add click handlers to the main panel.
  $(".main .header #about").on("click", showAbout);
  $(".main .header #ios_install").on("click", showIOS);
  $(".main .header #android_install").on("click", showAndroid);
  $(".main .header #list").on("click", showSaved);
  $(".tile").on("click", selectYear);

  // Add click handlers to the saved scores panel.
  $(".saved .header #back").on("click", showPrevious);
  $(".saved .header #upload").on("click", upload);
  $(".saved .header #download").on("click", download);

  // Add click handlers to the scorer panel.
  $(".scorer .header #back").on("click", showPrevious);
  $(".scorer .header #reset").on("click", resetScoresheet);
  $(".scorer .footer #save").on("click", saveScoresheet);
  $(".scorer .footer #delete").on("click", deleteSaved);

  // Show the main panel (now that it is fully populated).
  $(".main").show();
}

// Call the load function when the entire DOM has been loaded.
$(document).on("DOMContentLoaded", loaded);

// See if the user agent support a service worker.
if("serviceWorker" in navigator)
{
  // Only register a service worker if not being served from localhost (in
  // other words, development).
  if((window.location.hostname !== "localhost") &&
     (window.location.hostname !== "[::1]") &&
     !window.location.hostname.
        match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/))
  {
    // Set a function to call when the window has finished loading.
    $(window).on("load", function()
    {
      // Register the service worker.
      navigator.serviceWorker
        .register("sw.js")
        .then(res => { })
        .catch(err => console.log("service worker not registered", err));
    })
  }
}