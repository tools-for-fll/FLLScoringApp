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

// Shows the about dialog.
function
showAbout()
{
  const dialog = $("dialog#about");
  let showingLicense = false;

  // Called when the dialog hide animation completes.
  function
  closeEnd()
  {
    // Remove the hide class (preparing the dialog for the next time it is
    // displayed).
    dialog.removeClass("hide");

    // Close the modal dialog.
    dialog.close();

    // Remove the end of animation event listener.
    dialog.off("animationend", closeEnd);

    // Remove the keydown event listener.
    $(document).off("keydown", keyDown);
  }

  // Called when the dialog should be closed.
  function
  close()
  {
    // Add an end of animation event listener.
    dialog.on("animationend", closeEnd);

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
      close();
    }
  }

  // Called when a key is pressed.
  function
  keyDown(e)
  {
    // Close the dialog if the escape key is pressed.
    if((e.key == "Escape") && !showingLicense)
    {
      // Start the animated close of the dialog.
      close();

      // Prevent any further handling of this keystroke.
      e.preventDefault();
    }
  }

  // Shows a license dialog.
  function
  showLicense(id)
  {
    const license = $(`dialog${id}`);

    // Called when the dialog hide animation completes.
    function
    closeLicenseEnd()
    {
      // Remove the hide class (preparing the dialog for the next time it is
      // displayed).
      license.removeClass("hide");

      // Close the modal dialog.
      license.close();

      // Remove the end of animation event listener.
      license.off("animationend", closeLicenseEnd);

      // Remove the keydown event listener.
      $(document).off("keydown", keyDownLicense);

      // A license is no longer being shown.
      showingLicense = false;
    }

    // Called when the dialog should be closed.
    function
    closeLicense()
    {
      // Add an end of animation event listener.
      license.on("animationend", closeLicenseEnd);

      // Add the hide class to the dialog, starting the close animation.
      license.addClass("hide");

      // Return false to prevent further event propagation.
      return(false);
    }

    // Called when there is a click (mouse or touch).
    function
    clickLicense(e)
    {
      const rect = e.target.getBoundingClientRect();

      // See if the click is outside the dialog box.
      if((rect.left > e.clientX) || (rect.right < e.clientX) ||
         (rect.top > e.clientY) || (rect.bottom < e.clientY))
      {
        // Close the license dialog.
        closeLicense();
      }
    }

    // Called when a key is pressed.
    function
    keyDownLicense(e)
    {
      // Close the dialog if the escape key is pressed.
      if(e.key == "Escape")
      {
        // Start the animated close of the dialog.
        closeLicense();

        // Prevent any further handling of this keystroke.
        e.preventDefault();
      }
    }

    // Register the click handler for the button.
    license.find("button").off("click");
    license.find("button").on("click", closeLicense);

    // Register the click handler for the backdrop.
    license.off("click");
    license.on("click", clickLicense);

    // Add a keydown listener to the document to override the default Escape
    // key handling for a modal dialog (which simply closes it, instead of
    // animating the close like needed here).
    $(document).on("keydown", keyDownLicense);

    // Show the license dialog.
    license.showModal();

    // Scroll to the top of the license.
    license.scrollTop(0);

    // A license is being shown.
    showingLicense = true;

    // Return false to prevent further event propagation.
    return(false);
  }

  // Register the click handler for the close button.
  dialog.find("button").off("click");
  dialog.find("button").on("click", close);

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

  // Register the click handler for the backdrop.
  dialog.off("click");
  dialog.on("click", click);

  // Add a keydown listener to the document to override the default Escape key
  // handling for a modal dialog (which simply closes it, instead of animating
  // the close like needed here).
  $(document).on("keydown", keyDown);

  // Show the about dialog.
  dialog.showModal();
}

// Shows a confirmation dialog, allowing the the user to respond with yes or
// no.
function
showConfirm(message, yes = undefined, no = undefined)
{
  const dialog = $("dialog#confirm");

  // Called when the dialog hide animation completes.
  function
  closeEnd()
  {
    // Remove the hide class (preparing the dialog for the next time it is
    // displayed).
    dialog.removeClass("hide");

    // Close the modal dialog.
    dialog.close();

    // Remove the end of animation event listener.
    dialog.off("animationend", closeEnd);

    // Remove the keydown event listener.
    $(document).off("keydown", keyDown);
  }

  // Called when the dialog is closed.
  function
  close(confirmed)
  {
    // If the dialog was confirmed, and there is a yes callback function, call
    // it now.
    if(confirmed && (yes !== undefined))
    {
      yes();
    }

    // If the dialog was not confirmed, and there is a no callback function,
    // call it now.
    if(!confirmed && (no !== undefined))
    {
      no();
    }

    // Add an end of animation event listener.
    dialog.on("animationend", closeEnd);

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
      // Close the dialog without confirming it.
      close(false);
    }
  }

  // Called when a key is pressed.
  function
  keyDown(e)
  {
    // Close the dialog if the escape key is pressed.
    if(e.key == "Escape")
    {
      // Start the animated close of the dialog.
      close();

      // Prevent any further handling of this keystroke.
      e.preventDefault();
    }
  }

  // Insert the provided message into the dialog.
  dialog.find("#message").html(message);

  // Register the click handler for the yes button.
  dialog.find("#yes").off("click");
  dialog.find("#yes").on("click", () => close(true));

  // Register the click handler for the no button.
  dialog.find("#no").off("click");
  dialog.find("#no").on("click", () => close(false));

  // Register the click handler for the backdrop.
  dialog.off("click");
  dialog.on("click", click);

  // Add a keydown listener to the document to override the default Escape key
  // handling for a modal dialog (which simply closes it, instead of animating
  // the close like needed here).
  $(document).on("keydown", keyDown);

  // Show the confirmation dialog.
  dialog.showModal();
}

