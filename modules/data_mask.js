var hash_table = {};
var agentid_pattern = /[a-zA-Z]{2}[0-9]{3}[a-z|A-Z|0-9]{1}/;
var ban_pattern = /#####[0-9]{4}|[0-9]{9}/;
var phone_pattern = /d{3}-\\d{3}-\\d{4}|[0-9]{10}/;
var sn_pattern = /\\d{4}[nN]\\d{6}/;
var agentid_mask = "ATT_001";
var ban_mask = "BAN_001";
var phone_mask = "PHONE_001";
var sn_mask = "SN_001";

var hasAgentMask = function(value) 
{
	
	return /ATT_001/.test(value);
}

var hasBanMask = function(value) 
{
	
	return /BAN_001/.test(value);
}

var hasPhoneMask = function(value) 
{
	
	return /PHONE_001/.test(value);
}

var hasSNMask = function(value) 
{
	
	return /SN_001/.test(value);
}

var hasAgentId = function(value) 
{
	
	return agentid_pattern.test(value);
}
var hasBan = function(myString) 
{
	
	return ban_pattern.test(myString);
}
var hasPhone = function(value) 
{
	
	return phone_pattern.test(value);
}

var hasSN = function(value) 
{
	
	return sn_pattern.test(value);
}

var mask_string = function(str, pattern, rep)
{
	console.log ("Query Before token Masking: " + str);
	var masked_string = str.replace(pattern, rep);
	console.log ("Query after token Masking: " + masked_string);
	return masked_string;
}

var unmask_string = function(str, pattern, rep)
{
	console.log ("Query Before token UnMasking: " + str);
	var unmasked_string = str.replace(pattern, rep);
	console.log ("Query after token UnMasking: " + unmasked_string);
	return unmasked_string;
}

var mask_data = function(id, str) 
{
	  var obj = {};
	  
	  var masked_string = str;
	  
	  if (hasAgentId(masked_string))
	  {
		  var token = masked_string.match(agentid_pattern);
		  masked_string = mask_string(masked_string, agentid_pattern, agentid_mask);
		  obj[agentid_mask] = token;
	  }
	  else
	  {
		console.log("Query does not have Agent Id");
	  }
	  
	  if (hasBan(masked_string))
	  {
		  var token = masked_string.match(ban_pattern);
		  masked_string = mask_string(masked_string, ban_pattern, ban_mask);
		  obj[ban_mask] = token;
	  }
	  else
	  {
		console.log("Query does not have Ban");
	  }
	  
	  if (hasPhone(masked_string))
	  {
		  var token = masked_string.match(phone_pattern);
		  masked_string = mask_string(masked_string, phone_pattern, phone_mask);
		  obj[phone_mask] = token;
	  }
	  else
	  {
		console.log("Query does not have Phone");
	  }
	  
	  if (hasSN(masked_string))
	  {
		  var token = masked_string.match(sn_pattern);
		  masked_string = mask_string(masked_string, sn_pattern, sn_mask);
		  obj[sn_mask] = token;
	  }
	  else
	  {
		console.log("Query does not have Serial Number");
	  }
	  
	  if (Object.keys(obj).length === 0 && obj.constructor === Object)
	  {
		  
	  }
	  else
	  {
		  hash_table[id] = obj;
		  console.log(JSON.stringify(hash_table));
	  }
	  
	  return masked_string;
}

var unmask_data = function(id, str) 
{
	var unmasked_string = str;
	if (id in hash_table)
	{
		var obj = hash_table[id];
		if (hasAgentMask(unmasked_string))
		{
			var token = obj[agentid_mask];
			unmasked_string = unmask_string(unmasked_string, agentid_mask, token);
		}
		else
		{
			console.log("Query does not have Masked Agent Id");
		}
		 
		  if (hasBanMask(unmasked_string))
		  {
			  var token = obj[ban_mask];
			  unmasked_string = unmask_string(unmasked_string, ban_mask, token);
		  }
		  else
		  {
			console.log("Query does not have Ban Mask");
		  }
		  
		  if (hasPhoneMask(unmasked_string))
		  {
			  var token = obj[phone_mask];
			  unmasked_string = unmask_string(unmasked_string, phone_mask, token);
		  }
		  else
		  {
			console.log("Query does not have Phone Mask");
		  }
		  
		  if (hasSNMask(unmasked_string))
		  {
			  var token = obj[sn_mask];
			  unmasked_string = unmask_string(unmasked_string, sn_mask, token);
		  }
		  else
		  {
			console.log("Query does not have Serial Number Mask");
		  }
		  
		 // delete hash_table[id];
	}
	  
	return unmasked_string;
}

module.exports = 
{
		mask_data,
		unmask_data
};