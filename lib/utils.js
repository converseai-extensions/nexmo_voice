function getOutboundOptions(from, registrationData, localOptions) {

  var voiceName = null;
  var bargeIn = false;
  var loop = 1;
  var timeOut = 3;
  var submitOnHash = false;
  var maxDigits = null;

  var options = registrationData.options;
  if (options) {
    if (options.voice) {
      voiceName = options.voice;
    }
    if (options.bargeIn != null) {
      bargeIn = options.bargeIn;
    }
    if (options.loop) {
      loop = parseInt(options.loop);
      if (isNaN(loop) || loop < 0) {
        loop = 1;
      }
    }
    if (options.timout) {
      timeOut = parseInt(options.timout);
      if (isNaN(timout) || timout <= 0) {
        timeOut = 3;
      }
    }
    if (options.submitOnHash != null) {
      submitOnHash = options.submitOnHash;
    }
    if (options.maxDigits) {
      maxDigits = parseInt(options.maxDigits);
      if (isNaN(maxDigits) || maxDigits <= 0) {
        maxDigits = null;
      }
    }
  }

  if (from) {
    var numbers = registrationData.inbound.numbers;
    if (numbers) {
      for (var i = 0; i < numbers.length; i++) {
        var number = numbers[i];
        if (number.msisdn == from) {
          if (number.voice && number.voice != "") {
            voiceName = number.voice;
          }
          break;
        }
      }
    }
  }

  if (localOptions) {
    if (localOptions.voice) {
      voiceName = localOptions.voice;
    }
    if (localOptions.bargeIn) {
      if (localOptions.bargeIn == "YES") {
        bargeIn = true;
      } else if (localOptions.bargeIn == "NO") {
        bargeIn = false;
      }
    }
    if (localOptions.loop) {
      loop = parseInt(localOptions.loop);
      if (isNaN(loop) || loop < 0) {
        loop = 1;
      }
    }
    if (localOptions.timout) {
      timeOut = parseInt(localOptions.timout);
      if (isNaN(timout) || timout <= 0) {
        timeOut = 3;
      }
    }
    if (localOptions.submitOnHash) {
      if (localOptions.submitOnHash == "YES") {
        submitOnHash = true;
      } else if (localOptions.submitOnHash == "NO") {
        submitOnHash = false;
      }
    }
    if (localOptions.maxDigits) {
      maxDigits = parseInt(localOptions.maxDigits);
      if (isNaN(maxDigits) || maxDigits <= 0) {
        maxDigits = null;
      }
    }
  }

  if (!maxDigits) {
    maxDigits = 20;
  }

  return {
    voiceName: voiceName,
    bargeIn: bargeIn,
    loop: loop,
    timeOut: timeOut,
    submitOnHash: submitOnHash,
    maxDigits: maxDigits,
  };

}

function createApplication(api_key, api_secret, inboundURI, provider, callback) {

  var options = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: 'POST',
    form: {
      api_key: api_key,
      api_secret: api_secret,
      name: "converse_" + provider.workspaceUUID,
      type: "voice",
      answer_url: inboundURI + "?action=inbound",
      answer_method: "GET",
      event_url: inboundURI + "?action=event",
      event_method: "POST",
    },
    url: "https://api.nexmo.com/v1/applications",
  }

  var request = require('request');
  request(options, function(err, res, body) {
    if (err) {
      console.error(err);
      callback(false, null);
    }

    callback(true, JSON.parse(body));
  });

}

function updateApplication(api_key, api_secret, application_id, inboundURI, provider) {

  var options = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: 'PUT',
    qs: {
      api_key: api_key,
      api_secret: api_secret,
      name: "converse_" + provider.workspaceUUID,
      type: "voice",
      answer_url: inboundURI + "?action=inbound",
      answer_method: "GET",
      event_url: inboundURI + "?action=event",
      event_method: "POST",
    },
    url: "https://api.nexmo.com/v1/applications/" + application_id,
  }

  var request = require('request');
  request(options, function(err, res, body) {
    if (err) {
      console.error(err);
    }

    //console.log(body);
  });

  return true;
}

function deleteApplication(api_key, api_secret, application_id) {

  var options = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: 'DELETE',
    qs: {
      api_key: api_key,
      api_secret: api_secret,
    },
    url: "https://api.nexmo.com/v1/applications/" + application_id,
  }

  var request = require('request');
  request(options, function(err, res, body) {
    if (err) {
      console.error(err);
      return false;
    }

    //console.log(body);
    return true;
  });
}

