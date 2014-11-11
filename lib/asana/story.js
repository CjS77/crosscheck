'use strict';

/**
 * Module to interact with Asana service.
 * @module asana.story
 */

 
var conf = require("../conf"),
  item = require("../item"),
  comment = require("../comment"),
  parser = require("../parser"),
  _ = require("lodash"),
  request = require("superagent"),
  P = require("bluebird"),
  apiUrl = "https://app.asana.com/api/1.0/",
  user = "ANONYMOUS",
  psw = ""; // always empty

require("superagent-bluebird-promise");
require("string.prototype.endswith");

if (conf.get("asana.apiKey")) {
  user = conf.get("asana.apiKey");
}



/**
 * Create a Comment from an Asana task story.
 * @param {asana:Story} story - Story as returned by Asana API.
 * @returns {comment:Comment}
 *
 * @private
 * @static
 */
function toComment (story) {
  var com = comment.create({
    "lastUpdated" : Date.parse(story["created_at"])
  });
  
  com.body = parser.extractFields(story.text, com.fields);
  
  return com;
}


/**
 * Create a Asana task story from a Comment
 * @param {comment:Comment} comment
 * @returns {asana:Comment} story - Story ready to be send to Asana service.
 *
 * @private
 * @static
 */
function fromComment (comment) {
  var story = {
      data : {
        text : comment.body
      }
    }, 
    fieldsAsString = parser.serializeFields(comment.fields);
  
  // Append fields to text
  if (fieldsAsString.length > 0) {
    // Insert 2 blank lines if needed
    if (!story.data.text.endsWith("\n\n")) {
      story.data.text += story.data.text.endsWith("\n") ? "\n" : "\n\n";
    }
    story.data.text += fieldsAsString;
  }
  
  return story;
}

/**
 * Get the array of asana Stories of a specific task.
 * @param  {number} taskId - Unique ID of task in Asana.
 * @return {Array.<asana:Story>} - Array of Story as returned by Asana API.
 */
function getStories (taskId) {
  return request
    .get(apiUrl + "tasks/" + taskId + "/stories")
    .auth(user, psw)
    .promise()
    .then(function (res) {
      return res.body.data;
    });
}


function getComments (item) {
  if (!item.managerId) {
    throw new Error("item.managerId is required");
  }

  return getStories(item.managerId)
    .filter(function (story) {
      return story["type"] === "comment";
    })
    .map(function (story) {
      return toComment(story);
  });

}



module.exports = {
  getComments : getComments,
  
  // Private methods exposed for testing
  toComment: toComment,
  fromComment : fromComment,
  getStories : getStories
  
};