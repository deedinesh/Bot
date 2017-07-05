var recognition;
var agent_id;
var chtbt;
var uuid = guid();
var agent_ids = new Array("ma123q", "jd123j", "vc123r", "dp123a", "ab123c", "ue123d", "dd123e", "vs123f", "rk123g", "rb123h", "um123i", "ua123k");
var tec_field_services_products = new Array("All Products OOS", "DTV", "IPTV", "VOIP", "Internet");
var tec_field_services_transport_types = new Array("IP-CO", "IP-RT", "FTTN/FTTN-BP", "FTTP/FTTC", "FTTP/FTTC - Greater than 100 MG");
var tec_arc_products = new Array("ABF", "IP ARC");
var other_transport_types = new Array("N/A");
var all_product_oos_exceptions = new Array("Sync No Service", "No Sync", "Order Error", "Pair Change Tool Failure", "Port Change Tool Failure", "Network Outage", "Assignment Verification Tool Failure", "Assignment Corrections", "RTID Corrections", "No Light/Low Light", "ONT Activation Fallout", "Repair Ticket Creation", "Fiber Port Change Tool Failure (FMO)");
var dtv_exceptions = new Array("OLI Errors", "Wired to Wireless Conversion", "Remove DTV From Order", "Package Change", "IV Waiver", "Service Call Support");
var internet_exceptions = new Array("Slow Browse",
		"Unable to Browse",
		"Webistes Unreachable",
		"Registration Issues",
		"Static IP Assistance",
		"Speed - Upgrade/Downgrade",
		"Profile - Upgrade/Downgrade",
		"Member ID Issues");
var iptv_exceptions = new Array("No Picture",
		"Package Upgrade/Downgrade",
		"Equipment Swap Failure",
		"VOD Assistance",
		"Equipment Troubleshooting"
);
var voip_exceptions = new Array("IAD Issues",
		"Porting Issues",
		"No Dial Tone",
		"Cannot Receive/Make Calls",
		"Unable to Call Specific TN's",
		"Voicemail Assistance",
		"MyATT Zone Issues"
);
var ip_arc_exceptions = new Array("Sync No Service",
		"AOTS",
		"Static IP Assistance",
		"VoIP Assistance",
		"172 IP Assistance",
		"ONT Activations",
		"IPTV App Issues",
		"Website Unreachable",
		"No Light/Low Light"
);
var abf_exceptions = new Array("Sync no Service",
		"IAD Assistance",
		"NTI Change",
		"Order Assistance",
		"Static IP Assistance",
		"Other",
		"RG/STB Support",
		"Emux / EMT issues"
);

$(function()
{
	$("#chat").fadeOut();
	toggleOptions();

	// Get the modal
	var modal = document.getElementById('myModal');

	// Get the <span> element that closes the modal
	var span = document.getElementsByClassName("close")[0];


	// When the user clicks on <span> (x), close the modal
	span.onclick = function() {
	    modal.style.display = "none";
	}

	// When the user clicks anywhere outside of the modal, close it
	window.onclick = function(event) 
	{
		modal.style.display = "none";
	}
	
	$("#usermsg").keypress(function(event) 
	{
		if (event.which == 13) 
		{
			send_chat_msg(event);
		}
	});
	
	$("#submitmsg").click(function(event) 
	{
		send_chat_msg(event);
	});
			
	$("#done").click(function(event) 
	{
		event.preventDefault();
		$("#prechat").fadeIn();
		$("#chat").fadeOut();
		$('#chatbox').empty();
	});
	$("#chat_btn").click(function(event) 
	{
		var sep = " ";
		var acd = $( "#wgtc option:selected" ).text();
		agent_id = $( "#tan option:selected" ).text();
		var ban = $( "#ban" ).val();
		var customer_name = $( "#custname" ).val();
		var product = $( "#pdt option:selected" ).text();
		var transport_type = $( "#ttyp option:selected" ).text();
		var cbr = $( "#tcbr" ).val();
		var excp = $( "#excp option:selected" ).text();
		chtbt = $( "#chtbt option:selected" ).val();
		uuid = guid();
		
		var text = agent_id.trim() + sep + ban.trim() + sep + cbr + sep + product + sep + transport_type + sep + "sync_no_service";
		
		var tmp = customer_name.split(" ");
		
		switch(tmp.length)
		{
			case 1:
		        text = text + sep + tmp[0];
		        break;
		    case 2:
		    	text = text + sep + tmp[0] + sep + tmp[1];
		        break;
		    case 3:
		    	text = text + sep + tmp[0] + sep + tmp[1] + sep + tmp[2];
		        break;
		    default:
		        text = text + sep + customer_name;
		}
		
		if(ban.length == 9 && $.isNumeric( ban) )
		{
			if(cbr.length == 10 && $.isNumeric( cbr))
			{
				if (customer_name.length > 3 && isAlphabetic(customer_name))
			    {
					if (excp.length > 0)
				    {
						if (excp === "Sync No Service")
						{
							$("#prechat").fadeOut();
							$("#chat").fadeIn();
							send_msg(event, text);
						}
						else
						{
							$(".modal-content p").text("Please Select Sync No Service Exception Only");
					    	 modal.style.display = "block";
					    	 return false;
						}
				    }
				     else
				    {
				    	 $(".modal-content p").text("Please select an Exception");
				    	 modal.style.display = "block";
				    	 return false;
				    }
			    }
				else
				{
					 $(".modal-content p").text("Please provide at least 4 character customer name");
			    	 modal.style.display = "block";
			    	 return false;
				}
			}
			else
			{
				$(".modal-content p").text("Please enter a 10 Digit CBR");
				modal.style.display = "block";
				return false;
			}
		}
		else
		{
			$(".modal-content p").text("Please enter a 9 digit BAN");
			modal.style.display = "block";
			return false;
		}
	});
});

