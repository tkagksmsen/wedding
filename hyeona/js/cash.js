/**
* 년, 월, 일 관련한 UI를 만드는 클로저
* params t viewer 타입
*/
function TermViewer(current, key, a, th, findFn) {
	var fillColors = [], strokeColors = [];
	var kind = ['year', 'month', 'date', 'term'];
	var type = $(current).attr("id"), axis = a, headers = th, charts = {};
	
	TermViewer();
	
	/**
	* 생성자
	*/
	function TermViewer() {
		var cnt = 0;
		var makeEvent = function(el, nm) {
			$(el).click(function() { showTab(nm); });
		};
		
		$(current).find("li").each(function() {
			makeEvent(this, cnt);
			cnt++;
		});
		
		for(var idx in kind) {
			findFn(kind[idx], null, function(result) {
				doDraw(result.kind, result.data);
			});
		}
		
		setTimeout(function() {
			for(var idx in kind) 
				if(idx != 0) $(current).find("."+kind[idx]).hide();
		}, 1000);
	}
	
	/**
	* table & chart 그림
	* 
	* param term type (year, month, date, term)
	* params ar real data (row data)
	*/
	function doDraw(term, ar) {
		doDrawTable(term, ar);
		doDrawChart(term, ar);
	}
	
	function doDrawTable(term, ar) {
		$(current).find("."+term+" table tbody").empty();
		
		// 테이블 생성
		var thead = $("<thead>").append(getTableRow("head", ar[idx], {}, function(data) {}));
		var tbody = $("<tbody>");
		for(var idx in ar) 
			$(tbody).append(getTableRow("data", ar[idx], function(data) { goNext(term, data); }));
		$(current).find("."+term).find("table").empty();
		$(current).find("."+term).find("table").append($(thead));
		$(current).find("."+term).find("table").append($(tbody));
		$(document.body).scrollspy("refresh");
	}
	
	function doDrawChart(term, ar) {
		var chartData = {labels:[], datasets:[]};
		var ctx = $(current).find("."+term+" canvas").get(0).getContext("2d");
		
		// 그래프 데이터 생성
		for(var idx in axis) {
			chartData.datasets[idx] = [];
			for(var in_idx in ar) {
				var target_id = ar.length - in_idx - 1;
				chartData.labels[in_idx] = ar[target_id][key];
				chartData.datasets[idx][in_idx] = ar[target_id][axis[idx]];
			}
			chartData.datasets[idx] = makeChartData(chartData.datasets[idx], idx);
		}
		
		if(charts[term]) 
			charts[term].destroy();
		
		charts[term] = new Chart(ctx).Bar(chartData, {
			responsive : true, 
			scaleLabel: "<%= value.format()%>"
		});
		
		$(current).find("."+term).find(".legend").empty();
		$(current).find("."+term).find(".legend").append($(charts[term].generateLegend()));
		$(document.body).scrollspy("refresh");
	}
	
	/**
	* 테이블 row 생성 후 리턴
	* type에 따라서 table 형태 변경 (새로운 형태(type) 추가시 내부 switch case문만 추가해주면 됨)
	* 
	* params o row data object
	* params fn click event function
	*/
	function getTableRow(type, o, fn) {
		var el = $("<tr>").click(function() {fn(o[key])});
		for(var idx in headers) {
			el.append($((type == "head" ? "<th>"+headers[idx].name : "<td>"+(isNumberField(headers[idx].id) ? (o[headers[idx].id] + "").format() : o[headers[idx].id]))+"</td>").addClass("text-center"));
		}
		return el;
	}
	
	/**
	* 년 월 일의 Row 클릭 시 다음으로 넘어가는 액션 수행
	*
	* params term 선택한 row의 type
	* params data 선택한 row의 기간 정보
	*/
	function goNext(term, data) {
		switch(term) {
			case "year": 
				showTab(1);
				findFn('month', data, function(result) {
					doDraw(result.kind, result.data);
				});
				break;
			case "month":
				showTab(2);
				findFn('date', data, function(result) {
					doDraw(result.kind, result.data);
				});
				break;
			case "date":
				break;
		}
	}
	
	/**
	* 탭 클릭 동작을 수행 (선택한 탭의 패널을 보여주고 탭의 상태를 변경한다.)
	* params nm 선택한 탭의 번호
	*/
	function showTab(nm) {
		var cnt = 0, ar = ["year", "month", "date", "term"];
		
		$(current).find("li").each(function() {
			$(current).find("li:nth-child("+(cnt + 1)+")").removeClass("active");
			$(current).find("." + ar[cnt]).hide();
			cnt++;
		});
		
		$(current).find("li:nth-child("+(nm + 1)+")").addClass("active");
		$(current).find("." + ar[nm]).show();
		$(document.body).scrollspy("refresh");
	}
	
	/**
	* chart axis 데이터 생성
	* params ar 데이터 array
	* params idx axis index 번호
	*/
	function makeChartData(ar, idx) {
		if(!fillColors[idx]) {
			var color = rd_chart() + "," + rd_chart() +"," + rd_chart();;
			fillColors[idx] = "rgba("+color+",0.5)";
			strokeColors[idx] = "rgba("+color+",0.5)";
		}
		return {
			label: axis[idx],
			fillColor : fillColors[idx],
			strokeColor : strokeColors[idx],
			data : ar
		};
	}
	
	function findTerm(from, to) {
		findFn('term', {from:from, to:to}, function(result) {
			doDraw(result.kind, result.data);
		});
	}
	
	
	return {
		findTerm: function(from, to) {
			findTerm(from, to);
		},
		draw: function() {
			doDraw(term, ar); 
		},
		tab: function() {
			showTab(nm); 
		}
	};
}

			
/**
* 그룹핑하는 테이블을 만드는 클로져
*/
function GroupTable(current, mk, sk, mth, sth, rel, findFn, tableDataFn, showDetailFn, openFn) {
	var type = $(current).attr("id"), main_thead = mth, sub_thead = sth, main_key = mk, sub_key=sk, relatived = rel;
	var searchParams;

	findFn(function(params) {
		find(params);
	});
	
	/**
	* 테이블을 만들고 관련된 다른 클로저에 이벤트 전달.
	* 
	* params data 검색할 데이터 (키워드)
	*/
	function find(data) {
		searchParams = data;
		tableDataFn(data, function(result) {
			makeTable(result);
			
			for(var i = 0; i <relatived.length; i++)  
				relatived[i].find(result);
		});
	}
	
	/**
	* 테이블 & 서브 테이블 생성
	* 
	* params data 검색할 데이터 (키워드)
	*/
	function makeTable(data) {
		var head = $("<thead>");
		var body = $("<tbody>");
		var term_ar = data;
		
		$(head).append($("<th>").addClass("text-center").text(" "));
		
		for(var field in main_thead)
			$(head).append($("<th>").addClass("text-center").text(main_thead[field]));
		
		for(var idx in term_ar) { 
			var tr_data = $("<tr>");
			var tr_sub = $("<tr>");
			var sub_table_wrapper = $("<div id='"+type+"-sub-table-"+idx+"'>").addClass("accordian-body").addClass("collapse");
			var sub_table = $("<table>").addClass("table");
			
			$(tr_data).append($("<td>").addClass("text-center")
				.append($("<a class='accordion-toggle' data-toggle='collapse' href='#"+type+"-sub-table-"+idx+"'>").data("subTable", sub_table).data("key", term_ar[idx][main_key]).click(function() {
					var mainKey = $(this).data("key");
					var subTable = $(this).data("subTable");
					if(openFn instanceof Function && !$(this).data("subTable").find("thead")[0]) {
						openFn(searchParams, $(this).data("key"), function(result) {
							makeSubTable(subTable, mainKey, result);
						});
					}
				})
				.append("<span aria-hidden='true'>").addClass("glyphicon").addClass("glyphicon-plus")));
			
			for(var field in main_thead) {
				$(tr_data).append($("<td>").addClass("text-center").text((isNumberField(field) ? (term_ar[idx][field] + "").format() : term_ar[idx][field])));
			}
				
			$(tr_sub).append($("<td colspan='"+(field_count(main_thead) + 1)+"'>").css("padding", "0px").css("border", "0px")
				.append($(sub_table_wrapper).append(sub_table)));
			
			var innerData = term_ar[idx].data;
			if(!(openFn instanceof Function)) {
				makeSubTable(sub_table, term_ar[idx][main_key], term_ar[idx].data);
			}
			
			$(body).append($(tr_data));
			$(body).append($(tr_sub));
		}
		
		$(current).find("table").empty();
		$(current).find("table").append($(head));
		$(current).find("table").append($(body));
		$(document.body).scrollspy("refresh");
	}

	function makeSubTable(subTable, key, subData) {
		var sub_head = $("<thead>");
		var sub_body = $("<tbody>");
		
		if(showDetailFn)
			$(sub_head).append($("<th width=50>"));
		
		for(var field in sub_thead)
			$(sub_head).append($("<th>").addClass("text-center").text(sub_thead[field]));
		
		for(var sub_idx in subData) {
			var sub_tr = $("<tr>");
				
			if(showDetailFn)
				$(sub_tr).append($("<td>").data("main_key",key).data("sub_key",subData[sub_idx][sub_key]).css("padding", "4px").css("padding-left", "20px")
						.append($("<a herf='#'>").css("padding", "3px 6px").css("cursor", "pointer")
							.append($("<span aria-hidden='true'>").addClass("glyphicon").addClass("glyphicon-plus")))
							.click(function(){
								showDetailFn($(this).data("main_key"), $(this).data("sub_key"));
							}));
			for(var field in sub_thead)
				$(sub_tr).append($("<td>").addClass("text-center").text((isNumberField(field) ? (subData[sub_idx][field] + "").format() : subData[sub_idx][field])));
			$(sub_body).append($(sub_tr));
		}
		
		$(subTable).append($(sub_head));
		$(subTable).append($(sub_body));
		$(document.body).scrollspy("refresh");
	}
	
	return {};
}