// Shows a completion dialog, indicating the completion of an action.
function
showComplete(message)
{
  const dialog = $("dialog#complete");

  // Called when the dialog hide animation completes.
  function
  closeEnd()
  {
    // Remove the hide class (preparing the dialog for the next time it is
    // displayed).
    dialog.removeClass("hide");

    // Close the modal dialog.
    dialog.close();

    // Remove the end of animation event listener.
    dialog.off("animationend", closeEnd);

    // Remove the keydown event listener.
    $(document).off("keydown", keyDown);
  }

  // Called when the dialog is closed.
  function
  close()
  {
    // Add an end of animation event listener.
    dialog.on("animationend", closeEnd);

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
      close();
    }
  }

  // Called when a key is pressed.
  function
  keyDown(e)
  {
    // Close the dialog if the escape key is pressed.
    if(e.key == "Escape")
    {
      // Start the animated close of the dialog.
      close();

      // Prevent any further handling of this keystroke.
      e.preventDefault();
    }
  }

  // Insert the provided message into the dialog.
  dialog.find("#message").html(message);

  // Register the click handler for the button.
  dialog.find("button").off("click");
  dialog.find("button").on("click", close);

  // Register the click handler for the backdrop.
  dialog.off("click");
  dialog.on("click", click);

  // Add a keydown listener to the document to override the default Escape key
  // handling for a modal dialog (which simply closes it, instead of animating
  // the close like needed here).
  $(document).on("keydown", keyDown);

  // Show the dialog.
  dialog.showModal();
}

// Gets saved match details from the user.
function
getDetails(accept = undefined)
{
  const dialog = $("dialog#details");

  // Called when the dialog hide animation completes.
  function
  closeEnd()
  {
    // Remove the hide class (preparing the dialog for the next time it is
    // displayed).
    dialog.removeClass("hide");

    // Close the modal dialog.
    dialog.close();

    // Remove the end of animation event listener.
    dialog.off("animationend", closeEnd);

    // Remove the keydown event listener.
    $(document).off("keydown", keyDown);
  }

  // Called when the dialog is closed.
  function
  close(confirmed)
  {
    // If the dialog was confirmed, and there is a yes callback function, call
    // it now.
    if(confirmed && (accept !== undefined))
    {
      accept(dialog.find("input").val());
    }

    // Add an end of animation event listener.
    dialog.on("animationend", closeEnd);

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
      // Close the dialog without confirming it.
      close(false);
    }
  }

  // Called when a key is pressed.
  function
  keyDown(e)
  {
    // Close the dialog if the escape key is pressed.
    if(e.key == "Escape")
    {
      // Start the animated close of the dialog.
      close();

      // Prevent any further handling of this keystroke.
      e.preventDefault();
    }
  }

  // Reset the input field.
  dialog.find("input").val("");

  // Register the click handler for the yes button.
  dialog.find("#save").off("click");
  dialog.find("#save").on("click", () => close(true));

  // Register the click handler for the no button.
  dialog.find("#cancel").off("click");
  dialog.find("#cancel").on("click", () => close(false));

  // Register the click handler for the backdrop.
  dialog.off("click");
  dialog.on("click", click);

  // Add a keydown listener to the document to override the default Escape key
  // handling for a modal dialog (which simply closes it, instead of animating
  // the close like needed here).
  $(document).on("keydown", keyDown);

  // Show the confirmation dialog.
  dialog.showModal();
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