function createOptionString(k, a)
{
	var text = "";
	for (i = 0; i < a.length; i++) 
	{
		var key = k + i;
		text += "<option value='" + key + "'>" + a[i] + "</option>";
	} 
	
	return text;
}

function toggleOptions()
{
	append_agent_ids();
	var wgtcName = $('#wgtc').find(":selected").val();
	toggleProductDropDown(wgtcName);
	$("#wgtc").change(function () 
	{
        var val = $(this).val();
        toggleProductDropDown(val);
        var product = $('#pdt').find(":selected").val();
        toggleTransportTypeDropDown(product, val);
        var product_text = $('#pdt').find(":selected").text();
        toggleExceptionDropDown(product_text);
    });
	
	var product = $('#pdt').find(":selected").val();
	var product_text = $('#pdt').find(":selected").text();
    toggleTransportTypeDropDown(product, wgtcName);
    toggleExceptionDropDown(product_text);
    $("#pdt").change(function () 
    {
        var val = $(this).val();
        var product_text = $('#pdt').find(":selected").text();
        var wgtcName = $('#wgtc').find(":selected").val();
        toggleTransportTypeDropDown(val, wgtcName);
        toggleExceptionDropDown(product_text);
    });
}

var append_agent_ids = function()
{
	var txt = createOptionString("tan", agent_ids);
	$("#tan").empty().html(txt);
	$('#tan option[value=tan0]').attr('selected','selected');
}

function toggleProductDropDown(val)
{
	var txt = "";
	switch (String(val)) 
    {
        case "wgtc1":
        	txt = createOptionString("pdt", tec_field_services_products);
            break;
        case "wgtc2":
        	txt = createOptionString("pdt", tec_arc_products);
            break;
        case "wgtc3":
        	txt = createOptionString("pdt", tec_arc_products);
            break;
        case "wgtc4":
        	txt = createOptionString("pdt", tec_arc_products);
            break;
        case "wgtc5":
        	txt = createOptionString("pdt", tec_arc_products);
        default:
          console.log("Didn't match");
          break;
    }
	$("#pdt").empty().html(txt);
	$('#pdt option[value=pdt0]').attr('selected','selected');
}

function toggleTransportTypeDropDown(product, workgroup)
{
	var txt = "";
	if (String(workgroup) == "wgtc1")
	{
		switch (String(product)) 
	    {
	        case "pdt0":
	        	txt = createOptionString("ttype", tec_field_services_transport_types);
	            break;
	        case "pdt1":
	        	txt = createOptionString("ttype", other_transport_types);
	            break;
	        case "pdt2":
	        	txt = createOptionString("ttype", other_transport_types);
	            break;
	        case "pdt3":
	        	txt = createOptionString("ttype", other_transport_types);
	            break;
	        case "pdt4":
	        	txt = createOptionString("ttype", other_transport_types);
	        default:
	          console.log("Didn't match");
	          break;
	    }
	}
	else
	{
		txt = createOptionString("ttype", other_transport_types);
	}
	
	$("#ttype").empty().html(txt);
	$('#ttype option[value=ttype0]').attr('selected','selected');
}