function updateLinkNumbers(api_key, api_secret, application_id, inboundURI, voice_numbers, sms_numbers) {

  var numbers = {};

  if (sms_numbers) {
    for (var i = sms_numbers.length - 1; i >= 0; i--) {

      var number = sms_numbers[i];
      var msisdn = number.msisdn;
      var country = number.country;

      if (!msisdn || !country) {
        // If number is not valid, we remove it
        sms_numbers.splice(i, 1);
        continue;
      }

      numbers[msisdn] = {
        country: country,
        msisdn: msisdn,
        moHttpUrl: inboundURI + "?action=sms",
      };
    }
  }

  if (voice_numbers) {
    for (var i = voice_numbers.length - 1; i >= 0; i--) {

      var number = voice_numbers[i];
      var msisdn = number.msisdn;
      var country = number.country;

      if (!msisdn || !country) {
        // If number is not valid, we remove it
        voice_numbers.splice(i, 1);
        continue;
      }

      var existingNumber = numbers[msisdn];
      if (!existingNumber) {
        existingNumber = {
          country: country,
          msisdn: msisdn,
        }
      }

      existingNumber.voiceCallbackValue = application_id;
      existingNumber.voiceCallbackType = "app";
      existingNumber.voiceStatusCallback = inboundURI + "?action=number";

      numbers[msisdn] = existingNumber;
    }
  }

  if (!numbers || numbers.length == 0) {
    return;
  }

  for (var msisdn in numbers) {

    if (numbers.hasOwnProperty(msisdn)) {

      var number = numbers[msisdn];

      number.api_key = api_key;
      number.api_secret = api_secret;

      var options = {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        method: 'POST',
        form: number,
        url: "https://rest.nexmo.com/number/update",
      }

      var request = require('request');
      request(options, function(err, res, body) {
        if (err) {
          console.error(err);
        }
        if (res.statusCode != 200) {
          console.error(body);
        }

        //console.log(body);
      });
    }
  }
}

function getPluginLocalData(caller, scope, dataKey, callback) {

  if (!scope) {
    scope = "provider";
  }

  var request = require('request');

  var options = {
    headers: {
      "X-CONVERSE-PLUGIN-INVOKER": Buffer.from(JSON.stringify(caller)).toString('base64')
    },
    method: 'GET',
    url: "https://" + caller.provider.providerDomain + "/api/plugins/data/localdata?scope=" + scope + "&key=" + dataKey
  }

  request(options, function(err, res, body) {
    if (err) {
      console.error(err);
      callback(false, err);
    }

    if (body && body != "") {
      var parsed = JSON.parse(body);
      if (parsed && parsed.errorCode) {
        console.error(parsed.errorCode + " : " + parsed.errorMsg);
        callback(false, parsed);
        return;
      }

      callback(true, parsed);
      return;
    }

    callback(false, null);
  });

}

function setPluginLocalData(caller, scope, dataKey, dataBody) {

  if (!scope) {
    scope = "provider";
  }

  var request = require('request');

  var options = {
    headers: {
      "X-CONVERSE-PLUGIN-INVOKER": Buffer.from(JSON.stringify(caller)).toString('base64')
    },
    method: 'POST',
    body: dataBody,
    json: true,
    url: "https://" + caller.provider.providerDomain + "/api/plugins/data/localdata?scope=" + scope + "&key=" + dataKey
  }

  request(options, function(err, res, body) {
    if (err) {
      console.error('Failed setting plugin local data in data service : ' + String(err))
      return;
    }
    //console.log("Updated plugin local data in data service : " + JSON.stringify(body));
  });

}

function getPublicRecordingDetails(body, recordingData, fileFormat, callback) {

  var registrationData = body.payload.registrationData;

  if (!fileFormat) {
    fileFormat = "wav";
  }

  getPluginLocalData(body.caller, "provider", "private_key", function(ok, localData) {
    if (!ok || !localData) {
      callback(false, {
        httpStatus: 400,
        code: "INVALID_AUTH",
        description: "Invalid application private key"
      });
      return;
    }

    var Nexmo = require('nexmo');

    var nexmo = new Nexmo({
      apiKey: registrationData.api_key,
      apiSecret: registrationData.api_secret,
      applicationId: registrationData.application_id,
      privateKey: localData.privateKey,
    });

    var fs = require('fs');
    var tempFilename = "temp" + recordingData.conversation_uuid + "." + fileFormat;

    nexmo.files.save(recordingData.recording_url, tempFilename, function(error, getResponse) {
      if (error) {
        callback(false, {
          httpStatus: 400,
          code: "FAILED",
          description: error.body
        });
        return;
      }

      uploadMediaFromFile(registrationData, recordingData.conversation_uuid + "." + fileFormat, tempFilename, nexmo.generateJwt(), function(ok, data) {

        fs.unlink(tempFilename, function(err) {
          if (err) {
            console.error(err);
          }
        });

        if (!ok) {
          if (data.text) {
            data = data.text;
          }

          callback(false, {
            httpStatus: 400,
            code: "FAILED",
            description: data,
          });
          return;
        }

        data.start_time = Math.round(new Date(recordingData.start_time).getTime() / 1000);
        data.end_time = Math.round(new Date(recordingData.end_time).getTime() / 1000);
        data.length = data.end_time - data.start_time;

        callback(true, data);
      });

      /**
      // Inapropriate for larger files
      nexmo.files.get(recordingData.recording_url, function(error, getResponse) {
        uploadMediaFromData(registrationData, recordingData.conversation_uuid + "." + fileFormat, getResponse, nexmo.generateJwt(), function(ok, data) {
          // callback behaviour
        });
      }
      **/

    });

    /**
    // We would use this instead of downloading the file data if we could use the orginal file without api key and secret
    // As the sourve URL is visible in link/info
      uploadMediaFromUrl(registrationData, recording.conversation_uuid + "." + format, recording.recording_url, nexmo.generateJwt(), function(ok, data) {
        // callback behaviour
      });
    **/
  });

}