/**
* 차트를 그리는 클로져
*/
function GroupStackedChart(t, g, key) {
	var type = t, terms, groups = g;
	var current = $("#" + type);
	var ctx = $(current).find("canvas").get(0).getContext("2d");	
	var chart, chartData;
	var randomScalingFactor = function(){ return Math.round(Math.random()*100)};
	var randomColorFactor = function(){ return Math.round(Math.random()*255)};
	
	/**
	* 데이터에 해당하는 자료를 찾고 그래프를 그린다.
	* 
	* params data 그릴 데이터
	*/
	function draw(data) {
		var month_data = data;
		var groups_data = [];
		var labels = [];
		var datasets = [];
		
		for(var i = 0; i < month_data.length ; i++) {
			var target_id = month_data.length - i - 1;
			labels[i] = month_data[target_id][key];
			for(var j = 0; j < month_data[i].data.length; j++) {
				if(!groups_data[j]) groups_data[j] = [];
				groups_data[j][i] = month_data [target_id].data[j].amount;
			}
		}
		
		for(var i = 0; i < groups_data.length; i++) {
			var  data_ar = [], color = rd_chart() + "," + rd_chart() +"," + rd_chart();;
			
			datasets.push({
				label:groups[i],
				fillColor : "rgba("+color+",0.5)",
				strokeColor : "rgba("+color+",0.8)",
				data: groups_data[i]
			});
		}
		
		if(chart) 
			chart.destroy();
		chart = new Chart(ctx).StackedBar({labels : labels, datasets : datasets},{responsive : true, scaleLabel: "<%= value.format()%>" });
		$(current).find(".legend").empty();
		$(current).find(".legend").append($(chart.generateLegend()));
		$(document.body).scrollspy("refresh");
	}
	
	return {
		find : function(data) {
			draw(data);
		}
	};
}

