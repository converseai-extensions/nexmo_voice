/**
 * @file conversation.js
 * @author scott@converse.ai
 * @description
 *
 * Generated by the converse-cli tool for use with the Converse AI
 * Plugins SDK. https://developers.converse.ai/
 */

'use strict';

const Status = require('@converseai/plugins-sdk').Status;
const ModuleResponse = require('@converseai/plugins-sdk').Payloads.Module.ModuleResponse;
const MessageMedia = require('@converseai/plugins-sdk').Payloads.Module.MessageMedia;
const RichMedia = require('@converseai/plugins-sdk').Payloads.RichMedia;
const Utils = require('../lib/utils.js');

module.exports = function join_conference(app, body) {

  var registrationData = body.payload.registrationData;
  var channelSetting = body.payload.channelSetting;

  var code = body.payload.moduleParam.code;
  if (!code) {
    var response = new ModuleResponse();
    response.setError({
      httpStatus: 400,
      code: "REQUIRED_PARAMS_UNDEFINED",
      description: "Required parameter 'Conference Code' is undefined."
    });
    app.send(Status.SUCCESS, response);
    return;
  }

  Utils.getPluginLocalData(body.caller, "provider", "conference-" + code, function(ok, conferenceData) {
    if (!ok) {
      // It is not ok if the get failed or if the data is empty
      if (conferenceData) {
        // Not ok with data means there is an error
        var response = new ModuleResponse();
        response.setError({
          httpStatus: 400,
          code: "REQUIRED_PARAMS_UNDEFINED",
          description: "Required parameter 'Conference Code' is undefined."
        });
        app.send(Status.SUCCESS, response);
        return;
      }

      // Not ok with no data, just means that there was nothing to get
      var response = new ModuleResponse();
      response.setExit("invalid");
      app.send(Status.SUCCESS, response);
      return;
    }

    var hasStarted = conferenceData.started;

    var userId = channelSetting.userId;
    var threadId = channelSetting.threadId;
    var conferenceCode = conferenceData.code + "/0";
    if (conferenceData.isModerated) {
      conferenceCode = conferenceData.code + "/" + conferenceData.moderatorCode;
    }

    var conversationNcco = {
      action: "conversation",
      name: conferenceData.name,
      startOnEnter: "true",
      eventUrl: [registrationData.callback_uri + "?action=conference&to=" + userId + "&from=" + threadId + "&conference=" + conferenceCode],
      eventMethod: "POST",
      record: "false",
      endOnExit: "false",
    };

    if (conferenceData.record && ((!conferenceData.isModerated && !hasStarted) || conferenceData.moderator)) {
      conversationNcco.record = "true";

      var format = conferenceData.recordOptions.format;
      if (!format) {
        format = "mp3";
      }
      conversationNcco.format = format;
      conversationNcco.eventUrl[0] += "&intent=" + conferenceData.recordOptions.intent +
        "&entities=" + Buffer.from(JSON.stringify(conferenceData.recordOptions.entities)).toString('base64') +
        "&recording_format=" + format;
    }

    var ncco = [];

    if (conferenceData.isModerated) {
      var moderatorOptions = conferenceData.moderatorOptions;

      if (conferenceData.moderator) {
        conversationNcco.startOnEnter = "true";

        if (moderatorOptions.endOnExit) {
          conversationNcco.endOnExit = "true";
        }
      } else {
        conversationNcco.startOnEnter = "false";

        if (moderatorOptions.music) {
          conversationNcco.musicOnHoldUrl = [moderatorOptions.music];
        }

        if (!hasStarted) {
          var talk = {
            action: "talk",
            text: moderatorOptions.message,
            loop: 1,
          };

          var options = Utils.getOutboundOptions(threadId, registrationData, null);
          if (options.voiceName) {
            talk.voiceName = options.voiceName;
          }

          ncco.push(talk);
        }
      }
    }

    ncco.push(conversationNcco);

    var richMedia = new RichMedia();
    richMedia.setRichMediaType("ncco");
    richMedia.setRichMediaObject({
      ncco: ncco
    });

    var message = new MessageMedia();
    message.setMessageType(MessageMedia.TYPE_COMMENT);
    message.setMessageMedia(richMedia);

    var response = new ModuleResponse();
    response.setMessage(message);
    response.setExit("connected");
    app.send(Status.SUCCESS, response);

    if (!hasStarted) {
      conferenceData.started = true;

      if (conferenceData.isModerated) {
        conferenceData.moderator = true;
        Utils.setPluginLocalData(body.caller, "provider", "conference-" + conferenceData.moderator_code, conferenceData);
        conferenceData.moderator = false;
      }
      Utils.setPluginLocalData(body.caller, "provider", "conference-" + conferenceData.code, conferenceData);
    }

  });
};