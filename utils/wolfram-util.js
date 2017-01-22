Promise = require('bluebird');
var config = require('config');
var Client = require('node-wolfram');
var Wolfram = new Client(config.get("wolframAlpha.appId"));

var WolframUtil = function(){};

WolframUtil.prototype.get = function(query, callback){
    var wolframResult = {};
    var that = this;
    Wolfram.query(query, function(err, result){
        if(err)
            console.log(err);
        else {
            if (result.queryresult.pod) {
                for (var a = 0; a < result.queryresult.pod.length; a++) {
                    var pod = result.queryresult.pod[a];
                    var obj = [];
                    for (var b = 0; b < pod.subpod.length; b++) {
                        var subpod = pod.subpod[b];
                        for (var c = 0; c < subpod.plaintext.length; c++) {
                            var text = subpod.plaintext[c];
                            obj.push(text);
                        }
                        if(subpod.imagesource)
                            wolframResult["Img"] = [subpod.img[0].$.src,subpod.img[0].$.width,subpod.img[0].$.height];
                    }
                    wolframResult[pod.$.title] = obj;
                }
            }
            callback(that.formatResponse(wolframResult), wolframResult);
        }
    });
};

WolframUtil.prototype.formatResponse = function(input){
    var flockMlized = "";
    var finishFormat = false;
    if(input["Response"])
        flockMlized += input["Response"];
    else {
        for(var item in input){
            if(finishFormat)
                break;
            if(item == "Wikipedia summary" || item == "Img")
                continue;
            if (item == "Response"){
                flockMlized += input[item] +"<br/><br/>";
                finishFormat = true;
            }
            else if(item == "Input interpretation" || item == "Input"){
                flockMlized +="<b>" + input[item] +"</b><br/><br/>";
            } else if (item == "Result")
                flockMlized += input[item] +"<br/><br/>";
            else if(input[item] != '')
                flockMlized +="<i>" + item +"</i><br/>" + input[item] + "<br/><br/>";
        }
    }

    if(flockMlized != "")
        flockMlized = "<flockml>" + flockMlized + "</flockml>";
    return flockMlized;
};

module.exports = WolframUtil;