function SingleTable(current, h, findFn, dataFn) {
	var heads = h;
	
	findFn(function(params) {
		find(params);
	});
	
	function draw(data) {
		var thead = $("<thead>");
		var tbody = $("<tbody>");
		
		var tr = $("<tr>");
		for(var head in heads)
			$(tr).append($("<th>").addClass("text-center").text(heads[head]));
		$(thead).append($(tr));
		
		
		for(var idx in data) {
			tr = $("<tr>");
			for(var head in heads) 
				$(tr).append($("<td>").addClass("text-center").text((isNumberField(head) ? (data[idx][head] + "").format() : data[idx][head])));
			$(tbody).append(tr);
		}
		$(current).find("table").empty();
		$(current).find("table").append($(thead)).append($(tbody));
		$(document.body).scrollspy("refresh");
	}
	
	function find(params) {
		dataFn(params, function(result) {
			draw(result);
		});
	}
	
	return {
		find:function(params) {
			dataFn(params, function(data) {
				draw(data);
			});
		},
		draw:function(data) {
			draw(data);
		}
	}
}


/**
* date 객체를 yyyy-mm-dd 형식의 format의 string으로 변환
* 
* params date 변환할 date 객체
*/
function date_format(date) {
	if(date == null)
		return "";
	return date.getFullYear() + "-" + ((date.getMonth() + 1) < 10 ? "0" : "") + (date.getMonth() + 1) + "-" + ((date.getDate()) < 10 ? "0" : "") + date.getDate();
}

/**
* Object의 field count 세기
*/
function field_count(obj) {
	var cnt = 0;
	for(var field in obj) 
		cnt++;
	
	return cnt;
}

function default_date(date) {
	date.setDate(date.getDate() - 7);
	return date;
}


function commify(n) {
  var reg = /(^[+-]?\d+)(\d{3})/;
  n += '';
  while (reg.test(n))
    n = n.replace(reg, '$1' + ',' + '$2');

  return n;
}

var numberField = ["usd", "perUsd", "amount", "regularCash", "bonusCash", "arppu"]

function isNumberField(field) {
	for(var idx in numberField)
		if(field == numberField[idx])
			return true;
	return false;
}

String.prototype.format = function() {
	var num = parseInt(this);
	if(isNaN(num))
		return this;
	else
		return commify(num);
}