function generateUUID() {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
  return uuid;
};

function sendSMS(registrationData, caller, to, from, message, callback) {

  var Nexmo = require('nexmo');

  var nexmo = new Nexmo({
    apiKey: registrationData.api_key,
    apiSecret: registrationData.api_secret,
  });

  var options = {
    type: 'unicode',
  };
  nexmo.message.sendSms(from, to, message, options, (error, result) => {
    if (error) {
      console.error(error);
      callback(false, error);
    } else {
      //console.log(result);
      callback(true, result);
    }
  });
}

function cancelVerifyCode(registrationData, requestId, retries, callback) {

  if (!retries) {
    retries = 0;
  }

  var Nexmo = require('nexmo');

  var nexmo = new Nexmo({
    apiKey: registrationData.api_key,
    apiSecret: registrationData.api_secret,
  });

  var request = {
    request_id: requestId,
    cmd: 'cancel'
  };

  nexmo.verify.control(request, function(error, result) {
    if (callback != null) {
      if (error) {
        callback(false, String(error));
        return;
      }

      switch (result.status) {
        case "0":
          break;
        case "19":
          // 19 can be that it is already max tried or you have been too quick
          if (retries > 0) {
            setTimeout(function() {
              cancelVerifyCode(registrationData, requestId, retries - 1, callback)
            }, 10000);
            return;
          }
          callback(false, result.error_text);
          break;
        default:
          console.error(result);
          callback(false, result.error_text);
          break;
      }

      callback(true, result);
    }
  });
}

module.exports = {
  cancelVerifyCode: cancelVerifyCode,
  sendSMS: sendSMS,
  generateUUID: generateUUID,
  createApplication: createApplication,
  updateApplication: updateApplication,
  deleteApplication: deleteApplication,
  updateLinkNumbers: updateLinkNumbers,
  getOutboundOptions: getOutboundOptions,
  setPluginLocalData: setPluginLocalData,
  getPluginLocalData: getPluginLocalData,
  getPublicRecordingDetails: getPublicRecordingDetails,
}

// Functions that are not exported.
function uploadMediaFromFile(registrationData, filename, source, jwtToken, callback) {

  var urlEndpoint = "https://api.nexmo.com/v3/media?api_key=" + registrationData.api_key + "&api_secret=" + registrationData.api_secret + "";

  var request = require('request');
  var req = request.post(urlEndpoint, function(err, res, body) {
    if (err) {
      callback(false, err);
      return;
    }

    if (body.error_title && body.error_title != "") {
      callback(false, body);
      return;
    }

    if (res.statusCode != 201) {
      callback(false, res.body);
      return;
    }

    var newUrl = res.headers.location;
    // Remove /info from url
    newUrl = newUrl.substring(0, newUrl.length - 5);

    callback(true, {
      filename: filename,
      recording_url: newUrl + "?jwt-token=" + jwtToken
    });
  });
  var form = req.form();

  var fs = require('fs');
  form.append("filedata", fs.createReadStream(source), {
    filename: filename,
  });
}

function uploadMediaFromData(registrationData, filename, fileData, jwtToken, callback) {

  var urlEndpoint = "https://api.nexmo.com/v3/media?api_key=" + registrationData.api_key + "&api_secret=" + registrationData.api_secret + "";

  var request = require('request');
  var req = request.post(urlEndpoint, function(err, res, body) {
    if (err) {
      callback(false, err);
      return;
    }

    if (body.error_title && body.error_title != "") {
      callback(false, body);
      return;
    }

    if (res.statusCode != 201) {
      callback(false, res.body);
      return;
    }

    var newUrl = res.headers.location;
    // Remove /info from url
    newUrl = newUrl.substring(0, newUrl.length - 5);

    callback(true, {
      filename: filename,
      recording_url: newUrl + "?jwt-token=" + jwtToken
    });
  });
  var form = req.form();
  form.append("filedata", fileData, {
    filename: filename,
  });
}

function uploadMediaFromUrl(registrationData, filename, sourceUrl, jwtToken, callback) {

  var options = {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    formData: {
      filename: filename,
      url: sourceUrl,
    },
    method: "POST",
    url: "https://api.nexmo.com/v3/media?api_key=" + registrationData.api_key + "&api_secret=" + registrationData.api_secret + "",
  }

  var request = require('request');
  request(options, function(err, res, body) {
    if (err) {
      callback(false, err);
      return;
    }

    if (body.error_title && body.error_title != "") {
      callback(false, body);
      return;
    }

    if (res.statusCode != 201) {
      callback(false, res.body);
      return;
    }

    var newUrl = res.headers.location;
    // Remove /info from url
    newUrl = newUrl.substring(0, newUrl.length - 5);

    callback(true, {
      filename: filename,
      recording_url: newUrl + "?jwt-token=" + jwtToken
    });
  });

}