var H5P = H5P || {};

// Create object where external code may register and listen for H5P Events
H5P.externalDispatcher = new H5P.EventDispatcher();

if (H5P.isFramed && H5P.externalEmbed !== true) {
  H5P.externalDispatcher.on('*', window.top.H5P.externalDispatcher.trigger);
}

// EventDispatcher extensions

/**
 * Helper function for triggering xAPI added to the EventDispatcher
 *
 * @param {string} verb - the short id of the verb we want to trigger
 * @param {oject} extra - extra properties for the xAPI statement
 */
H5P.EventDispatcher.prototype.triggerXAPI = function(verb, extra) {
  this.trigger(this.createXAPIEventTemplate(verb, extra));
};

/**
 * Helper function to create event templates added to the EventDispatcher
 *
 * Will in the future be used to add representations of the questions to the
 * statements.
 *
 * @param {string} verb - verb id in short form
 * @param {object} extra - Extra values to be added to the statement
 * @returns {Function} - XAPIEvent object
 */
H5P.EventDispatcher.prototype.createXAPIEventTemplate = function(verb, extra) {
  var event = new H5P.XAPIEvent();

  event.setActor();
  event.setVerb(verb);
  if (extra !== undefined) {
    for (var i in extra) {
      event.data.statement[i] = extra[i];
    }
  }
  if (!('object' in event.data.statement)) {
    event.setObject(this);
  }
  if (!('context' in event.data.statement)) {
    event.setContext(this);
  }
  return event;
};

/**
 * Helper function to create xAPI completed events
 *
 * DEPRECATED - USE triggerXAPIScored instead
 *
 * @param {int} score - will be set as the 'raw' value of the score object
 * @param {int} maxScore - will be set as the "max" value of the score object
 */
H5P.EventDispatcher.prototype.triggerXAPICompleted = function(score, maxScore) {
  this.triggerXAPIScored(score, maxScore, 'completed');
};

/**
 * Helper function to create scored xAPI events
 *
 *
 * @param {int} score - will be set as the 'raw' value of the score object
 * @param {int} maxScore - will be set as the "max" value of the score object
 * @param {string} verb - short form of adl verb
 */
H5P.EventDispatcher.prototype.triggerXAPIScored = function(score, maxScore, verb) {
  var event = this.createXAPIEventTemplate(verb);
  event.setScoredResult(score, maxScore);
  this.trigger(event);
};

/**
 * Internal H5P function listening for xAPI completed events and stores scores
 *
 * @param {function} event - xAPI event
 */
H5P.xAPICompletedListener = function(event) {
  if (event.getVerb() === 'completed' && !event.getVerifiedStatementValue(['context', 'contextActivities', 'parent'])) {
    var score = event.getScore();
    var maxScore = event.getMaxScore();
    var contentId = event.getVerifiedStatementValue(['object', 'definition', 'extensions', 'http://h5p.org/x-api/h5p-local-content-id']);
    H5P.setFinished(contentId, score, maxScore);
  }
};