// Show the saved score panel.
function
showSaved()
{
  const main = $(".main");
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
      let html = `<div class="tile" data-key="${keys[idx]}" ` +
                 `     data-score="${data.score}" ` +
                 `     data-comment="${data.comment}">` +
                 `  <div class="logo">` +
                 `    <img src="${years[year].logo}" />` +
                 `  </div>` +
                 `  <span class="title">` +
                 `    <span>${data.comment}</span>` +
                 `    <span>${date}</span>` +
                 `    <span>Score: ${data.score}</span>` +
                 `  </span>` +
                 `  <span class="delete fa fa-trash"></span>` +
                 `  <span class="arrow fa fa-chevron-right"></span>` +
                 `</div>`;

      // Insert this tile into the list of saved matches.
      saved.find(".matches").append(html);
    }

    // Add the click handlers for the saved scores.
    $(".saved .container .matches .tile").on("click", selectSaved);
    $(".saved .container .matches .tile .delete").on("click", deleteSaved);
  }

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
    // Disable/hide the reset and save buttons.
    $(".scorer .container .header .reset").css("visibility", "hidden");
    $(".scorer .container .footer .save").css("visibility", "hidden");

    // Show the details at the top of the scoresheet.
    $(".scorer .container .missions .details").show();
  }
  else
  {
    // Enable/show the reset and save buttons.
    $(".scorer .container .header .reset").css("visibility", "visible");
    $(".scorer .container .footer .save").css("visibility", "visible");

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
    stmt = stmt.replace(new RegExp(` ${key} `, "i"), ` ${value} `);
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
  let state = getScoresheet();
  let score = 0;
  let value, count, mission_score;

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
            append(mission.constraints[item].description["en_US"]);
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
        html += `<img class="no_touch" src="no_touch.png"></img>`;
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

    // Show that the scoresheet has ben saved.
    showComplete("Scoresheet saved!");
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
  let target = $(e.currentTarget);
  let state = JSON.parse(storage.getItem(target.data("key")));
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
  let date =
    new Date(parseInt(target.data("key").substring(6))).toLocaleString();
  let html = `<span class="title">${state.comment}</span>` +
             `<span>${date}</span>`;
  $(".scorer .container .missions .details div").html(html);

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
  let target = $(e.target);

  // The click may have originated on a child of the tile, so navigate up the
  // DOM until the tile is found.
  while(!target.hasClass("tile"))
  {
    target = target.parent();
  }

  // Called when the delete has been confirmed by the user.
  function
  confirm()
  {
    // Remove this entry from the storage.
    storage.removeItem(target.data("key"));

    // Remove this tile from the DOM.
    target.remove();
  }

  // Convert the save time from milliseconds to a locale-specific strign.
  const date = new Date(parseInt(target.data("key").substring(6))).
                     toLocaleString();

  // Show a confirmation dialog to ensure that the user wants to delete this
  // saved scoresheet.
  showConfirm(`${target.data("comment")}` +
              `<br>` +
              `${date}` +
              `<br>` +
              `Score: ${target.data("score")}` +
              `<br>` +
              `<br>` +
              `Are you sure you want to delete this scoresheet?`, confirm);

  // Return false to prevent further event propagation.
  return(false);
}

// Called when the load of the DOM has completed.
async function
loaded()
{
  // Set the orientation lock to portrait. On some platforms (such as desktop),
  // orientation lock is not available, and will throw an exception. The catch
  // is to keep the browser's console quiet about it...it is a "don't care"
  // kind of error (it is prefered to have an orientation lock, but not a
  // requirement).
  //screen.orientation.lock("portrait").catch(() => { });

  // Called when the information for a given year is loaded.
  function
  yearLoad(data)
  {
    let season = data["year"];
    let year = season.substring(5);
    let logo = `seasons/${year}/${data["logo"]}`;
    let name = data["name"]["en_US"];

    // Construct the HTML for the tile that represents this year.
    let html = `<div class="tile" data-year="${year}" data-name="${name}">` +
               `  <div class="logo">` +
               `    <img src="${logo}" />` +
               `  </div>` +
               `  <span class="title">${season} ${name}</span>` +
               `  <span class="arrow fa fa-chevron-right"></span>` +
               `</div>`;

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
    await $.getJSON(`seasons/${year}/info.json`).done(yearLoad).catch(() => { });
  }

  // Add click handlers to the main panel.
  $(".main .container .header .about").on("click", showAbout);
  $(".main .container .header .list").on("click", showSaved);
  $(".tile").on("click", selectYear);

  // Add click handlers to the saved scores panel.
  $(".saved .container .header .back").on("click", showPrevious);

  // Add click handlers to the scorer panel.
  $(".scorer .container .header .back").on("click", showPrevious);
  $(".scorer .container .header .reset").on("click", resetScoresheet);
  $(".scorer .container .footer .save").on("click", saveScoresheet);

  // Show the main panel (now that it is fully populated).
  $(".main").show();
}

// Call the load function when the entire DOM has been loaded.
$(document).on("DOMContentLoaded", loaded);

// See if the user agent support a service worker.
if("serviceWorker" in navigator)
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