/**
 * 用做活动页面的工具js， 这个js 依赖于Jquery 和 loxia
 * 
 * 可以用来渲染表格，渲染翻页，提交form表单并处理表单返回结果，根据条件选择查询结果
 * 
 * 默认option {
 *   		queryUrl:undefined,
 *   		tableSelect:'#table_template',
 *   		paginSelect:'#pagin_template',
 *   		conditionBoard:".partTable",
 *   		currentPageBoard:".currentPage",
 *   		totalPageBoard:".tobalePage",
 *   		pagingBoard:".table_pager",
 *   		dataBoard:".editorTableDataTr",
 *   		dataTableBoard:".editorheader",
 *   		pagingTableBoard:".editorTable"
 *   }
 *   
 * 可以根据需要进行定义替换option属性
 * @author zl.shi
 */
;(function( win, $ ) {
	"use strict"
    var _global;
	
	var ActivityUtils = (function(options) {
		var _this = this;
		_this._initial(options);
		
	});
	ActivityUtils.initial = function(opt) {
		return new ActivityUtils(opt);
	}

	ActivityUtils.prototype = {
			constructor: this,
			
			_initial: function(opt) {
				var _this = this;
	            // 默认参数
	            var def = {
	            		queryUrl:undefined,
	            		tableSelect:'#table_template',
	            		paginSelect:'#pagin_template',
	            		conditionBoard:".partTable",
	    				currentPageBoard:".currentPage",
	            		totalPageBoard:".tobalePage",
	            		pagingBoard:".table_pager",
	            		dataBoard:".editorTableDataTr",
	            		dataTableBoard:".editorheader",
	            		pagingTableBoard:".editorTable"
	            };
	            _this.opt = Object.assign(def,opt);
	            
	        },

			parseTemplate: function( template, data, callback ) {
				var _this = this; 
				var str = null;
				var result = template.replace(/{{([^}}]+)?}}/g, function(s0, s1){
					str = eval(s1);
					return (str == "null" || str == "undefined" || str == undefined) ? "" : str ;
				});
				
				if ( !!callback.after ) {
					callback.after.call(_this, result);
				}

			},

			loadTable: function( param ) {
				var _this = this;
				loxia.asyncXhrGet( _contextPath + _this.opt.queryUrl, param, {
					success:function(data) {
						_this.renderTable( data );
						_this.renderFlipOver( data.pagination );
					},
					error:function(b){
						console.log(b);
					} 
				});
			},

			renderTable: function( data ) {
				var _this = this;
				var items = data.items
				var htmlTemp = "";
				
				for ( var index in items ) {
					_this.parseTemplate($(_this.opt.tableSelect).html(), items[index], {
						after: function( template ) {
							htmlTemp += template;
						}
					});
				}
				
				$(_this.opt.dataTableBoard).after(htmlTemp);
				
				for ( var key in data.selectTriggers ) {
					$("."+key).attr("checked", "checked");
				}

			},

			renderFlipOver: function( data ) {
				var _this = this;
				
				$(_this.opt.pagingBoard).remove();
				_this.parseTemplate($(_this.opt.paginSelect).html(), data, {
					after: function( template ) {
						$(_this.opt.pagingTableBoard).after(template);
					}
				});
			},
			
			jumpNext: function() {
				var _this = this;
				var currentEle = $(_this.opt.currentPageBoard);
				var totalEle = $(_this.opt.totalPageBoard);
				
				var currentNo = currentEle.html();
				var totalNo = totalEle.html();
				
				if ( (parseInt(currentNo) + 1) <= parseInt(totalNo) ) {
					_this.jumpPage(parseInt(currentNo) + 1);
				}
				
				
			},
			
			jumpPre: function() {
				var _this = this;
				var currentEle = $(_this.opt.currentPageBoard);
				var totalEle = $(_this.opt.totalPageBoard);
				
				var currentNo = currentEle.html();
				var totalNo = totalEle.html();
				
				if ( (parseInt(currentNo) - 1) >= 1 ) {
					_this.jumpPage(parseInt(currentNo) - 1);
				}
				
			},

			jumpPage: function( pageNo ) {
				var _this = this;
				var pragm = _this.pageNoParam( pageNo );
				
				$(_this.opt.dataBoard).remove();
				_this.loadTable(pragm);
			},

			searchActivity: function() {
				var _this = this;
				
				var pragm = _this.pageNoParam( 1 );
				
				$(_this.opt.dataBoard).remove();
				_this.loadTable(pragm);
			},
			
			initTimeWidget: function( selecter, onCloseFun, onSelectFun ) {
				$(selecter).datetimepicker({
					showSecond : true,
					timeFormat : 'hh:mm:ss',
					stepHour : 1,
					stepMinute : 1,
					stepSecond : 1,
					minDate:'-1970/01/01',
        			maxDate:'+1970/01/01',
					showOn  : "focus",
					changeMonth : true,
					changeYear  : true,
					onClose  : onCloseFun,
					onSelect : onSelectFun
				});
			},
			
			pageNoParam: function( pageNo ) {
				var _this = this;
				var pragm = _this.buildParam(_this.opt.conditionBoard);
				pragm.pageNo = pageNo;
				return pragm;
			},
			
			// Search children of <code>selecter</code>
			buildParam: function( selecter ) {
				var varKey = "serio-data";
				var selectStr = selecter + " [" + varKey+"]";
				var param = {};
				$(selectStr).each(function( index, ele) {
					var name = $(ele).attr(varKey);
					if ( $(ele).val() != "" ) {
						param[name] = $(ele).val()
					}
				});
				
				return param;
			},

			switchImg: function( obj, src, open) {
				if ( !open ) {
					return false;
				}
				$(obj).attr('src', src);
			},
			
			checkFormNotEmpty: function( parentSelect, names ) {
				
				var result = {
						status: false,
						element:[]
				}
				
				var element = null;
				for ( var index in names ) {
					element = $(parentSelect + " [name="+names[index]+"]");
					if ( !element ) {
						result.element.push(names[index]);
						return result;
					}
					if ( $.trim(element.val()) == "" ) {
						result.element.push(names[index]);
						return result;
					}
				}
				
				result.status = true;
				return result;
			},
			
			timeClose: function( startSelecter, endSelecter, dateText, inst, start) {
				
				var dateTextBox = !!start ? $(endSelecter) : $(startSelecter);
			
				if (dateTextBox.val() != '') {
					var startDate = $(startSelecter).datetimepicker('getDate');
					var endDate = $(endSelecter).datetimepicker('getDate');
					if (startDate > endDate)
						dateTextBox.val(dateText);
				}
				
				var option = !!start ? "minDate" : "maxDate";
				var limitTextBox = !!start ? $(startSelecter) : $(endSelecter);
				var data = limitTextBox.datetimepicker('getDate');
				if(data != null){
					dateTextBox.datetimepicker('option', option, new Date(data.getTime()));
				}
			},

			// The default form is not suports that process response by customer.
			// But submitForm can do that.
			submitForm: function( selecter, url, method, process ) {
				
				var seleform = $(selecter);
				if ( seleform.length <= 0 ) {
					console.log("No form found, selecter:["+selecter+"]");
					return;
				}

				var fd = new FormData(seleform[0]);
				$.ajax({
				  url: url,
				  type: method,
				  data: fd,
				  processData: false,   // Do not process data.
				  contentType: false,   // No content type is set.
				  success: process.success,
                  error: process.error
				})
			}
			
	}
	
    _global = (function(){ return this || (0, eval)('this'); }());
    if (typeof module !== "undefined" && module.exports) {
        module.exports = ActivityUtils;
    } else if (typeof define === "function" && define.amd) {
        define(function(){return ActivityUtils;});
    } else {
        !('ActivityUtils' in _global) && (_global.ActivityUtils = ActivityUtils);
    }
	
})( window, jQuery );