function toggleExceptionDropDown(product)
{
    switch (String(product)) 
    {
        case "All Products OOS":
        	txt = createOptionString("excp", all_product_oos_exceptions);
            break;
        case "DTV":
        	txt = createOptionString("excp", dtv_exceptions);
            break;
        case "Internet":
        	txt = createOptionString("excp", internet_exceptions);
            break;
        case "IPTV":
        	txt = createOptionString("excp", iptv_exceptions);
            break;
        case "VOIP":
        	txt = createOptionString("excp", voip_exceptions);
            break;
        case "IP ARC":
        	txt = createOptionString("excp", ip_arc_exceptions);
            break;
        case "ABF":
        	txt = createOptionString("excp", abf_exceptions);
             break;
        default:
          console.log("Didn't match");
          break;
    }
    $("#excp").empty().html(txt);
	$('#excp option[value=excp0').attr('selected','selected');
}

function clearFields()
{
	$('#ban').val('');
	$('#tcbr').val('');
	$('#custname').val('');
}

function send_chat_msg(event)
{
	var text = $("#usermsg").val();
	var result = validateUserMessage(text);
	var my_msg =  agent_id + " ( " + formatDate(new Date()) + " ) " + text;
	var styled_my_msg = "<div class='msgMe'>" + my_msg + "</div>";
	setResponse(styled_my_msg);
	$('#usermsg').val('');
	
	if (!result.trim())
	{
		send_msg(event, text);
	}
	else
	{
		event.preventDefault();
		var bot_msg = "bot123 ( " + formatDate(new Date()) + " ) " + result;
		var styled_bot_msg = "<div class='msgBot'>" + bot_msg + "</div>";
		setResponse(styled_bot_msg);
		$('#usermsg').val('');
	}
	
}

function validateUserMessage(text)
{
	if (!text.trim()) 
	{
	    return "Please enter some chat message";
	}
	else
	{
		if (hasNumber(text))
		{
			var ban = text.match(/\d+/);
			var tsize = ban.toString().length;

			switch (tsize) 
			{
			    case 9:
			    	return "";
			    case 14:
			    	return "";
			    default:
			        return "I typically look for 9 digits in a BAN or 14 digits in a serial number. I see this is not either. Can you please try one more time ?";
			}
		}
		else
		{
			return "";
		}
	}
}

function isAlphabetic(str)
{
	return /^[A-Za-z\s]+$/.test(str);
}

function hasNumber(myString)
{
	  return /\d/.test(myString);
}

function isNumeric(n) 
{
	  return !isNaN(parseFloat(n)) && isFinite(n);
}

function hasBan(myString) 
{
	return /#####[0-9]{4}|[0-9]{9}/.test(myString);
}

function hasSN(value) 
{
	return /^[a-z0-9]+$/i.test(value);
}

function formatDate(date) 
{
	  var hours = date.getHours();
	  var minutes = date.getMinutes();
	  var ampm = hours >= 12 ? 'pm' : 'am';
	  hours = hours % 12;
	  hours = hours ? hours : 12; // the hour '0' should be '12'
	  minutes = minutes < 10 ? '0'+minutes : minutes;
	  var strTime = hours + ':' + minutes + ' ' + ampm;
	  return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
}

function send_msg(event, text)
{
	event.preventDefault();
	send(text);
}

function send(text) 
{
	$.post("/chat",{query: text, chat_id: uuid, "agent_id": agent_id, csp: chtbt}, function(data)
	{
		 var bot_msg = "bot123 ( " + formatDate(new Date()) + " ) " + data;
		 var styled_bot_msg = "<div class='msgBot'>" + bot_msg + "</div>";
		 setResponse(styled_bot_msg);
    });
}

function setResponse(val) 
{
	$('#chatbox').append($('<li>').html( val ));
	var objDiv = document.getElementById("chatbox");
	objDiv.scrollTop = objDiv.scrollHeight;
}

function guid() 
{
	  function s4() {
	    return Math.floor((1 + Math.random()) * 0x10000)
	      .toString(16)
	      .substring(1);
	  }
	  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
	    s4() + '-' + s4() + s4() + s4();
}