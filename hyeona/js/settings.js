function clearModal(current) {
				var date = new Date();
				var year = date.getFullYear();
				var month = (((date.getMonth() + 1) + "").length == 1 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1));
	
	$(current).find("input").val("");
	$(current).find("select[name=year]").val(year);
	$(current).find("select[name=month]").val(month);
}

function formBinder(form, information) {
	for(var field in information) 
		$(form).find("input[name="+field+"]").val(information[field]);
}

function UpdateableTable(current, heads, key, updatable, event, dataFn, saveFn) {
	load();
	makeEvent();
	
	function load() {
		dataFn(function(ar) { buildUI(ar); });
	}
	
	function buildUI(data) {
		$(current).find("table > tbody").empty();
		
		for(var idx in data) {
			var tableLine = $("<tr>");
			
			for(var heard_idx in heads) {
				var tableData = $("<td>").append($("<span>").text(data[idx][heads[heard_idx]]));
				if(heads[heard_idx] == key)
					$(tableData).addClass("text-center").addClass("key");
				
				if(updatable[heads[heard_idx]]) {
					$(tableData).append($("<input>").val(data[idx][heads[heard_idx]]).data("field",heads[heard_idx]).data("key",data[idx][key]).addClass("form-control").hide());
					$(tableData).click(function() {
						$(this).find("span").hide();
						$(this).find("input").show();
						$(this).find("input").focus();
					});
					$(tableData).find("input").focusout(function() {
						saveData($(this).parent());
					});
					$(tableData).find("input").keyup(function(e) {
						if(e.keyCode == 13) saveData($(this).parent());
					});
				}
				
				$(tableLine).append(tableData);
			}
			
			tableLine.data("groupInfo", data[idx]);
			
			$(current).find("table > tbody").append(tableLine);
		}
		

		
		$(current).find("table > tbody > tr").click(function() {
			$(current).find("table > tbody > tr.active").removeClass("active");
			$(this).addClass("active");
		});
		
		$(document.body).scrollspy("refresh");
	}
	
	function saveData(el) {
		saveFn($(el).find("input").data("key"), $(el).find("input").data("field"), $(el).find("input").val(), function(data) {
			$(el).find("span").text(data);
		});
		$(el).find("input").hide();
		$(el).find("span").show();
	}
	
	function makeEvent() {
		for(var target in event) 
			$(current).find("div.btn-group").find("." + target).click(event[target]);
	}
	
	function getSelected() {
		return $(current).find("table > tbody > tr.active > td.key").text();
	}
	
	function getInfo() {
		return $(current).find("table > tbody > tr.active").data("groupInfo");
	}
	
	return {
		refresh: function() {
			load();
		},
		getSelected: function() {
			return getSelected();
		},
		getInfo: function() {
			return getInfo();
		}
	}
}