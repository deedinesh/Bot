'use strict';

var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require("request");
var http = require('http');
var fs = require('fs');
var app = express();
var conversation_logger = require("./modules/conversation_logger.js");
var log_reader = require("./modules/log_reader.js");
var tokenizer = require("./modules/data_mask.js");
var apiai = require("./modules/apiai_csp.js");
var csi_api = require("./modules/csi_api.js");
var account_api = require("./modules/account_api.js");
var snMissmatch = require("./modules/snMismatchTest.js");
var config = require('./configuration/config');

app.set('port', process.env.PORT || config.port);

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
	secret: 'it does not matter',
	cookie: { secure: false }
	})
)

app.get('/accountStatus/:id', account_api.handleAccountStatus);

app.post('/chat', function(req, res)
{
	console.log('req.session.account ^^^^^^^^^^^^^^^', req.session.account);
	var chat_id = req.body.chat_id;
	var query = req.body.query;
	var chtbt = req.body.csp;
	var agent_id = req.body.agent_id;

	console.log("Message from Front End:" + query + "\n");

	tokenize(chat_id, query, res, chtbt, agent_id, req);

});

app.post('/formHandler', function(req, res) {


	snMissmatch("this should be the ban").then( (act) => {
		req.session.account = act;
		var chat_id = req.body.chat_id;
		var query = req.body.query; //"ab1234 000456782 1234567892 All Products OOS  sync_no_service Jack Jones"
		query = query.substring(0, query.lastIndexOf("sync_no_service")+"sync_no_service".length);
		query = query + " " + act.CRMCustomerFirstName + " " + act.CRMCustomerLastName;
		var chtbt = req.body.csp;
		var agent_id = req.body.agent_id;

		console.log("Message from Front End:" + query + "\n");

		tokenize(chat_id, query, res, chtbt, agent_id, req);
	});}
);

app.get('/key', function(req, res)
{
	  res.send(config.api_ai_key);
});

app.post('/view', function(req, res)
{

	var result = [];
	// Read the file and print its contents.
	var filename = 'logs/conversation.log';
	function func(data)
	{
		if(data != "END")
		{
			console.log("Getting Logs");
			 var obj = JSON.parse(data);
			  var log_entry = {"chat_id": obj.chat_id, "agent_id": obj.agent_id, "query": obj.query, "reply": obj.reply, "intent": obj.intent, "time": obj.time};
			  result.push(log_entry);
		}
		else
		{
			console.log("Sending Logs");
			res.contentType('application/json');
			res.send( result);
		}
	}


	var input = fs.createReadStream(filename);
	log_reader.readLines(input, func);
});

var server = http.createServer(app).listen(app.get('port'), function()
{
	require('dns').lookup(require('os').hostname(), function (err, add, fam)
	{
		  var host_url = "http://" + add + ":" + app.get('port');
		  console.log("The application URL is: " + host_url);
	})

});

var mod = require('./modules/sockets.js').initialize(server);

function tokenize(chat_id, query, res, chtbt, agent_id, req)
{
	var msg = tokenizer.mask_data(chat_id, query);
	console.log("Tokenized String:" + msg + "\n");
  	send_api_ai_request(chat_id, msg, res, agent_id, query, req);
}

function send_api_ai_request(chat_id, message, res, agent_id, query, req)
{
	apiai.text_request(chat_id, message, function(reply)
	{
		var rp = JSON.parse(reply);
		console.log("Reply from API AI:" + rp.msg + "\n");
		detokenize(chat_id, rp.msg, res, agent_id, query, rp.intent, req);
	});
}

function detokenize(chat_id, tokenized_request, res, agent_id, query, intent_name, req)
{
	var msg = tokenizer.unmask_data(chat_id, tokenized_request);
	console.log("Dekotenized String:" + msg + "\n");
	check_message_type(chat_id, msg, res, agent_id, query, intent_name, req);
};

var check_message_type = async function(chat_id, msg, res, agent_id, query, intent_name, req)
{
	var m = msg.includes("(");

	if (m)
	{
		var methodList=msg.substring(msg.lastIndexOf("(")+1,msg.lastIndexOf(")"));

		var n = methodList.startsWith("PROGRESS_MESG");
		if (n)
		{
			var msg_to_send = msg.substr(0, msg.indexOf('('));
			mod.stream_bot_message(chat_id, msg_to_send);
			var progress_message=methodList.substring(methodList.indexOf(":")+1,methodList.lastIndexOf("["));
			mod.stream_progress_message(chat_id, progress_message);
			var str = methodList.substring(methodList.indexOf("["));
			var result = invoke_csi_api(str);
			var op = JSON.parse(result);
			var event_name = await invoke_urls(op.urls, req);
			apiai.event_request(chat_id, event_name, function(reply)
			{
				var rp = JSON.parse(reply);
				console.log("Event Reply from API AI:" + rp.msg + "\n");
				log_and_send(res, chat_id, agent_id, query, rp.msg, rp.intent);
			});
		}
		else
		{
			var places = msg.match(/<(.*?)>/g);
			var result = invoke_csi_api(methodList);
			var op = JSON.parse(result);
			var reply = await invoke_urls(op.urls, req);
			msg = msg.replace(places, reply);
			msg = msg.substring(0, msg.indexOf('?')+1);
			log_and_send(res, chat_id, agent_id, query, msg, intent_name);
		}
	}
	else
	{
		log_and_send(res, chat_id, agent_id, query, msg, intent_name);
	}
}

function invoke_csi_api(methodList)
{
		var n = methodList.includes("|");

		var urls = [];
		if (n)
		{
			var methods = methodList.split("|");
			for (var index in methods)
			{
				var ret = create_url(methods[index]);
				urls.push(ret);
			}
		}
		else
		{
			var ret = create_url(methodList);
			urls.push(ret);
		}

		var result = {"urls": urls};
		return JSON.stringify(result);

}

async function invoke_urls(url_array, req)
{
	var obj = url_array[0];

	switch(obj.method)
	{  	
		case "transfer_address":
			console.log("----------function call -- transfer_address--------");
			return {
				name: "1_0_confirm_ban_yes",
				//data: {address: __qqq__}
				data: {address:  req.session.account.CRMServiceAddress}
			};
		case "validate_serial_num_status":
			if ( req.session.account.snMatch ){
				return {
					name: "2_0_event_sn_match_confirm",
					data: {sn: 1000000000}
				};
			} else {
				return {name: "2_1_event_confirm_sn_no"};
			}
			break;
		case "get_agent_name":
			return {name: csi_api.get_agent_name(obj.value)};

		case "validate_account_status":
			return {name: csi_api.validate_account_status(obj.value)};

		case "validate_serial_number":
			return csi_api.validate_serial_number(obj.value);

		case "check_aots_outage":
			return csi_api.check_aots_outage(obj.value);

	    case "validate_serial_num_status":
	        return csi_api.validate_serial_num_status(obj.value);
	        break;
	        
		default:
			var text = "I have never heard of that fruit...";
			console.log(text);
	}
}

var log_and_send = function(res, chat_id, agent_id, query, reply, intent_name)
{
	write_log(chat_id, agent_id, query, reply, intent_name);

	var log_entry = {"chat_id": chat_id, "agent_id": agent_id, "query": query, "reply": reply, "intent": intent_name};
	conversation_logger.log_message(log_entry);
	mod.stream_log(JSON.stringify(log_entry));
	res.send(reply);
}

function write_log(chat_id, agent_id, query, msg, intent_name)
{
	var url = "http://localhost:8000/write_log?" + "chatID=" + chat_id + "&" + "MsgSentBy=" + agent_id + "&" + "request=" + query + "&" + "response=" + msg + "&" + "intentName=" + intent_name;

	  request(url, function (error, response, body)
	  {
		    if (!error && response.statusCode == 200)
		    {
		    	console.log("Successful Logging in SQLITE");
		    	console.log(url);
		    }
		    else
		    {
		    	console.log("ERROR in Logging in SQLITE");
		    	console.log(url);
		    }
	  })
}

function create_url(message)
{
	var url = {};
	var method=message.substring(message.lastIndexOf("[")+1,message.lastIndexOf("]"));
	var nv = message.substring(message.lastIndexOf("BEGIN")+5,message.lastIndexOf("END"));

	var nvp = nv.split(":");
	var param = nvp[0];
	var value = nvp[1];

	url["method"] = method;
	url["param"] = param;
	url["value"] = value;

	return url;
}
